# 📘 GUIA COMPLETO DE CONFIGURAÇÃO DO STRIPE

## 🎯 VISÃO GERAL
Este guia te ajudará a configurar o sistema de pagamentos recorrentes usando Stripe na plataforma Merfin.IA.

---

## 📋 PASSO 1: CRIAR CONTA NO STRIPE

1. Acesse: https://stripe.com/br
2. Clique em "Começar agora"
3. Preencha seus dados (email, nome, senha)
4. Confirme seu email
5. Complete o cadastro da empresa

**IMPORTANTE:** Use o modo de teste primeiro antes de ir para produção!

---

## 🔑 PASSO 2: OBTER AS CHAVES DE API

### 2.1 - Acessar o Dashboard
1. Faça login em: https://dashboard.stripe.com
2. **Ative o modo de TESTE** (toggle no canto superior direito deve estar em "Test mode")

### 2.2 - Copiar as Chaves
1. No menu lateral, clique em **"Developers"** → **"API keys"**
2. Você verá duas chaves:

   **Chave Publicável (Publishable key)**
   - Começa com: `pk_test_...`
   - Use no frontend (se necessário)
   
   **Chave Secreta (Secret key)**
   - Começa com: `sk_test_...`
   - 🔒 **NUNCA compartilhe esta chave!**
   - Clique em "Reveal test key" para visualizar
   - Copie e guarde com segurança

### 2.3 - Adicionar no .env
Abra o arquivo `server/.env` e adicione:
```
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
```

---

## 💳 PASSO 3: CRIAR PAYMENT LINKS (LINKS DE PAGAMENTO)

### 3.1 - O que são Payment Links?
São URLs únicas que levam seus clientes diretamente para uma página de checkout do Stripe. É a forma mais simples de aceitar pagamentos recorrentes!

### 3.2 - Criar Link para Plano Básico

1. No dashboard, vá em: **"Payment Links"** (menu lateral esquerdo)
2. Clique em **"+ New"** ou **"Create payment link"**
3. Preencha as informações:

   **Nome do produto:**
   ```
   Plano Básico - Merfin.IA
   ```

   **Descrição:**
   ```
   Gestão financeira completa com IA
   ```

   **Preço:**
   ```
   R$ 29,90 ou o valor que você definir
   ```

   **Tipo de cobrança:**
   - Selecione: ✅ **"Recurring"** (Recorrente)
   - Frequência: **"Monthly"** (Mensal)

   **Opções adicionais:**
   - ✅ Collect customer emails
   - ✅ Collect customer billing addresses (opcional)

4. Clique em **"Create link"**
5. **COPIE A URL** que aparecerá (ex: `https://buy.stripe.com/test_xxxxxx`)
6. Cole no arquivo `.env`:
   ```
   STRIPE_LINK_BASICO=https://buy.stripe.com/test_xxxxxx
   ```

### 3.3 - Repetir para os outros planos

Crie mais dois Payment Links seguindo o mesmo processo:

**Plano Premium:**
- Nome: `Plano Premium - Merfin.IA`
- Preço: `R$ 59,90`
- Tipo: Recurring/Monthly
- Cole a URL em: `STRIPE_LINK_PREMIUM=...`

**Plano Empresarial:**
- Nome: `Plano Empresarial - Merfin.IA`
- Preço: `R$ 99,90`
- Tipo: Recurring/Monthly
- Cole a URL em: `STRIPE_LINK_EMPRESARIAL=...`

### 3.4 - Adicionar Metadados (IMPORTANTE!)

Para cada Payment Link criado, adicione metadados para identificar o plano:

1. Edite o Payment Link
2. Role até "Metadata"
3. Adicione:
   - Key: `plano`
   - Value: `basico` (ou `premium` ou `empresarial`)
4. Salve as alterações

---

## 🔔 PASSO 4: CONFIGURAR WEBHOOK

### 4.1 - O que é um Webhook?
É uma URL que o Stripe chama automaticamente quando algo acontece (pagamento concluído, assinatura cancelada, etc.). Isso permite atualizar automaticamente o status da assinatura no seu banco de dados.

