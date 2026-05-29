param(
  [string]$Entrada = "",
  [string]$Saida = ""
)

$ErrorActionPreference = "Stop"

function Resolve-LocalPath([string]$PathValue) {
  return $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($PathValue)
}

$ffmpeg = Resolve-LocalPath ".\tools\ffmpeg\ffmpeg.exe"

if (!$Entrada) {
  Write-Host ""
  Write-Host "Digite o caminho do arquivo .webm que voce quer converter."
  Write-Host "Dica: voce pode arrastar o arquivo para esta janela e apertar Enter."
  Write-Host ""
  $Entrada = Read-Host "Arquivo WebM"
  $Entrada = $Entrada.Trim().Trim('"')
}

if (!(Test-Path -LiteralPath $ffmpeg)) {
  Write-Host ""
  Write-Host "FFmpeg ainda nao esta pronto em tools\ffmpeg\ffmpeg.exe."
  Write-Host "Rode .\InstalarFFmpeg.ps1 uma vez e tente novamente."
  exit 1
}

$inputPath = Resolve-LocalPath $Entrada

if (!(Test-Path -LiteralPath $inputPath)) {
  throw "Arquivo de entrada nao encontrado: $inputPath"
}

if (!$Saida) {
  $folder = Split-Path -Parent $inputPath
  $name = [System.IO.Path]::GetFileNameWithoutExtension($inputPath)
  $Saida = Join-Path $folder ($name + ".mp4")
}

$outputPath = Resolve-LocalPath $Saida

Write-Host "Convertendo para MP4..."
& $ffmpeg -y -i $inputPath -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -movflags +faststart -an $outputPath

if ($LASTEXITCODE -ne 0) {
  throw "Falha ao converter para MP4."
}

Write-Host ""
Write-Host "Pronto: $outputPath"
Write-Host ""
Read-Host "Pressione Enter para fechar"
