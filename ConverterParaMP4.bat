@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ConverterParaMP4.ps1" %*
echo.
echo Se a janela chegou aqui, o conversor terminou ou mostrou um erro acima.
pause
