const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importar sistema de intents e ações
const { INTENTS, INTENT_DETECTION_PROMPT } = require('./intents');
const spreadsheetActions = require('./spreadsheetActions');
const ThoughtProcess = require('./thoughtProcess');

const app = express();
const PORT = process.env.AGENT_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// ========== CONFIGURAÇÃO ==========
const OPERATIONAL_SERVER_URL = process.env.OPERATIONAL_SERVER_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'merfin_secret_key_2025';
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;

// ========== SEÇÕES DE DADOS DISPONÍVEIS ==========
const AVAILABLE_SECTIONS = {
    perfil: {
        title: "Perfil do Usuário",
        description: "Informações pessoais, metas financeiras com progresso acumulado, patrimônio e contexto familiar. Use para análises personalizadas sobre metas e progresso.",
        endpoint: "/api/perfil"
    },
    financas: {
        title: "Receitas e Despesas",
        description: "Dados detalhados de entradas e saídas financeiras, incluindo categorias e subcategorias.",
        endpoint: "/api/financas"
    },
    dividas: {
        title: "Dívidas e Parcelamentos",
        description: "Informações sobre dívidas ativas, parcelas e status de pagamento.",
        endpoint: "/api/dividas"
    },
    notas: {
        title: "Notas e Anotações",
        description: "Observações pessoais do usuário sobre suas finanças.",
        endpoint: "/api/notas"
    }
};

// ========== AUTENTICAÇÃO ==========
const verifyUserToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userToken = token;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// ========== FUNÇÕES AUXILIARES ==========

// Função para pesquisar na internet usando Serper API
async function pesquisarNaInternet(query) {
    if (!SEARCH_API_KEY) {
        console.log('   ⚠️ SEARCH_API_KEY não configurada - pesquisa desabilitada');
        return null;
    }

    try {
        console.log(`   🔍 Pesquisando na internet: "${query}"`);
        
        const response = await axios.post(
            'https://google.serper.dev/search',
            {
                q: query,
                hl: 'pt-br',
                num: 5  // Limitar a 5 resultados para não sobrecarregar
            },
            {
                headers: {
                    'X-API-KEY': SEARCH_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 5000  // Timeout de 5 segundos para não atrasar muito
            }
        );

        // Extrair informações relevantes
        const resultados = {
            temResultados: true,
            query: query,
            resposta: response.data.answerBox?.answer || response.data.answerBox?.snippet,
            resultados: response.data.organic?.slice(0, 3).map(r => ({
                titulo: r.title,
                snippet: r.snippet,
                link: r.link
            })) || [],
            knowledgeGraph: response.data.knowledgeGraph ? {
                titulo: response.data.knowledgeGraph.title,
                descricao: response.data.knowledgeGraph.description,
                atributos: response.data.knowledgeGraph.attributes
            } : null
        };

        console.log(`   ✅ Pesquisa concluída: ${resultados.resultados.length} resultados`);
        return resultados;

    } catch (error) {
        console.error('   ❌ Erro na pesquisa:', error.message);
        return null;
    }
}

// Função para decidir se precisa pesquisar na internet
async function precisaPesquisar(mensagemUsuario, intentData) {
    // Se não tem API key, não adianta tentar
    if (!SEARCH_API_KEY) {
        return { precisa: false, motivo: 'API key não configurada' };
    }

    // Intents que NUNCA precisam de pesquisa (são sobre dados pessoais do usuário)
    const intentsInternos = [
        'consulta_gastos',
        'adicionar_transacao',
        'consulta_metas',
        'consulta_dividas',
        'analise_financeira',
        'previsao_orcamento',
        'saudacao',
        'despedida'
    ];

    if (intentsInternos.includes(intentData?.intent)) {
        return { 
            precisa: false, 
            motivo: `Intent ${intentData.intent} usa apenas dados pessoais` 
        };
    }

    // Prompt para a IA decidir se precisa pesquisar
    const decisaoPrompt = `Você é um assistente que decide se uma pergunta precisa de pesquisa na internet.

REGRAS IMPORTANTES:
1. Pesquisar APENAS se a pergunta for sobre:
   - Informações atualizadas (preços, cotações, notícias recentes)
   - Fatos específicos ("quanto custa X hoje?", "qual a taxa de juros atual?", "o que é X?")
   - Comparações de produtos/serviços do mercado
   - Informações que mudam frequentemente

2. NÃO pesquisar se a pergunta for sobre:
   - Dados pessoais do usuário (seus gastos, suas metas, seu saldo)
   - Conselhos financeiros gerais (como economizar, investir)
   - Cálculos ou planejamentos
   - Perguntas conversacionais

3. Seja CONSERVADOR: prefira NÃO pesquisar em caso de dúvida

PERGUNTA: "${mensagemUsuario}"

Responda APENAS com JSON válido:
{
  "precisa": true/false,
  "motivo": "explicação breve",
  "queryPesquisa": "termos de busca otimizados" (apenas se precisa=true)
}`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: decisaoPrompt }],
                max_tokens: 150,
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const decisionText = response.data.choices[0].message.content;
        const cleanJson = decisionText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const decision = JSON.parse(cleanJson);

        return decision;

    } catch (error) {
        console.error('   ❌ Erro ao decidir sobre pesquisa:', error.message);
        return { precisa: false, motivo: 'Erro na decisão' };
    }
}

function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

function calculateMonthsList(currentMonth, monthsBack) {
    const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
    const months = [];

    for (let i = 0; i < monthsBack; i++) {
        let targetMonth = currentMonthNum - i;
        let targetYear = currentYear;

        while (targetMonth <= 0) {
            targetMonth += 12;
            targetYear -= 1;
        }

        const monthId = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;
        months.unshift(monthId);
    }

    return months;
}