### 4.2 - Configurar Webhook Local (Para Desenvolvimento)

#### Opção A: Usando Stripe CLI (Recomendado para teste local)

1. Instale o Stripe CLI: https://stripe.com/docs/stripe-cli
2. Após instalar, abra um terminal e execute:
   ```bash
   stripe login
   ```
3. Siga as instruções no navegador para autenticar
4. Execute para ouvir eventos:
   ```bash
   stripe listen --forward-to localhost:5000/api/pagamentos/webhook
   ```
5. O CLI mostrará um webhook secret que começa com `whsec_...`
6. Copie e adicione no `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   ```

#### Opção B: Usando ngrok (Para expor servidor local)

1. Instale ngrok: https://ngrok.com/download
2. Execute seu servidor Node.js normalmente
3. Em outro terminal, execute:
   ```bash
   ngrok http 5000
   ```
4. Copie a URL HTTPS que aparecer (ex: `https://xxxx-xxx-xxx-xxx.ngrok.io`)
5. Prossiga para a seção 4.3 usando essa URL

### 4.3 - Configurar Webhook no Stripe (Para Produção)

1. No dashboard, vá em: **"Developers"** → **"Webhooks"**
2. Clique em **"Add endpoint"** ou **"+ Add"**
3. **Endpoint URL:**
   ```
   https://seu-dominio.com/api/pagamentos/webhook
   ```
   ou se estiver usando ngrok:
   ```
   https://xxxx-xxx-xxx-xxx.ngrok.io/api/pagamentos/webhook
   ```

4. **Description:** (opcional)
   ```
   Webhook para Merfin.IA
   ```

5. **Select events to listen to:**
   Clique em "Select events" e marque:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`

6. Clique em **"Add endpoint"**

7. **COPIE O SIGNING SECRET** (começa com `whsec_...`)
   - Clique no webhook criado
   - Role até "Signing secret"
   - Clique em "Reveal"
   - Copie o valor

8. Adicione no `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   ```

---

## 📦 PASSO 5: INSTALAR DEPENDÊNCIAS

Execute no terminal dentro da pasta `server`:

```bash
npm install stripe
```

---

## 🚀 PASSO 6: INICIAR O SERVIDOR

1. Certifique-se de que todas as variáveis estão no `.env`:
   ```
   MONGO_URI=sua_url_mongodb
   JWT_SECRET=sua_chave_secreta
   PORT=5000
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_LINK_BASICO=https://buy.stripe.com/...
   STRIPE_LINK_PREMIUM=https://buy.stripe.com/...
   STRIPE_LINK_EMPRESARIAL=https://buy.stripe.com/...
   ```

2. Inicie o servidor:
   ```bash
   npm start
   ```

3. Se estiver usando Stripe CLI, em outro terminal execute:
   ```bash
   stripe listen --forward-to localhost:5000/api/pagamentos/webhook
   ```

---

## 🧪 PASSO 7: TESTAR O SISTEMA

### 7.1 - Testar a Página de Planos

1. Acesse: `http://localhost:5000/html/planos.html`
2. Você deve ver os 3 planos disponíveis
3. Clique em "Assinar Agora" em qualquer plano

### 7.2 - Testar o Pagamento

Você será redirecionado para o Stripe. Use estes dados de teste:

**Cartão de Crédito de Teste (SUCESSO):**
- Número: `4242 4242 4242 4242`
- Data: Qualquer data futura (ex: `12/25`)
- CVC: Qualquer 3 dígitos (ex: `123`)
- CEP: Qualquer CEP

**Cartão de Teste (FALHA):**
- Número: `4000 0000 0000 0002`

Mais cartões de teste: https://stripe.com/docs/testing

### 7.3 - Verificar Webhook

Após concluir o pagamento:
1. Verifique o terminal do seu servidor
2. Você deve ver: `✅ Webhook recebido: checkout.session.completed`
3. Verifique no MongoDB se a assinatura foi criada na collection `subscriptions`

