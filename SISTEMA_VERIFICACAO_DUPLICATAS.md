# Sistema de Verificação Inteligente de Duplicatas

## 📋 Visão Geral

Implementação de um sistema adaptativo que detecta automaticamente lançamentos duplicados na planilha financeira, mantendo a fluidez da conversa sem confirmações excessivas.

## 🎯 Objetivo

Resolver situações ambíguas como:
- **Afirmação**: "ontem eu comprei um celular novo de 3.500 reais"
- **Problema**: Não há comando explícito de adicionar
- **Solução**: Verificar se já existe antes de adicionar

## 🔧 Implementação

### Arquivos Modificados

1. **`server/spreadsheetActions.js`** - Lógica de verificação de duplicatas
2. **`server/serverAgent.js`** - Integração no fluxo do agente

### Funções Criadas

#### `checkDuplicateExpense(userToken, operationalServerUrl, monthId, expenseData)`
Verifica se uma despesa similar já existe na planilha.

**Retorno:**
```javascript
{
  isDuplicate: boolean,
  existingItem: object|null,
  similarity: number
}
```

#### `checkDuplicateIncome(userToken, operationalServerUrl, monthId, incomeData)`
Verifica se uma receita similar já existe na planilha.

**Retorno:** Mesmo formato de `checkDuplicateExpense`

### Funções Auxiliares

#### `normalizeString(str)`
Normaliza strings para comparação:
- Remove acentos
- Remove pontuação
- Converte para minúsculas
- Normaliza espaços

#### `calculateSimilarity(str1, str2)`
Calcula similaridade entre duas strings (0 a 1) baseado em palavras comuns.

## ⚙️ Critérios de Verificação

### 1. Valor (Obrigatório)
- Valores devem ser iguais ou muito próximos
- **Tolerância**: ±5 reais
- **Exemplos**:
  - R$ 3.500 e R$ 3.502 → MATCH ✓
  - R$ 3.500 e R$ 3.600 → NÃO MATCH ✗

### 2. Descrição (Obrigatório)
- Similaridade mínima de 70%
- Compara palavras em comum após normalização
- **Exemplos**:
  - "celular novo" vs "celular" → 75% (MATCH) ✓
  - "celular" vs "notebook" → 0% (NÃO MATCH) ✗

### 3. Categoria (Opcional)
- Se informada, deve ser igual (normalizada)
- Se não informada, ignora esse critério
- **Exemplos**:
  - "Eletrônicos" vs "eletronicos" → MATCH ✓
  - "Eletrônicos" vs "Alimentação" → NÃO MATCH ✗

### Resultado Final
**É DUPLICATA apenas se os 3 critérios baterem!**

## 🔄 Fluxo de Execução

### Cenário 1: Primeira Menção (Sem Duplicata)
```
Usuário: "ontem eu comprei um celular novo de 3500 reais"
         ↓
Intent detectado: ADD_EXPENSE
         ↓
Verificação de duplicata...
         ↓
✅ Nenhuma duplicata encontrada
         ↓
⚡ ADICIONAR NA PLANILHA
         ↓
Resposta: "Despesa de R$ 3.500 (celular novo) adicionada com sucesso!"
```

### Cenário 2: Segunda Menção (Com Duplicata)
```
Usuário: "ontem comprei um celular de 3500"
         ↓
Intent detectado: ADD_EXPENSE
         ↓
Verificação de duplicata...
         ↓
⚠️ DUPLICATA ENCONTRADA!
   - Item: "celular novo" - R$ 3.500
   - Similaridade: 85%
         ↓
🚫 NÃO ADICIONAR
         ↓
Resposta: "Entendi! Vi que você já tem essa despesa registrada 
           na planilha: celular novo de R$ 3.500,00 (Eletrônicos). 
           Tudo certo por aqui! 😊"
```

### Cenário 3: Compra Similar com Valor Diferente
```
Usuário: "comprei outro celular de 4200 reais"
         ↓
Intent detectado: ADD_EXPENSE
         ↓
Verificação de duplicata...
         ↓
✅ Não é duplicata (diferença de R$ 700)
         ↓
⚡ ADICIONAR NA PLANILHA
         ↓
Resposta: "Despesa de R$ 4.200 (celular) adicionada com sucesso!"
```