async function fetchOrganizedData(userToken, requiredSections, timeframe) {
    const result = {
        currentMonth: getCurrentMonth(),
        sections: {},
        metadata: {
            requestedSections: requiredSections,
            timeframe,
            timestamp: new Date().toISOString()
        }
    };

    try {
        // Buscar cada seção solicitada
        for (const section of requiredSections) {
            console.log(`   📦 Buscando seção: ${section}`);
            
            if (section === 'perfil') {
                const response = await axios.get(`${OPERATIONAL_SERVER_URL}/api/perfil`, {
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });
                result.sections.perfil = response.data;
                console.log(`      ✅ Perfil carregado`);
            }
            
            else if (section === 'financas') {
                const financas = {};
                let monthsToFetch = [];

                // Determinar meses a buscar baseado no timeframe
                if (timeframe.type === 'current_only') {
                    monthsToFetch = [getCurrentMonth()];
                } else if (timeframe.type === 'specific_months' && timeframe.months) {
                    monthsToFetch = timeframe.months;
                } else if (timeframe.type === 'last_n_months' && timeframe.count) {
                    monthsToFetch = calculateMonthsList(getCurrentMonth(), timeframe.count);
                }

                console.log(`      📅 Meses a buscar: ${monthsToFetch.join(', ')}`);

                // Buscar dados de cada mês
                if (monthsToFetch.length === 1) {
                    const response = await axios.get(
                        `${OPERATIONAL_SERVER_URL}/api/financas/${monthsToFetch[0]}`,
                        { headers: { 'Authorization': `Bearer ${userToken}` } }
                    );
                    financas[monthsToFetch[0]] = response.data;
                    console.log(`      ✅ Mês ${monthsToFetch[0]} carregado`);
                } else {
                    const response = await axios.post(
                        `${OPERATIONAL_SERVER_URL}/api/financas/multiplos-meses`,
                        { meses: monthsToFetch },
                        { headers: { 'Authorization': `Bearer ${userToken}` } }
                    );
                    
                    // Organizar por mês
                    response.data.forEach(mesData => {
                        financas[mesData.mesAno] = mesData;
                    });
                    console.log(`      ✅ ${response.data.length} meses carregados`);
                }

                result.sections.financas = financas;
            }
            
            else if (section === 'dividas') {
                const response = await axios.get(`${OPERATIONAL_SERVER_URL}/api/dividas`, {
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });
                result.sections.dividas = response.data;
                console.log(`      ✅ ${response.data.length} dívidas carregadas`);
            }
            
            else if (section === 'notas') {
                const response = await axios.get(`${OPERATIONAL_SERVER_URL}/api/notas`, {
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });
                result.sections.notas = response.data;
                console.log(`      ✅ ${response.data.length} notas carregadas`);
            }
        }

    } catch (error) {
        console.error('   ❌ Erro ao buscar dados do servidor operacional:');
        console.error('      Mensagem:', error.message);
        if (error.response) {
            console.error('      Status:', error.response.status);
            console.error('      Dados:', error.response.data);
        }
    }

    return result;
}

// ========== PROMPTS DO SISTEMA ==========

const SUMMARY_PROMPT = `Você é um assistente especializado em criar resumos concisos de conversas sobre finanças pessoais.

REGRAS OBRIGATÓRIAS:
1. Máximo de 450 palavras
2. Seja DIRETO e OBJETIVO, mas não deixe nada que considerar importante de fora.
3. Foque em dados financeiros que considerar cruciais, por exemplo:  valores, prazos, metas, receitas, despesas
4. Use terceira pessoa: "O usuário" e "Eu, o agente"
5. NÃO repita conclusões ou informações já mencionadas
6. NÃO detalhe informações implícitas (exemplo: se já disse "36 meses", não precisa explicar "3 anos")

CONTEXTO PRÉVIO DA CONVERSA:
{resumoAnterior}

INTERAÇÃO ATUAL A SER RESUMIDA:
- Mensagem do usuário: "{mensagemUsuario}"
- Minha resposta como agente: "{respostaAgente}"

TAREFA: 
Gere um resumo atualizado que:
1. Incorpore o contexto do resumo anterior (se houver) de forma SINTÉTICA
2. Elimine redundâncias.
3. Seja conciso - prefira "R$ 1.000/mês por 36 meses = R$ 36.000" a explicar cada cálculo
4. Agrupe informações relacionadas em vez de listar separadamente

EXEMPLO DE BOM RESUMO (CONCISO):
"O usuário quer juntar R$ 1.000/mês por 36 meses (total R$ 36.000). Tem R$ 377,25 de progresso rumo a R$ 45.000 para apartamento, fundo emergencial de R$ 15.000, renda de R$ 10.000/mês e 2 dependentes. Eu respondi que é viável (10% da renda), sugerindo: revisar despesas, automatizar transferência mensal e acompanhar progresso regularmente."`;


const DECISION_PROMPT = `Você é um assistente financeiro que precisa decidir quais dados buscar para responder perguntas.

SEÇÕES DISPONÍVEIS:
${Object.entries(AVAILABLE_SECTIONS).map(([key, section]) => 
    `- ${key}: ${section.description}`
).join('\n')}

Analise a pergunta do usuário e responda APENAS com JSON válido neste formato:
{
  "requiredSections": ["perfil", "financas"],
  "timeframe": {
    "type": "current_only",
    "months": ["YYYY-MM"],
    "count": 2,
    "reasoning": "explicação"
  }
}

TIPOS DE TIMEFRAME:
- "current_only": apenas mês atual, use months: ["mês-atual"]
- "specific_months": meses específicos, use months: ["YYYY-MM", ...]
- "last_n_months": últimos N meses, use count: N

REGRA IMPORTANTE - ANO:
- SEMPRE use o ANO ATUAL fornecido quando o usuário não especificar o ano
- Se o usuário mencionar "janeiro" e estamos em dezembro, considere janeiro do ANO ATUAL (passado recente)
- Apenas use anos anteriores se o usuário especificar explicitamente (ex: "em 2024", "no ano passado")

EXEMPLOS:
Pergunta: "Quanto gastei este mês?" (Data: 2025-12-19)
Resposta: {"requiredSections": ["financas"], "timeframe": {"type": "current_only", "months": ["MÊS-ATUAL"], "reasoning": "Apenas dados do mês atual"}}

Pergunta: "Compare este mês com o anterior" (Data: 2025-12-19)
Resposta: {"requiredSections": ["financas"], "timeframe": {"type": "last_n_months", "count": 2, "reasoning": "Últimos 2 meses para comparação"}}

Pergunta: "Gastos em outubro, novembro e dezembro" (Data: 2025-12-19)
Resposta: {"requiredSections": ["financas"], "timeframe": {"type": "specific_months", "months": ["2025-10", "2025-11", "2025-12"], "reasoning": "Meses específicos do ano atual 2025"}}

Pergunta: "Gastos em janeiro, fevereiro e março" (Data: 2025-12-19)
Resposta: {"requiredSections": ["financas"], "timeframe": {"type": "specific_months", "months": ["2025-01", "2025-02", "2025-03"], "reasoning": "Meses específicos do início do ano atual 2025"}}

Pergunta: "Minha situação financeira geral" (Data: 2025-12-19)
Resposta: {"requiredSections": ["perfil", "financas", "dividas"], "timeframe": {"type": "current_only", "months": ["MÊS-ATUAL"], "reasoning": "Visão completa do contexto atual"}}`;

