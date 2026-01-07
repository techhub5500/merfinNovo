/**
 * EMISSOR DE PENSAMENTOS DO AGENTE
 * 
 * Captura o meta-raciocínio do agente e transforma em eventos visuais
 * 
 * Não é simulação - são pensamentos reais baseados no que o agente está fazendo
 */

class ThoughtEmitter {
    constructor() {
        this.thoughts = [];
        this.currentId = 0;
    }

    // Emitir pensamento principal
    emit(text) {
        const thought = {
            id: `thought-${this.currentId++}`,
            text: text,
            type: 'main',
            timestamp: Date.now()
        };
        this.thoughts.push(thought);
        console.log(`   💭 ${text}`);
        return thought;
    }

    // Emitir sub-pensamento (análise mais profunda)
    emitSub(text) {
        const thought = {
            id: `thought-${this.currentId++}`,
            text: text,
            type: 'sub',
            timestamp: Date.now()
        };
        this.thoughts.push(thought);
        console.log(`      ├─ ${text}`);
        return thought;
    }

    // Obter todos os pensamentos
    getAll() {
        return this.thoughts;
    }

    // Limpar pensamentos
    clear() {
        this.thoughts = [];
        this.currentId = 0;
    }

    // Obter contagem
    count() {
        return this.thoughts.length;
    }
}

module.exports = ThoughtEmitter;
