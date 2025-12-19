param(
    [switch]$DevMode
)

Write-Host "🚀 Iniciando servidores Merfin.IA..." -ForegroundColor Green
Write-Host ""

$serverDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Função para iniciar servidor
function Start-Server {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Port
    )

    Write-Host "[$Name] Iniciando servidor ($Port)..." -ForegroundColor Yellow

    try {
        $job = Start-Job -ScriptBlock {
            param($cmd, $dir)
            Set-Location $dir
            Invoke-Expression $cmd
        } -ArgumentList $Command, $serverDir

        # Aguardar um pouco para verificar se iniciou
        Start-Sleep -Seconds 2

        # Verificar se o job ainda está rodando
        if ($job.State -eq "Running") {
            Write-Host "✅ $Name iniciado com sucesso!" -ForegroundColor Green
            return $job
        } else {
            Write-Host "❌ Falha ao iniciar $Name" -ForegroundColor Red
            Receive-Job $job
            return $null
        }
    }
    catch {
        Write-Host "❌ Erro ao iniciar $Name`: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Iniciar servidores
$jobs = @()

if ($DevMode) {
    $jobs += Start-Server -Name "Servidor Operacional" -Command "nodemon serverOperacional.js" -Port "5000"
    $jobs += Start-Server -Name "Servidor Agent" -Command "nodemon serverAgent.js" -Port "5001"
} else {
    $jobs += Start-Server -Name "Servidor Operacional" -Command "node serverOperacional.js" -Port "5000"
    $jobs += Start-Server -Name "Servidor Agent" -Command "node serverAgent.js" -Port "5001"
}

# Verificar se ambos iniciaram
$runningJobs = $jobs | Where-Object { $_ -ne $null }

if ($runningJobs.Count -eq 2) {
    Write-Host ""
    Write-Host "🎉 Ambos os servidores foram iniciados com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Servidor Operacional: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "🤖 Servidor Agent: http://localhost:5001" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Pressione Ctrl+C para parar os servidores" -ForegroundColor Yellow
    Write-Host ""

    # Manter script rodando
    try {
        while ($true) {
            Start-Sleep -Seconds 1

            # Verificar se algum job parou
            foreach ($job in $runningJobs) {
                if ($job.State -ne "Running") {
                    Write-Host "⚠️  Um dos servidores parou inesperadamente" -ForegroundColor Yellow
                    break
                }
            }
        }
    }
    finally {
        Write-Host ""
        Write-Host "🛑 Parando servidores..." -ForegroundColor Yellow

        foreach ($job in $runningJobs) {
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -ErrorAction SilentlyContinue
        }

        Write-Host "✅ Servidores parados!" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "❌ Falha ao iniciar todos os servidores" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow

    # Limpar jobs que falharam
    foreach ($job in $jobs) {
        if ($job) {
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -ErrorAction SilentlyContinue
        }
    }

    exit 1
}