const RESPONSE_PROMPT = `Você é Merfin — um consultor financeiro pessoal que vive dentro de uma plataforma de clareza financeira criada pela empresa Merfin.

SUA MISSÃO REAL É:
- Transformar ansiedade financeira em clareza
- Ajudar o usuário a ENTENDER sua realidade, não apenas controlá-la
- Tornar decisões financeiras conscientes e confiantes
- Ser um parceiro de raciocínio, não um fiscal de gastos

PRINCÍPIO FUNDAMENTAL:
"Dinheiro não deveria gerar ansiedade. Deveria gerar consciência, previsibilidade e autonomia."

COMO VOCÊ SE COMPORTA:
- Tom: Humano, empático, sem julgamento
- Linguagem: Simples e acessível (evite jargão financeiro)
- Abordagem: Explicar consequências ANTES de acontecerem
- Atitude: Parceiro que ilumina caminhos, não controlador que dita regras
- Respostas: CURTAS e naturais (máximo 300-400 caracteres para ações simples)

IMPORTANTE:
- NÃO seja prolixo ou robótico
- NÃO repita saudações desnecessárias
- Use o histórico para manter continuidade natural
- Seja direto, mas caloroso
- Celebre conquistas de forma genuína
- Valide sentimentos antes de dar conselhos técnicos

VOCÊ NUNCA:
❌ Julga escolhas financeiras
❌ Impõe controle rígido
❌ Promete enriquecimento rápido
❌ Gera ansiedade através de medo
❌ Se identifica como outra IA que não seja Merfin

FORMATAÇÃO DE RESPOSTAS (MARKDOWN RICO):
Use Markdown para tornar suas respostas mais claras e visualmente atrativas:
- **Negrito** para valores financeiros importantes (ex: **R$ 1.500**, **meta de R$ 50.000**)
- **Negrito** para termos-chave (ex: **fundo emergencial**, **investimento**)
- *Itálico* para ênfase emocional (ex: *você está no caminho certo*)
- Listas para passos ou itens (ex: - Primeiro, revise suas despesas\n- Segundo, automatize transferências)
- Tabelas para comparar dados (ex: | Mês | Receitas | Despesas |\n|------|---------|----------|\n| Dez | R$ 5.000 | R$ 4.200 |)
- Quebras de linha para separar ideias
- Evite excesso - use formatação apenas onde agrega valor

Os dados estão organizados por mês. Use "userData.sections.financas[MÊS]" para acessar dados específicos.

Forneça uma resposta personalizada, útil, CURTA e baseada nos dados reais.`;

// ========== FUNÇÃO DE GERAÇÃO DE RESUMO ==========

async function generateSummary(mensagemUsuario, respostaAgente, resumoAnterior = '') {
    try {
        const prompt = SUMMARY_PROMPT
            .replace('{resumoAnterior}', resumoAnterior || 'Nenhum - esta é a primeira interação')
            .replace('{mensagemUsuario}', mensagemUsuario)
            .replace('{respostaAgente}', respostaAgente);
        
        console.log('📝 Gerando resumo com gpt-3.5-turbo...');
        console.log('   📨 Mensagem do usuário:', mensagemUsuario.substring(0, 100) + (mensagemUsuario.length > 100 ? '...' : ''));
        console.log('   🤖 Resposta do agente:', respostaAgente.substring(0, 100) + (respostaAgente.length > 100 ? '...' : ''));
        console.log('   📚 Resumo anterior:', resumoAnterior ? resumoAnterior.substring(0, 100) + '...' : 'Nenhum');
        
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'system', content: prompt }],
                max_tokens: 600,
                temperature: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const resumo = response.data.choices[0].message.content.trim();
        const palavrasResumo = resumo.split(/\s+/).length;
        
        console.log('✅ Resumo gerado:', palavrasResumo, 'palavras');
        console.log('📄 Conteúdo do resumo:', resumo);
        
        return { resumo, palavrasResumo };
    } catch (error) {
        console.error('❌ Erro ao gerar resumo:', error.message);
        return { resumo: '', palavrasResumo: 0 };
    }
}

async function atualizarResumoConversa(conversaId, mensagemUsuario, respostaAgente, userToken) {
    try {
        // Buscar resumo anterior
        const resumoResponse = await axios.get(
            `${OPERATIONAL_SERVER_URL}/api/conversas/${conversaId}/resumo`,
            { headers: { 'Authorization': `Bearer ${userToken}` } }
        ).catch(() => ({ data: { resumo: '' } }));
        
        const resumoAnterior = resumoResponse.data.resumo || '';
        
        // Gerar novo resumo
        const { resumo, palavrasResumo } = await generateSummary(
            mensagemUsuario,
            respostaAgente,
            resumoAnterior
        );
        
        if (!resumo) {
            console.log('⚠️ Resumo vazio, pulando atualização');
            return;
        }
        
        // Salvar resumo (não-bloqueante)
        axios.patch(
            `${OPERATIONAL_SERVER_URL}/api/conversas/${conversaId}/resumo`,
            { resumo, palavrasResumo },
            { headers: { 'Authorization': `Bearer ${userToken}` } }
        ).catch(error => {
            console.error('❌ Erro ao salvar resumo:', error.message);
        });
        
        console.log('💾 Resumo enviado para salvamento assíncrono');
    } catch (error) {
        console.error('❌ Erro ao atualizar resumo:', error.message);
    }
}