### 7.4 - Verificar Dashboard Stripe

1. Acesse: https://dashboard.stripe.com/test/payments
2. Você deve ver o pagamento listado
3. Em "Subscriptions", você verá a assinatura criada

---

## 🔐 PASSO 8: SEGURANÇA E BOAS PRÁTICAS

### ✅ O que FAZER:
- ✅ Sempre use modo de teste antes de ir para produção
- ✅ Mantenha a chave secreta (`sk_...`) no `.env` e nunca comite no git
- ✅ Adicione `.env` no `.gitignore`
- ✅ Sempre verifique a assinatura do webhook (já implementado no código)
- ✅ Registre logs de todas as transações

### ❌ O que NÃO fazer:
- ❌ NUNCA exponha a chave secreta no frontend
- ❌ NUNCA comite o arquivo `.env` no git
- ❌ NUNCA desabilite a verificação de webhook signature

---

## 🌐 PASSO 9: IR PARA PRODUÇÃO

Quando estiver pronto para aceitar pagamentos reais:

1. Complete o cadastro da empresa no Stripe
2. Ative sua conta (Stripe pode pedir documentos)
3. Desative o "Test mode" no dashboard
4. Crie novos Payment Links em modo produção
5. Atualize as chaves no `.env`:
   - `sk_live_...` (chave secreta de produção)
   - `pk_live_...` (chave pública de produção)
6. Reconfigure o webhook com URL de produção
7. Teste tudo novamente em produção

---

## 📊 MONITORAMENTO

### Dashboard Stripe
Acesse regularmente: https://dashboard.stripe.com

**Métricas importantes:**
- Pagamentos bem-sucedidos
- Assinaturas ativas
- Taxa de cancelamento (churn)
- Pagamentos falhados

### Logs do Sistema
Monitore os logs do servidor para:
- Webhooks recebidos
- Erros de processamento
- Assinaturas ativadas/canceladas

---

## 🆘 TROUBLESHOOTING

### Problema: Webhook não está sendo recebido
**Solução:**
- Verifique se o servidor está rodando
- Confirme que a URL do webhook está correta
- Teste com Stripe CLI: `stripe trigger checkout.session.completed`
- Verifique os logs do webhook no Stripe Dashboard

### Problema: Erro "Invalid API Key"
**Solução:**
- Verifique se copiou a chave completa
- Confirme que está usando a chave correta (test/live)
- Verifique se não há espaços extras no `.env`

### Problema: Assinatura não é ativada após pagamento
**Solução:**
- Verifique se o webhook está configurado corretamente
- Confira os logs do servidor
- Verifique se o evento `checkout.session.completed` está sendo capturado
- Confirme que o email do pagamento corresponde a um usuário no banco

---

## 📚 RECURSOS ADICIONAIS

- **Documentação Stripe:** https://stripe.com/docs
- **API Reference:** https://stripe.com/docs/api
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Testing:** https://stripe.com/docs/testing
- **Webhooks:** https://stripe.com/docs/webhooks

---

## ✅ CHECKLIST FINAL

- [ ] Conta Stripe criada
- [ ] Modo de teste ativado
- [ ] Chaves de API copiadas e no `.env`
- [ ] 3 Payment Links criados
- [ ] Metadados adicionados aos links
- [ ] Links copiados para `.env`
- [ ] Webhook configurado
- [ ] Webhook secret no `.env`
- [ ] `npm install stripe` executado
- [ ] Servidor iniciado sem erros
- [ ] Teste de pagamento realizado com sucesso
- [ ] Webhook recebido corretamente
- [ ] Assinatura criada no MongoDB
- [ ] `.env` adicionado ao `.gitignore`

---

## 🎉 PRONTO!

Seu sistema de pagamentos recorrentes está configurado! 

Se tiver dúvidas, consulte a documentação do Stripe ou os comentários no código.

**Boa sorte com o Merfin.IA! 🚀**
