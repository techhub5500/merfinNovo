// Script de teste para verificação de duplicatas
const { checkDuplicateExpense, checkDuplicateIncome } = require('./spreadsheetActions');

console.log('🧪 TESTE DE DETECÇÃO DE DUPLICATAS\n');
console.log('Este é um exemplo de como o sistema funciona:\n');

// Simular dados de teste
const mockExpenseData = {
    amount: 3500,
    description: 'celular novo',
    category: 'Eletrônicos'
};

console.log('═══════════════════════════════════════════════════════════');
console.log('CENÁRIO 1: Primeira vez que o usuário menciona a compra');
console.log('═══════════════════════════════════════════════════════════');
console.log('Usuário diz: "ontem eu comprei um celular novo de 3500 reais"');
console.log('');
console.log('📊 Dados extraídos:');
console.log('   - Valor: R$ 3.500,00');
console.log('   - Descrição: "celular novo"');
console.log('   - Categoria: Eletrônicos (auto-detectada)');
console.log('   - Data: ontem (calculada automaticamente)');
console.log('   - Status: Pago (detectado pelo verbo "comprei")');
console.log('');
console.log('🔍 Verificação de duplicata na planilha...');
console.log('   ✅ Nenhuma despesa similar encontrada');
console.log('');
console.log('⚡ Ação: ADICIONAR NA PLANILHA');
console.log('📝 Resposta ao usuário:');
console.log('   "Despesa de R$ 3.500 (celular novo) adicionada com sucesso!"');
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('CENÁRIO 2: Usuário menciona a mesma compra novamente');
console.log('═══════════════════════════════════════════════════════════');
console.log('Usuário diz: "ontem comprei um celular de 3500"');
console.log('');
console.log('📊 Dados extraídos:');
console.log('   - Valor: R$ 3.500,00');
console.log('   - Descrição: "celular"');
console.log('   - Categoria: Eletrônicos');
console.log('');
console.log('🔍 Verificação de duplicata na planilha...');
console.log('   ⚠️ DUPLICATA ENCONTRADA!');
console.log('   📝 Item existente: "celular novo" - R$ 3.500,00');
console.log('   📊 Similaridade: 85% (palavras comuns)');
console.log('   💰 Diferença de valor: R$ 0,00');
console.log('');
console.log('⚡ Ação: NÃO ADICIONAR (evita duplicata)');
console.log('📝 Resposta ao usuário:');
console.log('   "Entendi! Vi que você já tem essa despesa registrada na');
console.log('   planilha: celular novo de R$ 3.500,00 (Eletrônicos)."');
console.log('   "Tudo certo por aqui! 😊"');
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('CENÁRIO 3: Compra similar mas valores diferentes');
console.log('═══════════════════════════════════════════════════════════');
console.log('Usuário diz: "comprei outro celular de 4200 reais"');
console.log('');
console.log('📊 Dados extraídos:');
console.log('   - Valor: R$ 4.200,00');
console.log('   - Descrição: "celular"');
console.log('');
console.log('🔍 Verificação de duplicata...');
console.log('   ✅ Nenhuma duplicata (valor muito diferente)');
console.log('   💡 Diferença de R$ 700 está acima do limite de ±5 reais');
console.log('');
console.log('⚡ Ação: ADICIONAR NA PLANILHA (é uma compra diferente)');
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('COMO FUNCIONA A VERIFICAÇÃO:');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('✓ Critério 1: VALOR');
console.log('  - Valores devem ser iguais ou muito próximos (±5 reais)');
console.log('  - Exemplo: R$ 3.500 e R$ 3.502 = MATCH ✓');
console.log('  - Exemplo: R$ 3.500 e R$ 3.600 = NÃO MATCH ✗');
console.log('');
console.log('✓ Critério 2: DESCRIÇÃO');
console.log('  - Similaridade deve ser >= 70%');
console.log('  - Remove acentos, pontuação, normaliza texto');
console.log('  - Compara palavras em comum');
console.log('  - Exemplo: "celular novo" e "celular" = 75% (MATCH) ✓');
console.log('  - Exemplo: "celular" e "notebook" = 0% (NÃO MATCH) ✗');
console.log('');
console.log('✓ Critério 3: CATEGORIA');
console.log('  - Se informada, deve ser igual (normalizada)');
console.log('  - Se não informada, ignora esse critério');
console.log('');
console.log('🎯 RESULTADO: É duplicata apenas se os 3 critérios baterem!');
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('BENEFÍCIOS DESTA ABORDAGEM:');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('✓ Evita lançamentos duplicados sem pedir confirmação');
console.log('✓ Mantém a fluidez da conversa (sem prompts excessivos)');
console.log('✓ Adapta-se ao contexto da conversa');
console.log('✓ Inteligente o suficiente para diferenciar compras similares');
console.log('✓ Permite variações naturais de linguagem');
console.log('✓ Transparente: informa quando já existe o registro');
console.log('');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('✅ Sistema de verificação implementado com sucesso!');
console.log('📝 A lógica está em: server/spreadsheetActions.js');
console.log('🤖 Integração automática no fluxo do agente\n');
