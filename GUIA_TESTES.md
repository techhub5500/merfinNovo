# 🧪 Guia de Testes - Sistema de Intents

## 🚀 Como Testar

### 1. Iniciar os Servidores

**Terminal 1 - Servidor Operacional:**
```powershell
cd C:\Users\edmar\OneDrive\Desktop\Merfin.IA\server
node serverOperacional.js
```

**Terminal 2 - Servidor do Agente:**
```powershell
cd C:\Users\edmar\OneDrive\Desktop\Merfin.IA\server
node serverAgent.js
```

### 2. Abrir o Chat
Abra [http://localhost:5000/html/chat.html](http://localhost:5000/html/chat.html) no navegador

---

## 📝 Testes Básicos de Planilha

### ✅ Teste 1: Adicionar Receita
```
Digite: "Recebi meu salário de R$ 5000"
```

**Esperado no Terminal:**
```
╔═════════════════════════════════════════════════════════╗
║             PASSO 0: DETECÇÃO DE INTENT                 ║
╚═════════════════════════════════════════════════════════╝
   ✅ Intent detectado: INTENT_ADD_INCOME
   🎯 Confiança: 98%

💰 AÇÃO: Adicionar Receita
   ✅ Receita adicionada com sucesso!
   💵 Valor: R$ 5000
   📝 Descrição: Salário
```

**Esperado no Chat:**
```
✅ Receita de R$ 5000 (Salário) adicionada com sucesso!
```

---

### ✅ Teste 2: Adicionar Despesa
```
Digite: "Gastei R$ 150 no mercado"
```

**Esperado no Terminal:**
```
   ✅ Intent detectado: INTENT_ADD_EXPENSE
💸 AÇÃO: Adicionar Despesa
   ✅ Despesa adicionada com sucesso!
   💵 Valor: R$ 150
   📝 Descrição: Mercado
```

**Esperado no Chat:**
```
✅ Despesa de R$ 150 (Mercado) adicionada com sucesso!
```

---

### ✅ Teste 3: Editar Campo Específico
```
Digite: "Muda a categoria da despesa do mercado para Alimentação"
```

**Esperado no Terminal:**
```
   ✅ Intent detectado: INTENT_UPDATE_EXPENSE_FIELD
🔄 AÇÃO: Atualizar Campo de Despesa
   🔍 Identificador: Mercado
   📝 Campo: categoria
   ✨ Novo valor: Alimentação
   ✅ Campo atualizado com sucesso!
```

---

### ✅ Teste 4: Deletar Receita
```
Digite: "Apaga a receita de salário"
```

**Esperado no Terminal:**
```
   ✅ Intent detectado: INTENT_DELETE_INCOME
🗑️ AÇÃO: Deletar Receita
   🔍 Identificador: salário
   ✅ Receita deletada com sucesso!
   📝 Receita removida: Salário - R$ 5000
```

---

### ✅ Teste 5: Listar Receitas
```
Digite: "Mostra minhas receitas"
```

**Esperado no Terminal:**
```
   ✅ Intent detectado: INTENT_LIST_INCOMES
📋 AÇÃO: Listar Receitas
   ✅ 3 receitas encontradas
```

---

## 📊 Testes de Análise (Fluxo Normal)

### ✅ Teste 6: Análise de Gastos
```
Digite: "Quanto gastei este mês?"
```

**Esperado no Terminal:**
```
   ✅ Intent detectado: INTENT_ANALYZE_SPENDING
💬 Intent requer resposta conversacional
   🔄 Continuando com fluxo normal...

╔═════════════════════════════════════════════════════════╗
║        PASSO 1: ANÁLISE DE DADOS NECESSÁRIOS            ║
╚═════════════════════════════════════════════════════════╝
   📊 Seções necessárias: financas
   📅 Timeframe: current_only
```

---

### ✅ Teste 7: Calcular Saldo
```
Digite: "Qual é meu saldo?"
```

**Esperado:**
- Intent: INTENT_CALCULATE_BALANCE
- Busca dados de receitas e despesas
- Retorna resposta com cálculo do saldo

---

### ✅ Teste 8: Educação Financeira
```
Digite: "O que é CDI?"
```

**Esperado:**
- Intent: INTENT_EXPLAIN_CONCEPT
- Resposta educativa sobre CDI

---

## 🔢 Testes de Cálculos

### ✅ Teste 9: Cálculo de Porcentagem
```
Digite: "Quanto é 10% de 5000?"
```

**Esperado:**
- Intent: INTENT_CALCULATE_PERCENTAGE
- Resposta: 10% de R$ 5.000,00 é R$ 500,00

---

### ✅ Teste 10: Cálculo de Parcela
```
Digite: "Divide R$ 1200 em 12 vezes"
```

**Esperado:**
- Intent: INTENT_CALCULATE_INSTALLMENT
- Resposta: Cada parcela fica R$ 100,00

---

## 💬 Testes de Conversação

### ✅ Teste 11: Saudação
```
Digite: "Oi"
```

**Esperado:**
- Intent: INTENT_GREETING
- Resposta amigável

---

### ✅ Teste 12: Agradecimento
```
Digite: "Obrigado"
```

**Esperado:**
- Intent: INTENT_THANKS
- Resposta educada

---

## 🎯 Testes de Metas

### ✅ Teste 13: Progresso da Meta
```
Digite: "Como está minha meta?"
```

**Esperado:**
- Intent: INTENT_CHECK_GOAL_PROGRESS
- Busca dados do perfil
- Mostra progresso das metas

---

## 🧪 Testes Avançados

### ✅ Teste 14: Edição Completa
```
Digite: "Edita a despesa do mercado para R$ 200"
```

**Esperado:**
- Intent: INTENT_EDIT_EXPENSE
- Atualiza o valor completo da despesa

---

### ✅ Teste 15: Múltiplas Entidades
```
Digite: "Adiciona uma despesa de R$ 80 em transporte paga no PIX"
```

**Esperado:**
- Intent: INTENT_ADD_EXPENSE
- Entidades extraídas: amount, category, paymentMethod
- Despesa criada com todos os dados

---

## 📋 Checklist de Verificação

Após cada teste, verifique:

- [ ] Intent detectado corretamente no terminal
- [ ] Confiança > 80%
- [ ] Entidades extraídas corretamente
- [ ] Ação executada (se aplicável)
- [ ] Dados salvos no banco
- [ ] Resposta clara para o usuário
- [ ] Logs formatados corretamente
- [ ] Sem erros no console

---

## 🐛 Troubleshooting

### Problema: Intent não detectado
**Solução:** Verifique se a API da OpenAI está configurada corretamente

### Problema: Ação não executada
**Solução:** Verifique logs no terminal para ver onde falhou

### Problema: Dados não salvos
**Solução:** Verifique conexão com MongoDB e servidor operacional

### Problema: Erro 401
**Solução:** Faça login novamente no sistema

---

## 📊 Monitoramento em Tempo Real

Para ver todos os processos, mantenha ambos os terminais visíveis:

```
┌─────────────────────┐  ┌─────────────────────┐
│ Terminal 1          │  │ Terminal 2          │
│ Operacional (5000)  │  │ Agente (5001)       │
│                     │  │                     │
│ Banco de dados      │  │ Detecção de Intent  │
│ API de financas     │  │ Execução de ações   │
│ Autenticação        │  │ Análises IA         │
└─────────────────────┘  └─────────────────────┘
```

---

## 🎨 Exemplo de Fluxo Completo

```
1. Usuário digita: "Recebi R$ 3000 de freelance"

2. Terminal do Agente mostra:
   ╔═════════════════════════════════════════════════════════╗
   ║                   🤖 NOVA CONSULTA                      ║
   ╚═════════════════════════════════════════════════════════╝
   💬 Pergunta: "Recebi R$ 3000 de freelance"
   
   ╔═════════════════════════════════════════════════════════╗
   ║             PASSO 0: DETECÇÃO DE INTENT                 ║
   ╚═════════════════════════════════════════════════════════╝
   ✅ Intent detectado: INTENT_ADD_INCOME
   🎯 Confiança: 97%
   
   💰 AÇÃO: Adicionar Receita
   ✅ Receita adicionada com sucesso!

3. Terminal Operacional mostra:
   📥 POST /api/financas/2025-12
   ✅ Dados salvos no banco

4. Chat mostra ao usuário:
   "✅ Receita de R$ 3000 (freelance) adicionada com sucesso!"

5. Planilha é atualizada automaticamente (recarregue a página)
```

---

**Pronto para testar!** 🚀
