# Script para iniciar ambos os servidores simultaneamente
# Executar: .\start-dev.ps1

Write-Host "`n🚀 Iniciando Merfin.IA em modo desenvolvimento...`n" -ForegroundColor Cyan

# Verificar se está na pasta raiz do projeto
if (-not (Test-Path ".\server\serverOperacional.js")) {
    Write-Host "❌ Erro: Execute este script na pasta raiz do projeto Merfin.IA" -ForegroundColor Red
    exit 1
}

# Verificar se node_modules existe
if (-not (Test-Path ".\server\node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
}

# Verificar se .env existe
if (-not (Test-Path ".\server\.env")) {
    Write-Host "⚠️  ATENÇÃO: Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "   Copie o arquivo .env.example para .env e configure suas credenciais" -ForegroundColor Yellow
    Write-Host "   Comando: Copy-Item server\.env.example server\.env`n" -ForegroundColor Yellow
    
    $resposta = Read-Host "Deseja continuar mesmo assim? (s/N)"
    if ($resposta -ne 's' -and $resposta -ne 'S') {
        exit 0
    }
}

Write-Host "✨ Iniciando servidores...`n" -ForegroundColor Green

# Iniciar servidor operacional em uma nova janela
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    Write-Host '🔵 SERVIDOR OPERACIONAL' -ForegroundColor Blue;
    Write-Host 'Porta: 5000' -ForegroundColor Cyan;
    Write-Host 'API: http://localhost:5000/api/status' -ForegroundColor Cyan;
    Write-Host '';
    cd server;
    node serverOperacional.js
"

# Aguardar 2 segundos
Start-Sleep -Seconds 2

# Iniciar servidor agent em uma nova janela
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    Write-Host '🤖 SERVIDOR AGENT (IA)' -ForegroundColor Magenta;
    Write-Host 'Porta: 5001' -ForegroundColor Cyan;
    Write-Host 'API: http://localhost:5001/health' -ForegroundColor Cyan;
    Write-Host '';
    cd server;
    node serverAgent.js
"

# Aguardar 3 segundos para servidores iniciarem
Start-Sleep -Seconds 3

Write-Host "`n✅ Servidores iniciados com sucesso!`n" -ForegroundColor Green
Write-Host "📋 URLs disponíveis:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:5000/html/index.html" -ForegroundColor White
Write-Host "   Chat:      http://localhost:5000/html/chat.html" -ForegroundColor White
Write-Host "   Dashboard: http://localhost:5000/html/minhas-financas.html" -ForegroundColor White
Write-Host "   Perfil:    http://localhost:5000/html/perfil.html" -ForegroundColor White
Write-Host "   Planos:    http://localhost:5000/html/planos.html" -ForegroundColor White
Write-Host "`n   API Status: http://localhost:5000/api/status" -ForegroundColor Gray
Write-Host "   Agent Health: http://localhost:5001/health" -ForegroundColor Gray
Write-Host "`n💡 Pressione Ctrl+C em cada janela para parar os servidores`n" -ForegroundColor Yellow
