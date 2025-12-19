# 🤖 Chat Merfin - Guia de Uso

## 📋 O que foi implementado

### Backend (serverAgent.js)
- ✅ Servidor Express na porta 5001
- ✅ Integração com OpenAI GPT-3.5-turbo
- ✅ Sistema de histórico de conversas por sessão
- ✅ Tratamento de erros e rate limiting
- ✅ Prompt personalizado para assistente financeiro

### Frontend (chat.html)
- ✅ Integração completa com a API do ChatGPT
- ✅ Efeito visual de "pensando" com animação de dots
- ✅ Efeito de digitação progressiva (3 palavras por vez)
- ✅ Interface responsiva e moderna
- ✅ Gerenciamento de sessões
- ✅ Mensagem de boas-vindas automática

### CSS (chat.css)
- ✅ Animações suaves para mensagens
- ✅ Efeito de "pensando" com dots animados
- ✅ Efeito de digitação com cursor piscante
- ✅ Estilo consistente com o design do projeto

## 🚀 Como usar

### 1. Instalar dependências
```bash
cd server
npm install
```

### 2. Iniciar os servidores

#### Opção A: Ambos os servidores juntos (Recomendado)
```bash
# Windows (PowerShell)
.\start-servers.ps1

# Ou via npm
npm run start:windows

# Modo desenvolvimento (com auto-reload)
.\start-servers.ps1 -DevMode
```

#### Opção B: Servidores separados
```bash
# Terminal 1: Servidor principal
npm run start

# Terminal 2: Servidor do chat
npm run start:agent
```

#### Opção C: Modo desenvolvimento separado
```bash
# Terminal 1: Servidor principal (auto-reload)
npm run dev

# Terminal 2: Servidor do chat (auto-reload)
npm run dev:agent
```

### 3. Abrir o chat
Abra o arquivo `client/html/chat.html` no navegador ou acesse:
```
http://localhost:5000/client/html/chat.html
```

## 🎨 Recursos implementados

### Efeito de "Pensando"
- Três dots animados aparecem enquanto a IA processa
- Animação suave e profissional
- Removido automaticamente quando a resposta chega

### Efeito de Digitação
- Mensagens aparecem progressivamente (3 palavras por vez)
- Intervalo de 150ms entre cada grupo de palavras
- Cursor piscante durante a digitação
- Scroll automático para acompanhar

### Gerenciamento de Estado
- Input desabilitado durante processamento
- Botão de envio mostra spinner quando carregando
- Histórico de conversas mantido por sessão
- Auto-resize do textarea

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```
PORT=5000                    # Servidor principal
AGENT_PORT=5001             # Servidor do chat
OPENAI_API_KEY=sua_chave    # Chave da API OpenAI
```

### Personalização do Prompt
Edite a constante `SYSTEM_PROMPT` em [serverAgent.js](server/serverAgent.js#L15) para personalizar o comportamento do assistente.

## 📝 Endpoints da API

### POST /api/chat
Envia uma mensagem para o chat
```json
{
  "message": "Olá, preciso de ajuda com investimentos",
  "sessionId": "session_123" // opcional
}
```

Resposta:
```json
{
  "success": true,
  "response": "Olá! Ficarei feliz em ajudar...",
  "sessionId": "session_123"
}
```

### DELETE /api/chat/history/:sessionId
Limpa o histórico de uma sessão

### GET /health
Verifica se o servidor está rodando

## 🎯 Comportamento do Chat

1. **Mensagem de Boas-vindas**: Aparece automaticamente após 500ms
2. **Envio**: Enter envia (ou Ctrl/Cmd + Enter)
3. **Processamento**: Mostra indicador de "pensando"
4. **Resposta**: Aparece com efeito de digitação
5. **Histórico**: Mantido durante toda a sessão

## 🐛 Solução de Problemas

### Erro: "Cannot connect to server"
- Verifique se o serverAgent.js está rodando na porta 5001
- Execute: `npm run start:agent`

### Erro: "Invalid API Key"
- Verifique se a OPENAI_API_KEY está correta no .env
- Certifique-se de que a chave está ativa

### Mensagens não aparecem
- Abra o Console do navegador (F12)
- Verifique se há erros de CORS
- Confirme que o CORS está habilitado no servidor

## 📊 Melhorias Futuras (Opcionais)

- [ ] Suporte a Markdown nas mensagens
- [ ] Upload de imagens/documentos financeiros
- [ ] Histórico persistente no banco de dados
- [ ] Múltiplas conversas simultâneas
- [ ] Exportar conversas em PDF
- [ ] Modo de voz (speech-to-text)
- [ ] Sugestões de perguntas rápidas
- [ ] Análise de sentimento

## 🎨 Customização de Estilos

### Cores dos Dots de "Pensando"
Edite em [chat.css](client/css/chat.css#L457):
```css
.thinking-dots span {
    background: var(--color-text-secondary);
}
```

### Velocidade de Digitação
Edite em [chat.html](client/html/chat.html#L94):
```javascript
}, 150); // Altere este valor (em milissegundos)
```

### Palavras por Grupo
Edite em [chat.html](client/html/chat.html#L88):
```javascript
const wordsToShow = words.slice(currentIndex, currentIndex + 3); // Altere o 3
```

## 💡 Dicas

- O histórico é mantido em memória. Reiniciar o servidor limpa tudo
- Cada sessão é identificada por um ID único salvo no localStorage
- A API tem limite de tokens (500 por resposta)
- O modelo usado é gpt-3.5-turbo (mais rápido e econômico)

---

**Desenvolvido com ❤️ para Merfin.IA**
