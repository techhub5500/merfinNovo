# 🚀 Sistema de Timeline de Progresso Visual

## 📋 Visão Geral

Substituímos o antigo indicador de "pensando" (três bolinhas) por um **sistema de timeline de progresso visual** que mostra eventos simulados do raciocínio da IA em tempo real.

---

## 🎯 Objetivos

1. **Transparência**: Mostrar ao usuário o que a IA está fazendo
2. **Engajamento**: Manter o usuário informado durante processamento
3. **Modernidade**: Design minimalista e elegante
4. **Contextualização**: Eventos específicos para cada tipo de tarefa

---

## 🏗️ Arquitetura

### **Backend (serverAgent.js)**

#### 1. Gerador de Eventos Contextuais
```javascript
function generateProgressEvents(intentType, sectionsUsed)
```

**Responsabilidade**: Gerar lista de eventos baseado no tipo de intent detectado.

**Tipos de Eventos**:
- `main`: Nó principal da timeline (círculo maior)
- `branch`: Ramificação (círculo menor, indentado)

**Eventos por Intent**:
- **Lançamento único**: Validação de dados
- **Consulta financeira**: Análise completa com filtragem e comparação
- **Edição/Exclusão**: Localização e validação
- **Conversação**: Processamento de contexto

**Nota**: Esta função está disponível no backend mas não é usada via SSE. Os eventos são simulados diretamente no frontend para maior confiabilidade e melhor performance.

---

### **Frontend (chat.html + chat.css)**

#### 1. Estrutura HTML
```html
<div class="progress-timeline">
    <div class="timeline-container" id="timeline-events">
        <!-- Eventos inseridos dinamicamente -->
    </div>
</div>
```

#### 2. JavaScript

**Função de Simulação de Eventos**:
```javascript
async function simulateProgressEvents(messageText)
```

**Responsabilidades**:
- Analisar mensagem do usuário para determinar contexto
- Selecionar eventos apropriados (lançamento, edição, consulta, etc.)
- Animar eventos com delays realistas
- Não depende de conexão com backend (mais confiável)

**Função de Renderização**:
```javascript
function addTimelineEvent(eventData)
```

**Responsabilidades**:
- Criar elementos HTML para cada evento
- Animar entrada dos eventos
- Atualizar status (`running` → `done`)
- Diferenciar visuais entre `main` e `branch`

**Fluxo de Envio (Simplificado)**:
1. `sendMessage()`: Cria timeline vazia
2. Chama `simulateProgressEvents()` que analisa a mensagem
3. Renderiza eventos localmente com animações
4. Ao finalizar eventos, faz requisição para API
5. Remove timeline e mostra resposta com efeito de digitação

---

## 🎨 Design Visual

### **Elementos**

#### Nó Principal (Main)
```
●  Coletando informações
│
```
- Cor: `#f4f4f5` (gelo)
- Tamanho: 10px
- Font-weight: 500

#### Nó Ramificação (Branch)
```
├─◦ Filtrando dados relevantes
│
```
- Cor: `rgba(244, 244, 245, 0.5)` (gelo transparente)
- Tamanho: 6px
- Indentação: 8px à esquerda
- Font-weight: 400

### **Animações**

#### 1. Entrada de Evento
```css
opacity: 0 → 1
transform: translateY(-10px) → translateY(0)
duration: 0.4s
```

#### 2. Status Running (Pulsação)
```css
@keyframes pulse {
    0%, 100%: opacity 1, scale 1
    50%: opacity 0.6, scale 1.05
}
```

#### 3. Conclusão (Done)
```css
@keyframes iconPulse {
    0%, 100%: scale 1
    50%: scale 1.2
}
```

### **Cores**

- **Linha vertical**: `rgba(244, 244, 245, 0.3)` → `rgba(244, 244, 245, 0.1)` (gradiente)
- **Ícone running**: `var(--color-text-tertiary)`
- **Ícone done**: `#a8dadc` (azul claro)
- **Label principal**: `var(--color-text-primary)`
- **Label branch**: `rgba(244, 244, 245, 0.6)`

---

## ⚡ Desempenho

### **Delays Entre Eventos**
- **Main node**: 400ms
- **Branch node**: 250ms
- **Após completar**: 100ms

### **Otimizações**
- Timeline criada uma vez, eventos adicionados dinamicamente
- Animações via CSS (GPU-accelerated)
- Eventos simulados localmente (sem overhead de rede)
- Detecção de contexto via palavras-chave na mensagem
- Performance previsível e consistente

---

## 🔄 Fluxo Completo

```
Usuário envia mensagem
    ↓
Frontend: Cria timeline vazia
    ↓
Frontend: Analisa mensagem (adicionar/editar/consultar)
    ↓
Frontend: Seleciona eventos contextuais
    ↓
Frontend: Renderiza eventos localmente (running → done)
    ↓
Frontend: Faz requisição POST /api/chat
    ↓
Backend: Processa e retorna resposta
    ↓
Frontend: Remove timeline e mostra resposta
```

---

## 📦 Arquivos Modificados

### Backend
- `server/serverAgent.js`
  - ✅ Adicionado `generateProgressEvents()`
  - ✅ Criado endpoint `GET /api/chat-stream`

### Frontend
- `client/html/chat.html`
  - ✅ Substituído `showThinkingIndicator()`
  - ✅ Adicionado `addTimelineEvent()`
  - ✅ Modificado `sendMessage()` para usar SSE
  - ✅ Criado `sendMessageDirect()` (fallback)

- `client/css/chat.css`
  - ✅ Removidos estilos de `.thinking-dots`
  - ✅ Adicionados estilos completos de `.progress-timeline`
  - ✅ Animações `pulse`, `iconPulse`

---

## 🎯 Exemplos de Eventos por Intent

### Consulta Financeira
```
● Entendendo o pedido
├─◦ Identificando objetivo
│
● Coletando informações
├─◦ Filtrando dados relevantes
├─◦ Ignorando ruído
│
● Analisando possibilidades
├─◦ Comparando alternativas
│
● Tomando decisões
├─◦ Priorizando caminhos
│
● Estruturando solução
├─◦ Organizando etapas
│
● Preparando resposta
│
● Finalizando
```

### Lançamento Único
```
● Entendendo o pedido
├─◦ Identificando objetivo
│
● Coletando informações
├─◦ Validando dados
│
● Estruturando solução
├─◦ Organizando etapas
│
● Preparando resposta
│
● Finalizando
```

---

## 🚨 Fallback

Se SSE falhar:
1. Detecta erro no `eventSource`
2. Chama `sendMessageDirect()`
3. Faz requisição normal sem eventos de progresso
4. Mantém experiência funcional (sem timeline)

---

## 🎉 Resultado Final

**Antes**: 🟣🟣🟣 (três bolinhas simples)

**Depois**: Timeline vertical animada com ramificações contextuais mostrando cada etapa do raciocínio da IA em tempo real! 🚀

---

## 📚 Referências Técnicas

- **SSE (Server-Sent Events)**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- **EventSource API**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- **CSS Animations**: [web.dev](https://web.dev/animations/)

---

**Desenvolvido para Merfin.IA - Janeiro 2026** 🤖✨
