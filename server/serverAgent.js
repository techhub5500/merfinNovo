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

// ========== SISTEMA DE INTENTS ==========
const INTENT_DEFINITIONS = {
    // Transaction Intents
    'add_income': {
        description: 'Adicionar receita/entrada de dinheiro',
        keywords: ['adicionar receita', 'registrar entrada', 'recebi', 'salário', 'ganho', 'entrada'],
        action: 'addTransaction',
        type: 'receita',
        requiredParams: ['valor']
    },
    
    'add_expense': {
        description: 'Adicionar despesa/gasto',
        keywords: ['adicionar despesa', 'gastei', 'paguei', 'comprei', 'registrar gasto', 'pagar'],
        action: 'addTransaction',
        type: 'despesa',
        requiredParams: ['valor']
    },
    
    'edit_transaction': {
        description: 'Editar transação existente',
        keywords: ['editar', 'alterar', 'modificar', 'corrigir', 'mudar valor', 'atualizar transação'],
        action: 'editTransaction',
        requiredParams: ['identificador', 'campo']
    },
    
    'delete_transaction': {
        description: 'Deletar transação',
        keywords: ['deletar', 'remover', 'apagar', 'excluir', 'cancelar registro'],
        action: 'deleteTransaction',
        requiredParams: ['identificador']
    },
    
    // Goal Management Intents
    'update_goal_progress': {
        description: 'Atualizar progresso de meta',
        keywords: ['adicionar à meta', 'atualizar progresso', 'progredir meta', 'avançar meta'],
        action: 'updateGoalProgress',
        requiredParams: ['valor']
    },
    
    'update_goal_info': {
        description: 'Atualizar informações da meta',
        keywords: ['mudar meta', 'alterar objetivo', 'redefinir meta'],
        action: 'updateGoalInfo',
        requiredParams: ['campo']
    },
    
    // Profile Update Intents
    'update_profile': {
        description: 'Atualizar informações do perfil',
        keywords: ['atualizar perfil', 'mudar informações', 'alterar dados', 'modificar perfil'],
        action: 'updateProfile',
        requiredParams: ['campo']
    },
    
    'update_patrimony': {
        description: 'Atualizar patrimônio',
        keywords: ['atualizar patrimônio', 'adicionar investimento', 'registrar ativo', 'patrimônio'],
        action: 'updatePatrimony',
        requiredParams: ['campo', 'valor']
    },
    
    // Debt Management Intents
    'add_debt': {
        description: 'Adicionar nova dívida',
        keywords: ['registrar dívida', 'adicionar parcelamento', 'nova dívida', 'parcelar'],
        action: 'addDebt',
        requiredParams: ['nome', 'valorTotal', 'numParcelas']
    },
    
    'mark_payment': {
        description: 'Marcar parcela como paga',
        keywords: ['pagar parcela', 'marcar como pago', 'paguei parcela', 'quitar parcela'],
        action: 'markPayment',
        requiredParams: ['dividaId', 'parcelaNumero']
    },
    
    'delete_debt': {
        description: 'Remover dívida',
        keywords: ['remover dívida', 'excluir dívida', 'deletar dívida'],
        action: 'deleteDebt',
        requiredParams: ['dividaId']
    },
    
    // Query and Analysis Intents
    'query_financial': {
        description: 'Consultar informações financeiras',
        keywords: ['quanto', 'qual', 'onde', 'quando', 'mostrar', 'listar', 'ver'],
        action: 'query',
        requiredParams: []
    },
    
    'financial_analysis': {
        description: 'Análise financeira detalhada',
        keywords: ['analisar', 'análise', 'avaliar', 'revisar', 'diagnóstico'],
        action: 'analyze',
        requiredParams: []
    },
    
    'calculate': {
        description: 'Fazer cálculos matemáticos',
        keywords: ['calcular', 'quanto é', 'soma', 'multiplicar', 'dividir'],
        action: 'calculate',
        requiredParams: []
    },
    
    // Education Intents
    'financial_education': {
        description: 'Educação financeira',
        keywords: ['explicar', 'ensinar', 'aprender', 'o que é', 'como funciona'],
        action: 'educate',
        requiredParams: []
    },
    
    // General Chat
    'chat': {
        description: 'Conversa casual',
        keywords: ['olá', 'oi', 'bom dia', 'obrigado', 'tchau'],
        action: 'chat',
        requiredParams: []
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

// ========== EXTRAÇÃO DE ENTIDADES ==========

function extractEntities(message) {
    const entities = {
        valor: null,
        data: null,
        descricao: null,
        categoria: null,
        subcategoria: null,
        formaPagamento: null,
        goalType: null,
        campo: null,
        identificador: null
    };
    
    // Extract money values (R$ 100, 100 reais, cem reais, 1000, 1k, 1 mil)
    const moneyPatterns = [
        /R\$\s*(\d+(?:[.,]\d{2})?)/i,
        /(\d+(?:[.,]\d{2})?)\s*reais?/i,
        /(\d+)\s*(?:mil|k)/i,
        /valor\s+(?:de\s+)?(\d+(?:[.,]\d{2})?)/i
    ];
    
    for (const pattern of moneyPatterns) {
        const match = message.match(pattern);
        if (match) {
            entities.valor = parseFloat(match[1].replace(',', '.'));
            if (message.toLowerCase().includes('mil') || message.toLowerCase().includes('k')) {
                entities.valor *= 1000;
            }
            break;
        }
    }
    
    // Extract dates (hoje, ontem, 15/12, dezembro)
    const datePatterns = {
        'hoje': new Date(),
        'ontem': new Date(Date.now() - 86400000),
        'anteontem': new Date(Date.now() - 172800000)
    };
    
    for (const [keyword, date] of Object.entries(datePatterns)) {
        if (message.toLowerCase().includes(keyword)) {
            entities.data = date.toISOString().split('T')[0];
            break;
        }
    }
    
    // Extract date in DD/MM format
    const dateMatch = message.match(/(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
        const [_, day, month] = dateMatch;
        const year = new Date().getFullYear();
        entities.data = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Extract description (words after "de" or "em" or "para" or "com")
    const descPatterns = [
        /(?:de|em|para|com|no|na)\s+([^,\.]+)/i,
        /descri[çc][ãa]o[:\s]+([^,\.]+)/i
    ];
    
    for (const pattern of descPatterns) {
        const match = message.match(pattern);
        if (match) {
            entities.descricao = match[1].trim();
            break;
        }
    }
    
    // Extract goal type (meta curto prazo, meta longo prazo)
    if (message.toLowerCase().includes('curto')) {
        entities.goalType = 'metaCurto';
    } else if (message.toLowerCase().includes('longo')) {
        entities.goalType = 'metaLongo';
    }
    
    // Extract payment method
    const paymentMethods = ['pix', 'dinheiro', 'débito', 'crédito', 'cartão'];
    for (const method of paymentMethods) {
        if (message.toLowerCase().includes(method)) {
            entities.formaPagamento = method.charAt(0).toUpperCase() + method.slice(1);
            break;
        }
    }
    
    return entities;
}

// ========== CLASSIFICADOR DE INTENTS ==========

async function classifyIntent(message, conversaResumo = '') {
    const prompt = `Você é um classificador de intenções para um assistente financeiro.

CONTEXTO DA CONVERSA:
${conversaResumo || 'Início da conversa'}

INTENÇÕES DISPONÍVEIS:
- add_income: usuário quer adicionar/registrar uma receita
- add_expense: usuário quer adicionar/registrar uma despesa
- edit_transaction: usuário quer editar uma transação existente
- delete_transaction: usuário quer deletar uma transação
- update_goal_progress: usuário quer adicionar progresso a uma meta
- update_goal_info: usuário quer alterar informações de uma meta (valor, prazo, descrição)
- update_profile: usuário quer atualizar informações pessoais do perfil
- update_patrimony: usuário quer atualizar patrimônio/investimentos
- add_debt: usuário quer registrar uma nova dívida
- mark_payment: usuário quer marcar uma parcela como paga
- delete_debt: usuário quer remover uma dívida
- query_financial: usuário quer apenas consultar/perguntar sobre seus dados
- financial_analysis: usuário quer uma análise detalhada das finanças
- calculate: usuário quer fazer cálculos matemáticos
- financial_education: usuário quer aprender sobre conceitos financeiros
- chat: conversa casual ou não relacionada a ações

MENSAGEM DO USUÁRIO: "${message}"

Responda APENAS com JSON válido:
{
  "intent": "nome_da_intencao",
  "confidence": 0.95,
  "entities": {
    "valor": 100.50,
    "descricao": "supermercado",
    "data": "2025-12-19",
    "goalType": "metaCurto"
  },
  "reasoning": "explicação breve"
}`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 300
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const content = response.data.choices[0].message.content;
        const result = JSON.parse(content);
        
        // Merge with local entity extraction
        const localEntities = extractEntities(message);
        result.entities = { ...localEntities, ...result.entities };
        
        console.log('🎯 Intent detectado:', result.intent, `(${(result.confidence * 100).toFixed(0)}%)`);
        console.log('📦 Entidades:', JSON.stringify(result.entities, null, 2));
        
        return result;
    } catch (error) {
        console.error('❌ Erro ao classificar intent:', error.message);
        // Fallback to query intent
        return { 
            intent: 'query_financial', 
            confidence: 0.5, 
            entities: extractEntities(message),
            reasoning: 'Fallback due to classification error'
        };
    }
}

// ========== ACTION HANDLERS ==========

async function addTransaction(userId, userToken, tipo, entities) {
    try {
        // Validate required fields
        if (!entities.valor) {
            return {
                success: false,
                needsInfo: true,
                missing: ['valor'],
                message: 'Por favor, informe o valor da transação.'
            };
        }
        
        // Determine month
        const mesAno = entities.data 
            ? entities.data.substring(0, 7) 
            : getCurrentMonth();
        
        // Prepare transaction data
        const transactionData = {
            data: entities.data || new Date().toISOString().split('T')[0],
            descricao: entities.descricao || 'Sem descrição',
            categoria: entities.categoria || '',
            subcategoria: entities.subcategoria || '',
            valor: entities.valor,
            status: 'Confirmado'
        };
        
        if (tipo === 'despesa') {
            transactionData.formaPagamento = entities.formaPagamento || '';
        }
        
        // Fetch current month data
        const response = await axios.get(
            `${OPERATIONAL_SERVER_URL}/api/financas/${mesAno}`,
            {
                headers: { 'Authorization': `Bearer ${userToken}` }
            }
        );
        
        const financasData = response.data;
        
        // Add new transaction
        if (tipo === 'receita') {
            financasData.receitas.push(transactionData);
        } else {
            financasData.despesas.push(transactionData);
        }
        
        // Save updated data
        await axios.post(
            `${OPERATIONAL_SERVER_URL}/api/financas/${mesAno}`,
            financasData,
            {
                headers: { 'Authorization': `Bearer ${userToken}` }
            }
        );
        
        return {
            success: true,
            message: `✅ ${tipo === 'receita' ? 'Receita' : 'Despesa'} de R$ ${entities.valor.toFixed(2)} adicionada com sucesso${entities.descricao ? ' em ' + entities.descricao : ''}!`,
            data: transactionData
        };
        
    } catch (error) {
        console.error('❌ Erro ao adicionar transação:', error.message);
        return {
            success: false,
            message: 'Erro ao adicionar transação. Tente novamente.'
        };
    }
}

async function editTransaction(userId, userToken, entities) {
    try {
        // This would require identification logic
        return {
            success: false,
            needsInfo: true,
            message: 'Para editar uma transação, preciso saber qual é. Pode me dizer a data e descrição?'
        };
    } catch (error) {
        console.error('❌ Erro ao editar transação:', error.message);
        return {
            success: false,
            message: 'Erro ao editar transação.'
        };
    }
}

async function deleteTransaction(userId, userToken, entities) {
    try {
        return {
            success: false,
            needsInfo: true,
            message: 'Para deletar uma transação, preciso identificá-la. Qual a data e descrição?'
        };
    } catch (error) {
        console.error('❌ Erro ao deletar transação:', error.message);
        return {
            success: false,
            message: 'Erro ao deletar transação.'
        };
    }
}

async function updateGoalProgress(userId, userToken, entities) {
    try {
        // Fetch current profile
        const response = await axios.get(
            `${OPERATIONAL_SERVER_URL}/api/perfil`,
            {
                headers: { 'Authorization': `Bearer ${userToken}` }
            }
        );
        
        const perfil = response.data;
        
        // Determine which goal to update
        const goalType = entities.goalType || 'metaCurto';
        const valorAdicionar = entities.valor || 0;
        
        if (!perfil[goalType] || !perfil[goalType].valor) {
            return {
                success: false,
                message: 'Meta não encontrada ou não configurada. Configure suas metas primeiro na página de Perfil.'
            };
        }
        
        // Update progress
        perfil[goalType].progresso = (perfil[goalType].progresso || 0) + valorAdicionar;
        perfil[goalType].ultimaAtualizacao = new Date();
        
        // Save updated profile
        await axios.post(
            `${OPERATIONAL_SERVER_URL}/api/perfil`,
            perfil,
            {
                headers: { 'Authorization': `Bearer ${userToken}` }
            }
        );
        
        const percentual = ((perfil[goalType].progresso / perfil[goalType].valor) * 100).toFixed(1);
        
        return {
            success: true,
            message: `✅ Progresso atualizado! Você já tem R$ ${perfil[goalType].progresso.toFixed(2)} (${percentual}%) da sua meta de R$ ${perfil[goalType].valor.toFixed(2)}. 🎯`,
            data: perfil[goalType]
        };
        
    } catch (error) {
        console.error('❌ Erro ao atualizar meta:', error.message);
        return {
            success: false,
            message: 'Erro ao atualizar progresso da meta.'
        };
    }
}

async function updateProfile(userId, userToken, entities) {
    try {
        return {
            success: false,
            needsInfo: true,
            message: 'Qual informação do perfil você gostaria de atualizar?'
        };
    } catch (error) {
        return {
            success: false,
            message: 'Erro ao atualizar perfil.'
        };
    }
}

async function updatePatrimony(userId, userToken, entities) {
    try {
        return {
            success: false,
            needsInfo: true,
            message: 'Qual ativo você gostaria de atualizar? (ações, fundos, imóveis, etc.)'
        };
    } catch (error) {
        return {
            success: false,
            message: 'Erro ao atualizar patrimônio.'
        };
    }
}

async function addDebt(userId, userToken, entities) {
    try {
        return {
            success: false,
            needsInfo: true,
            message: 'Para registrar uma dívida, preciso do nome, valor total e número de parcelas.'
        };
    } catch (error) {
        return {
            success: false,
            message: 'Erro ao adicionar dívida.'
        };
    }
}

async function markDebtPayment(userId, userToken, entities) {
    try {
        return {
            success: false,
            needsInfo: true,
            message: 'Qual dívida e qual parcela você pagou?'
        };
    } catch (error) {
        return {
            success: false,
            message: 'Erro ao marcar pagamento.'
        };
    }
}

async function executeAction(intent, entities, userToken, userId) {
    console.log('🎬 Executando ação:', intent);
    
    const handlers = {
        add_income: async () => {
            return await addTransaction(userId, userToken, 'receita', entities);
        },
        
        add_expense: async () => {
            return await addTransaction(userId, userToken, 'despesa', entities);
        },
        
        edit_transaction: async () => {
            return await editTransaction(userId, userToken, entities);
        },
        
        delete_transaction: async () => {
            return await deleteTransaction(userId, userToken, entities);
        },
        
        update_goal_progress: async () => {
            return await updateGoalProgress(userId, userToken, entities);
        },
        
        update_profile: async () => {
            return await updateProfile(userId, userToken, entities);
        },
        
        update_patrimony: async () => {
            return await updatePatrimony(userId, userToken, entities);
        },
        
        add_debt: async () => {
            return await addDebt(userId, userToken, entities);
        },
        
        mark_payment: async () => {
            return await markDebtPayment(userId, userToken, entities);
        }
    };
    
    if (handlers[intent]) {
        return await handlers[intent]();
    }
    
    return { success: false, message: 'Ação não implementada' };
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
        const { message, conversaId } = req.body;
        const currentMonth = getCurrentMonth();
        const currentDate = new Date().toISOString().split('T')[0];

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Mensagem inválida' });
        }

        console.log('\n┌─────────────────────────────────────────────────────────');
        console.log(`│ 🤖 NOVA CONSULTA`);
        console.log(`│ 👤 Usuário: ${req.userId}`);
        console.log(`│ 📅 Data atual: ${currentDate}`);
        console.log(`│ 💬 Pergunta: "${message}"`);
        console.log('└─────────────────────────────────────────────────────────\n');
        
        // ========== BUSCAR RESUMO DA CONVERSA ==========
        console.log('🔍 Verificando conversa ativa e resumo...');
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
                }
            } catch (error) {
                console.log('   ⚠️ Erro ao buscar resumo:', error.message);
            }
        }

        // ========== CLASSIFICAR INTENT ==========
        console.log('\n🎯 PASSO 1: Classificando intenção do usuário...');
        const intentResult = await classifyIntent(message, resumoContexto);
        
        console.log(`   Intent: ${intentResult.intent}`);
        console.log(`   Confidence: ${(intentResult.confidence * 100).toFixed(0)}%`);
        
        // ========== VERIFICAR SE É UMA AÇÃO ==========
        const actionIntents = [
            'add_income', 'add_expense', 'edit_transaction', 
            'delete_transaction', 'update_goal_progress', 'update_goal_info',
            'update_profile', 'update_patrimony', 'add_debt', 'mark_payment', 'delete_debt'
        ];
        
        if (actionIntents.includes(intentResult.intent) && intentResult.confidence > 0.6) {
            console.log('🎬 Executando ação:', intentResult.intent);
            
            // Execute the action
            const actionResult = await executeAction(
                intentResult.intent,
                intentResult.entities,
                req.userToken,
                req.userId
            );
            
            if (actionResult.needsInfo) {
                // Need more information from user
                return res.json({
                    success: true,
                    response: actionResult.message,
                    needsConfirmation: true,
                    intent: intentResult.intent,
                    partialEntities: intentResult.entities,
                    sectionsUsed: []
                });
            }
            
            if (actionResult.success) {
                // Action completed successfully - save to conversation
                if (conversaId) {
                    try {
                        await axios.post(
                            `${OPERATIONAL_SERVER_URL}/api/conversas/${conversaId}/mensagens`,
                            {
                                tipo: 'usuario',
                                conteudo: message,
                                sectionsUsed: [],
                                timeframe: null
                            },
                            { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                        );
                        
                        await axios.post(
                            `${OPERATIONAL_SERVER_URL}/api/conversas/${conversaId}/mensagens`,
                            {
                                tipo: 'assistente',
                                conteudo: actionResult.message,
                                sectionsUsed: [],
                                timeframe: null
                            },
                            { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                        );
                    } catch (error) {
                        console.log('⚠️ Erro ao salvar mensagens:', error.message);
                    }
                }
                
                return res.json({
                    success: true,
                    response: actionResult.message,
                    actionCompleted: true,
                    intent: intentResult.intent,
                    data: actionResult.data,
                    sectionsUsed: [],
                    conversaId
                });
            } else {
                // Action failed
                return res.json({
                    success: true,
                    response: actionResult.message + ' Posso ajudar de outra forma?',
                    actionFailed: true,
                    sectionsUsed: []
                });
            }
        }
        
        // ========== CONTINUAR COM FLUXO DE QUERY NORMAL ==========
        console.log('\n🔍 PASSO 2: Analisando quais dados são necessários...');
        
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
            const cleanJson = decisionText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            decision = JSON.parse(cleanJson);
            
            if (decision.timeframe?.months) {
                decision.timeframe.months = decision.timeframe.months.map(m => 
                    m === 'MÊS-ATUAL' ? currentMonth : m
                );
            }
            
            console.log('   ✅ Decisão interpretada:');
            console.log('   📊 Seções:', decision.requiredSections);
            console.log('   📅 Timeframe:', JSON.stringify(decision.timeframe));
            
        } catch (error) {
            console.error('   ❌ Erro ao parsear decisão:', error.message);
            decision = {
                requiredSections: ['financas'],
                timeframe: { 
                    type: 'current_only', 
                    months: [currentMonth],
                    reasoning: 'Fallback'
                }
            };
        }

        // ========== PASSO 3: BUSCAR DADOS ==========
        console.log('\n🔍 PASSO 3: Buscando dados do usuário...');
        
        const userData = await fetchOrganizedData(
            req.userToken,
            decision.requiredSections,
            decision.timeframe
        );

        console.log('   ✅ Dados recuperados');
        console.log('   📦 Seções:', Object.keys(userData.sections));

        // ========== PASSO 4: GERAR RESPOSTA ==========
        console.log('\n🔍 PASSO 4: Gerando resposta...');
        
        let contextoPrevio = '';
        if (resumoContexto) {
            contextoPrevio = `\n\nCONTEXTO DA CONVERSA:\n${resumoContexto}\n`;
        }
        
        const finalPrompt = `${RESPONSE_PROMPT}

DATA ATUAL: ${currentDate}${contextoPrevio}

DADOS DO USUÁRIO:
${JSON.stringify(userData, null, 2)}

PERGUNTA: "${message}"

Forneça uma resposta completa, personalizada e útil baseada nos dados reais do usuário.`;

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
        console.log('   ✅ Resposta gerada');
        
        // ========== CRIAR/ATUALIZAR CONVERSA ==========
        let finalConversaId = conversaId;
        
        if (!finalConversaId) {
            console.log('\n🆕 Criando nova conversa...');
            try {
                const novaConversa = await axios.post(
                    `${OPERATIONAL_SERVER_URL}/api/conversas`,
                    { titulo: message.substring(0, 50) + (message.length > 50 ? '...' : '') },
                    { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                );
                finalConversaId = novaConversa.data.conversa._id;
                console.log('   ✅ Conversa criada:', finalConversaId);
            } catch (error) {
                console.error('   ❌ Erro ao criar conversa:', error.message);
            }
        }
        
        // ========== SALVAR MENSAGENS ==========
        if (finalConversaId) {
            try {
                await axios.post(
                    `${OPERATIONAL_SERVER_URL}/api/conversas/${finalConversaId}/mensagens`,
                    {
                        tipo: 'usuario',
                        conteudo: message,
                        sectionsUsed: decision.requiredSections,
                        timeframe: decision.timeframe
                    },
                    { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                );
                
                await axios.post(
                    `${OPERATIONAL_SERVER_URL}/api/conversas/${finalConversaId}/mensagens`,
                    {
                        tipo: 'assistente',
                        conteudo: aiMessage,
                        sectionsUsed: decision.requiredSections,
                        timeframe: decision.timeframe
                    },
                    { headers: { 'Authorization': `Bearer ${req.userToken}` } }
                );
            } catch (error) {
                console.error('   ❌ Erro ao salvar mensagens:', error.message);
            }
        }
        
        // ========== ATUALIZAR RESUMO ==========
        if (finalConversaId) {
            console.log('\n🔄 Atualizando resumo da conversa...');
            try {
                await atualizarResumoConversa(finalConversaId, message, aiMessage, req.userToken);
                console.log('   ✅ Resumo atualizado');
            } catch (error) {
                console.error('   ❌ Erro ao atualizar resumo:', error.message);
            }
        }
        
        console.log('\n┌─────────────────────────────────────────────────────────');
        console.log('│ ✨ CONSULTA FINALIZADA COM SUCESSO');
        console.log('└─────────────────────────────────────────────────────────\n');

        res.json({
            success: true,
            response: aiMessage,
            conversaId: finalConversaId,
            debug: {
                sectionsUsed: decision.requiredSections,
                timeframe: decision.timeframe,
                currentDate: currentDate,
                resumoUsado: !!resumoContexto,
                intent: intentResult.intent
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
