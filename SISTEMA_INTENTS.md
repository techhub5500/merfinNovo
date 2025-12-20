# 🤖 Sistema de Intents - Merfin.IA

## 📚 Visão Geral

O sistema de intents permite que o agente Merfin identifique automaticamente a intenção do usuário e execute ações diretas nas planilhas de receitas e despesas, além de fornecer educação financeira, análises e cálculos.

---

## 🎯 O Que São Intents?

**Intents** (intenções) são rótulos que definem a ação mental ou prática que o agente deve executar a partir do input do usuário.

### Por Que São Necessários?

Sem intents, o agente não sabe quando:
- ✅ Adicionar uma receita
- ✅ Registrar um gasto
- ✅ Editar dados da planilha
- ✅ Apagar informações
- ✅ Fazer análises financeiras
- ✅ Explicar conceitos
- ✅ Realizar cálculos
- ✅ Apenas conversar

---

## 📋 Lista Completa de Intents

### 💰 Manipulação de Receitas
- **INTENT_ADD_INCOME**: Adicionar nova receita
- **INTENT_EDIT_INCOME**: Editar receita completa
- **INTENT_DELETE_INCOME**: Deletar receita
- **INTENT_UPDATE_INCOME_FIELD**: Atualizar apenas um campo
- **INTENT_LIST_INCOMES**: Listar receitas

### 💸 Manipulação de Despesas
- **INTENT_ADD_EXPENSE**: Adicionar nova despesa
- **INTENT_EDIT_EXPENSE**: Editar despesa completa
- **INTENT_DELETE_EXPENSE**: Deletar despesa
- **INTENT_UPDATE_EXPENSE_FIELD**: Atualizar apenas um campo
- **INTENT_LIST_EXPENSES**: Listar despesas

### 🔄 Manipulação Geral
- **INTENT_REPLACE_INCOME**: Substituir receita inteira
- **INTENT_REPLACE_EXPENSE**: Substituir despesa inteira
- **INTENT_CLEAR_ALL_INCOMES**: Limpar todas receitas
- **INTENT_CLEAR_ALL_EXPENSES**: Limpar todas despesas

### 📈 Consultas e Análises
- **INTENT_ANALYZE_SPENDING**: Analisar gastos
- **INTENT_CALCULATE_BALANCE**: Calcular saldo
- **INTENT_COMPARE_MONTHS**: Comparar meses
- **INTENT_FORECAST_BUDGET**: Projetar orçamento
- **INTENT_CATEGORY_BREAKDOWN**: Breakdown por categoria

### 🎯 Metas Financeiras
- **INTENT_UPDATE_GOAL**: Atualizar meta
- **INTENT_CHECK_GOAL_PROGRESS**: Verificar progresso
- **INTENT_CREATE_SAVINGS_PLAN**: Criar plano de economia

### 📚 Educação Financeira
- **INTENT_EXPLAIN_CONCEPT**: Explicar conceito financeiro
- **INTENT_INVESTMENT_ADVICE**: Conselho de investimento
- **INTENT_DEBT_MANAGEMENT**: Gestão de dívidas
- **INTENT_BUDGETING_TIPS**: Dicas de orçamento
- **INTENT_FINANCIAL_EDUCATION**: Educação financeira geral

### 🔢 Cálculos Matemáticos
- **INTENT_CALCULATE_PERCENTAGE**: Calcular porcentagem
- **INTENT_CALCULATE_INTEREST**: Calcular juros
- **INTENT_CALCULATE_INSTALLMENT**: Calcular parcela
- **INTENT_SIMPLE_MATH**: Matemática simples

### 💬 Conversação
- **INTENT_JUST_CHAT**: Apenas conversar
- **INTENT_CLARIFY**: Pedir esclarecimento
- **INTENT_GREETING**: Saudação
- **INTENT_FAREWELL**: Despedida
- **INTENT_THANKS**: Agradecimento

### 🛠️ Sistema
- **INTENT_HELP**: Pedir ajuda
- **INTENT_SHOW_SUMMARY**: Mostrar resumo financeiro
- **INTENT_EXPORT_DATA**: Exportar dados
- **INTENT_UNKNOWN**: Intenção não reconhecida

