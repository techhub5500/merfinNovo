# Sistema de Intents - Merfin IA

## 📋 Visão Geral

Sistema completo de classificação de intenções e execução de ações para o agente de IA financeiro Merfin. Permite que a IA execute ações automaticamente baseadas no input do usuário.

## 🎯 Intents Implementados

### 1. **Transações Financeiras**

#### `add_income`
- **Descrição**: Adicionar receita/entrada de dinheiro
- **Keywords**: "adicionar receita", "registrar entrada", "recebi", "salário", "ganho"
- **Parâmetros Necessários**: `valor`
- **Parâmetros Opcionais**: `data`, `descricao`, `categoria`, `subcategoria`
- **Exemplo**: "Recebi 3000 reais de salário hoje"

#### `add_expense`
- **Descrição**: Adicionar despesa/gasto
- **Keywords**: "adicionar despesa", "gastei", "paguei", "comprei", "registrar gasto"
- **Parâmetros Necessários**: `valor`
- **Parâmetros Opcionais**: `data`, `descricao`, `categoria`, `subcategoria`, `formaPagamento`
- **Exemplo**: "Gastei 150 no supermercado hoje"

#### `edit_transaction`
- **Descrição**: Editar transação existente
- **Keywords**: "editar", "alterar", "modificar", "corrigir", "mudar valor"
- **Parâmetros Necessários**: `identificador`, `campo`
- **Status**: Implementação básica (precisa de identificação inteligente)

#### `delete_transaction`
- **Descrição**: Deletar transação
- **Keywords**: "deletar", "remover", "apagar", "excluir", "cancelar registro"
- **Parâmetros Necessários**: `identificador`
- **Status**: Implementação básica (precisa de identificação inteligente)

### 2. **Gestão de Metas**

#### `update_goal_progress`
- **Descrição**: Adicionar progresso a uma meta
- **Keywords**: "adicionar à meta", "atualizar progresso", "progredir meta"
- **Parâmetros Necessários**: `valor`
- **Parâmetros Opcionais**: `goalType` (metaCurto ou metaLongo)
- **Exemplo**: "Adiciona 500 reais à minha meta de curto prazo"

#### `update_goal_info`
- **Descrição**: Alterar informações da meta (valor, prazo, descrição)
- **Keywords**: "mudar meta", "alterar objetivo", "redefinir meta"
- **Status**: Implementação básica

### 3. **Gestão de Perfil**

#### `update_profile`
- **Descrição**: Atualizar informações pessoais do perfil
- **Keywords**: "atualizar perfil", "mudar informações", "alterar dados"
- **Status**: Implementação básica

#### `update_patrimony`
- **Descrição**: Atualizar patrimônio/investimentos
- **Keywords**: "atualizar patrimônio", "adicionar investimento", "registrar ativo"
- **Status**: Implementação básica

### 4. **Gestão de Dívidas**

#### `add_debt`
- **Descrição**: Adicionar nova dívida
- **Keywords**: "registrar dívida", "adicionar parcelamento", "nova dívida"
- **Parâmetros Necessários**: `nome`, `valorTotal`, `numParcelas`
- **Status**: Implementação básica

#### `mark_payment`
- **Descrição**: Marcar parcela como paga
- **Keywords**: "pagar parcela", "marcar como pago", "paguei parcela"
- **Parâmetros Necessários**: `dividaId`, `parcelaNumero`
- **Status**: Implementação básica

#### `delete_debt`
- **Descrição**: Remover dívida
- **Keywords**: "remover dívida", "excluir dívida", "deletar dívida"
- **Status**: Implementação básica

### 5. **Consultas e Análises**

#### `query_financial`
- **Descrição**: Consultar informações financeiras
- **Keywords**: "quanto", "qual", "onde", "quando", "mostrar", "listar", "ver"
- **Ação**: Fluxo normal de query (sem execução de ação)

#### `financial_analysis`
- **Descrição**: Análise financeira detalhada
- **Keywords**: "analisar", "análise", "avaliar", "revisar", "diagnóstico"
- **Ação**: Fluxo normal com análise profunda

#### `calculate`
- **Descrição**: Fazer cálculos matemáticos
- **Keywords**: "calcular", "quanto é", "soma", "multiplicar", "dividir"

### 6. **Educação e Chat**

#### `financial_education`
- **Descrição**: Educação financeira
- **Keywords**: "explicar", "ensinar", "aprender", "o que é", "como funciona"

#### `chat`
- **Descrição**: Conversa casual
- **Keywords**: "olá", "oi", "bom dia", "obrigado", "tchau"

## 🔧 Sistema de Extração de Entidades

### Valores Monetários
- `R$ 100`, `100 reais`, `100`, `1k`, `1 mil`
- Suporta vírgula e ponto decimal

### Datas
- Palavras-chave: `hoje`, `ontem`, `anteontem`
- Formato: `DD/MM` (ano atual assumido)

### Descrições
- Padrões: "de [descrição]", "em [descrição]", "para [descrição]", "com [descrição]"

### Tipo de Meta
- `curto` → `metaCurto`
- `longo` → `metaLongo`

