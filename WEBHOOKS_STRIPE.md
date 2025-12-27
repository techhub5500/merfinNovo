# 📡 Sistema de Webhooks do Stripe - Merfin.IA

## 🎯 O que são Webhooks?

Webhooks são notificações automáticas que o **Stripe** envia para o seu servidor quando algo importante acontece com uma assinatura ou pagamento.

---

## ⚙️ Webhooks Configurados

### 1. **`checkout.session.completed`** ✅
**Quando acontece:** Usuário completa o pagamento no Stripe
**O que faz:**
- Cria o usuário no banco de dados
- Cria a assinatura com status "ativo"
- Define data de validade (30 dias ou 365 dias)
- Retorna token JWT para login automático

---

### 2. **`customer.subscription.updated`** 🔄
**Quando acontece:** Assinatura é modificada
**O que faz:**
- Atualiza status da assinatura no banco
- Atualiza data de validade
- Possíveis status:
  - `active` → `ativo` (funcionando normalmente)
  - `canceled` → `cancelado` (usuário cancelou)
  - `past_due` → `pendente` (pagamento atrasado)
  - `unpaid` → `pendente` (não pagou)

---

### 3. **`customer.subscription.deleted`** ❌
**Quando acontece:** Assinatura é cancelada ou deletada
**O que faz:**
- Marca assinatura como `cancelado` no banco
- Bloqueia acesso do usuário ao sistema
- Mostra modal com:
  - Mensagem de erro
  - Botão para falar com suporte (WhatsApp)
  - Botão para ver planos

**Log no console:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ ASSINATURA CANCELADA/DELETADA
   Subscription ID: sub_xxxxx
   Customer ID: cus_xxxxx
   Motivo: Não especificado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Assinatura marcada como cancelada no banco de dados
   User ID: 6xyz...
```

---

### 4. **`invoice.payment_failed`** ⚠️
**Quando acontece:** Falha no pagamento (cartão recusado, sem saldo, etc)
**O que faz:**
- Marca assinatura como `pendente`
- Usuário ainda pode acessar por alguns dias (grace period do Stripe)
- Sistema mostra aviso de pagamento pendente

**Log no console:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ FALHA NO PAGAMENTO
   Invoice ID: in_xxxxx
   Subscription ID: sub_xxxxx
   Valor: 20.0 BRL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Status da assinatura atualizado para: pendente
```

---

## 🚫 O que Acontece Quando uma Assinatura é Cancelada?

### **No Backend (serverOperacional.js)**
O middleware `checkSubscription` verifica o status antes de cada requisição:

```javascript
// Se assinatura cancelada
if (assinatura.status === 'cancelado') {
    return res.status(403).json({ 
        error: 'Assinatura cancelada',
        message: 'Sua assinatura foi cancelada...',
        type: 'assinatura_cancelada',
        contactSupport: true,
        whatsapp: '5511915381876',
        whatsappLink: 'https://wa.me/5511915381876?text=...',
        redirectTo: '/html/planos.html'
    });
}
```

### **No Frontend (app.js)**
Quando recebe erro 403 com `contactSupport: true`:
1. Chama `mostrarModalAssinaturaProblema(data)`
2. Mostra modal bonito com:
   - ❌ Ícone animado (pulsando)
   - Mensagem clara do problema
   - 📱 **Botão WhatsApp** (verde, destaque)
   - Botão "Ver Planos"
   - Número do WhatsApp: **(11) 91538-1876**

---

## 📱 Modal de Assinatura Cancelada

### **Visual:**
```
┌───────────────────────────────────────┐
│                                       │
│              🚫 (pulsando)            │
│                                       │
│        Assinatura cancelada           │
│                                       │
│  Sua assinatura foi cancelada.       │
│  Para continuar usando o Merfin,     │
│  reative sua assinatura ou entre     │
│  em contato com o suporte.           │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ 💡 Precisa de ajuda?            │ │
│  │ Nossa equipe está pronta!       │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  📱  Falar com Suporte         │ │ ← WhatsApp (verde)
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │      Ver Planos                 │ │ ← Link para planos
│  └─────────────────────────────────┘ │
│                                       │
│   WhatsApp: (11) 91538-1876          │
│                                       │
└───────────────────────────────────────┘
```

---

## 🔧 Testando Localmente

### **1. Instalar Stripe CLI:**
```bash
stripe listen --forward-to localhost:5000/api/pagamentos/webhook
```

### **2. Simular Cancelamento:**
No painel do Stripe ou via CLI:
```bash
stripe subscriptions cancel sub_xxxxx
```

### **3. Verificar Logs:**
- Console do servidor mostra: `❌ ASSINATURA CANCELADA/DELETADA`
- Frontend mostra modal de erro
- Botão WhatsApp funcional

---

## 🌐 Configuração em Produção

### **1. No Stripe Dashboard:**
1. Ir em: **Developers → Webhooks**
2. Adicionar endpoint: `https://seudominio.com/api/pagamentos/webhook`
3. Selecionar eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copiar **Signing Secret**

### **2. No arquivo `.env`:**
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...
```

### **3. Testar:**
- Cancelar assinatura de teste no Stripe
- Verificar se usuário é bloqueado
- Verificar se modal aparece com botão WhatsApp

---

## 📞 Suporte WhatsApp

**Número:** (11) 91538-1876  
**Link direto:** `https://wa.me/5511915381876`

### **Mensagens Automáticas por Tipo de Erro:**

**Assinatura Cancelada:**
```
Olá! Minha assinatura foi cancelada e preciso de ajuda.
```

**Assinatura Expirada:**
```
Olá! Minha assinatura expirou e preciso de ajuda para renovar.
```

**Pagamento Pendente:**
```
Olá! Preciso de ajuda com minha assinatura do Merfin.
```

---

## ✅ Checklist de Implementação

- [x] Webhooks configurados no código
- [x] Middleware de verificação atualizado
- [x] Modal de erro criado
- [x] Botão WhatsApp funcionando
- [x] Mensagens personalizadas por tipo de erro
- [x] Logs detalhados no console
- [x] Documentação completa

---

## 🐛 Troubleshooting

### **Webhook não está sendo recebido:**
1. Verificar se URL está correta no Stripe
2. Verificar se `express.raw()` está ANTES do `express.json()`
3. Verificar se firewall permite requisições do Stripe

### **Modal não aparece:**
1. Verificar console do navegador (F12)
2. Verificar se `fetchAPI` está sendo usado
3. Verificar se resposta tem `contactSupport: true`

### **WhatsApp não abre:**
1. Verificar se link tem formato correto: `https://wa.me/5511915381876`
2. Verificar se número está correto (sem espaços, com DDI)

---

## 📊 Fluxo Completo

```
Usuario no Stripe cancela → Stripe envia webhook → Backend recebe
                                                           ↓
                                        Atualiza status = "cancelado"
                                                           ↓
Usuario tenta acessar chat → fetchAPI → checkSubscription → 403
                                                           ↓
                                        Frontend recebe erro
                                                           ↓
                                    mostrarModalAssinaturaProblema()
                                                           ↓
                                        Modal com WhatsApp ✅
```

---

**Desenvolvido com ❤️ por Merfin.IA**  
*Sistema de Gestão Financeira Inteligente*
