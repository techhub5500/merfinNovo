# 🎯 TESTE DE CANCELAMENTO - INSTRUÇÕES IMEDIATAS

## ⚠️ PROBLEMA DETECTADO
Os webhooks estão sendo processados (Stripe CLI mostra `[200]`), mas **os logs não aparecem no terminal Node.js**.

## ✅ SOLUÇÃO IMPLEMENTADA
Adicionei um arquivo de log para registrar TODOS os webhooks, mesmo que os logs do console não apareçam.

## 📋 PASSO A PASSO DO TESTE

### 1️⃣ Limpar o usuário duplicado
```bash
cd server
node clean-test-user.js
# Quando pedir o email, digite: tececonsultoria32@gmail.com
```

### 2️⃣ Criar um NOVO usuário (use email diferente)
Use: **tececonsultoria33@gmail.com**
- Complete o pagamento
- Finalize o cadastro
- Faça login

### 3️⃣ Cancelar a assinatura no Stripe Dashboard
1. Vá para: https://dashboard.stripe.com/test/subscriptions
2. Encontre a assinatura de **tececonsultoria33@gmail.com**
3. Clique em "Cancel subscription"
4. Confirme o cancelamento

### 4️⃣ Verificar o arquivo de log
```bash
cd server
cat webhook-debug.log
```

**Você deve ver:**
```
[27/12/2025, 17:00:00] WEBHOOK RECEBIDO
[27/12/2025, 17:00:00] Event Type: customer.subscription.deleted
[27/12/2025, 17:00:00] 🚨 CANCELAMENTO DETECTADO: sub_xxxxx
[27/12/2025, 17:00:00] Atualizando MongoDB para cancelado...
[27/12/2025, 17:00:00] ✅ MongoDB atualizado com sucesso! Status: cancelado
```

### 5️⃣ Verificar no MongoDB
```bash
node debug-subscription.js
```

**Você deve ver:**
```
📌 ASSINATURA #X:
   ⭐ STATUS: cancelado  <-- DEVE ESTAR CANCELADO
```

### 6️⃣ Testar o bloqueio
1. Faça logout da plataforma
2. Faça login novamente com **tececonsultoria33@gmail.com**
3. **RESULTADO ESPERADO:** Modal de "Assinatura Cancelada" deve aparecer
4. **VOCÊ NÃO DEVE** conseguir acessar o sistema

## 🔍 SE NÃO FUNCIONAR

### Cenário A: Arquivo de log não existe
Significa que o webhook não está chegando ao servidor.
- Verifique se o Stripe CLI está rodando
- Verifique se o servidor Node está rodando

### Cenário B: Arquivo existe mas não tem "customer.subscription.deleted"
Significa que o webhook está chegando mas o evento de cancelamento não.
- Verifique se você cancelou no Stripe Dashboard TEST mode
- Não no LIVE mode

### Cenário C: Log mostra erro ao atualizar MongoDB
Significa que a assinatura não foi encontrada no banco.
- Execute: `node debug-subscription.js`
- Verifique se a assinatura existe

### Cenário D: MongoDB atualizado mas usuário ainda acessa
Significa que há um bug no middleware `checkSubscription`.
- Me envie os logs completos

## 📊 INFORMAÇÕES PARA DEBUG

Se não funcionar, me envie:

1. **Conteúdo completo do arquivo:**
```bash
cat server/webhook-debug.log
```

2. **Status da assinatura no MongoDB:**
```bash
node server/debug-subscription.js
```

3. **Logs do Stripe CLI** (últimas 10 linhas após cancelamento)

4. **Resposta do servidor ao tentar login:**
Abra DevTools (F12) → Network → Tente fazer login → Copie a resposta da requisição

## ⚡ COMANDO RÁPIDO PARA TESTAR TUDO

```bash
# Terminal 1 - Stripe CLI (se não estiver rodando)
stripe listen --forward-to localhost:5000/api/pagamentos/webhook

# Terminal 2 - Limpar e testar
cd server
node clean-test-user.js  # Digite: tececonsultoria32@gmail.com
echo "Agora crie novo usuário: tececonsultoria33@gmail.com"
echo "Depois cancele no Stripe e execute:"
echo "cat webhook-debug.log && node debug-subscription.js"
```

## 🎯 OBJETIVO FINAL

Após cancelar a assinatura:
1. ✅ Arquivo de log mostra processamento do cancelamento
2. ✅ MongoDB tem status "cancelado"
3. ✅ Usuário vê modal ao tentar fazer login
4. ✅ Usuário NÃO consegue acessar a plataforma
