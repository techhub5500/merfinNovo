const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.AGENT_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// ========== CONFIGURAÇÃO ==========
const OPERATIONAL_SERVER_URL = process.env.OPERATIONAL_SERVER_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'merfin_secret_key_2025';

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

const RESPONSE_PROMPT = `Você é Merfin, um assistente financeiro inteligente e empático.

CARACTERÍSTICAS:
- Analise os dados reais do usuário fornecidos
- Seja específico com valores e categorias
- Use linguagem clara e acessível
- Sugira ações práticas quando apropriado
- Celebre conquistas e motive em desafios

Os dados estão organizados por mês. Use a estrutura "userData.sections.financas[MÊS]" para acessar dados específicos.

Forneça uma resposta personalizada, útil e baseada nos dados reais.`;

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

// ========== ROTA PRINCIPAL DO CHAT ==========
app.post('/api/chat', verifyUserToken, async (req, res) => {
    try {
        const { message } = req.body;
        const currentMonth = getCurrentMonth();
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Mensagem inválida' });
        }

        console.log('\n┌─────────────────────────────────────────────────────────');
        console.log(`│ 🤖 NOVA CONSULTA`);
        console.log(`│ 👤 Usuário: ${req.userId}`);
        console.log(`│ 📅 Data atual: ${currentDate}`);
        console.log(`│ 📆 Mês atual: ${currentMonth}`);
        console.log(`│ 💬 Pergunta: "${message}"`);
        console.log('└─────────────────────────────────────────────────────────\n');
        
        // ========== BUSCAR CONVERSAÇÃO E RESUMO ==========
        console.log('🔍 Verificando conversa ativa e resumo...');
        let conversaId = req.body.conversaId;
        let resumoContexto = '';
        
        if (conversaId) {
            try {
                const resumoResponse = await axios.get(
                    `${OPERATIONAL_SERVER_URL}/api/conversas/${conversaId}/resumo`,
                    { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                );
                
                if (resumoResponse.data.resumo) {
                    resumoContexto = resumoResponse.data.resumo;
                    console.log(`   📚 Resumo carregado: ${resumoResponse.data.palavrasResumo} palavras`);
                } else {
                    console.log('   ℹ️ Conversa nova - sem resumo anterior');
                }
            } catch (error) {
                console.log('   ⚠️ Erro ao buscar resumo, continuando sem contexto:', error.message);
            }
        } else {
            console.log('   ℹ️ Nova conversa - será criada após resposta');
        }

        // ========== PASSO 1: IA DECIDE QUAIS DADOS PRECISA ==========
        console.log('🔍 PASSO 1: Analisando quais dados são necessários...');
        
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
        console.log('\n🔍 PASSO 2: Buscando dados do usuário...');
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
        console.log('\n🔍 PASSO 3: Gerando resposta personalizada...');
        
        // Incluir resumo da conversa no prompt, se existir
        let contextoPrevio = '';
        if (resumoContexto) {
            contextoPrevio = `\n\nCONTEXTO DA CONVERSA ANTERIOR:\n${resumoContexto}\n\nUse este contexto para dar continuidade à conversa de forma natural e coerente.`;
        }
        
        const finalPrompt = `${RESPONSE_PROMPT}

DATA ATUAL: ${currentDate}${contextoPrevio}

DADOS DO USUÁRIO:
${JSON.stringify(userData, null, 2)}

PERGUNTA: "${message}"

Forneça uma resposta completa, personalizada e útil baseada nos dados reais do usuário.`;

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
            console.log('\n⚠️ ConversaId não disponível - resumo não será atualizado');
        }
        
        console.log('\n┌─────────────────────────────────────────────────────────');
        console.log('│ ✨ CONSULTA FINALIZADA COM SUCESSO');
        console.log('└─────────────────────────────────────────────────────────\n');

        res.json({
            success: true,
            response: aiMessage,
            conversaId: conversaId,
            debug: {
                sectionsUsed: decision.requiredSections,
                timeframe: decision.timeframe,
                currentDate: currentDate,
                resumoUsado: !!resumoContexto
            }
        });

    } catch (error) {
        console.error('\n❌ ERRO NO PROCESSAMENTO DO CHAT:');
        console.error('   Tipo:', error.name);
        console.error('   Mensagem:', error.message);
        if (error.response?.data) {
            console.error('   Detalhes:', JSON.stringify(error.response.data, null, 2));
        }
        console.log('└─────────────────────────────────────────────────────────\n');

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
    console.log(`🔗 Server Operacional: ${OPERATIONAL_SERVER_URL}`);
    console.log(`📊 Seções disponíveis: ${Object.keys(AVAILABLE_SECTIONS).join(', ')}\n`);
});
