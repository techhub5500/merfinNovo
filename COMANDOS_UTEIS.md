# 🛠️ Comandos Úteis - Merfin.IA

## 📦 Instalação

### Instalar dependências
```bash
cd server
npm install
```

## 🚀 Desenvolvimento Local

### Iniciar ambos os servidores (Windows - PowerShell)
```powershell
.\start-dev.ps1
```

### Iniciar servidores manualmente

#### Servidor Operacional
```bash
cd server
node serverOperacional.js
```

#### Servidor Agent
```bash
cd server  
node serverAgent.js
```

### Abrir aplicação no navegador
```
http://localhost:5000/html/index.html
```

## 🧪 Testes

### Testar API Operacional
```bash
# Status do servidor
curl http://localhost:5000/api/status

# Cadastro de usuário
curl -X POST http://localhost:5000/api/auth/cadastro \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"Teste\",\"email\":\"teste@email.com\",\"senha\":\"123456\"}"

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"teste@email.com\",\"senha\":\"123456\"}"
```

### Testar API Agent
```bash
# Health check
curl http://localhost:5001/health

# Chat (precisa de token)
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d "{\"message\":\"Olá, quanto gastei este mês?\"}"
```

## 🔐 Configuração

### Copiar template de .env
```bash
# Windows
Copy-Item server\.env.example server\.env

# Linux/Mac
cp server/.env.example server/.env
```

### Gerar JWT_SECRET seguro
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📊 MongoDB

### Conectar ao MongoDB Atlas (exemplo)
```bash
mongosh "mongodb+srv://cluster.mongodb.net/merfin" --apiVersion 1 --username usuario
```

### Verificar dados
```javascript
// Listar usuários
db.users.find().pretty()

// Listar assinaturas
db.subscriptions.find().pretty()

// Contar documentos
db.users.countDocuments()
db.subscriptions.countDocuments()

// Limpar dados de teste
db.users.deleteOne({email: "teste@email.com"})
```

## 💳 Stripe

### Instalar Stripe CLI
```bash
# Windows (Scoop)
scoop install stripe

# Mac (Homebrew)
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.17.2/stripe_1.17.2_linux_x86_64.tar.gz
tar -xvf stripe_1.17.2_linux_x86_64.tar.gz
```

### Login no Stripe
```bash
stripe login
```

### Testar webhook localmente
```bash
stripe listen --forward-to localhost:5000/api/pagamentos/webhook
```

### Enviar evento de teste
```bash
stripe trigger checkout.session.completed
```

### Ver logs de webhooks
```bash
stripe logs tail
```

## 🌐 Deploy no Render

### Via CLI (opcional)
```bash
# Instalar Render CLI
npm install -g @render-com/cli

# Login
render login

# Deploy
render deploy
```

### Via Git (recomendado)
```bash
git add .
git commit -m "Preparar para deploy no Render"
git push origin main
```

## 🔍 Debugging

### Ver logs do servidor em tempo real (desenvolvimento)
Os logs aparecem automaticamente no terminal onde o servidor foi iniciado.

### Ver logs no Render (produção)
1. Acesse Dashboard do Render
2. Selecione o serviço
3. Clique em "Logs" no menu lateral

### Logs com filtro
```bash
# Filtrar por erro
# No Windows PowerShell
node serverOperacional.js 2>&1 | Select-String "erro|error"

# No Linux/Mac
node serverOperacional.js 2>&1 | grep -i error
```

## 🧹 Limpeza

### Limpar node_modules
```bash
cd server
Remove-Item -Recurse -Force node_modules  # Windows PowerShell
rm -rf node_modules  # Linux/Mac
```

### Reinstalar dependências
```bash
cd server
npm install
```

### Limpar cache do npm
```bash
npm cache clean --force
```

## 📝 Git

### Inicializar repositório
```bash
git init
git add .
git commit -m "Initial commit - Merfin.IA"
```

### Conectar ao GitHub
```bash
git remote add origin https://github.com/seu-usuario/merfin-ia.git
git branch -M main
git push -u origin main
```

### Criar .gitignore
Já está criado! Mas se precisar verificar:
```bash
cat .gitignore  # Linux/Mac
Get-Content .gitignore  # Windows PowerShell
```

## 🔄 Atualização

### Atualizar dependências
```bash
cd server
npm update
```

### Verificar dependências desatualizadas
```bash
npm outdated
```

### Atualizar package.json
```bash
npm install <pacote>@latest
```

## 📊 Monitoramento

### Verificar uso de porta
```bash
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :5001

# Linux/Mac
lsof -i :5000
lsof -i :5001
```

### Matar processo em uma porta
```bash
# Windows PowerShell (rodar como Admin)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Linux/Mac
kill -9 $(lsof -t -i:5000)
```

## 🚨 Emergência

### Restaurar .env de backup
```bash
# Se você fez backup
Copy-Item server\.env.backup server\.env  # Windows
cp server/.env.backup server/.env  # Linux/Mac
```

### Reverter última mudança no Git
```bash
git reset --hard HEAD~1
```

### Ver diferenças antes de commitar
```bash
git diff
```

## 📚 Documentação

### Abrir documentação local
```
README.md - Visão geral do projeto
DEPLOY_RENDER.md - Guia de deploy
CHECKLIST_DEPLOY.md - Checklist pré-deploy
RESUMO_ALTERACOES.md - Mudanças implementadas
```

### Links úteis
- [Render Docs](https://render.com/docs)
- [Stripe API](https://stripe.com/docs/api)
- [OpenAI API](https://platform.openai.com/docs)
- [MongoDB Atlas](https://docs.atlas.mongodb.com)

---

**Desenvolvido para Merfin.IA** 🤖💰
