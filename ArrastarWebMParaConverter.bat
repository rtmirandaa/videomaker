@echo off
cd /d "%~dp0"
if "%~1"=="" (
  echo Arraste um arquivo .webm em cima deste .bat para converter para MP4.
  echo.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ConverterParaMP4.ps1" -Entrada "%~1"
echo.
echo Se a janela chegou aqui, o conversor terminou ou mostrou um erro acima.
pause
