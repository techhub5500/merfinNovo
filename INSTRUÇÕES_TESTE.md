# 📋 INSTRUÇÕES PARA TESTE DO SISTEMA DE PAGAMENTO

## ✅ Correção Aplicada

O erro `userId: undefined` foi corrigido! Agora o sistema está validando o userId antes de fazer qualquer consulta.

## 🧹 PASSO 1: Limpar Dados Antigos

Antes de testar, **LIMPE O NAVEGADOR** para remover dados de tentativas anteriores:

```javascript
// Abra o Console do navegador (F12) e execute:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

OU manualmente:
1. Pressione `F12` no navegador
2. Vá em **Application** (Chrome) ou **Armazenamento** (Firefox)
3. Clique em **Local Storage** → `http://localhost:5000`
4. Clique com botão direito → **Clear**
5. Faça o mesmo para **Session Storage**
6. Recarregue a página (F5)

## 🚀 PASSO 2: Iniciar Servidores

### Terminal 1 - Stripe CLI (DEVE ESTAR RODANDO):
```bash
stripe listen --forward-to localhost:5000/api/pagamentos/webhook
```

### Terminal 2 - Servidor Node.js:
```bash
cd server
npm start
```

## 🧪 PASSO 3: Fluxo de Teste Completo

### A) NOVO CADASTRO

1. **Acesse:** `http://localhost:5000/html/chat.html`
2. **Clique em "Cadastro"**
3. **Preencha os dados:**
   - Nome: Seu nome
   - Email: teste@exemplo.com (use um email novo)
   - Senha: 123456
   - Confirmar Senha: 123456
4. **Selecione um plano:** Mensal (R$ 20) ou Anual (R$ 190)
5. **Clique em "Cadastrar"**
6. **Uma nova aba abrirá** com a página de pagamento do Stripe
7. **Complete o pagamento:**
   - Cartão de teste: `4242 4242 4242 4242`
   - Data: Qualquer data futura (ex: 12/26)
   - CVC: Qualquer 3 números (ex: 123)
   - Nome: Qualquer nome
8. **Após confirmar o pagamento:**
   - Você será redirecionado para uma página de sucesso do Stripe
   - **VOLTE para a aba original da plataforma**
   - **RECARREGUE a página (F5)**
9. **Sistema vai:**
   - Detectar que você voltou do Stripe
   - Mostrar "⏳ Verificando pagamento..."
   - Buscar seu pagamento no Stripe
   - Criar sua conta no MongoDB
   - Criar sua assinatura
   - Fazer login automático
   - Redirecionar para o chat

### B) TESTE DE LOGIN (após cadastro bem-sucedido)

1. **Faça logout** (se estiver logado)
2. **Acesse novamente:** `http://localhost:5000/html/chat.html`
3. **Clique em "Login"**
4. **Preencha:**
   - Email: teste@exemplo.com
   - Senha: 123456
5. **Clique em "Entrar"**
6. **Sistema vai:**
   - Validar suas credenciais
   - Gerar token JWT
   - Fazer login e redirecionar

## 🔍 PASSO 4: Verificar Logs

### Logs do Stripe CLI (Terminal 1):
Você deve ver eventos como:
```
✅ customer.created
✅ checkout.session.completed
✅ customer.subscription.created
✅ invoice.paid
```

### Logs do Servidor Node.js (Terminal 2):

**Quando webhook recebe o pagamento:**
```
💳 [CHECKOUT COMPLETED] Pagamento concluído!
📧 Customer Email: teste@exemplo.com
🔗 Client Reference ID: teste@exemplo.com
💰 Amount Total: 20
```

**Quando você recarrega a página:**
```
🎯 [FINALIZAR CADASTRO] Iniciando processo...
📝 Dados recebidos:
   Nome: Seu Nome
   Email: teste@exemplo.com
   Plano: mensal
🔍 Verificando pagamento no Stripe...
✅ Cliente encontrado no Stripe: cus_xxxxx
✅ Assinatura ativa encontrada: sub_xxxxx
👤 Criando usuário no MongoDB...
✅ Usuário criado com sucesso: 676fxxxxxxxxxxxx
💳 Criando registro de assinatura...
✅ Assinatura criada com sucesso
✅ Token gerado com sucesso
```

**Login bem-sucedido:**
```
📨 [2025-12-27T16:15:23.920Z] POST /api/auth/login
✅ Login realizado com sucesso
```

## ❌ PROBLEMAS COMUNS

### 1. "Pagamento não encontrado"
- **Causa:** Webhook ainda não processou ou email não corresponde
- **Solução:** Aguarde 5-10 segundos e recarregue (F5)

### 2. "Email já cadastrado"
- **Causa:** Tentativa anterior criou o usuário parcialmente
- **Solução 1:** Use um email diferente
- **Solução 2:** Ou faça login com o email existente

### 3. "Token inválido" ao tentar acessar
- **Causa:** Token expirou ou é inválido
- **Solução:** Faça logout e login novamente

### 4. Webhook não recebe eventos
- **Causa:** Stripe CLI não está rodando
- **Solução:** Inicie o Stripe CLI no terminal 1

## 📊 VERIFICAR NO STRIPE DASHBOARD

1. Acesse: https://dashboard.stripe.com/test/customers
2. Você deve ver o cliente criado
3. Clique no cliente para ver a assinatura ativa

## 🎉 SUCESSO!

Se você conseguir:
- ✅ Criar conta após pagamento
- ✅ Fazer login
- ✅ Acessar o chat

**O sistema está funcionando perfeitamente!** 🚀

---

## 💡 NOTAS IMPORTANTES

1. **SEMPRE limpe o localStorage** antes de novos testes
2. **SEMPRE mantenha o Stripe CLI rodando** durante os testes
3. **Aguarde alguns segundos** após o pagamento antes de recarregar
4. **Use emails diferentes** para cada teste se houver problemas
5. Este é o **modo de teste** do Stripe - nenhum pagamento real é processado

## 🆘 SUPORTE

Se mesmo após seguir todos os passos você encontrar erros:
1. Copie os logs completos do terminal do servidor
2. Copie os logs do Stripe CLI
3. Abra o Console do navegador (F12) e copie os erros
4. Me envie todas essas informações