## ✨ Benefícios

### 1. **Evita Duplicatas Automáticas**
- Não adiciona o mesmo lançamento duas vezes
- Inteligente o suficiente para detectar variações de linguagem

### 2. **Mantém Fluidez da Conversa**
- Não pede confirmações desnecessárias
- Age de forma contextual e adaptativa

### 3. **Transparente com o Usuário**
- Informa quando o registro já existe
- Usa linguagem natural e amigável

### 4. **Inteligente e Preciso**
- Diferencia compras similares com valores diferentes
- Permite variações naturais de descrição
- Normaliza textos para comparação robusta

### 5. **Não Engessado**
- Adapta-se ao contexto
- Não bloqueia fluxo de trabalho
- Mantém consistência dos dados

## 🧪 Casos de Teste

### Teste 1: Duplicata Exata
```javascript
Primeira vez: "comprei um iphone de 5000 reais"
Segunda vez:  "comprei um iphone de 5000 reais"
Resultado: NÃO ADICIONA (duplicata detectada)
```

### Teste 2: Variação de Descrição
```javascript
Primeira vez: "comprei notebook dell"
Segunda vez:  "comprei notebook"
Resultado: NÃO ADICIONA (70%+ similaridade)
```

### Teste 3: Valor Ligeiramente Diferente
```javascript
Primeira vez: "paguei 100 reais de luz"
Segunda vez:  "paguei 102 reais de luz"
Resultado: NÃO ADICIONA (dentro da tolerância de ±5)
```

### Teste 4: Produto Similar, Valor Diferente
```javascript
Primeira vez: "comprei celular de 3500"
Segunda vez:  "comprei celular de 4200"
Resultado: ADICIONA (diferença acima de ±5)
```

### Teste 5: Descrição Diferente, Mesmo Valor
```javascript
Primeira vez: "comprei celular de 3500"
Segunda vez:  "comprei notebook de 3500"
Resultado: ADICIONA (similaridade < 70%)
```

## 📊 Dados de Debug

O sistema retorna informações de debug para rastreamento:

```javascript
{
  success: true,
  response: "mensagem ao usuário",
  conversaId: "...",
  debug: {
    intent: "ADD_EXPENSE",
    confidence: 0.95,
    actionExecuted: false,
    duplicateDetected: true,
    existingItem: {
      descricao: "celular novo",
      valor: 3500,
      categoria: "Eletrônicos"
    },
    currentDate: "2025-12-21"
  }
}
```

## 🎯 Quando Usar

### ✅ Usar Verificação de Duplicata
- Intent: `ADD_EXPENSE` ou `ADD_INCOME`
- Afirmações ambíguas sem comando explícito
- Quando usuário repete informação

### ❌ Não Usar Verificação
- Comandos explícitos: "adicione", "lance", "registre"
- Operações de edição: `EDIT_EXPENSE`, `EDIT_INCOME`
- Operações de deleção: `DELETE_EXPENSE`, `DELETE_INCOME`
- Listagens e consultas

## 🔮 Melhorias Futuras

1. **Machine Learning**: Treinar modelo para melhor detecção de similaridade
2. **Histórico Temporal**: Considerar data do lançamento na verificação
3. **Categorização Automática**: Melhorar sugestão de categorias baseado em histórico
4. **Feedback Loop**: Aprender com correções do usuário
5. **Agrupamento Inteligente**: Detectar lançamentos recorrentes (assinaturas, salários)

## 📝 Notas Técnicas

- **Performance**: Verificação é O(n) onde n = número de lançamentos no mês
- **Escalabilidade**: Para muitos lançamentos, considerar indexação
- **Tolerância Configurável**: Valores de threshold podem ser ajustados
- **Thread-Safe**: Operações são atômicas no servidor operacional
- **Logging Completo**: Toda verificação é logada para debug

## 🚀 Conclusão

O sistema de verificação inteligente de duplicatas equilibra:
- **Automação** - Age sem interrupções desnecessárias
- **Segurança** - Evita dados duplicados
- **Inteligência** - Adapta-se ao contexto
- **Experiência** - Mantém fluidez conversacional

**Resultado**: Um assistente financeiro que age como um parceiro inteligente, não como um sistema rígido de formulários.
