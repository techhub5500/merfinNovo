# 🧪 Guia de Testes - Sistema de Intents Merfin IA

## 🚀 Como Testar

### 1. Iniciar os Servidores

```bash
# Terminal 1 - Servidor Operacional
cd server
node serverOperacional.js

# Terminal 2 - Servidor Agent
cd server
node serverAgent.js
```

### 2. Abrir o Chat

Navegue até: `http://localhost:5000/html/chat.html`

## ✅ Casos de Teste

### 🟢 Teste 1: Adicionar Receita

**Input**: `Recebi 5000 reais de salário hoje`

**Resultado Esperado**:
- ✅ Intent: `add_income` (confiança > 60%)
- ✅ Entidades extraídas: `{ valor: 5000, descricao: "salário", data: "2025-12-20" }`
- ✅ Resposta: "✅ Receita de R$ 5000.00 adicionada com sucesso em salário!"
- ✅ Transação salva no banco de dados

**Verificar**:
- Ir para "Minhas Finanças"
- Verificar se a receita aparece na tabela
- Verificar valor e descrição

---

### 🟢 Teste 2: Adicionar Despesa

**Input**: `Gastei 250 no supermercado com pix`

**Resultado Esperado**:
- ✅ Intent: `add_expense`
- ✅ Entidades: `{ valor: 250, descricao: "supermercado", formaPagamento: "Pix" }`
- ✅ Resposta confirmando adição
- ✅ Despesa salva

---

### 🟢 Teste 3: Adicionar Receita com Data Específica

**Input**: `Recebi 1500 reais ontem`

**Resultado Esperado**:
- ✅ Data: 19/12/2025 (ontem)
- ✅ Valor: 1500
- ✅ Transação adicionada com data correta

---

### 🟢 Teste 4: Valor em Milhares

**Input**: `Gastei 2 mil no aluguel`

**Resultado Esperado**:
- ✅ Valor: 2000
- ✅ Descrição: "aluguel"
- ✅ Despesa adicionada

---

### 🟢 Teste 5: Atualizar Meta

**Input**: `Adiciona 500 reais à minha meta de curto prazo`

**Resultado Esperado**:
- ✅ Intent: `update_goal_progress`
- ✅ Valor: 500
- ✅ Tipo: metaCurto
- ✅ Resposta mostrando progresso atualizado com percentual
- ✅ Progresso salvo no perfil

**Verificar**:
- Ir para "Perfil"
- Ver se o progresso da meta aumentou

---

### 🟡 Teste 6: Falta de Informação

**Input**: `Adiciona uma receita`

**Resultado Esperado**:
- ✅ Intent: `add_income`
- ✅ `needsConfirmation: true`
- ✅ Resposta: "Por favor, informe o valor da transação."

---

### 🟢 Teste 7: Query Normal (Não é Ação)

**Input**: `Quanto gastei esse mês?`

**Resultado Esperado**:
- ✅ Intent: `query_financial` (confiança > 60%)
- ✅ Fluxo normal de query executado
- ✅ Dados buscados do servidor
- ✅ Resposta personalizada com análise

---

### 🟢 Teste 8: Conversa Casual

**Input**: `Olá, bom dia!`

**Resultado Esperado**:
- ✅ Intent: `chat`
- ✅ Resposta amigável
- ✅ Não executa nenhuma ação

---

### 🟢 Teste 9: Múltiplas Transações na Mesma Conversa

**Sequência**:
1. `Recebi 3000 de salário`
2. `Gastei 150 no mercado`
3. `Quanto sobrou?`

**Resultado Esperado**:
- ✅ Primeira mensagem: adiciona receita
- ✅ Segunda mensagem: adiciona despesa
- ✅ Terceira mensagem: calcula e responde

---

### 🟢 Teste 10: Data em Formato DD/MM

**Input**: `Gastei 80 reais em 15/12`

**Resultado Esperado**:
- ✅ Data: 2025-12-15
- ✅ Valor: 80
- ✅ Despesa adicionada com data correta

---

## 🔍 Verificações nos Logs

### Console do serverAgent.js deve mostrar:

```
🎯 Intent detectado: add_income (95%)
📦 Entidades: {
  "valor": 5000,
  "descricao": "salário",
  "data": "2025-12-20"
}
🎬 Executando ação: add_income
✅ Receita adicionada com sucesso
```

### Verificar no MongoDB

