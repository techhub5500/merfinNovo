# 💳 Fluxo de Cadastro + Pagamento - Merfin.IA

## 📋 Resumo da Implementação

Foi implementado um sistema completo onde o usuário **primeiro escolhe o plano e efetua o pagamento**, e **apenas após a confirmação do pagamento** o cadastro é finalizado.

---

## 🎯 Planos Disponíveis

### 💰 Plano Mensal: **R$ 20,00/mês**
- ✅ Gestão financeira completa
- ✅ Chat com IA personalizada
- ✅ Relatórios mensais
- ✅ Suporte por email

### 🎁 Plano Anual: **R$ 190,00/ano** (Mais Popular)
- ✅ Tudo do Plano Mensal
- 💰 Economize R$ 50,00/ano
- ✅ Relatórios avançados
- ✅ Suporte prioritário

---

## 🔄 Fluxo Completo

### **1️⃣ Usuário Acessa a Plataforma**
- Tenta acessar sem estar logado
- Modal de autenticação aparece

### **2️⃣ Usuário Clica em "Cadastro"**
- Preenche os dados:
  - Nome
  - Email
  - Senha
  - Confirmar Senha
- **NOVO:** Escolhe um dos planos (Mensal ou Anual)
- Clica em **"Efetuar Pagamento"**

### **3️⃣ Redirecionamento para Stripe**
- Dados são salvos temporariamente no `localStorage`
- Usuário é redirecionado para o checkout do Stripe
- Stripe exibe a página de pagamento

### **4️⃣ Pagamento no Stripe**
- Usuário preenche dados do cartão
- Stripe processa o pagamento
- Após conclusão, retorna para a plataforma

### **5️⃣ Webhook Processa Pagamento**
- Stripe envia evento `checkout.session.completed`
- Servidor recebe o webhook
- **Cria o usuário no MongoDB**
- **Ativa a assinatura**

### **6️⃣ Usuário Volta para Plataforma**
- Sistema verifica dados pendentes no `localStorage`
- Aguarda 3 segundos para webhook processar
- Finaliza cadastro via API `/api/pagamentos/finalizar-cadastro`
- Gera token JWT
- **Redireciona para o chat** ✅

---

## 🛠️ Arquivos Modificados

### **Backend:**
1. **`server/.env`**
   - Adicionadas chaves do Stripe
   - Configurados links de pagamento

2. **`server/stripePayments.js`**
   - Atualizados preços: R$ 20 (mensal) e R$ 190 (anual)
   - Webhook modificado para criar usuário após pagamento
   - Nova rota `/finalizar-cadastro` para completar registro

### **Frontend:**
1. **`client/html/perfil.html`**
   - Modal de cadastro agora inclui seleção de planos
   - Botão alterado para "Efetuar Pagamento"

2. **`client/html/chat.html`**
   - Mesmo modal atualizado

3. **`client/html/minhas-financas.html`**
   - Mesmo modal atualizado

4. **`client/css/style.css`**
   - Estilos para cards de planos no modal
   - Visual responsivo e moderno

5. **`client/js/app.js`**
   - Função `handleCadastro()` modificada para salvar dados e redirecionar ao Stripe
   - Nova função `verificarRetornoPagamento()` para processar retorno
   - Integração com API de finalização de cadastro

---

## 🔐 Segurança

- ✅ Dados salvos temporariamente no `localStorage` (máx 2 horas)
- ✅ Pagamento processado 100% pelo Stripe
- ✅ Webhook verifica assinatura do evento
- ✅ Senha criptografada com bcrypt
- ✅ Token JWT com expiração de 7 dias

---

## 📊 Status de Assinatura

### **Estados Possíveis:**
- `pendente` - Aguardando pagamento
- `ativo` - Pagamento confirmado
- `cancelado` - Assinatura cancelada

### **Validação:**
- Usuário só acessa plataforma com status `ativo`
- Middleware verifica assinatura em cada requisição

---

## 🧪 Como Testar

### **1. Iniciar Servidores:**
```bash
# Terminal 1: Servidor
cd server
npm run start:all

# Terminal 2: Stripe CLI
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

### **2. Copiar Webhook Secret:**
- O Stripe CLI vai exibir algo como: `whsec_abc123...`
- Cole no `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
- Reinicie o servidor

### **3. Testar Cadastro:**
1. Acesse: `http://localhost:5000/client/html/chat.html`
2. Clique em "Cadastro"
3. Preencha os dados
4. Escolha um plano (recomendo Anual)
5. Clique em "Efetuar Pagamento"
6. Use cartão teste: **4242 4242 4242 4242**
7. Data: qualquer futura, CVV: qualquer
8. Aguarde o redirecionamento
9. Você será logado automaticamente! 🎉

---

## ⚠️ Importante

### **Para Desenvolvimento:**
- Use as chaves de **teste** (`sk_test_...`)
- Use Stripe CLI para webhooks locais
- Cartões de teste: https://stripe.com/docs/testing

### **Para Produção:**
1. Trocar chaves de teste pelas de produção (`sk_live_...`)
2. Configurar webhook no Dashboard do Stripe
3. URL: `https://seu-dominio.com/api/stripe/webhook`
4. Atualizar `STRIPE_WEBHOOK_SECRET` no `.env` de produção

---

## 📝 Próximos Passos (Opcional)

- [ ] Enviar email de boas-vindas após cadastro
- [ ] Página de gerenciamento de assinatura
- [ ] Botão para alterar plano
- [ ] Histórico de pagamentos
- [ ] Notificações de renovação

---

## 🆘 Troubleshooting

### **"Erro ao verificar pagamento"**
- Certifique-se que o Stripe CLI está rodando
- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto

### **"Usuário não encontrado"**
- Aguarde alguns segundos, o webhook pode estar processando
- Recarregue a página

### **"Pagamento não foi confirmado"**
- Verifique os logs do servidor
- Confirme que o webhook está recebendo eventos

---

✅ **Sistema implementado e funcionando!**
