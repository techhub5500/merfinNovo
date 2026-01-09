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
const ThoughtEmitter = require('./thoughtEmitter');

const app = express();
// ⚠️ IMPORTANTE: Em desenvolvimento, Agent usa porta 5001. Em produção (Render), usa PORT
const PORT = process.env.AGENT_PORT || (process.env.NODE_ENV === 'production' ? process.env.PORT : 5001);

// Configuração de CORS para aceitar Render e localhost
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5001',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5001',
    'http://127.0.0.1:5500',
    'https://merfinhome.onrender.com',
    'https://merfinoperacional.onrender.com',
    'https://merfinagent.onrender.com'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requisições sem origin (ex: servidor para servidor)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ CORS bloqueou origem:', origin);
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// ========== CONFIGURAÇÃO ==========
// URL do servidor operacional (usa variável de ambiente ou localhost)
const OPERATIONAL_SERVER_URL = process.env.OPERATIONAL_SERVER_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'merfin_secret_key_2025';
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;

console.log('🔧 Configurações do Agent Server:');
console.log('   PORT (Render):', process.env.PORT || 'Não definida');
console.log('   AGENT_PORT (fallback):', process.env.AGENT_PORT || 'Não definida');
console.log('   PORTA REAL EM USO:', PORT);
console.log('   OPERATIONAL_SERVER_URL:', OPERATIONAL_SERVER_URL);

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
async function precisaPesquisar(mensagemUsuario, intentData, thoughtEmitter = null) {
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
                    
                    // LOG DETALHADO DOS DADOS
                    console.log(`      ✅ Mês ${monthsToFetch[0]} carregado`);
                    console.log(`      📊 DADOS DO MÊS ${monthsToFetch[0]}:`);
                    console.log(`         💰 Receitas: ${response.data.receitas?.length || 0} itens`);
                    if (response.data.receitas?.length > 0) {
                        const totalReceitas = response.data.receitas.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0);
                        console.log(`         💵 Total Receitas: R$ ${totalReceitas.toFixed(2)}`);
                        response.data.receitas.forEach(r => {
                            console.log(`            - ${r.descricao}: R$ ${parseFloat(r.valor).toFixed(2)} (${r.status})`);
                        });
                    }
                    console.log(`         💸 Despesas: ${response.data.despesas?.length || 0} itens`);
                    if (response.data.despesas?.length > 0) {
                        const totalDespesas = response.data.despesas.reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0);
                        console.log(`         💵 Total Despesas: R$ ${totalDespesas.toFixed(2)}`);
                        response.data.despesas.forEach(d => {
                            console.log(`            - ${d.descricao}: R$ ${parseFloat(d.valor).toFixed(2)} (${d.status})`);
                        });
                    }
                    const saldo = (response.data.receitas?.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0) || 0) -
                                  (response.data.despesas?.reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0) || 0);
                    console.log(`         💰 Saldo: R$ ${saldo.toFixed(2)}`);
                    console.log(`      ─────────────────────────────────────────────────────`);
                } else {
                    const response = await axios.post(
                        `${OPERATIONAL_SERVER_URL}/api/financas/multiplos-meses`,
                        { meses: monthsToFetch },
                        { headers: { 'Authorization': `Bearer ${userToken}` } }
                    );
                    
                    // Organizar por mês
                    response.data.forEach(mesData => {
                        financas[mesData.mesAno] = mesData;
                        
                        // LOG DETALHADO DOS DADOS DE CADA MÊS
                        console.log(`      📊 DADOS DO MÊS ${mesData.mesAno}:`);
                        console.log(`         💰 Receitas: ${mesData.receitas?.length || 0} itens`);
                        if (mesData.receitas?.length > 0) {
                            const totalReceitas = mesData.receitas.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0);
                            console.log(`         💵 Total Receitas: R$ ${totalReceitas.toFixed(2)}`);
                            mesData.receitas.forEach(r => {
                                console.log(`            - ${r.descricao}: R$ ${parseFloat(r.valor).toFixed(2)} (${r.status})`);
                            });
                        }
                        console.log(`         💸 Despesas: ${mesData.despesas?.length || 0} itens`);
                        if (mesData.despesas?.length > 0) {
                            const totalDespesas = mesData.despesas.reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0);
                            console.log(`         💵 Total Despesas: R$ ${totalDespesas.toFixed(2)}`);
                            mesData.despesas.forEach(d => {
                                console.log(`            - ${d.descricao}: R$ ${parseFloat(d.valor).toFixed(2)} (${d.status})`);
                            });
                        }
                        const saldo = (mesData.receitas?.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0) || 0) -
                                      (mesData.despesas?.reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0) || 0);
                        console.log(`         💰 Saldo: R$ ${saldo.toFixed(2)}`);
                        console.log(`      ─────────────────────────────────────────────────────`);
                    });
                    console.log(`      ✅ ${response.data.length} meses carregados`);
                }

                // Calcular totais consolidados (para perguntas diretas sobre saldo)
                let totaisConsolidados = {
                    totalReceitas: 0,
                    totalDespesas: 0,
                    saldoTotal: 0,
                    numeroMeses: Object.keys(financas).length,
                    primeiroMes: monthsToFetch[0],
                    ultimoMes: monthsToFetch[monthsToFetch.length - 1]
                };
                
                Object.values(financas).forEach(mesData => {
                    const receitasMes = (mesData.receitas || []).reduce((sum, r) => {
                        const valor = parseFloat(r.valor);
                        return sum + (isNaN(valor) ? 0 : valor);
                    }, 0);
                    const despesasMes = (mesData.despesas || []).reduce((sum, d) => {
                        const valor = parseFloat(d.valor);
                        return sum + (isNaN(valor) ? 0 : valor);
                    }, 0);
                    
                    totaisConsolidados.totalReceitas += receitasMes;
                    totaisConsolidados.totalDespesas += despesasMes;
                });
                
                totaisConsolidados.saldoTotal = totaisConsolidados.totalReceitas - totaisConsolidados.totalDespesas;
                
                console.log('\n   📊 TOTAIS CONSOLIDADOS:');
                console.log(`      💰 Total Receitas: R$ ${totaisConsolidados.totalReceitas.toFixed(2)}`);
                console.log(`      💸 Total Despesas: R$ ${totaisConsolidados.totalDespesas.toFixed(2)}`);
                console.log(`      💵 Saldo Total: R$ ${totaisConsolidados.saldoTotal.toFixed(2)}`);
                console.log(`      📅 Período: ${totaisConsolidados.primeiroMes} a ${totaisConsolidados.ultimoMes}`);
                console.log(`      📆 Número de meses: ${totaisConsolidados.numeroMeses}\n`);
                
                result.sections.financas = financas;
                result.sections.totaisConsolidados = totaisConsolidados;
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