// ========== ROTA DE HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Merfin Agent Inteligente',
        availableSections: Object.keys(AVAILABLE_SECTIONS)
    });
});

// ========== CARREGAR CATEGORIAS ==========
function loadCategories() {
    try {
        const categoriesPath = path.join(__dirname, '../client/js/categories.json');
        const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
        return JSON.parse(categoriesData);
    } catch (error) {
        console.error('   ⚠️ Erro ao carregar categorias:', error.message);
        return { receitasCategorias: {}, despesasCategorias: {} };
    }
}

// ========== DETECTOR DE INTENT ==========
async function detectIntent(message, currentDate, conversationContext = '') {
    console.log('🔍 DETECÇÃO DE INTENT');
    console.log('   💬 Analisando mensagem...');
    
    try {
        // Carregar categorias
        const categories = loadCategories();
        
        let contextualInfo = '';
        if (conversationContext) {
            contextualInfo = `\n\nCONTEXTO DA CONVERSA ANTERIOR:
${conversationContext}

IMPORTANTE: Se o usuário fizer referência contextual ("essa receita", "essa despesa", "mude o valor") e o contexto menciona um MÊS ESPECÍFICO, você DEVE extrair esse mês e incluir em entities.month no formato YYYY-MM.
Exemplo: Se o contexto menciona "julho" ou "julho de 2025" e o usuário diz "edite essa receita", inclua "month": "2025-07" nas entities.`;
        }
        
        const prompt = `${INTENT_DETECTION_PROMPT}

DATA ATUAL: ${currentDate}
IMPORTANTE: Se o usuário mencionar "hoje", use EXATAMENTE esta data: ${currentDate}${contextualInfo}

CATEGORIAS DISPONÍVEIS DE RECEITAS:
${JSON.stringify(categories.receitasCategorias, null, 2)}

CATEGORIAS DISPONÍVEIS DE DESPESAS:
${JSON.stringify(categories.despesasCategorias, null, 2)}

REGRAS PARA CATEGORIAS:
- SEMPRE escolha uma categoria E subcategoria da lista acima
- A subcategoria DEVE estar dentro da categoria escolhida
- Use a categoria e subcategoria mais adequada baseada na descrição
- Se for receita de freelance, use categoria "Salário e Rendimentos do Trabalho" e subcategoria "Freelance"
- Se for despesa de mercado, use categoria "Alimentação" e subcategoria "Supermercado"
- Se for despesa de uber/99, use categoria "Transporte" e subcategoria "Aplicativos de transporte (Uber, 99)"
- NUNCA retorne uma categoria sem sua respectiva subcategoria
- Se não tiver certeza da subcategoria, escolha a primeira opção da categoria

REGRAS INTELIGENTES PARA DATA:
VOCÊ DEVE INTERPRETAR EXPRESSÕES NATURAIS DE DATA. Data de referência: ${currentDate}

IMPORTANTE SOBRE COMPETÊNCIA:
- A competência (mês de lançamento) é determinada automaticamente pela DATA do lançamento
- Se o usuário mencionar "16 de julho", a data será 2025-07-16 E a competência será 2025-07
- Se o usuário mencionar "ontem" (19/12), a data será 2025-12-19 E a competência será 2025-12
- O sistema salvará automaticamente no mês correto baseado na data informada
- SEMPRE extraia a data mais específica possível

EXPRESSÕES DE DATA:

- "hoje" → ${currentDate}
- "ontem" → calcular data de 1 dia antes de ${currentDate}
- "amanhã" → calcular data de 1 dia depois de ${currentDate}
- "semana passada" → calcular 7 dias antes de ${currentDate}
- "mês passado" → mês anterior (mesmo dia)
- "dia X" ou "todo dia X" → dia X do mês atual (ex: "dia 15" = 2025-12-15)
- "próxima segunda/terça/quarta/quinta/sexta" → calcular próximo dia da semana
- "último dia útil" → último dia útil do mês atual (pular sábados/domingos)
- "primeiro dia útil" → primeiro dia útil do mês atual
- "quinto dia útil" ou "5º dia útil" → CALCULAR o 5º dia útil do mês atual:
  * Começar no dia 1 do mês
  * Contar apenas dias úteis (segunda a sexta, pular sábados e domingos)
  * Retornar o 5º dia útil em formato YYYY-MM-DD
  * Exemplo: Se dezembro/2025 começa em segunda (dia 1), então:
    1º útil = 01/12, 2º útil = 02/12, 3º útil = 03/12, 4º útil = 04/12, 5º útil = 05/12
- "Xº dia útil" (onde X é qualquer número) → aplicar mesma lógica para qualquer dia útil
- Se não mencionar data, use: ${currentDate}
- NUNCA use datas de anos anteriores a menos que explicitamente mencionado

IMPORTANTE: Você DEVE fazer o cálculo e retornar uma data concreta no formato YYYY-MM-DD

REGRAS CRÍTICAS PARA STATUS:
- Para DESPESAS: Apenas "Pago" ou "A pagar"
- Para RECEITAS: Apenas "Recebido" ou "A receber"
- VERBOS NO PASSADO = Ação concluída:
  * "paguei", "gastei", "comprei", "paguei" → status: "Pago"
  * "recebi", "ganhei", "entrou" → status: "Recebido"
- VERBOS NO FUTURO = Ação pendente:
  * "vou pagar", "vou gastar", "preciso pagar" → status: "A pagar"
  * "vou receber", "vai entrar" → status: "A receber"
- ATENÇÃO: "paguei meu aluguel" = status DEVE ser "Pago" (não "A pagar")
- ATENÇÃO: "recebi meu salário" = status DEVE ser "Recebido" (não "A receber")

MENSAGEM DO USUÁRIO: "${message}"

Analise e retorne o JSON com intent, confidence, reasoning e entities.
Certifique-se de usar a data correta (${currentDate} se "hoje"), categorias da lista fornecida, e STATUS CORRETO baseado no tempo verbal.`;

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: prompt }],
                max_tokens: 2000,
                temperature: 0.2
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const intentText = response.data.choices[0].message.content;
        console.log('   📄 Resposta da IA:', intentText);
        
        // Limpar JSON
        const cleanJson = intentText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const intentData = JSON.parse(cleanJson);
        
        console.log(`   ✅ Intent detectado: ${intentData.intent}`);
        console.log(`   🎯 Confiança: ${(intentData.confidence * 100).toFixed(0)}%`);
        console.log(`   💭 Raciocínio: ${intentData.reasoning}`);
        if (Object.keys(intentData.entities || {}).length > 0) {
            console.log(`   📊 Entidades extraídas:`, JSON.stringify(intentData.entities, null, 2));
        }
        
        return intentData;
    } catch (error) {
        console.error('   ❌ Erro ao detectar intent:', error.message);
        return {
            intent: INTENTS.UNKNOWN,
            confidence: 0,
            reasoning: 'Erro ao processar',
            entities: {}
        };
    }
}

