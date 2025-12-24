# Sistema de Validação de Transações Incompletas

## 📋 Visão Geral

Sistema implementado para validar se transações financeiras (receitas e despesas) têm informações essenciais antes de serem registradas. Quando faltarem dados importantes (principalmente descrição), o agente solicita esclarecimento ao usuário ao invés de fazer o lançamento com valores null.

## 🎯 Problema Resolvido

**Antes:**
- Usuário: "1550 de despesa"
- Sistema: Aceita e registra com:
  - `description: null`
  - `category: "Outros"`
  - `subcategory: "Outros"`

**Depois:**
- Usuário: "1550 de despesa"
- Sistema: Solicita esclarecimento com mensagem amigável

## 🔧 Implementação

### 1. Novo Intent: CLARIFY_TRANSACTION

**Arquivo:** `intents.js`

```javascript
CLARIFY_TRANSACTION: "INTENT_CLARIFY_TRANSACTION"
```

Este intent é detectado quando:
- Falta descrição da transação
- Usuário envia apenas valor sem contexto
- Informação é vaga demais para classificação

### 2. Regras de Detecção

**Arquivo:** `intents.js` - Seção "REGRA CRÍTICA"

```
🔴 REGRA CRÍTICA - VALIDAÇÃO DE INFORMAÇÕES ESSENCIAIS:
Quando o usuário quiser adicionar uma RECEITA ou DESPESA:
- Se faltar DESCRIÇÃO (ex: "1550 de despesa", "adicione 200", "500 de receita") → use INTENT_CLARIFY_TRANSACTION
- Se tiver APENAS valor SEM contexto do que é → use INTENT_CLARIFY_TRANSACTION
- Descrição essencial: o QUE foi comprado/recebido (ex: "salário", "mercado", "uber", "freelance")
```

**Exemplos que REQUEREM esclarecimento:**
- ❌ "1550 de despesa" → falta descrição
- ❌ "adicione 200" → falta tipo e descrição
- ❌ "500 de receita" → falta descrição
- ❌ "gastei 100" → falta descrição do que foi

**Exemplos que estão COMPLETOS:**
- ✅ "Paguei 150 no mercado" → tem descrição (mercado)
- ✅ "Recebi 5000 de salário" → tem descrição (salário)
- ✅ "Gastei 80 de uber" → tem descrição (uber)

### 3. Validação no Executor de Ações

**Arquivo:** `serverAgent.js` - Função `executeAction()`

```javascript
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
```

**Fluxo:**
1. Intent detectado como CLARIFY_TRANSACTION
2. Sistema identifica tipo de transação e valor (se houver)
3. Retorna objeto com:
   - `success: false` - não executa ação
   - `requiresClarification: true` - sinaliza que precisa de mais dados
   - `message` - mensagem amigável com exemplos

### 4. Template de Resposta

**Arquivo:** `reasoning.js`

```javascript
CLARIFY_TRANSACTION: {
    tone: 'amigavel_orientador',
    celebrate: false,
    maxLength: 200,
    insights: [],
    template: (data) => {
        const tipo = data.transactionType === 'income' ? 'receita' : 
                    data.transactionType === 'expense' ? 'despesa' : 'transação';
        const valor = data.amount ? ` de R$ ${parseFloat(data.amount).toFixed(2).replace('.', ',')}` : '';
        
        return `Para fazer o lançamento dessa ${tipo}${valor}, preciso de uma descrição. 

Por exemplo:
• "Comprei 150 no supermercado hoje"
• "Recebi 5000 de salário semana passada"
• "Paguei 80 de uber com cartão de crédito"

Me envie com a descrição que eu faço o lançamento! 😊`;
    }
}
```

### 5. Exemplos no Sistema

**Arquivo:** `intents.js` - Seção INTENT_EXAMPLES

```javascript
[INTENTS.CLARIFY_TRANSACTION]: [
    "1550 de despesa",
    "adicione 200",
    "500 de receita",
    "gastei 100",
    "recebi 300",
    "coloca 1000",
    "2500",
    "despesa de 450"
]
```

## 📝 Mensagem de Esclarecimento

### Estrutura da Mensagem

```
Para fazer o lançamento dessa [tipo][valor], preciso de uma descrição.

Por exemplo:
• "Comprei 150 no supermercado hoje"
• "Recebi 5000 de salário semana passada"
• "Paguei 80 de uber com cartão de crédito"

Me envie com a descrição que eu faço o lançamento! 😊
```

### Componentes Dinâmicos

1. **[tipo]** - "receita", "despesa" ou "transação" (genérico)
2. **[valor]** - Valor formatado se foi fornecido (ex: " de R$ 1.550,00")
3. **Exemplos práticos** - Três exemplos diferentes para ilustrar formato correto

### Tom e Estilo

- ✅ **Amigável:** Usa emoji e linguagem acolhedora
- ✅ **Orientador:** Fornece exemplos concretos
- ✅ **Objetivo:** Deixa claro o que precisa
- ✅ **Positivo:** Encoraja o usuário a tentar novamente