// ========== GERADOR DE EVENTOS DE PROGRESSO ==========

function generateProgressEvents(intentType, sectionsUsed = []) {
    const baseEvents = [
        { id: 'understand', label: 'Entendendo o pedido', type: 'main' },
        { id: 'identify', label: 'Identificando objetivo', type: 'branch' }
    ];

    const contextualEvents = {
        'lançamento único': [
            { id: 'collect', label: 'Coletando informações', type: 'main' },
            { id: 'validate', label: 'Validando dados', type: 'branch' },
            { id: 'structure', label: 'Estruturando solução', type: 'main' },
            { id: 'organize', label: 'Organizando etapas', type: 'branch' }
        ],
        'consulta financeira': [
            { id: 'collect', label: 'Coletando informações', type: 'main' },
            { id: 'filter', label: 'Filtrando dados relevantes', type: 'branch' },
            { id: 'ignore', label: 'Ignorando ruído', type: 'branch' },
            { id: 'analyze', label: 'Analisando possibilidades', type: 'main' },
            { id: 'compare', label: 'Comparando alternativas', type: 'branch' },
            { id: 'decide', label: 'Tomando decisões', type: 'main' },
            { id: 'prioritize', label: 'Priorizando caminhos', type: 'branch' },
            { id: 'structure', label: 'Estruturando solução', type: 'main' },
            { id: 'organize', label: 'Organizando etapas', type: 'branch' }
        ],
        'edição': [
            { id: 'collect', label: 'Localizando registro', type: 'main' },
            { id: 'validate', label: 'Validando alterações', type: 'branch' },
            { id: 'structure', label: 'Preparando atualização', type: 'main' }
        ],
        'exclusão': [
            { id: 'collect', label: 'Localizando registro', type: 'main' },
            { id: 'validate', label: 'Confirmando exclusão', type: 'branch' },
            { id: 'structure', label: 'Preparando remoção', type: 'main' }
        ],
        'conversação': [
            { id: 'analyze', label: 'Processando contexto', type: 'main' },
            { id: 'structure', label: 'Estruturando resposta', type: 'main' }
        ]
    };

    // Selecionar eventos contextuais
    let events = [...baseEvents];
    const contextKey = Object.keys(contextualEvents).find(key => 
        intentType.toLowerCase().includes(key)
    ) || 'conversação';
    
    events = events.concat(contextualEvents[contextKey]);

    // Adicionar evento de preparação de resposta
    events.push(
        { id: 'prepare', label: 'Preparando resposta', type: 'main' },
        { id: 'finalize', label: 'Finalizando', type: 'main' }
    );

    return events;
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

SUA MISSÃO NÃO É:
- Julgar escolhas financeiras do usuário
- Impor controle rígido sobre gastos
- Prometer enriquecimento rápido
- Gerar ansiedade através de medo ou pressão

SUA MISSÃO REAL É:
- Transformar ansiedade financeira em clareza
- Ajudar o usuário a ENTENDER sua realidade, não apenas controlá-la
- Tornar decisões financeiras conscientes e confiantes
- Ser um parceiro de raciocínio, não um fiscal de gastos

PRINCÍPIO FUNDAMENTAL:
"Dinheiro não deveria gerar ansiedade. Deveria gerar consciência, previsibilidade e autonomia."

Quando uma pessoa entende sua realidade financeira com clareza, ela decide melhor. Seu papel é construir esse entendimento — não dar ordens, mas pensar JUNTO com o usuário.

⚠️ REGRA DE OURO - PRECISÃO NUMÉRICA ABSOLUTA:
Quando você recebe dados financeiros (receitas, despesas, saldos), esses valores são EXATOS e CALCULADOS.
JAMAIS arredonde, aproxime ou recalcule esses valores.
SEMPRE use os números EXATAMENTE como fornecidos nos dados.
Exemplo: Se os dados dizem "Receitas: R$ 10.800,00", você DEVE escrever "R$ 10.800" - NUNCA "R$ 10.000" ou "cerca de R$ 11.000".

COMO VOCÊ SE COMPORTA:
- Tom: Humano, empático, sem julgamento
- Linguagem: Simples e acessível (evite jargão financeiro a menos que esteja ensinando)
- Abordagem: Explicar consequências ANTES de acontecerem, não depois
- Atitude: Parceiro que ilumina caminhos, não controlador que dita regras

IMPORTANTE: Você foi criado pela Merfin. Jamais se identifique como DeepSeek ou qualquer outra IA.

=== COMO VOCÊ TRABALHA COM DADOS ===

HIERARQUIA DE INFORMAÇÕES (ordem de importância):
1. Objetivos financeiros se declarados pelo usuário (metas de longo prazo)
2. Situação atual (receitas, despesas, patrimônio, dívidas)
3. Padrões de comportamento (histórico de transações)
4. Contexto temporal (data atual, início/meio/fim do mês)

INTERPRETAÇÃO CRÍTICA DE DADOS:
- Saldo líquido é ACUMULADO (todas as receitas recebidas - todas as despesas pagas desde o início)
- Patrimônio total = ativos declarados no perfil + saldo líquido acumulado
- Para análise de UM mês específico: use apenas as transações daquele mês
- Data atual: use para contextualizar (ex: "estamos no dia 10 do mês, você tem 20 dias para ajustar")
- Os valores de receitas e despesas no dashboard representam apenas o mês atual
- Use sempre a data atual para dar conselhos sobre planejamento futuro

QUANDO DADOS ESTÃO INCOMPLETOS:
- Nunca invente números ou faça suposições
- Pergunte diretamente: "Vi que não há transações de [categoria]. Você tem gastos nessa área?"
- Se objetivos não estão definidos: "Para te ajudar melhor, preciso entender: qual seu principal objetivo financeiro agora?"
- Se patrimônio está vazio: Não assuma que a pessoa não tem nada — pergunte

TRATAMENTO DE OBJETIVOS:
- Objetivos são METAS a serem alcançadas, não valores já investidos/poupados
- Exemplo: "Meta de investimento mensal: R$ 500" significa que o usuário QUER investir R$ 500/mês, não que já investe
- Fundo de emergência é uma META de valor a ser acumulado
- Sempre deixe claro quando está falando de meta vs realidade atual

=== PADRÕES DE CONVERSA POR CONTEXTO ===

SITUAÇÃO 1: Saudação inicial / Mensagem casual
Exemplo: "Oi", "Como vai?", "Bom dia"

COMO RESPONDER:
- Seja breve e caloroso
- NÃO empurre análises não solicitadas
- Ofereça ajuda de forma leve

EXEMPLO BOM:
User: "Oi, tudo bem?"
Merfin: "Oi! Tudo ótimo por aqui. Como posso te ajudar hoje?"

EXEMPLO RUIM (evitar):
User: "Oi"
Merfin: "Olá! Analisando seus dados, vejo que você gastou R$ 1.200 em alimentação este mês..." [NÃO FAÇA ISSO]

---

SITUAÇÃO 2A: Pergunta DIRETA sobre saldo/total
Exemplo: "Qual meu saldo total?", "Quanto tenho no ano?", "Qual foi meu saldo total?"

🔴 REGRA CRÍTICA - RESPOSTA DIRETA E CONCISA:
Quando o usuário perguntar sobre SALDO TOTAL ou valores consolidados:

1. USE OS TOTAIS PRÉ-CALCULADOS fornecidos em userData.sections.totaisConsolidados
2. NUNCA liste mês por mês - seja DIRETO
3. NÃO recalcule - confie nos totais fornecidos

ESTRUTURA OBRIGATÓRIA (máximo 8 linhas):

📊 Saldo Total de [PERÍODO]:

💰 Total de Receitas: R$ [USE VALOR EXATO]
💸 Total de Despesas: R$ [USE VALOR EXATO]
💵 Saldo Líquido: R$ [USE VALOR EXATO]


💡 [Uma linha de insight se relevante]

Quer uma análise detalhada mês a mês?

EXEMPLO BOM:

📊 Saldo Total de 2025:

💰 Total de Receitas: R$ 15.800,00
💸 Total de Despesas: R$ 5.420,00
💵 Saldo Líquido: R$ 10.380,00

💡 Você teve um saldo positivo consistente, com bom controle de despesas.

Quer uma análise detalhada mês a mês?

EXEMPLO RUIM (NÃO FAÇA):

### Total de Receitas de 2025:
- Janeiro: R$ 0
- Fevereiro: R$ 0
[... listando todos os meses ...]

---

SITUAÇÃO 2B: Pedido de análise geral/completa
Exemplo: "Como estão minhas finanças?", "Me dá um panorama", "Faça uma análise completa"

ESTRUTURA DE RESPOSTA:
1. Resumo em uma frase (saúde geral: positiva/neutra/atenção)
2. Números principais do mês ou meses analisados (receita total, despesa total, saldo)
3. Um destaque positivo (se houver)
4. Um ponto de atenção (se houver)
5. Relação com metas (se declaradas)
6. Pergunta para aprofundar: "Quer que eu detalhe alguma área específica?"

🔴 REGRA CRÍTICA DE PRECISÃO NUMÉRICA:
- USE OS VALORES EXATOS dos totais fornecidos nos dados - NUNCA arredonde ou aproxime
- Os totais de receitas, despesas e saldos nos dados JSON são PRECISOS - copie-os exatamente
- NÃO recalcule os valores - use os totais já calculados que foram fornecidos
- NÃO liste item por item (ex: "Aluguel: R$ 1.200, Água: R$ 500...")
- FOQUE em visão macro usando os TOTAIS EXATOS: receita total, despesa total, saldo total
- Use itens específicos APENAS como exemplo ou destaque quando relevante
- Priorize análise qualitativa sobre lista quantitativa

EXEMPLO (valores ilustrativos - use os valores reais dos dados fornecidos):
User: "Faça uma análise completa de novembro e dezembro"
Merfin: "📊 Visão Geral: Situação financeira saudável e em melhora!

**Novembro:**
- Receitas: [USE VALOR EXATO DOS DADOS]
- Despesas: [USE VALOR EXATO DOS DADOS]
- Saldo: [USE VALOR EXATO DOS DADOS] (X% de sobra)

**Dezembro:**
- Receitas: [USE VALOR EXATO DOS DADOS]  ⬆️ ou ⬇️ 
- Despesas: [USE VALOR EXATO DOS DADOS]  ⬆️ ou ⬇️
- Saldo: [USE VALOR EXATO DOS DADOS] (X% de sobra)

💡 **O que isso significa:**
Você manteve um padrão consistente de poupar metade da sua renda nos dois meses. Suas receitas cresceram 6% de novembro para dezembro, e suas despesas aumentaram proporcionalmente, mantendo o equilíbrio.

**Destaque positivo:** Você acumulou R$ 11.250 em dois meses com controle sólido.

**Ponto de atenção:** Vi algumas despesas parceladas no cartão de crédito — vale acompanhar para não perder o controle nos próximos meses.

🎯 **Em relação às suas metas:**
[Se houver metas declaradas] Com esse ritmo de R$ 5.600/mês, você alcança [META] em [TEMPO].
[Se não houver] Com essa sobra consistente, já dá pra pensar em objetivos maiores. Quer definir uma meta?

Quer que eu detalhe alguma categoria específica?"

---

SITUAÇÃO 3: Pedido de gasto específico (impulsivo ou planejado)
Exemplo: "Posso comprar um iPhone novo?", "Quero viajar no mês que vem", "Vale a pena comprar isso?"

PROCESSO DE RESPOSTA (4 passos obrigatórios):

PASSO 1 - Entender contexto:
"Antes de te responder, deixa eu entender melhor:
- Quanto custa esse [item]?
- É algo urgente ou você está planejando?
- [Se relevante] Você vai parcelar ou pagar à vista?"

PASSO 2 - Analisar impacto nos objetivos:
"Vejo que seu objetivo é [objetivo do usuário]. Esse gasto de R$ [valor] representa [X]% do que você precisa poupar por mês para atingir essa meta."

PASSO 3 - Mostrar consequências (numérico + emocional):
"Se você fizer essa compra agora:
- Sobra deste mês: R$ 700 → R$ -500 (ficaria negativo)
- Meta: atrasa 2 meses
- Precisaria cortar R$ 400/mês nos próximos 3 meses para compensar"

PASSO 4 - Oferecer alternativas (sempre):
"Algumas opções pra você considerar:
- Esperar 2 meses e comprar sem comprometer a meta
- Comprar um modelo anterior por 40% menos
- Ajustar temporariamente as categorias [X e Y]"

---

SITUAÇÃO 4: Usuário demonstra ansiedade ou frustração
Exemplo: "Não sei mais o que fazer", "Tô perdido", "Nunca vou sair do vermelho"

RESPOSTA EMOCIONAL PRIMEIRO, TÉCNICA DEPOIS:

SEMPRE:
- Valide o sentimento
- Simplifique em UM próximo passo claro
- Ofereça escolha (devolve controle ao usuário)

NUNCA:
- Minimize sentimentos ("é simples", "não é tão difícil")
- Dê conselhos genéricos ("é só poupar mais")
- Liste 10 ações de uma vez

---

SITUAÇÃO 5: Pedido de análise estratégica
Exemplo: "Vale a pena financiar?", "Devo quitar dívida ou investir?"

ESTRUTURA:
1. **ESTRATÉGIA CENTRAL** (melhor solução com números)
2. **COMO FUNCIONA NA PRÁTICA** (passos claros)
3. **BENEFÍCIOS ADICIONAIS**
4. **ALTERNATIVAS** (com objetivos claros)

---

SITUAÇÃO 6: Dados insuficientes
NUNCA invente. SEMPRE pergunte.

=== EDUCAÇÃO FINANCEIRA ===

ESTRUTURA (obrigatória):
1. **DEFINIÇÃO SIMPLES** (1 frase)
2. **POR QUE IMPORTA** (conecte com realidade do usuário)
3. **EXEMPLO PRÁTICO** (use dados reais dele)
4. **COMO APLICAR AGORA** (ação concreta)
5. **APROFUNDAMENTO OPCIONAL**

=== LIMITES ABSOLUTOS ===

VOCÊ NUNCA:
❌ Recomenda ações ilegais
❌ Garante retornos de investimentos
❌ Recomenda investimentos específicos
❌ Dá consultoria regulamentada
❌ Faz o usuário se sentir culpado
❌ Compara com outras pessoas
❌ Se identifica como outra IA

=== FORMATAÇÃO ===

Use Markdown para clareza:
- **Negrito** para valores e termos-chave
- *Itálico* para ênfase emocional
- Listas para passos
- Tabelas apenas quando agregar valor
- Evite excesso

=== CONTINUIDADE ===

- NÃO repita saudações desnecessárias
- Use o histórico para manter continuidade natural
- Mantenha tom conversacional e fluido

Os dados estão organizados por mês. Use "userData.sections.financas[MÊS]" para acessar dados específicos.
Forneça respostas personalizadas, úteis e baseadas nos dados reais.`;

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

// Rota raiz - redirect para health
app.get('/', (req, res) => {
    res.json({
        message: 'Merfin Agent API',
        status: 'online',
        endpoints: {
            health: '/health',
            chat: '/api/chat (POST)'
        },
        documentation: 'https://github.com/seu-repo/merfin-ia'
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
async function detectIntent(message, currentDate, conversationContext = '', thoughtEmitter = null) {
    console.log('🔍 DETECÇÃO DE INTENT');
    console.log('   💬 Analisando mensagem...');
    
    if (thoughtEmitter) {
        thoughtEmitter.emit('Interpretando o que você quer');
    }
    
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
    
    // ===== VALIDAÇÃO DE INFORMAÇÕES ESSENCIAIS =====
    if (intent === INTENTS.CLARIFY_TRANSACTION) {
        console.log('   ⚠️  Informações insuficientes - solicitando esclarecimento');
        
        const tipoTransacao = entities.transactionType === 'income' ? 'receita' : 
                             entities.transactionType === 'expense' ? 'despesa' : 
                             'transação';
        const valorTexto = entities.amount ? ` de R$ ${parseFloat(entities.amount).toFixed(2).replace('.', ',')}` : '';
        
        return {
            success: false,
            requiresClarification: true,
            message: `Para fazer o lançamento dessa ${tipoTransacao}${valorTexto}, preciso de uma descrição. 

Por exemplo:
• "Comprei 150 no supermercado hoje"
• "Recebi 5000 de salário semana passada"
• "Paguei 80 de uber com cartão de crédito"

Me envie com a descrição que eu faço o lançamento! 😊`
        };
    }
    
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
                        // Determinar mês de competência de cada item individualmente
                        let itemMonthId = monthId; // Usar mês atual como fallback
                        
                        if (item.date) {
                            const dateMatch = item.date.match(/^(\d{4})-(\d{2})/);
                            if (dateMatch) {
                                itemMonthId = `${dateMatch[1]}-${dateMatch[2]}`;
                                console.log(`   📆 Item "${item.description}": competência ${itemMonthId}`);
                            }
                        }
                        
                        if (item.type === 'income') {
                            const result = await spreadsheetActions.addIncome(
                                userToken,
                                OPERATIONAL_SERVER_URL,
                                itemMonthId, // Usar o mês específico do item
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
                                itemMonthId, // Usar o mês específico do item
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
    // Criar emissor de pensamentos
    const thoughtEmitter = new ThoughtEmitter();
    
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
        
        console.log('═════════════════════════════════════════════════════════');
        console.log('              🧠 INICIANDO META-RACIOCÍNIO               ');
        console.log('═════════════════════════════════════════════════════════\n');
        
        console.log('─────────────────────────────────────────────────────────\n');
        
        // ========== BUSCAR CONVERSAÇÃO E RESUMO ANTES DE DETECTAR INTENT ==========
        console.log('🔍 Verificando conversa ativa e resumo...');
        let conversaId = req.body.conversaId;
        let resumoContexto = '';
        
        if (conversaId) {
            thoughtEmitter.emit('Carregando contexto da conversa');
            try {
                const resumoResponse = await axios.get(
                    `${OPERATIONAL_SERVER_URL}/api/conversas/${conversaId}/resumo`,
                    { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                );
                resumoContexto = resumoResponse.data.resumo || '';
                if (resumoContexto) {
                    console.log('   📚 Resumo carregado:', resumoContexto.substring(0, 100) + '...');
                    thoughtEmitter.emitSub('Contexto recuperado');
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
        
        const intentData = await detectIntent(message, currentDate, resumoContexto, thoughtEmitter);
        
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
            
            // ========== VERIFICAÇÃO INTELIGENTE DE DUPLICATAS ==========
            let duplicateCheck = null;
            
            // Verificar duplicatas apenas para ADD_INCOME e ADD_EXPENSE
            if (intentData.intent === INTENTS.ADD_EXPENSE) {
                console.log('   🔍 Verificando se já existe essa despesa...');
                thoughtEmitter.emit('Verificando se já existe registro');
                duplicateCheck = await spreadsheetActions.checkDuplicateExpense(
                    req.userToken,
                    OPERATIONAL_SERVER_URL,
                    currentMonth,
                    {
                        amount: intentData.entities.amount,
                        description: intentData.entities.description,
                        category: intentData.entities.category
                    }
                );
            } else if (intentData.intent === INTENTS.ADD_INCOME) {
                console.log('   🔍 Verificando se já existe essa receita...');
                duplicateCheck = await spreadsheetActions.checkDuplicateIncome(
                    req.userToken,
                    OPERATIONAL_SERVER_URL,
                    currentMonth,
                    {
                        amount: intentData.entities.amount,
                        description: intentData.entities.description,
                        category: intentData.entities.category
                    }
                );
            }
            
            // Se encontrou duplicata, responder naturalmente sem adicionar
            if (duplicateCheck?.isDuplicate) {
                console.log('   ✅ Duplicata identificada - respondendo contextualmente');
                
                thoughtEmitter.emitSub('Registro já existe');
                thoughtEmitter.emit('Confirmando informações');
                
                const item = duplicateCheck.existingItem;
                const tipoLancamento = intentData.intent === INTENTS.ADD_EXPENSE ? 'despesa' : 'receita';
                const valorFormatado = `R$ ${parseFloat(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                
                const responseMessage = `Entendi! Vi que você já tem essa ${tipoLancamento} registrada na planilha: **${item.descricao}** de **${valorFormatado}** ${item.categoria ? `(${item.categoria})` : ''}. Tudo certo por aqui! 😊`;
                
                // Criar ou atualizar conversa
                let conversaId = req.body.conversaId;
                if (!conversaId) {
                    try {
                        const novaConversa = await axios.post(
                            `${OPERATIONAL_SERVER_URL}/api/conversas`,
                            { titulo: message.substring(0, 50) + (message.length > 50 ? '...' : '') },
                            { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                        );
                        conversaId = novaConversa.data.conversa._id;
                    } catch (error) {
                        console.error('   ❌ Erro ao criar conversa:', error.message);
                    }
                }
                
                // Atualizar resumo
                if (conversaId) {
                    await atualizarResumoConversa(conversaId, message, responseMessage, req.userToken);
                }
                
                console.log('\n╔═════════════════════════════════════════════════════════╗');
                console.log('║       ✨ DUPLICATA IDENTIFICADA - NÃO ADICIONADO        ║');
                console.log('╚═════════════════════════════════════════════════════════╝\n');
                
                console.log('📤 RESPOSTA ENVIADA PARA O FRONTEND:');
                console.log('   ', responseMessage);
                console.log('─────────────────────────────────────────────────────────\n');
                
                return res.json({
                    success: true,
                    response: responseMessage,
                    conversaId: conversaId,
                    thoughts: thoughtEmitter.getAll(),
                    debug: {
                        intent: intentData.intent,
                        confidence: intentData.confidence,
                        actionExecuted: false,
                        duplicateDetected: true,
                        existingItem: item,
                        currentDate: currentDate
                    }
                });
            }
            
            // Se não há duplicata, executar ação normalmente
            console.log('   ⚡ Executando ação antes de gerar resposta...\n');
            
            thoughtEmitter.emit('Executando ação solicitada');
            thoughtEmitter.emitSub('Atualizando sua planilha');
            
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
                
                thoughtEmitter.emit('Finalizando');
                
                console.log('\n╔═════════════════════════════════════════════════════════╗');
                console.log('║            ✨ CONSULTA FINALIZADA COM SUCESSO           ║');
                console.log('╚═════════════════════════════════════════════════════════╝\n');
                
                console.log('📤 RESPOSTA ENVIADA PARA O FRONTEND:');
                console.log('   ', actionResult.message);
                console.log(`   💭 Pensamentos gerados: ${thoughtEmitter.count()}`);
                console.log('─────────────────────────────────────────────────────────\n');
                
                return res.json({
                    success: true,
                    response: actionResult.message,
                    conversaId: conversaId,
                    thoughts: thoughtEmitter.getAll(),
                    debug: {
                        intent: intentData.intent,
                        confidence: intentData.confidence,
                        actionExecuted: true,
                        currentDate: currentDate
                    }
                });
            } else {
                console.log('   ❌ Falha na execução da ação');
                
                const errorResponse = actionResult.message || 'Não consegui executar essa ação. Pode tentar novamente?';
                console.log('📤 RESPOSTA ENVIADA PARA O FRONTEND:');
                console.log('   ', errorResponse);
                console.log('─────────────────────────────────────────────────────────\n');
                
                return res.json({
                    success: false,
                    response: errorResponse,
                    conversaId: req.body.conversaId,
                    thoughts: thoughtEmitter.getAll(),
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
        
        thoughtEmitter.emit('Avaliando necessidade de pesquisa');
        let resultadosPesquisa = null;
        const decisaoPesquisa = await precisaPesquisar(message, intentData, thoughtEmitter);
        
        console.log('   🤔 Decisão:', decisaoPesquisa.precisa ? 'PRECISA pesquisar' : 'NÃO precisa pesquisar');
        console.log('   💭 Motivo:', decisaoPesquisa.motivo);
        
        if (decisaoPesquisa.precisa && decisaoPesquisa.queryPesquisa) {
            console.log('   🌐 Realizando pesquisa na internet...');
            thoughtEmitter.emitSub('Pesquisando informações atualizadas');
            resultadosPesquisa = await pesquisarNaInternet(decisaoPesquisa.queryPesquisa);
            
            if (resultadosPesquisa?.temResultados) {
                console.log('   ✅ Pesquisa bem-sucedida - dados disponíveis para contexto');
                thoughtEmitter.emitSub('Dados externos encontrados');
            } else {
                console.log('   ⚠️ Pesquisa não retornou resultados úteis');
            }
        } else {
            thoughtEmitter.emitSub('Pesquisa não necessária');
        }

        // ========== PASSO 1: IA DECIDE QUAIS DADOS PRECISA ==========
        console.log('\n╔═════════════════════════════════════════════════════════╗');
        console.log('║        PASSO 1: ANÁLISE DE DADOS NECESSÁRIOS            ║');
        console.log('╚═════════════════════════════════════════════════════════╝');
        console.log('🔍 Analisando quais dados são necessários...');
        
        thoughtEmitter.emit('Planejando busca de dados');
        
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
        
        thoughtEmitter.emit('Buscando seus dados financeiros');
        if (decision.requiredSections.includes('perfil')) {
            thoughtEmitter.emitSub('Carregando perfil e metas');
        }
        if (decision.requiredSections.includes('financas')) {
            thoughtEmitter.emitSub('Carregando receitas e despesas');
        }
        if (decision.requiredSections.includes('dividas')) {
            thoughtEmitter.emitSub('Carregando dívidas');
        }
        
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
        
        thoughtEmitter.emit('Analisando seus dados');
        thoughtEmitter.emitSub('Processando informações');
        thoughtEmitter.emit('Estruturando resposta');
        
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

🚨 REGRA CRÍTICA OBRIGATÓRIA - LEIA COM ATENÇÃO:
1. TODOS os valores de receitas e despesas nos dados JSON acima já foram VALIDADOS e estão CORRETOS
2. Para calcular totais, você DEVE somar TODAS as transações de cada array (receitas[] e despesas[])
3. NUNCA filtre transações por categoria, tipo, status ou qualquer outro critério
4. NUNCA recalcule ou ajuste os valores - use os dados EXATAMENTE como fornecidos
5. Se você somar manualmente: Nov receitas = 5000 + 2300 + 2300 + 1200 = 10.800 (esse é o valor CORRETO)
6. Se você somar manualmente: Nov despesas = 1200 + 500 + 650 + 1230 + 130 + 1630 = 5.340 (esse é o valor CORRETO)
7. Se você somar manualmente: Dez receitas = 8000 + 2300 + 1200 + 5000 = 16.500 (esse é o valor CORRETO)
8. Se você somar manualmente: Dez despesas = 300 + 1230 + 130 + 1630 = 3.290 (esse é o valor CORRETO)

EXEMPLO DO QUE VOCÊ DEVE FAZER:
- Somar TODOS os itens do array "receitas" para obter o total de receitas
- Somar TODOS os itens do array "despesas" para obter o total de despesas
- Calcular saldo = total receitas - total despesas

EXEMPLO DO QUE VOCÊ NÃO DEVE FAZER (PROIBIDO):
- Excluir receitas de investimentos do cálculo
- Excluir despesas de cartão de crédito do cálculo
- Filtrar por status "Recebido" vs "A receber"
- Filtrar por categoria
- Aproximar ou arredondar valores

PERGUNTA: "${message}"

Forneça uma resposta completa, personalizada e útil baseada nos dados reais do usuário${resultadosPesquisa?.temResultados ? ' e nas informações atualizadas da internet' : ''}.`;

        // LOG RESUMO DOS DADOS ENVIADOS PARA A IA
        console.log('\n   📊 RESUMO DOS DADOS ENVIADOS PARA A IA:');
        console.log('   ═══════════════════════════════════════════════════════');
        if (userData.sections?.financas) {
            const meses = Object.keys(userData.sections.financas);
            console.log(`   📅 Meses incluídos: ${meses.join(', ')}`);
            meses.forEach(mes => {
                const mesData = userData.sections.financas[mes];
                const totalReceitas = mesData.receitas?.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0) || 0;
                const totalDespesas = mesData.despesas?.reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0) || 0;
                console.log(`   \n   ${mes}:`);
                console.log(`      💰 Receitas: ${mesData.receitas?.length || 0} itens = R$ ${totalReceitas.toFixed(2)}`);
                console.log(`      💸 Despesas: ${mesData.despesas?.length || 0} itens = R$ ${totalDespesas.toFixed(2)}`);
                console.log(`      💵 Saldo: R$ ${(totalReceitas - totalDespesas).toFixed(2)}`);
            });
        }
        if (userData.sections?.perfil) {
            console.log(`   \n   👤 Perfil incluído: Sim`);
        }
        console.log('   ═══════════════════════════════════════════════════════\n');

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
        
        // VALIDAÇÃO: Verificar se a IA usou os valores corretos
        console.log('\n   🔍 VALIDAÇÃO DOS VALORES NA RESPOSTA:');
        console.log('   ═══════════════════════════════════════════════════════');
        if (userData.sections?.financas) {
            const meses = Object.keys(userData.sections.financas);
            meses.forEach(mes => {
                const mesData = userData.sections.financas[mes];
                const totalReceitas = mesData.receitas?.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0) || 0;
                const totalDespesas = mesData.despesas?.reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0) || 0;
                
                // Formatações possíveis do valor na resposta
                const receitaFormats = [
                    `R$ ${totalReceitas.toFixed(0)}`,
                    `R$ ${totalReceitas.toFixed(2).replace('.', ',')}`,
                    `R$ ${totalReceitas.toLocaleString('pt-BR')}`,
                    totalReceitas.toFixed(0),
                    totalReceitas.toFixed(2)
                ];
                
                const receitaEncontrada = receitaFormats.some(format => aiMessage.includes(format));
                
                console.log(`   ${mes}:`);
                console.log(`      📊 Receita esperada: R$ ${totalReceitas.toFixed(2)}`);
                console.log(`      ${receitaEncontrada ? '✅' : '❌'} Valor ${receitaEncontrada ? 'encontrado' : 'NÃO encontrado'} na resposta`);
                
                if (!receitaEncontrada) {
                    console.log(`      ⚠️ ALERTA: A IA pode ter usado valor diferente!`);
                }
            });
        }
        console.log('   ═══════════════════════════════════════════════════════\n');
        
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
        
        thoughtEmitter.emit('Finalizando resposta');
        
        console.log('\n╔═════════════════════════════════════════════════════════╗');
        console.log('║            ✨ CONSULTA FINALIZADA COM SUCESSO           ║');
        console.log('╚═════════════════════════════════════════════════════════╝\n');

        console.log('📤 RESPOSTA ENVIADA PARA O FRONTEND:');
        console.log('   ', aiMessage);
        console.log(`   💭 Pensamentos gerados: ${thoughtEmitter.count()}`);
        console.log('─────────────────────────────────────────────────────────\n');

        res.json({
            success: true,
            response: aiMessage,
            conversaId: conversaId,
            thoughts: thoughtEmitter.getAll(),
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