// ========== EXECUTOR DE AÇÕES ==========
async function executeAction(intent, entities, userToken, currentMonth) {
    console.log('\n⚡ EXECUTANDO AÇÃO');
    console.log(`   🎬 Intent: ${intent}`);
    
    // Determinar mês de competência baseado na data do lançamento
    let monthId = currentMonth;
    
    if (entities.date) {
        // Extrair YYYY-MM da data (formato: YYYY-MM-DD)
        const dateMatch = entities.date.match(/^(\d{4})-(\d{2})/);
        if (dateMatch) {
            monthId = `${dateMatch[1]}-${dateMatch[2]}`;
            console.log(`   📆 Competência identificada pela data: ${monthId}`);
        }
    }
    
    // Permitir override manual se entities.month for fornecido
    if (entities.month) {
        monthId = entities.month;
        console.log(`   📆 Competência manual especificada: ${monthId}`);
    }
    
    console.log(`   📂 Salvando no mês: ${monthId}`);
    
    try {
        switch (intent) {
            case INTENTS.ADD_INCOME:
                return await spreadsheetActions.addIncome(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId,
                    {
                        amount: entities.amount,
                        description: entities.description,
                        category: entities.category,
                        subcategory: entities.subcategory,
                        date: entities.date,
                        status: entities.status
                    }
                );
            
            case INTENTS.ADD_EXPENSE:
                return await spreadsheetActions.addExpense(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId,
                    {
                        amount: entities.amount,
                        description: entities.description,
                        category: entities.category,
                        subcategory: entities.subcategory,
                        date: entities.date,
                        paymentMethod: entities.paymentMethod,
                        status: entities.status
                    }
                );
            
            case INTENTS.EDIT_INCOME:
                return await spreadsheetActions.editIncome(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId,
                    entities.identifier,
                    {
                        amount: entities.amount,
                        description: entities.description,
                        category: entities.category,
                        subcategory: entities.subcategory,
                        date: entities.date,
                        status: entities.status
                    }
                );
            
            case INTENTS.EDIT_EXPENSE:
                return await spreadsheetActions.editExpense(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId,
                    entities.identifier,
                    {
                        amount: entities.amount,
                        description: entities.description,
                        category: entities.category,
                        subcategory: entities.subcategory,
                        date: entities.date,
                        paymentMethod: entities.paymentMethod,
                        status: entities.status
                    }
                );
            
            case INTENTS.UPDATE_INCOME_FIELD:
                return await spreadsheetActions.updateIncomeField(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId,
                    entities.identifier,
                    entities.field,
                    entities.newValue
                );
            
            case INTENTS.UPDATE_EXPENSE_FIELD:
                return await spreadsheetActions.updateExpenseField(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId,
                    entities.identifier,
                    entities.field,
                    entities.newValue
                );
            
            case INTENTS.DELETE_INCOME:
                return await spreadsheetActions.deleteIncome(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId,
                    entities.identifier
                );
            
            case INTENTS.DELETE_EXPENSE:
                return await spreadsheetActions.deleteExpense(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId,
                    entities.identifier
                );
            
            case INTENTS.LIST_INCOMES:
                return await spreadsheetActions.listIncomes(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId
                );
            
            case INTENTS.LIST_EXPENSES:
                return await spreadsheetActions.listExpenses(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId
                );
            
            case INTENTS.CLEAR_ALL_INCOMES:
                return await spreadsheetActions.clearAllIncomes(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId
                );
            
            case INTENTS.CLEAR_ALL_EXPENSES:
                return await spreadsheetActions.clearAllExpenses(
                    userToken,
                    OPERATIONAL_SERVER_URL,
                    monthId
                );
            
            case INTENTS.BULK_ADD:
                console.log('\n📦 AÇÃO: Adicionar Múltiplos Itens');
                console.log(`   📊 Total de itens: ${entities.items?.length || 0}`);
                
                const results = {
                    success: true,
                    incomes: { added: 0, failed: 0 },
                    expenses: { added: 0, failed: 0 },
                    details: []
                };
                
                if (!entities.items || entities.items.length === 0) {
                    return {
                        success: false,
                        message: 'Nenhum item para adicionar.'
                    };
                }
                
                for (const item of entities.items) {
                    try {
                        if (item.type === 'income') {
                            const result = await spreadsheetActions.addIncome(
                                userToken,
                                OPERATIONAL_SERVER_URL,
                                monthId,
                                {
                                    amount: item.amount,
                                    description: item.description,
                                    category: item.category,
                                    subcategory: item.subcategory,
                                    date: item.date,
                                    status: item.status
                                }
                            );
                            if (result.success) {
                                results.incomes.added++;
                                results.details.push(`✅ Receita: ${item.description} (R$ ${item.amount})`);
                            } else {
                                results.incomes.failed++;
                                results.details.push(`❌ Receita: ${item.description} - ${result.message}`);
                            }
                        } else if (item.type === 'expense') {
                            const result = await spreadsheetActions.addExpense(
                                userToken,
                                OPERATIONAL_SERVER_URL,
                                monthId,
                                {
                                    amount: item.amount,
                                    description: item.description,
                                    category: item.category,
                                    subcategory: item.subcategory,
                                    date: item.date,
                                    paymentMethod: item.paymentMethod || 'Dinheiro',
                                    status: item.status
                                }
                            );
                            if (result.success) {
                                results.expenses.added++;
                                results.details.push(`✅ Despesa: ${item.description} (R$ ${item.amount})`);
                            } else {
                                results.expenses.failed++;
                                results.details.push(`❌ Despesa: ${item.description} - ${result.message}`);
                            }
                        }
                    } catch (error) {
                        console.error(`   ❌ Erro ao processar item ${item.description}:`, error.message);
                        results.details.push(`❌ ${item.description} - Erro: ${error.message}`);
                    }
                }
                
                console.log(`   ✅ Processamento concluído!`);
                console.log(`   📊 Receitas: ${results.incomes.added} adicionadas`);
                console.log(`   💸 Despesas: ${results.expenses.added} adicionadas`);
                
                actionResult = {
                    success: true,
                    data: results
                };
                break;
            default:
                console.log('   ℹ️ Intent não requer ação direta na planilha');
                return { requiresAIResponse: true };
        }
        
        // ========== PROCESSAR RESPOSTA COM SISTEMA DE RACIOCÍNIO ==========
        if (actionResult && actionResult.success) {
            console.log('   ✅ Ação executada com sucesso!');
            
            // Buscar dados do usuário para contexto
            const userData = {
                currentMonth: monthId
            };
            
            // Criar instância do processo de pensamento
            const thoughtProcess = new ThoughtProcess();
            
            // Processar resposta natural
            const intelligentResponse = thoughtProcess.process(
                intent,
                entities,
                actionResult,
                userData
            );
            
            // Se requer resposta da IA (consultas complexas)
            if (intelligentResponse.requiresAI) {
                console.log('   🤖 Requer resposta elaborada da IA');
                return { requiresAIResponse: true };
            }
            
            // Usar resposta humanizada
            actionResult.message = intelligentResponse.response;
            actionResult.metadata = intelligentResponse.metadata;
            
            console.log('   🧠 Resposta humanizada gerada!');
        }
        
        return actionResult;
    } catch (error) {
        console.error('   ❌ Erro ao executar ação:', error.message);
        return {
            success: false,
            message: 'Ops, algo deu errado. Pode tentar de novo? 😅',
            error: error.message
        };
    }
}

