$ErrorActionPreference = "Stop"

$tools = Join-Path $PSScriptRoot "tools"
$zip = Join-Path $tools "ffmpeg-release-essentials.zip"
$extract = Join-Path $tools "ffmpeg-extract"
$target = Join-Path $tools "ffmpeg"
$url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"

New-Item -ItemType Directory -Force -Path $tools | Out-Null
New-Item -ItemType Directory -Force -Path $target | Out-Null

if (!(Test-Path (Join-Path $target "ffmpeg.exe"))) {
  Write-Host "Baixando FFmpeg portatil..."
  curl.exe -L -C - -o $zip $url

  Write-Host "Extraindo FFmpeg..."
  if (Test-Path $extract) {
    Remove-Item -LiteralPath $extract -Recurse -Force
  }
  Expand-Archive -LiteralPath $zip -DestinationPath $extract -Force

  $ffmpeg = Get-ChildItem -Path $extract -Recurse -Filter ffmpeg.exe | Select-Object -First 1
  $ffprobe = Get-ChildItem -Path $extract -Recurse -Filter ffprobe.exe | Select-Object -First 1

  if (!$ffmpeg) {
    throw "Nao encontrei ffmpeg.exe dentro do pacote baixado."
  }

  Copy-Item -LiteralPath $ffmpeg.FullName -Destination (Join-Path $target "ffmpeg.exe") -Force
  if ($ffprobe) {
    Copy-Item -LiteralPath $ffprobe.FullName -Destination (Join-Path $target "ffprobe.exe") -Force
  }
}

& (Join-Path $target "ffmpeg.exe") -version | Select-Object -First 1
Write-Host "FFmpeg pronto em tools\ffmpeg."
