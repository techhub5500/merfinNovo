@echo off
echo Iniciando servidores Merfin.IA...
echo.

echo [1/2] Iniciando servidor operacional (porta 5000)...
start "Servidor Operacional" cmd /k "cd /d %~dp0 && node serverOperacional.js"

timeout /t 2 /nobreak > nul

echo [2/2] Iniciando servidor agent (porta 5001)...
start "Servidor Agent" cmd /k "cd /d %~dp0 && node serverAgent.js"

echo.
echo ✅ Ambos os servidores foram iniciados!
echo.
echo 📊 Servidor Operacional: http://localhost:5000
echo 🤖 Servidor Agent: http://localhost:5001
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause > nul