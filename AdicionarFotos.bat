@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0AdicionarFotos.ps1" %*
echo.
echo Se a janela chegou aqui, o processo terminou ou mostrou um erro acima.
pause
