param(
  [string]$Entrada = "",
  [string]$Saida = ""
)

$ErrorActionPreference = "Stop"

function Resolve-LocalPath([string]$PathValue) {
  return $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($PathValue)
}

function Wait-ToClose {
  Write-Host ""
  Read-Host "Pressione Enter para fechar"
}

try {
  Set-Location -LiteralPath $PSScriptRoot

  $ffmpeg = Resolve-LocalPath ".\tools\ffmpeg\ffmpeg.exe"

  while (!$Entrada) {
    Write-Host ""
    Write-Host "Digite o caminho do arquivo .webm que voce quer converter."
    Write-Host "Dica: voce pode arrastar o arquivo para esta janela e apertar Enter."
    Write-Host ""
    $Entrada = (Read-Host "Arquivo WebM").Trim().Trim('"')

    if (!$Entrada) {
      Write-Host "Nenhum arquivo informado."
    }
  }

  if (!(Test-Path -LiteralPath $ffmpeg)) {
    Write-Host ""
    Write-Host "FFmpeg ainda nao esta pronto em tools\ffmpeg\ffmpeg.exe."
    Write-Host "Rode InstalarFFmpeg.ps1 uma vez e tente novamente."
    Wait-ToClose
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

  Write-Host ""
  Write-Host "Convertendo para MP4..."
  Write-Host "Entrada: $inputPath"
  Write-Host "Saida:   $outputPath"
  Write-Host ""

  & $ffmpeg -y -i $inputPath -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -movflags +faststart -an $outputPath

  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao converter para MP4. Codigo do FFmpeg: $LASTEXITCODE"
  }

  Write-Host ""
  Write-Host "Pronto: $outputPath"
  Wait-ToClose
}
catch {
  Write-Host ""
  Write-Host "Nao foi possivel converter para MP4."
  Write-Host $_.Exception.Message
  Wait-ToClose
  exit 1
}
