# 📝 Resumo das Alterações para Deploy no Render

## ✅ Mudanças Implementadas

### 1. Configuração de CORS

#### serverOperacional.js
✅ CORS configurado para aceitar múltiplas origens:
- Localhost (desenvolvimento): `http://localhost:3000`, `http://localhost:5000`, `http://localhost:5001`
- Render (produção): 
  - `https://merfin-home.onrender.com` (frontend)
  - `https://merfin-operacional.onrender.com` (backend)
  - `https://merfin-agent.onrender.com` (agent)

#### serverAgent.js
✅ CORS idêntico ao servidor operacional
✅ Configuração de logging para debug de origens bloqueadas

### 2. URLs Dinâmicas

#### serverAgent.js
✅ `OPERATIONAL_SERVER_URL` usa variável de ambiente:
```javascript
const OPERATIONAL_SERVER_URL = process.env.OPERATIONAL_SERVER_URL || 'http://localhost:5000';
```

✅ Logs de configuração adicionados para debug

#### Frontend - config.js
✅ URLs dinâmicas baseadas no hostname:
```javascript
const getAPIUrl = () => {
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    return 'https://merfin-operacional.onrender.com';
};

const getAgentAPIUrl = () => {
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5001';
    }
    return 'https://merfin-agent.onrender.com';
};
```

✅ Exportação global de `API_URL` e `AGENT_API_URL`

#### Frontend - app.js
✅ Todas as URLs hardcoded substituídas por `window.API_URL`:
- Login
- Verificação de assinatura
- Finalizar cadastro
- Buscar planos
- Função `fetchAPI`

#### Frontend - chat.html
✅ Requisição do chat usando `window.AGENT_API_URL`

#### Frontend - planos.js
✅ API_URL usando configuração global: `window.API_URL`

### 3. Arquivos de Configuração Criados

✅ **render.yaml** - Configuração automática dos 3 serviços no Render
- Serviço 1: merfin-operacional (backend principal)
- Serviço 2: merfin-agent (servidor IA)
- Serviço 3: merfin-home (frontend estático)

✅ **DEPLOY_RENDER.md** - Guia completo de deploy passo a passo

✅ **CHECKLIST_DEPLOY.md** - Checklist de verificação pré e pós-deploy

✅ **README.md** - Documentação do projeto atualizada

✅ **.env.example** - Template de variáveis de ambiente

✅ **start-dev.ps1** - Script PowerShell para iniciar servidores localmente

✅ **.gitignore** - Atualizado com padrões adicionais

## 🚀 Como Testar Localmente

### 1. Modo Desenvolvimento (localhost)

```bash
# Opção 1: Script automatizado (Windows)
.\start-dev.ps1

# Opção 2: Manual
# Terminal 1
cd server
node serverOperacional.js

# Terminal 2
cd server
node serverAgent.js

# Abrir no navegador
http://localhost:5000/html/index.html
```

✅ Frontend detecta automaticamente localhost e usa:
- `http://localhost:5000` (API Operacional)
- `http://localhost:5001` (API Agent)

### 2. Simular Produção Localmente

Não é necessário - o código funciona automaticamente em ambos os ambientes.

## 🌐 URLs em Produção no Render

Após deploy, as URLs serão:

- **Frontend (Principal):** https://merfin-home.onrender.com
- **Backend Operacional:** https://merfin-operacional.onrender.com
- **Backend Agent:** https://merfin-agent.onrender.com

✅ Frontend detecta automaticamente que não está em localhost e usa as URLs do Render

## 🔧 Variáveis de Ambiente Necessárias

### Para merfin-operacional:
```
NODE_ENV=production
PORT=5000
MONGO_URI=<sua-mongodb-uri>
JWT_SECRET=<chave-secreta>
STRIPE_SECRET_KEY=<stripe-key>
STRIPE_WEBHOOK_SECRET=<webhook-secret>
STRIPE_PRICE_ID_BASICO=<price-id>
STRIPE_PRICE_ID_PREMIUM=<price-id>
STRIPE_PRICE_ID_EMPRESARIAL=<price-id>
```

### Para merfin-agent:
```
NODE_ENV=production
AGENT_PORT=5001
PORT=5001
OPERATIONAL_SERVER_URL=https://merfin-operacional.onrender.com
JWT_SECRET=<mesma-do-operacional>
OPENAI_API_KEY=<openai-key>
SEARCH_API_KEY=<serper-key> (opcional)
```

## ✨ Benefícios da Implementação

1. ✅ **Código único** funciona em desenvolvimento e produção
2. ✅ **Sem hardcoded URLs** - tudo configurável
3. ✅ **CORS seguro** - apenas origens permitidas
4. ✅ **Fácil manutenção** - URLs centralizadas no config.js
5. ✅ **Deploy automatizado** - render.yaml configura tudo
6. ✅ **Documentação completa** - guias passo a passo

## 🎯 Próximos Passos para Deploy

1. ✅ Código está pronto
2. ⏳ Criar conta no Render
3. ⏳ Conectar repositório GitHub
4. ⏳ Configurar variáveis de ambiente
5. ⏳ Fazer deploy dos 3 serviços
6. ⏳ Configurar webhook do Stripe
7. ⏳ Testar aplicação em produção

Consulte [DEPLOY_RENDER.md](./DEPLOY_RENDER.md) para instruções detalhadas.

## 🐛 Troubleshooting

### Erro de CORS
- Verifique se a origem está na lista `allowedOrigins` nos servidores
- Confirme que os domínios do Render estão corretos nos arrays

### URLs não funcionam
- Verifique o console do navegador para ver qual URL está sendo usada
- Confirme que `config.js` está carregado antes de outros scripts
- Verifique se `window.API_URL` e `window.AGENT_API_URL` estão definidos

### Servidores não se comunicam
- Verifique `OPERATIONAL_SERVER_URL` no servidor agent
- Confirme que os serviços estão rodando (status verde no Render)
- Verifique logs no Dashboard do Render

## 📊 Status Atual

✅ **PRONTO PARA DEPLOY**

Todos os arquivos foram ajustados para funcionar tanto em localhost quanto no Render.

---

**Desenvolvido com ❤️ para Merfin.IA** 🤖💰
