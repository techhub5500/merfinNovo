# Merfin.IA - Plataforma de Gestão Financeira Pessoal

Sistema completo de gestão financeira pessoal com inteligência artificial.

## 🚀 Deploy Rápido no Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

Este projeto está configurado para deploy automático no Render usando o arquivo `render.yaml`.

### Serviços

- **Frontend:** https://merfin-home.onrender.com
- **API Operacional:** https://merfin-operacional.onrender.com
- **API Agent (IA):** https://merfin-agent.onrender.com

## 📋 Pré-requisitos para Deploy

1. Conta no [Render.com](https://render.com)
2. Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
3. Chave API da [OpenAI](https://platform.openai.com)
4. Conta no [Stripe](https://stripe.com) (para pagamentos)

## 🔧 Configuração Local

### Instalação

```bash
# Clone o repositório
git clone <seu-repositorio>
cd Merfin.IA

# Instale dependências do servidor
cd server
npm install

# Volte para raiz
cd ..
```

### Variáveis de Ambiente

Crie um arquivo `.env` dentro da pasta `server/`:

```env
# MongoDB
MONGO_URI=sua_connection_string_mongodb

# JWT
JWT_SECRET=sua_chave_secreta_jwt

# OpenAI
OPENAI_API_KEY=sua_chave_openai

# Stripe
STRIPE_SECRET_KEY=sua_chave_stripe
STRIPE_WEBHOOK_SECRET=seu_webhook_secret
STRIPE_PRICE_ID_BASICO=price_xxx
STRIPE_PRICE_ID_PREMIUM=price_xxx
STRIPE_PRICE_ID_EMPRESARIAL=price_xxx

# Servidores
PORT=5000
AGENT_PORT=5001
OPERATIONAL_SERVER_URL=http://localhost:5000

# Opcional - Pesquisa Web
SEARCH_API_KEY=sua_chave_serper
```

### Executar Localmente

```bash
# Terminal 1 - Servidor Operacional
cd server
node serverOperacional.js

# Terminal 2 - Servidor Agent
cd server
node serverAgent.js

# Abrir frontend
# Abra client/html/index.html no navegador
# Ou use um servidor local:
cd client
python -m http.server 3000
# Acesse: http://localhost:3000/html/index.html
```

## 🌐 Deploy no Render

### Método 1: Deploy Automático (Recomendado)

1. Faça fork deste repositório no GitHub
2. Conecte sua conta do Render ao GitHub
3. No Render Dashboard, clique em **"New +"** → **"Blueprint"**
4. Selecione o repositório
5. O Render detectará o `render.yaml` automaticamente
6. Configure as variáveis de ambiente secretas
7. Clique em **"Apply"**

### Método 2: Deploy Manual

Consulte o arquivo [DEPLOY_RENDER.md](./DEPLOY_RENDER.md) para instruções detalhadas.

## 🏗️ Estrutura do Projeto

```
Merfin.IA/
├── client/                 # Frontend (HTML, CSS, JS)
│   ├── css/
│   ├── html/
│   └── js/
│       ├── config.js      # Configuração de URLs (localhost/produção)
│       ├── app.js         # Lógica do chat
│       └── ...
├── server/                # Backend (Node.js)
│   ├── serverOperacional.js  # Servidor principal (auth, CRUD, webhooks)
│   ├── serverAgent.js        # Servidor IA (processamento NLU)
│   ├── stripePayments.js     # Sistema de pagamentos
│   ├── intents.js            # Detecção de intenções
│   ├── models.js             # Schemas MongoDB
│   └── package.json
├── render.yaml            # Configuração de deploy
├── DEPLOY_RENDER.md       # Guia completo de deploy
└── README.md              # Este arquivo
```

## 🔐 Segurança

- ✅ Autenticação JWT
- ✅ Senhas com bcrypt
- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ Middleware de verificação de assinatura
- ✅ Webhooks Stripe assinados

## 🤖 Funcionalidades

### Para Usuários
- 💰 Gestão de receitas e despesas
- 📊 Dashboard financeiro interativo
- 🎯 Metas e objetivos financeiros
- 💳 Controle de dívidas
- 💬 Chat com IA financeira (Merfin)
- 📝 Sistema de notas
- 📈 Análises e insights

### Inteligência Artificial
- 🧠 Processamento de linguagem natural
- 📈 Análise preditiva de gastos
- 💡 Sugestões personalizadas
- 🔍 Detecção de padrões
- 📚 Educação financeira contextual

### Sistema de Pagamentos
- 💳 Integração completa com Stripe
- 🔄 Assinaturas recorrentes
- 📧 Webhooks para eventos de pagamento
- ✅ Controle de acesso por plano

## 📱 Compatibilidade

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Chrome Android)
- ✅ Tablet

## 🛠️ Tecnologias

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Markdown renderizado (marked.js)
- Highlight.js para code blocks

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT para autenticação
- Bcrypt para senhas

### Integrações
- OpenAI GPT-4o-mini (IA conversacional)
- Stripe (pagamentos)
- Serper API (pesquisa web - opcional)

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

## 👨‍💻 Desenvolvedor

Desenvolvido por **Edmar** - Merfin.IA

## 🆘 Suporte

Para suporte, entre em contato:
- WhatsApp: [+55 11 91538-1876](https://wa.me/5511915381876)
- Email: suporte@merfin.com.br (configurar)

---

**Merfin.IA** - Transformando ansiedade financeira em clareza 🤖💰
