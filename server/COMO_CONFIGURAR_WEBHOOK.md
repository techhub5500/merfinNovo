# 🚀 Como Configurar o Webhook do Stripe

## 📝 O que você precisa fazer:

### **OPÇÃO 1: Desenvolvimento Local com Stripe CLI (RECOMENDADO)** ⭐

#### Passo 1: Instalar o Stripe CLI
```bash
# Windows (usando Chocolatey)
choco install stripe-cli

# Ou baixe direto: https://github.com/stripe/stripe-cli/releases
```

#### Passo 2: Fazer Login no Stripe CLI
```bash
stripe login
```
Isso vai abrir o navegador para você autorizar.

#### Passo 3: Iniciar o Servidor
```bash
cd server
node serverOperacional.js
```

#### Passo 4: Em outro terminal, rodar o Stripe CLI
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

#### Passo 5: Copiar o Webhook Secret
O Stripe CLI vai mostrar algo assim:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

Copie esse `whsec_...` e cole no arquivo `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

#### Passo 6: Reiniciar o Servidor
Pare o servidor (Ctrl+C) e inicie novamente para carregar a nova variável.

---

### **OPÇÃO 2: Desenvolvimento Local com Ngrok**

#### Passo 1: Instalar Ngrok
```bash
# Windows (usando Chocolatey)
choco install ngrok

# Ou baixe: https://ngrok.com/download
```

#### Passo 2: Iniciar o Servidor
```bash
cd server
node serverOperacional.js
```

#### Passo 3: Criar Túnel Ngrok
Em outro terminal:
```bash
ngrok http 3000
```

Você vai ver algo assim:
```
Forwarding https://abc123.ngrok.io -> http://localhost:3000
```

#### Passo 4: Configurar Webhook no Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"Add endpoint"**
3. Cole a URL do ngrok + o endpoint:
   ```
   https://abc123.ngrok.io/api/stripe/webhook
   ```
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Clique em **"Add endpoint"**
6. Copie o **"Signing secret"** (começa com `whsec_...`)
7. Cole no `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_abc123...
   ```
8. Reinicie o servidor

---

### **OPÇÃO 3: Produção (Servidor Hospedado)**

Se seu servidor já está online (Heroku, AWS, etc):

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"Add endpoint"**
3. Cole a URL do seu servidor:
   ```
   https://seu-dominio.com/api/stripe/webhook
   ```
4. Selecione os mesmos eventos acima
5. Copie o **"Signing secret"**
6. Adicione no `.env` do servidor de produção

---

## ✅ Como Testar se Está Funcionando

### Teste com Stripe CLI:
```bash
stripe trigger checkout.session.completed
```

### Teste Manual:
1. Acesse: http://localhost:3000/client/html/index.html
2. Tente fazer login com um usuário sem assinatura
3. Você deve ver a tela de pagamento
4. Clique em um plano e faça um pagamento teste
5. Use o cartão teste: `4242 4242 4242 4242`
6. Após o pagamento, o webhook deve ser acionado automaticamente

---

## 🔍 Logs para Debug

O servidor vai mostrar logs quando receber eventos do webhook:
```
🎯 Webhook recebido: checkout.session.completed
✅ Pagamento confirmado para: usuario@email.com
```

---

## ⚠️ Problemas Comuns

### "Webhook signature verification failed"
- Verifique se o `STRIPE_WEBHOOK_SECRET` no `.env` está correto
- Certifique-se de reiniciar o servidor após alterar o `.env`

### "404 Not Found" no webhook
- Confirme que a URL está correta: `/api/stripe/webhook`
- Verifique se o servidor está rodando na porta correta

### Webhook não está sendo chamado
- Com Stripe CLI: certifique-se que ele está rodando em paralelo
- Com Ngrok: verifique se o túnel está ativo
- Em produção: teste a URL no navegador primeiro