## 🔄 Fluxo Completo

```
┌─────────────────────────────────┐
│ Usuário envia mensagem          │
│ "1550 de despesa"               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ detectIntent() analisa          │
│ com GPT-4o-mini                 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Detecta falta de descrição      │
│ Intent: CLARIFY_TRANSACTION     │
│ entities: {                     │
│   transactionType: "expense"    │
│   amount: 1550                  │
│ }                               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ executeAction() processa        │
│ - success: false                │
│ - requiresClarification: true   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Retorna mensagem amigável       │
│ solicitando descrição           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Usuário envia novamente         │
│ "1550 de mercado hoje"          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Intent: ADD_EXPENSE             │
│ Com descrição completa          │
│ ✅ Transação registrada         │
└─────────────────────────────────┘
```

## 🧪 Casos de Teste

### ❌ Devem Solicitar Esclarecimento

| Mensagem                | Motivo                           |
|-------------------------|----------------------------------|
| "1550 de despesa"       | Falta descrição                  |
| "adicione 200"          | Falta tipo e descrição           |
| "500 de receita"        | Falta descrição                  |
| "gastei 100"            | Falta descrição                  |
| "recebi 300"            | Falta descrição                  |
| "coloca 1000"           | Falta tipo e descrição           |
| "2500"                  | Falta tipo e descrição           |
| "despesa de 450"        | Falta descrição                  |

### ✅ Devem Ser Aceitas

| Mensagem                                      | Descrição Extraída   |
|-----------------------------------------------|----------------------|
| "Paguei 150 no mercado"                       | mercado              |
| "Recebi 5000 de salário"                      | salário              |
| "Gastei 80 de uber"                           | uber                 |
| "Comprei 200 de roupas"                       | roupas               |
| "Recebi 300 de freelance"                     | freelance            |
| "Paguei 1550 de aluguel"                      | aluguel              |
| "Gastei 50 com lanche"                        | lanche               |

## 🎨 Personalização

### Tom da Mensagem

Pode ser ajustado em `reasoning.js`:

```javascript
tone: 'amigavel_orientador'  // Outras opções: 'profissional', 'casual', 'breve'
```

### Exemplos Fornecidos

Os exemplos podem ser personalizados para refletir o perfil do usuário:

```javascript
• "Comprei 150 no supermercado hoje"      // Despesa comum
• "Recebi 5000 de salário semana passada" // Receita recorrente
• "Paguei 80 de uber com cartão"          // Despesa com forma de pagamento
```

### Comprimento da Mensagem

```javascript
maxLength: 200  // Caracteres máximos permitidos
```

## 🔍 Monitoramento e Logs

O sistema registra logs detalhados:

```javascript
console.log('   ⚠️  Informações insuficientes - solicitando esclarecimento');
```

Útil para:
- Debugar casos edge
- Entender padrões de uso
- Melhorar exemplos fornecidos

## 📊 Benefícios

### Para o Usuário

1. **Dados Mais Completos:** Evita lançamentos com informações null
2. **Melhor Categorização:** Descrições permitem classificação mais precisa
3. **Aprendizado:** Exemplos ensinam formato correto
4. **Experiência Positiva:** Tom amigável não intimida

### Para o Sistema

1. **Qualidade de Dados:** Banco de dados mais limpo
2. **Análises Precisas:** Relatórios baseados em dados completos
3. **Menos Correções:** Usuários erram menos após aprender
4. **Categorização Automática:** Descrições facilitam ML/AI

## 🚀 Próximos Passos (Opcional)

### Validações Adicionais

1. **Valores Muito Altos/Baixos:**
   - "Você quis dizer R$ 15,50 ou R$ 1.550,00?"

2. **Datas Suspeitas:**
   - "Essa despesa é realmente de 2023 ou deveria ser de 2024?"

3. **Categorias Conflitantes:**
   - "Você categorizou como 'Alimentação' mas a descrição é 'combustível'. Está correto?"

### Melhorias na Mensagem

1. **Sugestões Contextuais:**
   - Se o usuário já tem muitas despesas de "mercado", sugerir isso

2. **Aprendizado do Perfil:**
   - Adaptar exemplos baseado nas categorias mais usadas

3. **Atalhos:**
   - "Ou simplesmente diga: 'era mercado'"

## 📝 Notas de Implementação

- **Performance:** Validação não adiciona latência significativa (ocorre no mesmo fluxo)
- **Compatibilidade:** Funciona com sistema de duplicatas existente
- **Rollback:** Se necessário, basta remover o intent CLARIFY_TRANSACTION
- **Testes:** Arquivos de sintaxe validados com `node --check`

## ✅ Status

**Implementado e validado em:**
- ✅ intents.js - Novo intent e regras de detecção
- ✅ serverAgent.js - Validação no executor de ações
- ✅ reasoning.js - Template de resposta humanizada
- ✅ Testes de sintaxe - Todos os arquivos validados

**Pronto para uso!** 🎉
