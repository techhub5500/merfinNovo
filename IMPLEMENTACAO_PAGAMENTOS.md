# 🎯 SISTEMA DE PAGAMENTOS RECORRENTES - IMPLEMENTAÇÃO

## 📁 ARQUIVOS CRIADOS

### Backend (server/)
1. **stripePayments.js** - Rotas e lógica de pagamentos Stripe
   - Rota para listar planos
   - Rota para verificar status da assinatura
   - Webhook para receber eventos do Stripe
   - Rota para cancelar assinatura

2. **models.js** - Model de assinatura (integrado no serverOperacional.js)

3. **.env.example** - Template com todas as variáveis necessárias

### Frontend (client/)
4. **html/planos.html** - Página de seleção de planos
5. **css/planos.css** - Estilos da página de planos
6. **js/planos.js** - Lógica da página de planos

### Documentação
7. **GUIA_STRIPE.md** - Guia completo passo a passo

---

## 🔧 MODIFICAÇÕES NOS ARQUIVOS EXISTENTES

### server/serverOperacional.js
- ✅ Adicionado Schema de Assinatura (Subscription)
- ✅ Adicionado middleware `checkSubscription` para verificar assinatura ativa
- ✅ Integração das rotas do Stripe
- ✅ Exportação dos models para uso no stripePayments.js

### client/js/app.js
- ✅ Atualizado `fetchAPI` para tratar erros de assinatura (403)
- ✅ Adicionada função `verificarAssinatura` no login
- ✅ Redirecionamento automático para planos se não tiver assinatura

---

## 🚀 PRÓXIMOS PASSOS

### 1. Instalar Dependência do Stripe
```bash
cd server
npm install stripe
```

### 2. Configurar .env
Copie o `.env.example` para `.env` e preencha as variáveis:
```bash
cp .env.example .env
```

Edite o `.env` e adicione:
- Suas chaves do Stripe (veja GUIA_STRIPE.md)
- URLs dos Payment Links
- Webhook secret

### 3. Seguir o Guia Completo
Abra o arquivo `GUIA_STRIPE.md` e siga TODOS os passos para:
- Criar conta no Stripe
- Obter chaves de API
- Criar Payment Links
- Configurar Webhook

### 4. Testar o Sistema
```bash
# Terminal 1: Iniciar servidor
cd server
npm start

# Terminal 2: Stripe CLI (webhook local)
stripe listen --forward-to localhost:5000/api/pagamentos/webhook
```

Acesse: `http://localhost:5000/html/planos.html`

---

## 📊 FLUXO DO SISTEMA

### 1. Usuário Acessa a Plataforma
```
Login → Verificação de Assinatura → 
  ├─ Sem assinatura → Redireciona para /html/planos.html
  ├─ Assinatura pendente → Redireciona para /html/planos.html
  ├─ Assinatura ativa → Acessa plataforma normalmente
  └─ Assinatura expirada → Redireciona para /html/planos.html
```

### 2. Usuário Escolhe um Plano
```
/html/planos.html → 
Seleciona plano → 
Confirma → 
Redireciona para Stripe (Payment Link)
```

### 3. Usuário Faz o Pagamento
```
Stripe Checkout →
Pagamento confirmado →
Stripe envia webhook →
Sistema atualiza banco de dados →
Status = "ativo"
```

### 4. Usuário Acessa a Plataforma
```
Login novamente →
Verificação de assinatura →
Status "ativo" → ✅ Acesso liberado!
```

---

## 🛡️ PROTEÇÃO DAS ROTAS

Para proteger uma rota e exigir assinatura ativa, use os dois middlewares:

```javascript
// Exemplo:
app.get('/api/rota-protegida', authMiddleware, checkSubscription, async (req, res) => {
    // Somente usuários autenticados E com assinatura ativa chegam aqui
    res.json({ message: 'Acesso liberado!' });
});
```

**Middlewares disponíveis:**
- `authMiddleware` - Verifica se o usuário está logado (token JWT válido)
- `checkSubscription` - Verifica se o usuário tem assinatura ativa

---

## 📋 ROTAS DA API

### Planos
- `GET /api/pagamentos/planos` - Lista todos os planos disponíveis