```javascript
// Coleção: financas
// Buscar documento do mês 2025-12
{
  "mesAno": "2025-12",
  "receitas": [
    {
      "data": "2025-12-20",
      "descricao": "salário",
      "valor": 5000,
      "status": "Confirmado"
    }
  ]
}
```

---

## 🐛 Debugar Problemas

### Problema: Intent não está sendo detectado

**Verificar**:
1. ✅ `OPENAI_API_KEY` está definida no `.env`?
2. ✅ Servidor Agent está rodando?
3. ✅ Logs mostram "🎯 Intent detectado"?

**Console**:
```bash
cd server
node serverAgent.js
# Deve mostrar: 🔑 OpenAI: ✓
```

---

### Problema: Ação não está sendo executada

**Verificar**:
1. ✅ Confiança do intent > 60%?
2. ✅ Intent está na lista de `actionIntents`?
3. ✅ Handler está implementado?

**Debug**:
```javascript
// Adicione logs temporários em executeAction()
console.log('Handler disponível?', !!handlers[intent]);
```

---

### Problema: Entidades não estão sendo extraídas

**Verificar**:
1. ✅ Padrão de regex está correto?
2. ✅ Função `extractEntities()` está sendo chamada?
3. ✅ Merge de entidades está acontecendo?

**Test**:
```javascript
// No console Node.js
const extractEntities = require('./serverAgent.js').extractEntities;
console.log(extractEntities('Gastei 250 no mercado'));
```

---

### Problema: Dados não estão sendo salvos

**Verificar**:
1. ✅ Token JWT está válido?
2. ✅ Servidor Operacional está rodando?
3. ✅ MongoDB está conectado?
4. ✅ Requisição está sendo enviada ao endpoint correto?

**Debug**:
```bash
# No servidor operacional, deve aparecer:
POST /api/financas/2025-12 200
```

---

## 📊 Resposta da API

### Estrutura para Ação Bem-Sucedida

```json
{
  "success": true,
  "response": "✅ Receita de R$ 5000.00 adicionada com sucesso!",
  "actionCompleted": true,
  "intent": "add_income",
  "data": {
    "data": "2025-12-20",
    "descricao": "salário",
    "valor": 5000,
    "status": "Confirmado"
  },
  "sectionsUsed": [],
  "conversaId": "675f..."
}
```

### Estrutura para Falta de Info

```json
{
  "success": true,
  "response": "Por favor, informe o valor da transação.",
  "needsConfirmation": true,
  "intent": "add_income",
  "partialEntities": {
    "descricao": "salário"
  },
  "sectionsUsed": []
}
```

---

## 🎯 Checklist Completo

- [ ] Servidor Operacional rodando
- [ ] Servidor Agent rodando
- [ ] MongoDB conectado
- [ ] OpenAI API Key configurada
- [ ] Frontend acessível
- [ ] Login funcionando
- [ ] Chat aberto
- [ ] Teste 1: Adicionar Receita
- [ ] Teste 2: Adicionar Despesa
- [ ] Teste 3: Data específica
- [ ] Teste 4: Valores em milhares
- [ ] Teste 5: Atualizar meta
- [ ] Teste 6: Falta de informação
- [ ] Teste 7: Query normal
- [ ] Teste 8: Conversa casual
- [ ] Teste 9: Múltiplas transações
- [ ] Teste 10: Formato DD/MM
- [ ] Verificar MongoDB
- [ ] Verificar UI atualizada
- [ ] Verificar logs

---

## 🚨 Problemas Conhecidos

### 1. Edit/Delete Transaction
**Status**: Implementação básica
**Limitação**: Não identifica transações automaticamente
**Workaround**: Usuário precisa especificar data e descrição exata

### 2. Confirmações
**Status**: Não implementado ainda
**Limitação**: Ações destrutivas não pedem confirmação
**Próximo Passo**: Adicionar fluxo de confirmação

### 3. Batch Operations
**Status**: Não implementado
**Limitação**: Uma transação por mensagem
**Próximo Passo**: Detectar múltiplas transações

---

## 💡 Dicas

1. **Use descrições claras**: "Gastei 100 no mercado" > "Gastei 100"
2. **Inclua forma de pagamento**: "com pix", "no crédito"
3. **Especifique datas**: "hoje", "ontem", "15/12"
4. **Seja específico com metas**: "meta de curto prazo" vs "meta"

---

**Boa sorte com os testes! 🚀**
