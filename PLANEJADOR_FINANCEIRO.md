# 🎯 PLANEJADOR FINANCEIRO - DOCUMENTAÇÃO TÉCNICA

## 📋 VISÃO GERAL

O Planejador Financeiro é um sistema inteligente e interativo que ajuda usuários a planejar objetivos financeiros de forma estruturada, com suporte de IA, pesquisa online e análise personalizada.

---

## 🏗️ ARQUITETURA

### **Frontend**
- **planejador.css** - Estilos visuais modernos
- **planejador.js** - Lógica de interação e gerenciamento de estado
- **chat.html** - Integração com interface de chat

### **Backend**
- **serverAgent.js** - Rotas de API e processamento com IA
- Integração com sistema existente de busca de dados financeiros
- Suporte a pesquisa online (Serper API)

---

## 🔄 FLUXO DE FUNCIONAMENTO

### **1. Entrada no Modo Planejador**
```
Usuário vê card → Clica no card → Modo planejador ativado
```

**O que acontece:**
- Card "Planejador Financeiro" aparece no chat vazio
- Placeholder muda de "Pergunte sobre suas finanças" para "Me diga o que você quer planejar"
- Barra de status aparece no topo
- Flag `planejador.ativo = true`

### **2. Coleta do Objetivo**
```
Usuário digita objetivo → Enviado para IA → Perguntas geradas
```

**Exemplo de input:**
```
"Viagem para Barcelona de 5 dias"
"Comprar um carro usado até R$ 40.000"
"Fazer um empréstimo para reformar a casa"
```

**Endpoint:** `POST /api/planner/generate-questions`

**Request:**
```json
{
  "objetivo": "Viagem para Barcelona de 5 dias",
  "contexto": {
    "tipo": "",
    "objetivo": "Viagem para Barcelona de 5 dias",
    "perguntas": [],
    "respostas": [],
    "etapa": "inicial"
  }
}
```

**Response:**
```json
{
  "tipo": "viagem",
  "descricao": "Planejamento de viagem internacional",
  "perguntas": [
    {
      "question": "Para quando você planeja viajar?",
      "type": "date",
      "required": true
    },
    {
      "question": "Quanto você já tem guardado?",
      "type": "number",
      "placeholder": "R$ 0,00",
      "required": true
    },
    {
      "question": "Quantas pessoas viajarão?",
      "type": "choice",
      "options": ["Só eu", "2 pessoas", "3-4 pessoas", "5+"],
      "required": true
    }
  ]
}
```

### **3. Renderização de Perguntas**
```
JSON recebido → Frontend renderiza → Usuário responde
```

**Tipos de pergunta suportados:**

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `text` | Input de texto curto | Nome, descrição |
| `number` | Input numérico | Valores em R$ |
| `date` | Seletor de data | Data da viagem |
| `textarea` | Texto longo | Detalhes, observações |
| `select` | Dropdown | Lista de opções |
| `choice` | Botões de escolha visual | Múltipla escolha estilizada |

### **4. Envio de Respostas**
```
Formulário completo → Enviado para IA → Planejamento gerado
```

**Endpoint:** `POST /api/planner/create-plan`

**Request:**
```json
{
  "objetivo": "Viagem para Barcelona de 5 dias",
  "perguntas": [...],
  "respostas": [
    {
      "pergunta": "Para quando você planeja viajar?",
      "resposta": "2026-07-15"
    },
    {
      "pergunta": "Quanto você já tem guardado?",
      "resposta": "5000"
    }
  ],
  "contexto": {...}
}
```

**Processamento:**
1. ✅ IA analisa objetivo + respostas
2. 🌐 Pesquisa online (se necessário) - preços reais de passagens, hospedagem, etc
3. 📊 Gera planejamento detalhado
4. 💰 Consulta dados financeiros do usuário
5. 🔍 Cria análise personalizada de viabilidade

**Response:**
```json
{
  "success": true,
  "planejamento": "## 🎯 Resumo Executivo\n...",
  "contexto": {...}
}
```

### **5. Exibição do Planejamento**
```
Markdown recebido → Renderizado com marked.js → Exibido no chat
```

**Estrutura do planejamento:**
- 🎯 Resumo Executivo
- 💰 Custos Previstos (com valores reais pesquisados)
- 📅 Cronograma
- 💡 Recomendações Práticas
- ⚠️ Pontos de Atenção
- 📊 Próximos Passos
- 🔍 Análise Personalizada (baseada nos dados do usuário)

### **6. Perguntas de Follow-up**
```
Usuário faz pergunta adicional → Contexto preservado → Resposta contextualizada
```

**Como funciona:**
- Contexto do planejamento é mantido em `planejador.contexto`
- Perguntas subsequentes incluem `planejadorContexto` no request
- IA recebe todo o histórico do planejamento
- Resposta é contextualizada e relevante

---

## 🎨 DESIGN E UX

### **Princípios de Design**
- ✅ Visual harmonioso com identidade Merfin
- ✅ Animações suaves e progressivas
- ✅ Feedback visual claro
- ✅ Responsivo mobile-first
- ✅ Acessibilidade

### **Componentes Visuais**

#### **Card de Entrada**
```css
.planner-card {
  gradient: #1a1f2e → #2d3748
  hover: translateY(-4px)
  border: rgba(168, 218, 220, 0.2)
}
```

#### **Barra de Status**
- Posição: Sticky no topo
- Informações: Modo ativo + Botão de sair
- Backdrop blur para elegância

#### **Container de Perguntas**
- Animação: slideUpFade
- Perguntas aparecem progressivamente
- Badge de progresso dinâmico