### Forma de Pagamento
- Detecta: PIX, Dinheiro, Débito, Crédito, Cartão

## 🎬 Fluxo de Execução

```
1. Usuário envia mensagem
   ↓
2. Sistema busca resumo da conversa (contexto)
   ↓
3. Classificador de Intent (GPT-4o-mini)
   ↓
4. Extração de Entidades (local + IA)
   ↓
5. Verificação: É uma ação?
   ├─ SIM → Executa ação
   │         ├─ Falta info? → Solicita
   │         ├─ Sucesso? → Confirma
   │         └─ Erro? → Informa
   └─ NÃO → Fluxo normal de query
              ├─ Decide dados necessários
              ├─ Busca dados
              └─ Gera resposta
```

## 📊 Resposta da API

### Para Ações Bem-Sucedidas
```json
{
  "success": true,
  "response": "✅ Receita de R$ 3000.00 adicionada com sucesso!",
  "actionCompleted": true,
  "intent": "add_income",
  "data": { /* dados da transação */ },
  "sectionsUsed": [],
  "conversaId": "..."
}
```

### Para Ações que Precisam de Informação
```json
{
  "success": true,
  "response": "Por favor, informe o valor da transação.",
  "needsConfirmation": true,
  "intent": "add_income",
  "partialEntities": { /* entidades já extraídas */ },
  "sectionsUsed": []
}
```

### Para Queries Normais
```json
{
  "success": true,
  "response": "Sua resposta personalizada...",
  "conversaId": "...",
  "debug": {
    "sectionsUsed": ["perfil", "financas"],
    "timeframe": { "type": "current_only" },
    "currentDate": "2025-12-20",
    "resumoUsado": true,
    "intent": "query_financial"
  }
}
```

## 🚀 Próximos Passos

### Implementações Prioritárias

1. **Edit Transaction (Inteligente)**
   - Buscar transações por descrição/data/valor
   - Permitir edição de campos específicos
   - Confirmação antes de editar

2. **Delete Transaction (Inteligente)**
   - Identificação precisa da transação
   - Confirmação obrigatória
   - Suporte a múltiplas transações similares

3. **Update Profile (Completo)**
   - Suporte para todos os campos do perfil
   - Validação de dados
   - Atualização parcial

4. **Update Patrimony (Completo)**
   - Atualizar valores individuais de ativos
   - Adicionar/remover tipos de investimento

5. **Add Debt (Completo)**
   - Criar dívida com todas as informações
   - Calcular parcelas automaticamente
   - Definir datas de vencimento

6. **Mark Payment (Inteligente)**
   - Listar dívidas ativas
   - Identificar parcela específica
   - Atualizar status

### Melhorias Futuras

1. **Confirmação Multi-Step**
   - Diálogo interativo para coletar informações faltantes
   - Confirmação antes de ações destrutivas

2. **Busca Inteligente de Transações**
   - Fuzzy matching para descrições
   - Busca por intervalo de datas
   - Busca por categoria

3. **Batch Operations**
   - Adicionar múltiplas transações de uma vez
   - Editar múltiplas transações
   - Importar de texto/CSV

4. **Validações Avançadas**
   - Verificar limites de orçamento
   - Alertas de gastos excessivos
   - Sugestões de economia

## 💡 Exemplos de Uso

### Adicionar Receita
```
Usuário: "Recebi meu salário de 5000 reais hoje"
IA: ✅ Receita de R$ 5000.00 adicionada com sucesso!
```

### Adicionar Despesa
```
Usuário: "Gastei 250 no mercado com cartão"
IA: ✅ Despesa de R$ 250.00 adicionada em mercado!
```

### Atualizar Meta
```
Usuário: "Adiciona 1000 reais à minha meta de longo prazo"
IA: ✅ Progresso atualizado! Você já tem R$ 5000.00 (50%) da sua meta de R$ 10000.00. 🎯
```

### Query Normal
```
Usuário: "Quanto gastei esse mês?"
IA: [Analisa dados e responde com detalhes]
```

## 🔐 Segurança

- Todas as ações requerem token JWT válido
- Dados são salvos no banco através do servidor operacional
- Validação de propriedade dos dados (userId)
- Logs completos de todas as ações

## 📝 Logs

O sistema registra:
- Intent detectado e confiança
- Entidades extraídas
- Ações executadas
- Erros e falhas
- Tempo de processamento

Exemplo:
```
🎯 Intent detectado: add_income (95%)
📦 Entidades: {
  "valor": 3000,
  "descricao": "salário",
  "data": "2025-12-20"
}
🎬 Executando ação: add_income
✅ Receita adicionada com sucesso
```

## 🤝 Integração com Frontend

O frontend deve:
1. Enviar mensagem + conversaId (se existir)
2. Verificar campo `actionCompleted` na resposta
3. Se `needsConfirmation`, coletar informações adicionais
4. Exibir feedback apropriado ao usuário
5. Atualizar UI após ações bem-sucedidas

---

**Status**: ✅ Sistema Base Implementado
**Versão**: 1.0
**Data**: 20/12/2025