---

## 🔄 Fluxo de Funcionamento

### 1️⃣ Usuário Envia Mensagem
```
Usuário: "Recebi meu salário de R$ 5000"
```

### 2️⃣ Detecção de Intent (GPT-4o-mini)
```json
{
  "intent": "INTENT_ADD_INCOME",
  "confidence": 0.98,
  "reasoning": "Usuário quer adicionar receita de salário",
  "entities": {
    "amount": 5000,
    "category": "Salário",
    "description": "Salário"
  }
}
```

### 3️⃣ Verificação: É Ação Direta na Planilha?

**Se SIM** (adicionar, editar, apagar):
- Executa a ação imediatamente
- Salva os dados no banco
- Retorna mensagem de confirmação
- Atualiza resumo da conversa
- FIM

**Se NÃO** (análise, educação, conversa):
- Busca dados necessários do usuário
- Envia para IA com contexto completo
- Gera resposta personalizada
- Atualiza resumo da conversa
- FIM

### 4️⃣ Logs no Terminal

```
╔═════════════════════════════════════════════════════════╗
║                   🤖 NOVA CONSULTA                      ║
╚═════════════════════════════════════════════════════════╝
👤 Usuário: 507f1f77bcf86cd799439011
📅 Data atual: 2025-12-20
📆 Mês atual: 2025-12
💬 Pergunta: "Recebi meu salário de R$ 5000"
─────────────────────────────────────────────────────────

╔═════════════════════════════════════════════════════════╗
║             PASSO 0: DETECÇÃO DE INTENT                 ║
╚═════════════════════════════════════════════════════════╝
🔍 DETECÇÃO DE INTENT
   💬 Analisando mensagem...
   ✅ Intent detectado: INTENT_ADD_INCOME
   🎯 Confiança: 98%
   💭 Raciocínio: Usuário quer adicionar receita de salário
   📊 Entidades extraídas: {
     "amount": 5000,
     "category": "Salário",
     "description": "Salário"
   }

📝 Intent requer ação direta na planilha!
   ⚡ Executando ação antes de gerar resposta...

💰 AÇÃO: Adicionar Receita
   📅 Mês: 2025-12
   📊 Dados: {
     "amount": 5000,
     "description": "Salário",
     "category": "Salário"
   }
   ✅ Receita adicionada com sucesso!
   💵 Valor: R$ 5000
   📝 Descrição: Salário

╔═════════════════════════════════════════════════════════╗
║            ✨ CONSULTA FINALIZADA COM SUCESSO           ║
╚═════════════════════════════════════════════════════════╝
```

---

## 📝 Exemplos de Uso

### Adicionar Receita
```
Usuário: "Recebi R$ 200 de freelance"
Agente: ✅ Receita de R$ 200 (freelance) adicionada com sucesso!
```

### Adicionar Despesa
```
Usuário: "Gastei R$ 150 no mercado"
Agente: ✅ Despesa de R$ 150 (mercado) adicionada com sucesso!
```

### Editar Campo Específico
```
Usuário: "Muda a categoria da despesa do mercado para Alimentação"
Agente: ✅ Campo "categoria" da despesa atualizado para "Alimentação"!
```

### Deletar Item
```
Usuário: "Apaga a receita de freelance"
Agente: ✅ Receita "freelance" (R$ 200) deletada com sucesso!
```

### Análise Financeira
```
Usuário: "Quanto gastei este mês?"
Agente: Neste mês você gastou R$ 3.450,00 distribuídos em:
- Alimentação: R$ 1.200,00 (34.7%)
- Transporte: R$ 800,00 (23.2%)
- Moradia: R$ 950,00 (27.5%)
- Lazer: R$ 500,00 (14.6%)
```

### Educação Financeira
```
Usuário: "O que é CDI?"
Agente: CDI (Certificado de Depósito Interbancário) é a taxa...
```

### Cálculos
```
Usuário: "Quanto é 10% de 5000?"
Agente: 10% de R$ 5.000,00 é R$ 500,00
```

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐
│  Mensagem do    │
│    Usuário      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  1. Detector de Intent          │
│  (GPT-4o-mini)                  │
│  - Identifica intenção          │
│  - Extrai entidades             │
│  - Calcula confiança            │
└────────┬────────────────────────┘
         │
         ▼
    ┌───┴───┐
    │ É ação│
    │direta?│
    └───┬───┘
        │
    ┌───┴─────────┐
    │            │
    ▼            ▼
