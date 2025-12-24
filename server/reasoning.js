/**
 * SISTEMA DE RACIOCÍNIO DO MERFIN
 * 
 * Implementa o perfil completo do agente:
 * - Transformar ansiedade financeira em clareza
 * - Parceiro de raciocínio, não fiscal de gastos
 * - Respostas curtas, naturais e empáticas
 */

const REASONING_CHAINS = {
    // Adicionar receita
    ADD_INCOME: {
        tone: 'positivo_breve',
        celebrate: (amount) => amount > 1000,
        maxLength: 120,
        insights: ['verificar_se_recorrente', 'sugerir_investimento_se_alto'],
        template: (data) => {
            const description = data.description ? `de ${data.description} ` : '';
            return `✅ Receita ${description}de R$ ${data.amount.toFixed(2)} adicionada com sucesso!`;
        }
    },
    
    // Adicionar despesa
    ADD_EXPENSE: {
        tone: 'neutro_objetivo',
        celebrate: false,
        maxLength: 100,
        insights: ['verificar_categoria_alta'],
        template: (data) => {
            const description = data.description ? `de ${data.description} ` : '';
            return `✅ Despesa ${description}de R$ ${data.amount.toFixed(2)} adicionada com sucesso!`;
        }
    },
    
    // Editar campo
    EDIT_FIELD: {
        tone: 'breve_confirmatorio',
        celebrate: false,
        maxLength: 80,
        insights: [],
        template: (data) => {
            return `✅ Pronto! ${data.field || 'Campo'} atualizado.`;
        }
    },
    
    // Deletar item
    DELETE_ITEM: {
        tone: 'breve_confirmatorio',
        celebrate: false,
        maxLength: 80,
        insights: [],
        template: (data) => {
            return `✅ Feito! ${data.description || 'Item'} removido.`;
        }
    },
    
    // Bulk add
    BULK_ADD: {
        tone: 'confirmatorio_resumo',
        celebrate: true,
        maxLength: 150,
        insights: [],
        template: (data) => {
            return `🎉 Pronto! ${data.totalItems} lançamentos adicionados (${data.incomes} receitas, ${data.expenses} despesas).`;
        }
    },
    
    // Consulta geral - requer análise completa
    GENERAL_QUERY: {
        tone: 'analitico_empatico',
        celebrate: (saldo) => saldo > 0,
        maxLength: 400,
        insights: ['analisar_saldo', 'comparar_mes_anterior', 'sugerir_proximo_passo'],
        requiresAI: true // Indica que precisa de resposta elaborada da IA
    },
    
    // Pedido de ajuda / ansiedade
    HELP_REQUEST: {
        tone: 'empatico_guia',
        celebrate: false,
        maxLength: 300,
        insights: ['oferecer_primeiro_passo'],
        requiresAI: true
    }
};

const INSIGHT_GENERATORS = {
    verificar_se_recorrente: (data) => {
        const recorrenteKeywords = ['salário', 'salary', 'salario', 'renda fixa', 'mensal', 'freelance'];
        const description = (data.description || '').toLowerCase();
        
        const isRecorrente = recorrenteKeywords.some(keyword => 
            description.includes(keyword)
        );
        
        if (isRecorrente) {
            return {
                type: 'recorrente_mensal',
                text: 'Como é renda recorrente, já posso te ajudar a planejar os próximos meses.'
            };
        }
        return null;
    },
    
    sugerir_investimento_se_alto: (data) => {
        if (data.amount && data.amount > 3000) {
            return {
                type: 'sugestao_investir',
                text: `Valor alto! Que tal guardar/investir pelo menos 20% dele? 💰`
            };
        }
        return null;
    },
    
    verificar_categoria_alta: (data, userData) => {
        // TODO: Implementar comparação com média quando tivermos histórico
        // Por enquanto, apenas marca para análise futura
        if (data.amount && data.amount > 500) {
            return {
                type: 'verificar_padrao',
                text: null // Não exibe por enquanto, mas marca para análise
            };
        }
        return null;
    }
};

const CELEBRATION_PHRASES = [
    '✨ Ótimo!',
    '🎉 Excelente!',
    '👏 Muito bem!',
    '🚀 Show!',
    '⭐ Perfeito!',
    '💪 Mandou bem!'
];

const NEUTRAL_CONFIRMATIONS = [
    '✅ Feito!',
    '✅ Pronto!',
    '✅ Registrado!',
    '✅ Anotado!',
    '✅ Ok!'
];

function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function selectReasoningChain(intent) {
    const intentMapping = {
        'INTENT_ADD_INCOME': 'ADD_INCOME',
        'INTENT_ADD_EXPENSE': 'ADD_EXPENSE',
        'INTENT_EDIT_INCOME': 'EDIT_FIELD',
        'INTENT_EDIT_EXPENSE': 'EDIT_FIELD',
        'INTENT_UPDATE_INCOME_FIELD': 'EDIT_FIELD',
        'INTENT_UPDATE_EXPENSE_FIELD': 'EDIT_FIELD',
        'INTENT_DELETE_INCOME': 'DELETE_ITEM',
        'INTENT_DELETE_EXPENSE': 'DELETE_ITEM',
        'INTENT_BULK_ADD': 'BULK_ADD',
        'INTENT_ANALYZE_FINANCES': 'GENERAL_QUERY',
        'INTENT_UNKNOWN': 'HELP_REQUEST'
    };
    
    const chainName = intentMapping[intent] || 'GENERAL_QUERY';
    return REASONING_CHAINS[chainName];
}

function generateInsights(chain, actionData, userData) {
    const insights = [];
    
    if (!chain.insights || chain.insights.length === 0) {
        return insights;
    }
    
    for (const insightType of chain.insights) {
        const generator = INSIGHT_GENERATORS[insightType];
        if (generator) {
            const insight = generator(actionData, userData);
            if (insight && insight.text) {
                insights.push(insight);
            }
        }
    }
    
    return insights;
}

module.exports = {
    REASONING_CHAINS,
    INSIGHT_GENERATORS,
    CELEBRATION_PHRASES,
    NEUTRAL_CONFIRMATIONS,
    selectReasoningChain,
    generateInsights,
    pickRandom
};
