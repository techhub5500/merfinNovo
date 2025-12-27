# 🚀 Migração do Stripe de Localhost para Produção

## 📋 Checklist de Migração

### 1️⃣ **Configurações do Stripe Dashboard**

#### A. Mudar de Modo Teste para Modo Produção
- Acesse: https://dashboard.stripe.com
- No canto superior esquerdo, **desative** o toggle "Modo de teste"
- Agora você verá as chaves de produção (live keys)

#### B. Obter Novas Chaves de API
```bash
# ANTES (Teste - localhost)
STRIPE_SECRET_KEY=sk_test_51SixMk...
STRIPE_PUBLISHABLE_KEY=pk_test_51SixMk...
STRIPE_WEBHOOK_SECRET=whsec_df0d1b...

# DEPOIS (Produção)
STRIPE_SECRET_KEY=sk_live_51SixMk...  # ⚠️ NUNCA COMPARTILHE
STRIPE_PUBLISHABLE_KEY=pk_live_51SixMk...
STRIPE_WEBHOOK_SECRET=whsec_XXXXXX...  # Novo segredo do webhook
```

**Onde encontrar:**
- **Secret Key**: Dashboard → Developers → API keys → Secret key (live)
- **Publishable Key**: Dashboard → Developers → API keys → Publishable key (live)

---

### 2️⃣ **Criar Payment Links de Produção**

Os links de teste (`buy.stripe.com/test_...`) **NÃO FUNCIONAM** em produção!

#### Como criar novos Payment Links:
1. Dashboard → Produtos → **Criar produto**
2. Configure os planos:
   - **Plano Mensal**: R$ 20,00/mês
   - **Plano Anual**: R$ 190,00/ano
3. Para cada produto, clique em **Payment Links** → **Create payment link**
4. Copie as URLs geradas (formato: `buy.stripe.com/XXXXXX`)

#### Atualizar no .env:
```bash
STRIPE_PAYMENT_LINK_MENSAL=https://buy.stripe.com/XXXXXX
STRIPE_PAYMENT_LINK_ANUAL=https://buy.stripe.com/YYYYYY
```

---

### 3️⃣ **Configurar Webhook de Produção**

⚠️ **CRÍTICO**: O webhook precisa apontar para seu domínio real, não localhost!

#### A. Criar Webhook Endpoint
1. Dashboard → Developers → **Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   ```
   URL: https://seudominio.com/api/pagamentos/webhook
   Descrição: Merfin Produção - Pagamentos
   ```

#### B. Selecionar Eventos
Marque exatamente estes eventos:
- ✅ `checkout.session.completed` (principal)
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_failed`
- ✅ `invoice.paid`
- ✅ `invoice.payment_succeeded`

#### C. Obter Signing Secret
Após criar o webhook, copie o **Signing secret** (começa com `whsec_...`)

```bash
# Atualizar no .env
STRIPE_WEBHOOK_SECRET=whsec_NOVO_SEGREDO_DE_PRODUCAO
```

---

### 4️⃣ **Atualizar Variáveis de Ambiente**

Seu arquivo `.env` de **produção** deve ter:

```bash
# ========== STRIPE (PRODUÇÃO) ==========
STRIPE_SECRET_KEY=sk_live_51SixMkGyFEMUQzRr...
STRIPE_PUBLISHABLE_KEY=pk_live_51SixMkGyFEMUQzRr...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PAYMENT_LINK_MENSAL=https://buy.stripe.com/...
STRIPE_PAYMENT_LINK_ANUAL=https://buy.stripe.com/...

# ========== BACKEND ==========
PORT=5000
JWT_SECRET=merfin_secret_key_2025_PRODUCAO  # ⚠️ MUDE ISTO
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/merfin?retryWrites=true&w=majority
```

⚠️ **NUNCA COMMITE O .env NO GIT!**

---

### 5️⃣ **Atualizar URLs no Frontend**

#### A. Arquivo: `client/js/app.js`

**Procure por todas as ocorrências de:**
```javascript
fetch('http://localhost:5000/api/...')
```

**Substitua por:**
```javascript
// Opção 1: URL dinâmica (recomendado)
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://seudominio.com';

fetch(`${API_URL}/api/pagamentos/planos`)

// Opção 2: URL fixa (mais simples)
fetch('https://seudominio.com/api/pagamentos/planos')
```

#### B. Arquivos a atualizar:
- ✅ `client/js/app.js` - handleCadastro(), verificarRetornoPagamento(), finalizarCadastroManual()
- ✅ `client/js/perfil.js` - Se tiver requisições de pagamento
- ✅ `client/js/dashboard.js` - Se tiver requisições de pagamento
- ✅ `client/js/minhas-financas.js` - Se tiver requisições de pagamento

---

### 6️⃣ **Configurar CORS no Servidor**

Atualize `server/serverOperacional.js`:

```javascript
const cors = require('cors');

