# 📋 Guia de Deploy no Render - Merfin.IA

Este guia detalha como fazer deploy da aplicação Merfin.IA no Render com 3 serviços separados.

## 🏗️ Arquitetura de Deploy

A aplicação é dividida em 3 serviços independentes:

1. **merfin-operacional** (Backend Principal) - Porta 5000
   - Autenticação, CRUD de dados, webhooks Stripe
   - URL: `https://merfin-operacional.onrender.com`

2. **merfin-agent** (Servidor IA) - Porta 5001
   - Processamento de linguagem natural, intents, OpenAI
   - URL: `https://merfin-agent.onrender.com`

3. **merfin-home** (Frontend) - Site Estático
   - Interface web (HTML, CSS, JS)
   - URL: `https://merfin-home.onrender.com` (principal)

## 🚀 Passo a Passo para Deploy

### Preparação Local (já feito)

✅ CORS configurado para aceitar origens do Render
✅ URLs dinâmicas no frontend (localhost + Render)
✅ Variáveis de ambiente configuradas
✅ Arquivo `render.yaml` criado

### 1. Criar Conta no Render

1. Acesse [render.com](https://render.com)
2. Crie uma conta (pode usar GitHub)
3. Conecte seu repositório GitHub (recomendado) ou faça upload manual

### 2. Deploy via Dashboard do Render

#### Opção A: Deploy Automático com render.yaml (Recomendado)

1. No dashboard do Render, clique em **"New +"** → **"Blueprint"**
2. Conecte seu repositório GitHub
3. O Render detectará automaticamente o `render.yaml`
4. Clique em **"Apply"**
5. Configure as variáveis de ambiente secretas (ver seção abaixo)

#### Opção B: Deploy Manual (3 serviços separados)

Se preferir criar cada serviço manualmente:

**Serviço 1: merfin-operacional**
1. New + → Web Service
2. Build Command: `cd server && npm install`
3. Start Command: `cd server && node serverOperacional.js`
4. Environment Variables: (ver lista abaixo)

**Serviço 2: merfin-agent**
1. New + → Web Service
2. Build Command: `cd server && npm install`
3. Start Command: `cd server && node serverAgent.js`
4. Environment Variables: (ver lista abaixo)

**Serviço 3: merfin-home**
1. New + → Static Site
2. Publish Directory: `./client`
3. Sem variáveis necessárias

### 3. Configurar Variáveis de Ambiente

#### Para merfin-operacional:

```
NODE_ENV=production
PORT=5000
MONGO_URI=<sua-connection-string-mongodb>
JWT_SECRET=<sua-chave-secreta-jwt>
STRIPE_SECRET_KEY=<sua-chave-stripe>
STRIPE_WEBHOOK_SECRET=<seu-webhook-secret-stripe>
STRIPE_PRICE_ID_BASICO=<price-id-plano-basico>
STRIPE_PRICE_ID_PREMIUM=<price-id-plano-premium>
STRIPE_PRICE_ID_EMPRESARIAL=<price-id-plano-empresarial>
```

#### Para merfin-agent:

```
NODE_ENV=production
AGENT_PORT=5001
PORT=5001
OPERATIONAL_SERVER_URL=https://merfin-operacional.onrender.com
JWT_SECRET=<mesma-chave-do-operacional>
OPENAI_API_KEY=<sua-chave-openai>
SEARCH_API_KEY=<sua-chave-serper> (opcional)
```

### 4. Configurar Webhook do Stripe

Após deploy do `merfin-operacional`:

1. Acesse o Dashboard do Stripe
2. Vá em **Developers** → **Webhooks**
3. Adicione endpoint: `https://merfin-operacional.onrender.com/api/pagamentos/webhook`
4. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copie o **Signing Secret** e adicione como `STRIPE_WEBHOOK_SECRET`

### 5. Verificar Deploy

Após todos os serviços estarem rodando:

#### Teste Backend Operacional:
```bash
curl https://merfin-operacional.onrender.com/api/status
```
Resposta esperada: `{"status":"online","database":"conectado"}`

#### Teste Agent:
```bash
curl https://merfin-agent.onrender.com/health
```
Resposta esperada: `{"status":"ok","service":"Merfin Agent Inteligente"}`

#### Teste Frontend:
Abra: `https://merfin-home.onrender.com`

## 🔧 Configurações Adicionais

### Domínio Customizado (Futuro)

Quando quiser usar um domínio próprio:

1. No Render, vá em cada serviço → Settings → Custom Domain
2. Adicione o domínio desejado
3. Configure os registros DNS conforme instruções do Render
4. Atualize as origens CORS nos servidores se necessário

### Plano Free do Render - Limitações

⚠️ **Importante sobre o plano gratuito:**

- Serviços são **desligados após 15 minutos de inatividade**
- **Cold start** de ~30 segundos na primeira requisição
- 750 horas/mês compartilhadas entre serviços
- Builds limitados (pode falhar se demorar muito)

**Solução para cold start:**
- Use serviço de ping (ex: UptimeRobot, Cron-job.org)
- Faça requisições a cada 10-14 minutos para manter serviços ativos

### Monitoramento

Recomendado configurar:
- **UptimeRobot** ou **Better Uptime** para monitorar disponibilidade
- **LogTail** ou **Papertrail** para logs centralizados (Render oferece integração)

## 🐛 Troubleshooting

### Erro: "Application failed to respond"
- Verifique se o `PORT` está configurado corretamente
- Confirme que o servidor está ouvindo em `0.0.0.0` (não `localhost`)

### Erro de CORS
- Verifique se a origem está na lista `allowedOrigins` nos servidores
- Confirme que os domínios do Render estão corretos

### Erro de conexão MongoDB
- Verifique se o IP do Render está na whitelist do MongoDB Atlas
- Recomendado: permitir acesso de qualquer IP (0.0.0.0/0) para serviços na nuvem

### Webhook Stripe não funciona
- Confirme que o endpoint está correto
- Verifique se `STRIPE_WEBHOOK_SECRET` está configurado
- Teste enviando evento de teste pelo Dashboard do Stripe

## 📊 Logs e Debugging

Para visualizar logs em tempo real:

1. No Dashboard do Render
2. Selecione o serviço
3. Clique em **"Logs"** no menu lateral
4. Logs aparecem em tempo real

## 🔄 Atualizações

### Deploy Automático (com GitHub conectado):
- Faça push para o branch `main`
- Render detecta automaticamente e faz redeploy

### Deploy Manual:
- No Dashboard → Selecione serviço → Manual Deploy → Deploy latest commit

## 🆘 Suporte

Em caso de dúvidas:
- Documentação oficial: [render.com/docs](https://render.com/docs)
- Comunidade Render: [community.render.com](https://community.render.com)

---

**Desenvolvido por Merfin.IA** 🤖💰
