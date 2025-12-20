/**
 * PROCESSO DE PENSAMENTO DO MERFIN
 * 
 * Implementa o raciocínio estruturado do agente antes de responder:
 * 1. Entender contexto
 * 2. Identificar tipo de situação
 * 3. Selecionar estratégia de resposta
 * 4. Gerar insights inteligentes
 * 5. Construir resposta natural
 */

const reasoning = require('./reasoning');
const responseStyles = require('./responseStyles');

class ThoughtProcess {
    constructor() {
        this.context = {};
        this.insights = [];
        this.chain = null;
    }
    
    // Preparar dados da ação
    prepareActionData(intent, entities, actionResult) {
        const baseData = {
            description: entities.description,
            amount: entities.amount,
            category: entities.category,
            subcategory: entities.subcategory,
            field: entities.field,
            newValue: entities.newValue,
            date: entities.date
        };
        
        // Para bulk add
        if (intent === 'INTENT_BULK_ADD' && actionResult.data) {
            return {
                type: 'bulk_added',
                totalItems: (actionResult.data.incomes?.added || 0) + (actionResult.data.expenses?.added || 0),
                incomes: actionResult.data.incomes?.added || 0,
                expenses: actionResult.data.expenses?.added || 0
            };
        }
        
        return baseData;
    }
    
    // Processar resposta natural
    process(intent, entities, actionResult, userData = {}) {
        console.log('\n🧠 PROCESSO DE PENSAMENTO INICIADO');
        console.log(`   📝 Intent: ${intent}`);
        
        // 1. Selecionar chain de raciocínio
        this.chain = reasoning.selectReasoningChain(intent);
        console.log(`   🎯 Chain selecionada: ${Object.keys(reasoning.REASONING_CHAINS).find(k => reasoning.REASONING_CHAINS[k] === this.chain)}`);
        console.log(`   🎨 Tom: ${this.chain.tone}`);
        console.log(`   📏 Limite: ${this.chain.maxLength} caracteres`);
        
        // 2. Preparar dados da ação
        const actionData = this.prepareActionData(intent, entities, actionResult);
        
        // 3. Gerar insights
        this.insights = reasoning.generateInsights(this.chain, actionData, userData);
        if (this.insights.length > 0) {
            console.log(`   💡 Insights gerados: ${this.insights.length}`);
        }
        
        // 4. Construir resposta
        let response;
        
        // Para bulk add, usar resposta específica
        if (intent === 'INTENT_BULK_ADD') {
            response = responseStyles.buildBulkResponse(actionResult.data);
        } else {
            response = responseStyles.buildNaturalResponse(this.chain, actionData, this.insights);
        }
        
        // Se a chain requer resposta da IA (consultas complexas)
        if (response === null && this.chain.requiresAI) {
            console.log('   🤖 Chain requer resposta elaborada da IA');
            return {
                requiresAI: true,
                tone: this.chain.tone,
                insights: this.insights
            };
        }
        
        console.log(`   ✅ Resposta gerada: ${response.length} caracteres`);
        console.log(`   📄 Preview: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`);
        console.log('   ✨ Processo concluído!\n');
        
        return {
            response: response,
            metadata: {
                tone: this.chain.tone,
                insights: this.insights,
                celebrated: this.chain.celebrate && (typeof this.chain.celebrate === 'function' ? this.chain.celebrate(actionData.amount) : this.chain.celebrate),
                length: response.length
            }
        };
    }
}

module.exports = ThoughtProcess;
