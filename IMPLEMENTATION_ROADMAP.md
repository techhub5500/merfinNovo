# 🗺️ Roadmap de Implementação - Sistema de Intents Merfin IA

## ✅ Fase 1: Base do Sistema (CONCLUÍDO)

### Implementado
- ✅ Definição de 15+ intents
- ✅ Sistema de classificação de intents (GPT-4o-mini)
- ✅ Extração de entidades (valores, datas, descrições)
- ✅ Integração com rota `/api/chat`
- ✅ Handlers básicos para todas as ações
- ✅ `addTransaction` (receitas e despesas) - FUNCIONAL
- ✅ `updateGoalProgress` - FUNCIONAL
- ✅ Sistema de logs detalhados
- ✅ Documentação completa

### Funcionalidades Ativas
1. **Adicionar Receitas** - 100% funcional
2. **Adicionar Despesas** - 100% funcional
3. **Atualizar Progresso de Metas** - 100% funcional
4. **Query Normal** - 100% funcional (fluxo existente)

---

## 🔄 Fase 2: Ações Avançadas (PRÓXIMO)

### Prioridade ALTA

#### 1. Edit Transaction (Inteligente)
**Tempo Estimado**: 2-3 horas

**Implementar**:
```javascript
async function editTransaction(userId, userToken, entities) {
    // 1. Buscar transações do mês atual
    // 2. Filtrar por descrição/valor/data (fuzzy match)
    // 3. Se múltiplas → perguntar qual
    // 4. Se única → confirmar e editar
    // 5. Salvar alterações
}
```

**Entidades Necessárias**:
- `identificador`: data + descrição parcial
- `campo`: qual campo editar (valor, descrição, categoria)
- `novoValor`: novo valor do campo

**Exemplos**:
- "Edita o gasto de mercado para 300 reais"
- "Altera a receita de salário para 5500"
- "Muda a data da despesa do mercado para 18/12"

---

#### 2. Delete Transaction (Inteligente)
**Tempo Estimado**: 2 horas

**Implementar**:
```javascript
async function deleteTransaction(userId, userToken, entities) {
    // 1. Buscar transações
    // 2. Identificar por descrição + data aproximada
    // 3. Confirmar antes de deletar
    // 4. Remover do array
    // 5. Salvar
}
```

**Entidades Necessárias**:
- `identificador`: descrição + data (opcional)
- Confirmação obrigatória

**Exemplos**:
- "Remove o gasto do mercado de hoje"
- "Deleta a receita de 1500 reais"
- "Apaga a despesa de 18/12"

---

#### 3. Update Profile (Completo)
**Tempo Estimado**: 2 horas

**Implementar**:
```javascript
async function updateProfile(userId, userToken, entities) {
    // Campos permitidos:
    // - nome, idade, profissao, cidade, estado, sobre
    // - numDependentes, unicaRenda, rendaConjugue
    // - fundoEmergencia, prazoFundo
}
```

**Exemplos**:
- "Muda minha idade para 32"
- "Atualiza minha profissão para desenvolvedor"
- "Muda meu fundo de emergência para 15000"

---

### Prioridade MÉDIA

#### 4. Update Patrimony (Completo)
**Tempo Estimado**: 2 horas

**Campos**:
- acoes, fundos, tesouro, cdb, poupanca
- imoveis, veiculos, cripto, previdencia, outros

**Exemplos**:
- "Adiciona 5000 em ações"
- "Atualiza meus imóveis para 300000"
- "Coloca 2000 em poupança"

---

#### 5. Add Debt (Completo)
**Tempo Estimado**: 3 horas

**Implementar**:
- Criar dívida com nome, valor, parcelas
- Calcular datas de vencimento
- Definir tipo de dívida
- Calcular valor de cada parcela

**Exemplos**:
- "Registra uma dívida de cartão de 3000 em 10 parcelas"
- "Adiciona financiamento de 50000 em 60 meses"

---

#### 6. Mark Payment (Completo)
**Tempo Estimado**: 2-3 horas

**Implementar**:
- Listar dívidas ativas do usuário
- Identificar dívida por nome
- Identificar parcela por número ou próxima em aberto
- Marcar como paga
- Atualizar total pago

**Exemplos**:
- "Paga a parcela 3 do cartão"
- "Marca como pago a próxima parcela do financiamento"
- "Quita a parcela de dezembro da dívida X"

---

### Prioridade BAIXA

#### 7. Batch Operations
**Tempo Estimado**: 4-5 horas

**Funcionalidades**:
- Detectar múltiplas transações em uma mensagem
- Processar cada uma individualmente
- Retornar resumo de todas

**Exemplo**:
```
"Hoje gastei 50 no mercado, 30 no uber e 100 na farmácia"
→ 3 despesas adicionadas
```

---

#### 8. Update Goal Info
**Tempo Estimado**: 2 horas

**Implementar**:
- Alterar valor da meta
- Alterar prazo
- Alterar descrição
- Resetar progresso

**Exemplos**:
- "Muda minha meta de curto prazo para 20000"
- "Altera o prazo da meta de longo prazo para 60 meses"

---

## 🎨 Fase 3: Melhorias de UX (FUTURO)

### 1. Confirmações Inteligentes
**Tempo Estimado**: 3-4 horas

**Implementar**:
- Sistema de multi-step conversation
- Manter estado temporário
- Confirmar antes de ações destrutivas (delete)
- Confirmar valores altos (> R$ 1000)