#### **Resultado do Planejamento**
- Layout: Card destacado
- Ícone: 56px com shadow
- Formatação: Markdown completo

---

## 🔒 SEGURANÇA E VALIDAÇÃO

### **Autenticação**
- Token JWT obrigatório em todas as rotas
- Middleware `verifyUserToken` aplicado

### **Validação de Dados**
- Campos `required` validados no frontend
- Validação adicional no backend
- Sanitização de inputs

### **Privacidade**
- Planejamento NÃO acessa dados do usuário até etapa final
- Dados financeiros consultados apenas quando necessário
- Contexto isolado por sessão

---

## 🧪 TESTANDO O PLANEJADOR

### **Teste 1: Viagem Internacional**
```
1. Clicar no card "Planejador Financeiro"
2. Digitar: "Viagem para Paris por 7 dias"
3. Responder perguntas geradas
4. Verificar se planejamento inclui:
   - Passagens aéreas (pesquisa real)
   - Hospedagem (valores de mercado)
   - Alimentação diária
   - Passeios e atrações
   - Análise de viabilidade com dados reais
```

### **Teste 2: Compra de Veículo**
```
1. Ativar planejador
2. Digitar: "Comprar carro usado até R$ 50.000"
3. Responder sobre entrada, financiamento, prazo
4. Verificar cálculos de:
   - Valor total com juros
   - Parcelas mensais
   - Documentação e taxas
   - Impacto no orçamento mensal
```

### **Teste 3: Empréstimo Bancário**
```
1. Ativar planejador
2. Digitar: "Fazer empréstimo de R$ 20.000"
3. Responder sobre finalidade, prazo, renda
4. Verificar análise de:
   - Taxa de juros de mercado (pesquisada)
   - CET (Custo Efetivo Total)
   - Impacto na capacidade de pagamento
   - Alternativas viáveis
```

### **Teste 4: Follow-up**
```
1. Após planejamento criado
2. Perguntar: "E se eu economizar R$ 500 a mais por mês?"
3. Verificar se resposta:
   - Refere-se ao planejamento anterior
   - Recalcula prazos
   - Mantém contexto
```

---

## 🐛 TROUBLESHOOTING

### **Card não aparece**
- ✅ Verificar se `planejador.js` foi carregado
- ✅ Verificar console: `✅ Planejador Financeiro carregado`
- ✅ Verificar se há mensagens no chat (card some quando há mensagens)

### **Perguntas não aparecem**
- ✅ Verificar resposta da API no Network
- ✅ Verificar console: `📋 Perguntas geradas`
- ✅ Verificar se JSON está bem formatado

### **Planejamento não carrega**
- ✅ Verificar chave OpenAI no backend
- ✅ Verificar logs do servidor: `✅ Planejamento criado`
- ✅ Verificar se pesquisa online funcionou (opcional)

### **Contexto não preservado**
- ✅ Verificar `planejador.contexto` no console
- ✅ Verificar se `planejadorContexto` está no request
- ✅ Verificar logs: `🎯 Contexto Planejador: Ativo`

---

## 📊 MÉTRICAS E LOGS

### **Frontend (Console do Navegador)**
```javascript
🎯 Inicializando Planejador Financeiro...
✅ Planejador Financeiro carregado
🎯 Ativando modo planejador...
🎯 Processando objetivo: [mensagem]
📋 Perguntas geradas: [data]
📤 Enviando respostas...
✅ Planejamento criado: [data]
```

### **Backend (Console do Servidor)**
```
╔═════════════════════════════════════════════════════════╗
║          PLANEJADOR: GERANDO PERGUNTAS                  ║
╚═════════════════════════════════════════════════════════╝
🎯 Objetivo: [objetivo]
✅ Perguntas geradas: 7
📋 Tipo identificado: viagem

╔═════════════════════════════════════════════════════════╗
║          PLANEJADOR: CRIANDO PLANEJAMENTO               ║
╚═════════════════════════════════════════════════════════╝
📝 Contexto preparado para IA
🌐 Realizando pesquisa na internet...
✅ Dados externos obtidos
⏳ Gerando planejamento com gpt-4o...
✅ Planejamento criado
📊 Consultando dados financeiros do usuário...
⏳ Gerando análise personalizada...
✅ Análise personalizada gerada
```

---

## 🚀 MELHORIAS FUTURAS

### **Curto Prazo**
- [ ] Salvar planejamentos no banco de dados
- [ ] Histórico de planejamentos criados
- [ ] Exportar planejamento em PDF
- [ ] Compartilhar planejamento

### **Médio Prazo**
- [ ] Simulador interativo de cenários
- [ ] Integração com Open Banking
- [ ] Lembretes e notificações
- [ ] Gamificação do progresso

### **Longo Prazo**
- [ ] IA aprende com histórico do usuário
- [ ] Planejamentos colaborativos
- [ ] Integração com marketplace de serviços
- [ ] Assistente de voz

---

## 📚 REFERÊNCIAS

- **Sistema de busca inteligente:** [serverAgent.js](serverAgent.js#L273-L443)
- **Pesquisa online:** [serverAgent.js](serverAgent.js#L113-L161)
- **Detecção de intent:** [intents.js](intents.js)
- **Design system:** [style.css](style.css)

---

## 👨‍💻 DESENVOLVIDO POR

**Merfin.IA** - Transformando ansiedade financeira em clareza

**Data:** Janeiro 2026

**Versão:** 1.0.0

---

✨ **Pronto para planejar o futuro financeiro com inteligência!** 🎯