### Status
- `GET /api/pagamentos/status/:userId` - Verifica status da assinatura do usuário

### Webhook
- `POST /api/pagamentos/webhook` - Recebe eventos do Stripe (uso interno)

### Cancelamento
- `POST /api/pagamentos/cancelar/:userId` - Cancela assinatura do usuário

---

## 💾 BANCO DE DADOS

### Nova Collection: subscriptions

```javascript
{
  userId: ObjectId,              // Referência ao usuário
  stripeCustomerId: String,      // ID do cliente no Stripe
  stripeSubscriptionId: String,  // ID da assinatura no Stripe
  status: String,                // pendente | ativo | cancelado | expirado
  plano: String,                 // basico | premium | empresarial
  validoAte: Date,               // Data de expiração
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔔 EVENTOS DO WEBHOOK

O sistema processa automaticamente estes eventos do Stripe:

1. **checkout.session.completed** - Pagamento concluído
   - Cria/atualiza assinatura com status "ativo"

2. **customer.subscription.created** - Nova assinatura
   - Registra log da criação

3. **customer.subscription.updated** - Assinatura atualizada
   - Atualiza status e data de expiração

4. **customer.subscription.deleted** - Assinatura cancelada
   - Muda status para "cancelado"

5. **invoice.payment_failed** - Falha no pagamento
   - Muda status para "pendente"

---

## 🎨 PERSONALIZAÇÃO

### Alterar Valores dos Planos
Edite: `server/stripePayments.js` na seção `PLANOS`:
```javascript
const PLANOS = {
    basico: {
        nome: 'Plano Básico',
        preco: 'R$ 29,90/mês',  // ← Altere aqui
        // ...
    }
}
```

### Adicionar/Remover Planos
1. Adicione na constante `PLANOS` em `stripePayments.js`
2. Crie o Payment Link no Stripe
3. Adicione a URL no `.env`

### Customizar Página de Planos
Edite:
- Estrutura: `client/html/planos.html`
- Estilos: `client/css/planos.css`
- Lógica: `client/js/planos.js`

---

## ⚠️ IMPORTANTE

### Segurança
- ✅ Nunca exponha a chave secreta (`sk_...`) no frontend
- ✅ Sempre verifique a assinatura do webhook
- ✅ Use HTTPS em produção
- ✅ Adicione `.env` ao `.gitignore`

### Testes
- ✅ Sempre teste em modo de teste do Stripe primeiro
- ✅ Use cartões de teste do Stripe
- ✅ Monitore os logs do webhook

### Produção
- ✅ Complete o cadastro no Stripe
- ✅ Ative sua conta
- ✅ Troque as chaves de test para live
- ✅ Reconfigure o webhook com URL de produção

---

## 📚 ARQUIVOS DE REFERÊNCIA

1. **GUIA_STRIPE.md** - Guia passo a passo completo
2. **server/stripePayments.js** - Código comentado
3. **server/.env.example** - Template de configuração
4. **client/js/planos.js** - Frontend comentado

---

## 🆘 PROBLEMAS COMUNS

### "Invalid API Key"
→ Verifique se copiou a chave completa no `.env`

### Webhook não funciona
→ Use Stripe CLI para teste local ou ngrok

### Assinatura não ativa após pagamento
→ Verifique se o webhook está sendo recebido nos logs

### Redirecionamento em loop
→ Verifique se o email do pagamento corresponde ao email do usuário

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Arquivos backend criados
- [x] Arquivos frontend criados
- [x] Middlewares implementados
- [x] Integração com serverOperacional.js
- [x] Verificação no login
- [x] Proteção de rotas
- [x] Guia de configuração criado
- [ ] Dependências instaladas (npm install stripe)
- [ ] .env configurado
- [ ] Stripe configurado
- [ ] Testes realizados

---

## 🎉 CONCLUSÃO

O sistema está 100% implementado! Agora você precisa:

1. Seguir o **GUIA_STRIPE.md** para configurar sua conta
2. Instalar a dependência: `npm install stripe`
3. Configurar o arquivo `.env`
4. Testar o sistema

**Qualquer dúvida, consulte os comentários no código ou a documentação do Stripe!**

---

Desenvolvido para Merfin.IA 🚀
