# ✅ Checklist Pré-Deploy - Merfin.IA

Use este checklist antes de fazer deploy no Render para garantir que tudo está configurado corretamente.

## 📋 Checklist de Código

### Backend - Servidor Operacional
- [x] CORS configurado com origens do Render
- [x] Middleware de autenticação JWT implementado
- [x] Middleware de verificação de assinatura implementado
- [x] Webhook do Stripe com body raw configurado
- [x] Variáveis de ambiente usando process.env
- [x] Porta dinâmica (process.env.PORT)
- [x] Conexão MongoDB sem opções deprecadas
- [x] Tratamento de erros adequado

### Backend - Servidor Agent
- [x] CORS configurado com origens do Render
- [x] URL do servidor operacional usando variável de ambiente
- [x] Porta dinâmica (process.env.AGENT_PORT || process.env.PORT)
- [x] Health check endpoint (/health)
- [x] Integração OpenAI configurada
- [x] Tratamento de erros de API externa

### Frontend
- [x] URLs dinâmicas (localhost + Render) no config.js
- [x] Chat.html usando window.AGENT_API_URL
- [x] Todos os fetchAPI usando API_URL configurado
- [x] Sem URLs hardcoded (localhost:5000/5001)
- [x] Tratamento de erros de requisição

## 🔐 Checklist de Segurança

- [ ] JWT_SECRET é uma string forte e aleatória
- [ ] Senhas são hasheadas com bcrypt
- [ ] Tokens expiram (7 dias configurado)
- [ ] Validação de entrada em todas as rotas
- [ ] Rate limiting considerado (opcional para futuro)
- [ ] HTTPS será usado em produção (Render fornece automaticamente)
- [ ] Variáveis sensíveis NÃO estão no código (apenas em .env)

## 🗄️ Checklist de Banco de Dados

### MongoDB Atlas
- [ ] Cluster criado no MongoDB Atlas
- [ ] Usuário do banco criado com senha forte
- [ ] Whitelist de IPs configurada:
  - [ ] **0.0.0.0/0** permitido (necessário para Render)
- [ ] Connection string testada localmente
- [ ] Índices criados automaticamente pelos schemas

## 💳 Checklist de Stripe

### Configuração Básica
- [ ] Conta Stripe criada
- [ ] Produtos criados no Dashboard:
  - [ ] Plano Básico
  - [ ] Plano Premium
  - [ ] Plano Empresarial
- [ ] Preços (Prices) criados para cada produto
- [ ] Price IDs copiados

### Chaves API
- [ ] STRIPE_SECRET_KEY copiada (usar Test Key para testes)
- [ ] Webhook criado com URL: `https://merfin-operacional.onrender.com/api/pagamentos/webhook`
- [ ] Eventos selecionados no webhook:
  - [ ] checkout.session.completed
  - [ ] customer.subscription.updated
  - [ ] customer.subscription.deleted
  - [ ] invoice.payment_succeeded
  - [ ] invoice.payment_failed
- [ ] STRIPE_WEBHOOK_SECRET copiado

### Teste Local (Opcional)
- [ ] Stripe CLI instalado
- [ ] `stripe listen --forward-to localhost:5000/api/pagamentos/webhook` testado
- [ ] Checkout session de teste criada e completada

## 🤖 Checklist de OpenAI

- [ ] Conta OpenAI criada
- [ ] Billing configurado (créditos disponíveis)
- [ ] API Key criada
- [ ] Modelo gpt-4o-mini disponível na conta
- [ ] Testado localmente com chave

## 🌐 Checklist de Deploy no Render

### Preparação
- [ ] Código commitado no GitHub
- [ ] Repositório público ou privado conectado ao Render
- [ ] Arquivo render.yaml na raiz do projeto
- [ ] README.md atualizado
- [ ] .gitignore configurado (node_modules, .env)

### Variáveis de Ambiente Preparadas

#### Para merfin-operacional:
```
NODE_ENV=production
PORT=5000
MONGO_URI=
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_BASICO=
STRIPE_PRICE_ID_PREMIUM=
STRIPE_PRICE_ID_EMPRESARIAL=
```

#### Para merfin-agent:
```
NODE_ENV=production
AGENT_PORT=5001
PORT=5001
OPERATIONAL_SERVER_URL=https://merfin-operacional.onrender.com
JWT_SECRET=
OPENAI_API_KEY=
SEARCH_API_KEY= (opcional)
```

### Deploy
- [ ] Blueprint criado no Render ou serviços criados manualmente
- [ ] Variáveis de ambiente configuradas nos 3 serviços
- [ ] Build iniciado automaticamente
- [ ] Build completado com sucesso
- [ ] Serviços rodando (status verde)

## ✅ Checklist Pós-Deploy

### Testes de Funcionamento
- [ ] **Servidor Operacional:**
  - [ ] `GET https://merfin-operacional.onrender.com/api/status` retorna 200
  - [ ] Response: `{"status":"online","database":"conectado"}`

- [ ] **Servidor Agent:**
  - [ ] `GET https://merfin-agent.onrender.com/health` retorna 200
  - [ ] Response: `{"status":"ok","service":"Merfin Agent Inteligente"}`

- [ ] **Frontend:**
  - [ ] https://merfin-home.onrender.com abre corretamente
  - [ ] Console do navegador sem erros de CORS
  - [ ] Página de login carrega
  - [ ] CSS e JS carregam corretamente

### Teste de Fluxo Completo
- [ ] Cadastro de novo usuário funciona
- [ ] Login funciona e gera token
- [ ] Redirecionamento para página de planos após login
- [ ] Checkout do Stripe abre corretamente
- [ ] Após pagamento bem-sucedido, webhook é recebido
- [ ] Assinatura é ativada no banco de dados
- [ ] Acesso ao dashboard liberado
- [ ] Chat com IA funciona
- [ ] Lançamento de transações funciona
- [ ] Dashboard exibe dados corretamente

### Webhook do Stripe
- [ ] Enviar evento de teste pelo Dashboard do Stripe
- [ ] Verificar logs no Render (servidor operacional)
- [ ] Confirmar que evento foi recebido e processado
- [ ] Verificar no MongoDB que assinatura foi atualizada

## 🔍 Monitoramento

### Configurar (Recomendado)
- [ ] UptimeRobot ou Better Uptime para ping constante
- [ ] Configurar alertas por email/SMS
- [ ] Ping a cada 10-14 minutos (evitar cold start)

### Logs
- [ ] Acessar logs no Dashboard do Render
- [ ] Verificar se há erros recorrentes
- [ ] Configurar integração com Papertrail ou LogTail (opcional)

## 📊 Performance

### Plano Free do Render - Atenção
- [ ] Ciente que serviços desligam após 15 min de inatividade
- [ ] Cold start de ~30 segundos na primeira requisição
- [ ] 750 horas/mês compartilhadas entre 3 serviços
- [ ] Considerar upgrade para plano pago se uso crescer

## 🎉 Deploy Completo!

Quando todos os itens acima estiverem marcados:

1. ✅ Aplicação está no ar
2. ✅ Todos os sistemas funcionando
3. ✅ Pronto para usuários reais!

## 🆘 Em Caso de Problemas

Consulte:
- [DEPLOY_RENDER.md](./DEPLOY_RENDER.md) - Guia completo
- Logs do Render Dashboard
- [Render Community](https://community.render.com)

---

**Boa sorte com o deploy! 🚀**
