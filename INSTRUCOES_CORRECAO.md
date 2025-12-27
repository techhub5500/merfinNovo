# 🔧 Correção do Modal de Login/Cadastro + Migração Stripe

## ✅ **Problema 1: Botão de Cadastro não funciona**

### O que foi corrigido:
1. ✅ Adicionado `e.preventDefault()` nos event listeners das tabs
2. ✅ Adicionado logs detalhados para debug
3. ✅ Validação de existência dos elementos HTML

### Como testar:
1. Abra o navegador (F12 para abrir DevTools)
2. Vá para Console
3. Recarregue a página
4. Você verá logs como:
   ```
   ✅ Tab Login encontrada, adicionando listener
   ✅ Tab Cadastro encontrada, adicionando listener
   ```
5. Clique no botão "Cadastro"
6. No console, você verá:
   ```
   🔄 Mudando modo de autenticação para: cadastro
   Elementos encontrados: {loginForm: true, cadastroForm: true, ...}
   ✅ Modo alterado com sucesso
   ```

### Se não funcionar:
- Verifique se o modal está abrindo (deve aparecer quando você não está logado)
- Verifique no Console se há erros JavaScript
- Envie os logs do console para análise

---

## 📦 **Problema 2: Migração para Produção**

### Arquivo criado: `MIGRACAO_STRIPE_PRODUCAO.md`
Documento completo com **10 passos** para migrar do localhost para produção.

### Resumo rápido:

#### **PASSO 1: No Stripe Dashboard**
```
1. Desativar "Modo de teste"
2. Copiar chaves de PRODUÇÃO:
   - sk_live_... (Secret Key)
   - pk_live_... (Publishable Key)
3. Criar novos Payment Links para produção
4. Criar novo Webhook apontando para seu domínio
5. Copiar novo Webhook Secret (whsec_...)
```

#### **PASSO 2: Atualizar .env**
```bash
# PRODUÇÃO
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PAYMENT_LINK_MENSAL=https://buy.stripe.com/XXXXX
STRIPE_PAYMENT_LINK_ANUAL=https://buy.stripe.com/YYYYY
```

#### **PASSO 3: Atualizar URLs do Frontend**
Arquivo criado: `client/js/config.js`

**Opção A (Recomendada):** Usar o arquivo config.js
```html
<!-- Adicione ANTES do app.js em todos os HTML -->
<script src="../js/config.js"></script>
<script src="../js/app.js"></script>
```

Depois, altere a URL em `config.js`:
```javascript
// Linha 18-19
return 'https://seudominio.com';  // ⚠️ MUDE AQUI
```

**Opção B:** Buscar e substituir manualmente
```javascript
// ANTES
fetch('http://localhost:5000/api/...')

// DEPOIS
fetch('https://seudominio.com/api/...')
```

#### **PASSO 4: HTTPS Obrigatório**
⚠️ O Stripe **EXIGE** HTTPS em produção!
- Vercel/Netlify: SSL automático ✅
- Outros: Configure Let's Encrypt

#### **PASSO 5: Webhook URL**
```
Stripe Dashboard → Webhooks → Add endpoint
URL: https://seudominio.com/api/pagamentos/webhook
```

---

## 📋 Checklist Antes de Produção

Imprima e marque conforme avança:

```
□ Modo teste Stripe DESATIVADO
□ Chaves sk_live_... e pk_live_... no .env
□ Payment Links de PRODUÇÃO criados
□ Webhook apontando para domínio real
□ URLs frontend ATUALIZADAS (sem localhost)
□ HTTPS configurado e funcionando
□ Teste de pagamento real OK
□ Webhooks retornando 200 OK
□ Usuário criado no MongoDB após pagamento
□ JWT_SECRET alterado (não usar o mesmo do teste)
```

---

## 🆘 Precisa de Ajuda?

### Debug do Modal:
1. Abra Console (F12)
2. Digite: `document.getElementById('auth-modal')`
3. Se retornar `null`, o modal não existe na página

### Debug do Stripe:
1. Stripe Dashboard → Webhooks
2. Clique no seu webhook
3. Veja os "Recent deliveries"
4. Se está 200 OK = funcionando ✅
5. Se está 400/500 = erro no servidor ❌

### Logs Importantes:
```javascript
// No navegador (Console)
localStorage.getItem('merfin_token')  // Deve ter valor após login

// No servidor (Terminal Node.js)
// Você verá:
💳 [CHECKOUT COMPLETED] Pagamento concluído!
✅ Usuário criado com sucesso
```

---

## 📞 Contatos

**Documentação Completa:**
- `MIGRACAO_STRIPE_PRODUCAO.md` - Guia detalhado
- `client/js/config.js` - Helper de URLs

**Stripe Docs:**
- https://stripe.com/docs/payments
- https://stripe.com/docs/webhooks

---

**Data:** 27/12/2025
**Status:** ✅ Correções aplicadas + Guia de produção criado