// ========== ROTA PRINCIPAL DO CHAT ==========
app.post('/api/chat', verifyUserToken, async (req, res) => {
    try {
        const { message } = req.body;
        const currentMonth = getCurrentMonth();
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Mensagem inválida' });
        }

        console.log('\n╔═════════════════════════════════════════════════════════╗');
        console.log('║                   🤖 NOVA CONSULTA                      ║');
        console.log('╚═════════════════════════════════════════════════════════╝');
        console.log(`👤 Usuário: ${req.userId}`);
        console.log(`📅 Data atual: ${currentDate}`);
        console.log(`📆 Mês atual: ${currentMonth}`);
        console.log(`💬 Pergunta: "${message}"`);
        console.log('─────────────────────────────────────────────────────────\n');
        
        console.log('─────────────────────────────────────────────────────────\n');
        
        // ========== BUSCAR CONVERSAÇÃO E RESUMO ANTES DE DETECTAR INTENT ==========
        console.log('🔍 Verificando conversa ativa e resumo...');
        let conversaId = req.body.conversaId;
        let resumoContexto = '';
        
        if (conversaId) {
            try {
                const resumoResponse = await axios.get(
                    `${OPERATIONAL_SERVER_URL}/api/conversas/${conversaId}/resumo`,
                    { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                );
                resumoContexto = resumoResponse.data.resumo || '';
                if (resumoContexto) {
                    console.log('   📚 Resumo carregado:', resumoContexto.substring(0, 100) + '...');
                }
            } catch (error) {
                console.log('   ⚠️ Erro ao buscar resumo:', error.message);
            }
        } else {
            console.log('   ℹ️ Nova conversa - será criada após resposta');
        }
        
        // ========== PASSO 0: DETECTAR INTENT COM CONTEXTO ==========
        console.log('╔═════════════════════════════════════════════════════════╗');
        console.log('║             PASSO 0: DETECÇÃO DE INTENT                 ║');
        console.log('╚═════════════════════════════════════════════════════════╝');
        
        const intentData = await detectIntent(message, currentDate, resumoContexto);
        
        // ========== VERIFICAR SE É AÇÃO DIRETA NA PLANILHA ==========
        const spreadsheetIntents = [
            INTENTS.ADD_INCOME,
            INTENTS.ADD_EXPENSE,
            INTENTS.EDIT_INCOME,
            INTENTS.EDIT_EXPENSE,
            INTENTS.UPDATE_INCOME_FIELD,
            INTENTS.UPDATE_EXPENSE_FIELD,
            INTENTS.DELETE_INCOME,
            INTENTS.DELETE_EXPENSE,
            INTENTS.CLEAR_ALL_INCOMES,
            INTENTS.CLEAR_ALL_EXPENSES,
            INTENTS.BULK_ADD
        ];
        
        if (spreadsheetIntents.includes(intentData.intent)) {
            console.log('\n📝 Intent requer ação direta na planilha!');
            console.log('   ⚡ Executando ação antes de gerar resposta...\n');
            
            const actionResult = await executeAction(
                intentData.intent,
                intentData.entities,
                req.userToken,
                currentMonth
            );
            
            if (actionResult.success) {
                console.log('   ✅ Ação executada com sucesso!');
                
                // Criar ou atualizar conversa
                let conversaId = req.body.conversaId;
                if (!conversaId) {
                    console.log('\n🆕 Criando nova conversa...');
                    try {
                        const novaConversa = await axios.post(
                            `${OPERATIONAL_SERVER_URL}/api/conversas`,
                            { titulo: message.substring(0, 50) + (message.length > 50 ? '...' : '') },
                            { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                        );
                        conversaId = novaConversa.data.conversa._id;
                        console.log('   ✅ Conversa criada:', conversaId);
                    } catch (error) {
                        console.error('   ❌ Erro ao criar conversa:', error.message);
                    }
                }
                
                // Atualizar resumo
                if (conversaId) {
                    await atualizarResumoConversa(conversaId, message, actionResult.message, req.userToken);
                }
                
                console.log('\n╔═════════════════════════════════════════════════════════╗');
                console.log('║            ✨ CONSULTA FINALIZADA COM SUCESSO           ║');
                console.log('╚═════════════════════════════════════════════════════════╝\n');
                
                return res.json({
                    success: true,
                    response: actionResult.message,
                    conversaId: conversaId,
                    debug: {
                        intent: intentData.intent,
                        confidence: intentData.confidence,
                        actionExecuted: true,
                        currentDate: currentDate
                    }
                });
            } else {
                console.log('   ❌ Falha na execução da ação');
                return res.json({
                    success: false,
                    response: actionResult.message || 'Não consegui executar essa ação. Pode tentar novamente?',
                    conversaId: req.body.conversaId,
                    debug: {
                        intent: intentData.intent,
                        confidence: intentData.confidence,
                        actionExecuted: false,
                        error: actionResult.error
                    }
                });
            }
        }
        
        // ========== CONTINUAR COM FLUXO NORMAL PARA OUTROS INTENTS ==========
        console.log('\n💬 Intent requer resposta conversacional');
        console.log('   🔄 Continuando com fluxo normal...\n');

        // ========== PASSO 0.5: VERIFICAR SE PRECISA PESQUISAR NA INTERNET ==========
        console.log('╔═════════════════════════════════════════════════════════╗');
        console.log('║      PASSO 0.5: VERIFICAÇÃO DE PESQUISA NECESSÁRIA      ║');
        console.log('╚═════════════════════════════════════════════════════════╝');
        
        let resultadosPesquisa = null;
        const decisaoPesquisa = await precisaPesquisar(message, intentData);
        
        console.log('   🤔 Decisão:', decisaoPesquisa.precisa ? 'PRECISA pesquisar' : 'NÃO precisa pesquisar');
        console.log('   💭 Motivo:', decisaoPesquisa.motivo);
        
        if (decisaoPesquisa.precisa && decisaoPesquisa.queryPesquisa) {
            console.log('   🌐 Realizando pesquisa na internet...');
            resultadosPesquisa = await pesquisarNaInternet(decisaoPesquisa.queryPesquisa);
            
            if (resultadosPesquisa?.temResultados) {
                console.log('   ✅ Pesquisa bem-sucedida - dados disponíveis para contexto');
            } else {
                console.log('   ⚠️ Pesquisa não retornou resultados úteis');
            }
        }

        // ========== PASSO 1: IA DECIDE QUAIS DADOS PRECISA ==========
        console.log('╔═════════════════════════════════════════════════════════╗');
        console.log('║        PASSO 1: ANÁLISE DE DADOS NECESSÁRIOS            ║');
        console.log('╚═════════════════════════════════════════════════════════╝');
        console.log('🔍 Analisando quais dados são necessários...');
        
        const decisionPrompt = `${DECISION_PROMPT}

DATA ATUAL: ${currentDate}
MÊS ATUAL: ${currentMonth}
PERGUNTA DO USUÁRIO: "${message}"

Responda apenas com JSON válido.`;

        console.log('   ⏳ Consultando OpenAI para decisão...');
        
        const decisionResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: decisionPrompt }],
                max_tokens: 300,
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        let decision;
        try {
            const decisionText = decisionResponse.data.choices[0].message.content;
            console.log('   📄 Resposta bruta da IA:');
            console.log('   ', decisionText);
            
            // Limpar possível markdown
            const cleanJson = decisionText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            decision = JSON.parse(cleanJson);
            
            // Substituir MÊS-ATUAL pelo mês real
            if (decision.timeframe?.months) {
                decision.timeframe.months = decision.timeframe.months.map(m => 
                    m === 'MÊS-ATUAL' ? currentMonth : m
                );
            }
            
            console.log('\n   ✅ Decisão interpretada:');
            console.log('   📊 Seções necessárias:', decision.requiredSections);
            console.log('   📅 Timeframe:', JSON.stringify(decision.timeframe));
            console.log('   💭 Raciocínio:', decision.timeframe.reasoning);
            
        } catch (error) {
            console.error('   ❌ Erro ao parsear decisão da IA:', error.message);
            console.log('   🔄 Usando fallback: dados do mês atual');
            
            // Fallback: usar dados do mês atual
            decision = {
                requiredSections: ['financas'],
                timeframe: { 
                    type: 'current_only', 
                    months: [currentMonth],
                    reasoning: 'Fallback - erro ao interpretar decisão da IA'
                }
            };
        }

        // ========== PASSO 2: BUSCAR DADOS ORGANIZADOS ==========
        console.log('\n╔═════════════════════════════════════════════════════════╗');
        console.log('║           PASSO 2: BUSCA DE DADOS DO USUÁRIO            ║');
        console.log('╚═════════════════════════════════════════════════════════╝');
        console.log('🔍 Buscando dados do usuário...');
        console.log('   📥 Conectando ao servidor operacional:', OPERATIONAL_SERVER_URL);
        
        const userData = await fetchOrganizedData(
            req.userToken,
            decision.requiredSections,
            decision.timeframe
        );

        console.log('   ✅ Dados recuperados com sucesso');
        console.log('   📦 Seções carregadas:', Object.keys(userData.sections));
        
        if (userData.sections.financas) {
            const mesesCarregados = Object.keys(userData.sections.financas);
            console.log('   📅 Meses financeiros carregados:', mesesCarregados);
        }

        // ========== PASSO 3: IA GERA RESPOSTA COM OS DADOS ==========
        console.log('\n╔═════════════════════════════════════════════════════════╗');
        console.log('║         PASSO 3: GERAÇÃO DE RESPOSTA PERSONALIZADA      ║');
        console.log('╚═════════════════════════════════════════════════════════╝');
        console.log('🔍 Gerando resposta personalizada...');
        
        // Incluir resumo da conversa no prompt, se existir
        let contextoPrevio = '';
        if (resumoContexto) {
            contextoPrevio = `\n\nCONTEXTO DA CONVERSA ANTERIOR:\n${resumoContexto}\n\nUse este contexto para dar continuidade à conversa de forma natural e coerente.`;
        }
        
        // Incluir informações do intent detectado
        const intentContext = `\n\nINFORMAÇÕES DO INTENT DETECTADO:\n- Intent: ${intentData.intent}\n- Confiança: ${(intentData.confidence * 100).toFixed(0)}%\n- Raciocínio: ${intentData.reasoning}\n- Entidades extraídas: ${JSON.stringify(intentData.entities)}\n\nUse essas informações para contextualizar melhor sua resposta.`;
        
        // Incluir resultados da pesquisa na internet, se houver
        let contextoPesquisa = '';
        if (resultadosPesquisa?.temResultados) {
            contextoPesquisa = `\n\n🌐 INFORMAÇÕES DA INTERNET:\nPesquisa realizada: "${resultadosPesquisa.query}"\n\n`;
            
            if (resultadosPesquisa.resposta) {
                contextoPesquisa += `Resposta Direta: ${resultadosPesquisa.resposta}\n\n`;
            }
            
            if (resultadosPesquisa.knowledgeGraph) {
                contextoPesquisa += `Knowledge Graph:\n- Título: ${resultadosPesquisa.knowledgeGraph.titulo}\n- Descrição: ${resultadosPesquisa.knowledgeGraph.descricao}\n`;
                if (resultadosPesquisa.knowledgeGraph.atributos) {
                    contextoPesquisa += `- Atributos: ${JSON.stringify(resultadosPesquisa.knowledgeGraph.atributos)}\n`;
                }
                contextoPesquisa += '\n';
            }
            
            if (resultadosPesquisa.resultados?.length > 0) {
                contextoPesquisa += 'Principais Resultados:\n';
                resultadosPesquisa.resultados.forEach((r, i) => {
                    contextoPesquisa += `${i + 1}. ${r.titulo}\n   ${r.snippet}\n   Fonte: ${r.link}\n\n`;
                });
            }
            
            contextoPesquisa += 'IMPORTANTE: Use estas informações da internet para complementar sua resposta com dados atualizados e precisos. Cite as fontes quando relevante.';
        }
        
        const finalPrompt = `${RESPONSE_PROMPT}

DATA ATUAL: ${currentDate}${contextoPrevio}${intentContext}${contextoPesquisa}

DADOS DO USUÁRIO:
${JSON.stringify(userData, null, 2)}

PERGUNTA: "${message}"

Forneça uma resposta completa, personalizada e útil baseada nos dados reais do usuário${resultadosPesquisa?.temResultados ? ' e nas informações atualizadas da internet' : ''}.`;

        console.log('   ⏳ Consultando OpenAI para resposta final...');

        const finalResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: finalPrompt }],
                max_tokens: 1000,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiMessage = finalResponse.data.choices[0].message.content;
        
        console.log('   ✅ Resposta gerada com sucesso');
        console.log('   📝 Tamanho da resposta:', aiMessage.length, 'caracteres');
        
        // ========== CRIAR CONVERSA SE NÃO EXISTIR ==========
        if (!conversaId) {
            console.log('\n🆕 Criando nova conversa...');
            try {
                const novaConversa = await axios.post(
                    `${OPERATIONAL_SERVER_URL}/api/conversas`,
                    { titulo: message.substring(0, 50) + (message.length > 50 ? '...' : '') },
                    { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                );
                conversaId = novaConversa.data.conversa._id;
                console.log('   ✅ Conversa criada:', conversaId);
            } catch (error) {
                console.error('   ❌ Erro ao criar conversa:', error.message);
                console.error('   📄 Detalhes:', error.response?.data);
                // Continuar mesmo sem criar a conversa (modo degradado)
            }
        }
        
        // ========== ATUALIZAR RESUMO DA CONVERSA (SÍNCRONO) ==========
        if (conversaId) {
            console.log('\n🔄 Atualizando resumo da conversa (aguardando conclusão)...');
            try {
                // IMPORTANTE: Executar de forma síncrona para garantir que capture a mensagem correta
                await atualizarResumoConversa(conversaId, message, aiMessage, req.userToken);
                console.log('   ✅ Resumo atualizado com sucesso');
            } catch (error) {
                console.error('   ❌ Erro ao atualizar resumo:', error.message);
                // Não bloquear a resposta ao usuário por erro no resumo
            }
        } else {
            console.log('\n   ⚠️ ConversaId não disponível - resumo não será atualizado');
        }
        
        console.log('\n╔═════════════════════════════════════════════════════════╗');
        console.log('║            ✨ CONSULTA FINALIZADA COM SUCESSO           ║');
        console.log('╚═════════════════════════════════════════════════════════╝\n');

        res.json({
            success: true,
            response: aiMessage,
            conversaId: conversaId,
            debug: {
                intent: intentData.intent,
                confidence: intentData.confidence,
                sectionsUsed: decision.requiredSections,
                timeframe: decision.timeframe,
                currentDate: currentDate,
                resumoUsado: !!resumoContexto,
                actionExecuted: false,
                pesquisaRealizada: !!resultadosPesquisa?.temResultados,
                queryPesquisa: decisaoPesquisa.precisa ? decisaoPesquisa.queryPesquisa : null
            }
        });

    } catch (error) {
        console.error('\n❌ ERRO NO PROCESSAMENTO DO CHAT:');
        console.error('   Tipo:', error.name);
        console.error('   Mensagem:', error.message);
        if (error.response?.data) {
            console.error('   Detalhes:', JSON.stringify(error.response.data, null, 2));
        }
        console.log('╚═════════════════════════════════════════════════════════╝\n');

        if (error.response?.status === 429) {
            return res.status(429).json({
                error: 'Muitas requisições. Aguarde um momento.'
            });
        }

        if (error.response?.status === 401) {
            return res.status(500).json({
                error: 'Erro de autenticação com OpenAI.'
            });
        }

        res.status(500).json({
            error: 'Desculpe, tive um problema ao processar sua mensagem.',
            details: error.message
        });
    }
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
    console.log(`\n🤖 Servidor Merfin Agent Inteligente`);
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🔑 OpenAI: ${process.env.OPENAI_API_KEY ? '✓' : '✗'}`);
    console.log(`� Pesquisa Internet: ${SEARCH_API_KEY ? '✓' : '✗'}`);
    console.log(`�🔗 Server Operacional: ${OPERATIONAL_SERVER_URL}`);
    console.log(`📊 Seções disponíveis: ${Object.keys(AVAILABLE_SECTIONS).join(', ')}\n`);
});
