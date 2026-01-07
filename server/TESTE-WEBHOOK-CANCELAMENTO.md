# 🔍 TESTE DE WEBHOOK DE CANCELAMENTO

## Problema Identificado
O evento `customer.subscription.deleted` está sendo recebido pelo Stripe CLI, mas **NÃO está chegando ao servidor Node.js**.

## Causa Mais Provável
O Stripe CLI pode estar:
1. Não enviando o evento para o endpoint correto
2. Enviando mas o endpoint não está respondendo
3. O webhook secret está incorreto

## ✅ PASSO A PASSO PARA TESTAR

### 1. Verificar se o Stripe CLI está rodando corretamente

No terminal do Stripe CLI, você deve ver algo assim:
```
Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

Se não estiver rodando, execute:
```bash
stripe listen --forward-to localhost:5000/api/pagamentos/webhook
```

### 2. Reiniciar o servidor Node.js

Pare o servidor (Ctrl+C) e inicie novamente:
```bash
npm run dev
```

### 3. Logs Esperados

Agora, com as melhorias que fiz, você deve ver:

**Quando qualquer webhook for recebido:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 [WEBHOOK CHAMADO] 27/12/2025, 16:45:30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Quando for um cancelamento:**
```
🔍 [WEBHOOK DEBUG] Processando evento: customer.subscription.deleted
🔍 [WEBHOOK DEBUG] Event ID: evt_xxxxx

🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
❌ ASSINATURA CANCELADA/DELETADA
   Subscription ID: sub_xxxxx
   Customer ID: cus_xxxxx
```

### 4. Testar Cancelamento

1. Faça login com o usuário: **tececonsultoria31@gmail.com**
2. Vá ao Stripe Dashboard
3. Encontre a assinatura do cliente
4. Clique em "Cancel subscription"
5. **OBSERVE O TERMINAL NODE.JS** - deve aparecer os logs acima

### 5. Verificar se funcionou

Após cancelar:
- Faça logout
- Tente fazer login novamente
- Você **DEVE VER** o modal de assinatura cancelada
- Você **NÃO DEVE** conseguir acessar a plataforma

## 🚨 SE NÃO FUNCIONAR

### Verificar webhook secret

No arquivo `server/.env`, a variável `STRIPE_WEBHOOK_SECRET` deve estar igual ao secret que o Stripe CLI mostrou.

Execute no terminal:
```bash
cd server
cat .env | grep STRIPE_WEBHOOK_SECRET
```

### Verificar rota do webhook

No terminal do Stripe CLI, quando você cancela algo, deve aparecer:
```
--> customer.subscription.deleted [evt_xxxxx]
<-- [200] POST http://localhost:5000/api/pagamentos/webhook [evt_xxxxx]
```

Se aparecer **[400]** ou **[500]**, o webhook está chegando mas falhando.

## 📝 O QUE FIZ

1. Adicionei log inicial no webhook para ver se ele é chamado
2. Adicionei logs de debug antes do switch case
3. O código de atualização do MongoDB já estava correto
4. O middleware `checkSubscription` já verifica o status corretamente

## 🎯 PRÓXIMO TESTE

Depois de reiniciar tudo:
1. Cancele a assinatura do tececonsultoria31@gmail.com
2. Copie TODOS os logs do terminal Node.js
3. Copie TODOS os logs do terminal Stripe CLI
4. Me envie para análise se não funcionar