**Exemplo de Fluxo**:
```
Usuário: "Remove o gasto do mercado"
IA: "Encontrei 3 gastos de mercado. Qual deles?
     1. 15/12 - R$ 150
     2. 18/12 - R$ 200
     3. 20/12 - R$ 250"
Usuário: "O de 250"
IA: "Confirma remoção da despesa de R$ 250 do dia 20/12?"
Usuário: "Sim"
IA: "✅ Despesa removida com sucesso!"
```

---

### 2. Busca Fuzzy
**Tempo Estimado**: 2-3 horas

**Implementar**:
- Levenshtein distance para descrições
- Aproximação de valores (±10%)
- Aproximação de datas (±3 dias)

**Biblioteca**: `fuse.js` ou `string-similarity`

---

### 3. Sugestões Contextuais
**Tempo Estimado**: 4-5 horas

**Implementar**:
- Detectar padrões de gastos
- Sugerir categorias baseado em descrição
- Auto-completar informações baseado em histórico

**Exemplo**:
```
Usuário: "Gastei 150 no mercado"
IA: [detecta histórico]
IA: "Adicionei R$ 150 em Mercado.
     Categoria: Alimentação (baseado em histórico)
     Forma de Pagamento: Débito (última vez que comprou lá)"
```

---

### 4. Validações e Alertas
**Tempo Estimado**: 3-4 horas

**Implementar**:
- Verificar se gasto ultrapassa limite de categoria
- Alertar gastos duplicados (mesmo valor/descrição/dia)
- Avisar quando meta está próxima
- Alertar parcelas vencidas

**Exemplo**:
```
Usuário: "Gastei 500 em lazer"
IA: "⚠️ Adicionado! Mas atenção: você já gastou R$ 1200
     de R$ 800 planejados em Lazer este mês."
```

---

## 🧪 Fase 4: Inteligência Avançada (FUTURO DISTANTE)

### 1. Previsões e Projeções
- Prever gastos futuros baseado em histórico
- Projetar quando atingirá suas metas
- Alertar sobre possível falta de dinheiro

### 2. Análise de Sentimento
- Detectar se usuário está preocupado/feliz
- Ajustar tom da resposta
- Oferecer suporte emocional quando necessário

### 3. Recomendações Personalizadas
- Sugerir onde cortar gastos
- Recomendar investimentos
- Propor metas baseado em perfil

### 4. Integração com Bancos
- Conectar com Open Banking
- Importar transações automaticamente
- Sincronizar saldo

---

## 📋 Checklist de Implementação

### Fase 2 - Ações Avançadas
- [ ] Edit Transaction (Inteligente)
  - [ ] Busca de transações
  - [ ] Fuzzy matching
  - [ ] Edição de campos
  - [ ] Testes
- [ ] Delete Transaction
  - [ ] Identificação
  - [ ] Confirmação
  - [ ] Remoção
  - [ ] Testes
- [ ] Update Profile
  - [ ] Todos os campos
  - [ ] Validação
  - [ ] Testes
- [ ] Update Patrimony
  - [ ] Todos os ativos
  - [ ] Cálculo de total
  - [ ] Testes
- [ ] Add Debt
  - [ ] Criação completa
  - [ ] Cálculo de parcelas
  - [ ] Testes
- [ ] Mark Payment
  - [ ] Listagem de dívidas
  - [ ] Identificação de parcela
  - [ ] Atualização
  - [ ] Testes

### Fase 3 - Melhorias de UX
- [ ] Sistema de confirmação
- [ ] Busca fuzzy
- [ ] Sugestões contextuais
- [ ] Validações e alertas

### Fase 4 - Inteligência Avançada
- [ ] Previsões
- [ ] Análise de sentimento
- [ ] Recomendações
- [ ] Integração bancária

---

## 🎯 Métricas de Sucesso

### KPIs Técnicos
- **Taxa de Sucesso de Classificação**: > 90%
- **Tempo de Resposta**: < 3 segundos
- **Taxa de Erro**: < 5%
- **Cobertura de Intents**: 100% dos casos de uso

### KPIs de UX
- **Taxa de Confirmação Necessária**: < 20%
- **Número de Mensagens para Completar Ação**: < 2
- **Satisfação do Usuário**: > 4.5/5
- **Uso de Ações vs Queries**: > 40% ações

### KPIs de Negócio
- **Adoção de Features**: > 60% usuários ativos
- **Retenção**: > 70% em 30 dias
- **Engajamento**: > 10 mensagens/usuário/semana

---

## 📚 Recursos Necessários

### Bibliotecas Adicionais (Futuro)
```json
{
  "fuse.js": "^6.6.2",           // Busca fuzzy
  "string-similarity": "^4.0.4",  // Comparação de strings
  "chrono-node": "^2.7.0",        // Parse de datas naturais
  "compromise": "^14.0.0"         // NLP para português
}
```

### APIs Externas (Futuro)
- Open Banking (integração bancária)
- SMS API (alertas por SMS)
- WhatsApp Business API (notificações)

---

## 🚀 Como Contribuir

1. **Escolha uma task** da Fase 2 ou 3
2. **Crie uma branch**: `feature/edit-transaction`
3. **Implemente** seguindo os padrões do código
4. **Teste** todos os casos de uso
5. **Documente** no código e no README
6. **Abra PR** com descrição detalhada

---

**Última Atualização**: 20/12/2025
**Versão Atual**: 1.0 (Fase 1 Completa)
**Próxima Release**: Fase 2 (Janeiro 2026)
