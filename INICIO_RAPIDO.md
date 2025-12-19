# 🚀 Início Rápido - Merfin.IA

## Para iniciar TODOS os servidores de uma vez:

### Windows (PowerShell)
```powershell
cd server
.\start-servers.ps1
```

### Ou via npm:
```bash
cd server
npm run start:windows
```

## O que será iniciado:
- 📊 **Servidor Principal** (porta 5000) - API principal, autenticação, perfil
- 🤖 **Servidor Agent** (porta 5001) - Chat com IA (OpenAI)

## Após iniciar:
Abra no navegador: `client/html/chat.html`

## Para parar:
Pressione `Ctrl+C` no terminal onde os servidores estão rodando.

---
**Nota**: Certifique-se de ter executado `npm install` na pasta server primeiro!