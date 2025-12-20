/**
 * GERADOR DE RESPOSTAS NATURAIS DO MERFIN
 * 
 * Transforma dados estruturados em respostas conversacionais
 * seguindo o perfil: humano, empático, sem julgamento
 */

const reasoning = require('./reasoning');

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function buildNaturalResponse(chain, actionData, insights) {
    // Se requer resposta da IA (consultas complexas), retorna indicador
    if (chain.requiresAI) {
        return null; // Sinaliza que deve usar IA
    }
    
    let response = '';
    
    // 1. Usar template do chain
    if (chain.template) {
        response = chain.template(actionData);
    } else {
        // Fallback genérico
        if (chain.celebrate) {
            response = reasoning.pickRandom(reasoning.CELEBRATION_PHRASES) + ' ';
        } else {
            response = reasoning.pickRandom(reasoning.NEUTRAL_CONFIRMATIONS) + ' ';
        }
    }
    
    // 2. Adicionar primeiro insight se houver e couber
    if (insights.length > 0 && response.length < chain.maxLength - 80) {
        const firstInsight = insights[0];
        if (firstInsight.text) {
            response += '\n\n💡 ' + firstInsight.text;
        }
    }
    
    // 3. Garantir limite de tamanho
    if (response.length > chain.maxLength) {
        response = response.substring(0, chain.maxLength - 3) + '...';
    }
    
    return response.trim();
}

function buildBulkResponse(data) {
    const { incomes, expenses } = data;
    const totalItems = (incomes?.added || 0) + (expenses?.added || 0);
    
    if (totalItems === 0) {
        return '✅ Ok! Mas não encontrei itens para adicionar.';
    }
    
    let response = `🎉 Pronto! ${totalItems} lançamentos adicionados`;
    
    if (incomes?.added > 0 || expenses?.added > 0) {
        response += ` (${incomes?.added || 0} receitas, ${expenses?.added || 0} despesas)`;
    }
    
    response += '.';
    
    return response;
}

module.exports = {
    buildNaturalResponse,
    buildBulkResponse,
    formatCurrency
};