// ANTES (localhost)
app.use(cors());

// DEPOIS (produção)
const allowedOrigins = [
    'https://seudominio.com',
    'https://www.seudominio.com',
    // Manter localhost para desenvolvimento
    'http://localhost:5000',
    'http://127.0.0.1:5000'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
```

---

### 7️⃣ **Configurar Certificado SSL (HTTPS)**

⚠️ **OBRIGATÓRIO**: O Stripe requer HTTPS em produção!

#### Opções:
1. **Vercel/Netlify**: SSL automático ✅
2. **Heroku**: SSL grátis com addon
3. **AWS/VPS**: Let's Encrypt (Certbot)
4. **Cloudflare**: SSL/TLS gratuito

---

### 8️⃣ **Testar Pagamentos de Produção**

⚠️ **ATENÇÃO**: Você precisará usar cartões reais ou o modo de teste do Stripe.

#### Cartões de Teste (Modo Produção com Teste Ativado):
```
Número: 4242 4242 4242 4242
Data: Qualquer data futura (12/25)
CVC: 123
CEP: 12345
```

#### Pagamentos Reais:
- Use valores baixos para teste (R$ 0,50)
- Verifique se os webhooks chegam corretamente
- Confirme criação de usuário no MongoDB

---

### 9️⃣ **Monitoramento e Logs**

#### Dashboard do Stripe:
- **Payments**: Ver todos os pagamentos recebidos
- **Customers**: Lista de clientes
- **Subscriptions**: Assinaturas ativas
- **Webhooks**: Verificar entregas (200 OK = sucesso)

#### Logs do Servidor:
```javascript
// Manter logs detalhados em produção
console.log('💳 [CHECKOUT COMPLETED]', session.id);
console.log('✅ Usuário criado:', user.email);
```

---

### 🔟 **Checklist Final**

Antes de ir para produção:

- [ ] ✅ Modo de teste Stripe **DESATIVADO**
- [ ] ✅ Chaves de API de **PRODUÇÃO** no .env
- [ ] ✅ Payment Links de **PRODUÇÃO** criados
- [ ] ✅ Webhook apontando para **DOMÍNIO REAL**
- [ ] ✅ URLs do frontend **ATUALIZADAS** (sem localhost)
- [ ] ✅ CORS configurado com **DOMÍNIO REAL**
- [ ] ✅ Certificado **SSL/HTTPS** ativo
- [ ] ✅ `.env` com secrets de **PRODUÇÃO**
- [ ] ✅ JWT_SECRET **ALTERADO** (não usar o mesmo do teste)
- [ ] ✅ Teste de pagamento real **FUNCIONANDO**
- [ ] ✅ Webhooks retornando **200 OK**

---

## 📊 Resumo das Mudanças

| Item | Localhost (Teste) | Produção |
|------|-------------------|----------|
| **Chaves API** | `sk_test_...` / `pk_test_...` | `sk_live_...` / `pk_live_...` |
| **Payment Links** | `buy.stripe.com/test_...` | `buy.stripe.com/...` |
| **Webhook URL** | `http://localhost:5000/...` | `https://seudominio.com/...` |
| **Frontend URL** | `localhost:5000` | `seudominio.com` |
| **SSL** | Não obrigatório | **OBRIGATÓRIO** |
| **Cartões** | Somente teste | Reais + alguns testes |

---

## 🆘 Problemas Comuns

### Webhook retorna 400/500:
- ✅ Verificar se `express.raw()` está **ANTES** de `express.json()`
- ✅ Confirmar que `STRIPE_WEBHOOK_SECRET` está correto
- ✅ Verificar se a URL está acessível publicamente

### Pagamento não cria usuário:
- ✅ Verificar logs do servidor (webhook recebido?)
- ✅ Confirmar que MongoDB está acessível
- ✅ Verificar email no `checkout.session.completed`

### CORS Error:
- ✅ Adicionar domínio em `allowedOrigins`
- ✅ Verificar se tem `https://` ou `http://`

---

## 📞 Suporte

- **Stripe Docs**: https://stripe.com/docs
- **Webhook Testing**: https://dashboard.stripe.com/test/webhooks
- **API Logs**: https://dashboard.stripe.com/logs

---

**Criado em:** 27 de dezembro de 2025  
**Versão:** 1.0.0  
**Sistema:** Merfin.IA - Plataforma de Gestão Financeira