┌────────┐  ┌──────────────┐
│  SIM   │  │    NÃO       │
│        │  │              │
│Executar│  │Buscar dados  │
│ ação   │  │+ IA responde │
└───┬────┘  └──────┬───────┘
    │              │
    └──────┬───────┘
           │
           ▼
    ┌─────────────┐
    │  Resposta   │
    │ ao Usuário  │
    └─────────────┘
```

---

## 📂 Estrutura de Arquivos

```
server/
├── intents.js              # Definições de intents e exemplos
├── spreadsheetActions.js   # Funções de manipulação de planilhas
└── serverAgent.js          # Servidor principal com integração
```

### intents.js
- Lista de todos os intents
- Exemplos de mensagens para cada intent
- Prompt de detecção de intent para IA

### spreadsheetActions.js
- addIncome(): Adicionar receita
- addExpense(): Adicionar despesa
- editIncome(): Editar receita
- editExpense(): Editar despesa
- updateIncomeField(): Atualizar campo de receita
- updateExpenseField(): Atualizar campo de despesa
- deleteIncome(): Deletar receita
- deleteExpense(): Deletar despesa
- listIncomes(): Listar receitas
- listExpenses(): Listar despesas

### serverAgent.js
- detectIntent(): Detecta intent da mensagem
- executeAction(): Executa ação baseada no intent
- Fluxo principal de chat integrado

---

## 🔧 Como Adicionar Novos Intents

1. **Adicione o intent em `intents.js`**:
```javascript
const INTENTS = {
    // ... existentes
    NEW_INTENT: "INTENT_NEW_INTENT"
};
```

2. **Adicione exemplos**:
```javascript
const INTENT_EXAMPLES = {
    [INTENTS.NEW_INTENT]: [
        "exemplo 1",
        "exemplo 2"
    ]
};
```

3. **Atualize o prompt de detecção** se necessário

4. **Implemente a ação em `spreadsheetActions.js`** (se for ação direta)

5. **Adicione o case no `executeAction()`** em `serverAgent.js`

---

## 🎨 Personalização de Respostas

O agente pode ser personalizado editando os prompts em `serverAgent.js`:

- **SUMMARY_PROMPT**: Como gerar resumos de conversas
- **DECISION_PROMPT**: Como decidir quais dados buscar
- **RESPONSE_PROMPT**: Como formatar respostas
- **INTENT_DETECTION_PROMPT** (em intents.js): Como detectar intents

---

## 🚀 Funcionalidades Mantidas

O sistema de intents é um **adicional** às funcionalidades existentes:

✅ Educação financeira
✅ Análises personalizadas
✅ Consultas sobre metas
✅ Comparações entre meses
✅ Projeções e planejamento
✅ Cálculos matemáticos
✅ Conversa natural

**NOVO**:
✅ Adicionar/editar/apagar receitas e despesas via chat
✅ Logs detalhados no terminal
✅ Detecção inteligente de intenções
✅ Extração automática de entidades

---

## 📊 Monitoramento

Todos os logs são exibidos no terminal com formatação visual:

- 📝 Intent detectado
- 🎯 Confiança da detecção
- 💭 Raciocínio da IA
- 📊 Entidades extraídas
- ⚡ Ações executadas
- ✅ Sucesso/Falha
- 💾 Dados salvos

---

## 🔐 Segurança

- Todas as ações requerem autenticação JWT
- Dados validados antes de salvar
- Logs não expõem informações sensíveis
- Fallback para intent UNKNOWN em casos de dúvida

---

## 🎯 Próximos Passos

- [ ] Adicionar confirmação para ações destrutivas (deletar)
- [ ] Implementar desfazer última ação
- [ ] Adicionar suporte a edição em lote
- [ ] Exportação de dados em diferentes formatos
- [ ] Integração com notificações
- [ ] Histórico de ações executadas

---

**Desenvolvido com ❤️ para Merfin.IA**
