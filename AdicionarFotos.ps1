param(
  [string]$VideoBase = ".\.mp4",
  [string]$PastaImagens = ".\novas-imagens",
  [string]$Saida = ".\video-atualizado.mp4",
  [int]$SegundosPorImagem = 5,
  [string]$CorFundo = "white"
)

$ErrorActionPreference = "Stop"

function Resolve-LocalPath([string]$PathValue) {
  $resolved = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($PathValue)
  return $resolved
}

$ffmpeg = Resolve-LocalPath ".\tools\ffmpeg\ffmpeg.exe"
$ffprobe = Resolve-LocalPath ".\tools\ffmpeg\ffprobe.exe"

if (!(Test-Path -LiteralPath $ffmpeg)) {
  Write-Host ""
  Write-Host "FFmpeg ainda nao esta pronto em tools\ffmpeg\ffmpeg.exe."
  Write-Host "Baixe o pacote essentials em https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
  Write-Host "Depois copie ffmpeg.exe e ffprobe.exe para tools\ffmpeg\."
  exit 1
}

$videoBasePath = Resolve-LocalPath $VideoBase
$imagesPath = Resolve-LocalPath $PastaImagens
$outputPath = Resolve-LocalPath $Saida

if (!(Test-Path -LiteralPath $videoBasePath)) {
  throw "Video base nao encontrado: $videoBasePath"
}

if (!(Test-Path -LiteralPath $imagesPath)) {
  New-Item -ItemType Directory -Force -Path $imagesPath | Out-Null
  throw "Pasta de imagens criada em $imagesPath. Coloque as novas imagens nela e rode de novo."
}

$images = Get-ChildItem -LiteralPath $imagesPath -File |
  Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|webp|bmp)$' } |
  Sort-Object Name

if (!$images) {
  throw "Nenhuma imagem encontrada em $imagesPath."
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("patrocinadores-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

try {
  $width = 1280
  $height = 720

  if (Test-Path -LiteralPath $ffprobe) {
    $probe = & $ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 $videoBasePath
    if ($probe -match '^(\d+)x(\d+)$') {
      $width = [int]$Matches[1]
      $height = [int]$Matches[2]
    }
  }

  $imageList = Join-Path $tempRoot "imagens.txt"
  $segment = Join-Path $tempRoot "novas-imagens.mp4"
  $concatList = Join-Path $tempRoot "juntar.txt"
  $safeOutput = $outputPath

  $imageListLines = New-Object System.Collections.Generic.List[string]
  foreach ($image in $images) {
    $escaped = $image.FullName.Replace("'", "'\''")
    $imageListLines.Add("file '$escaped'")
    $imageListLines.Add("duration $SegundosPorImagem")
  }
  $last = $images[-1].FullName.Replace("'", "'\''")
  $imageListLines.Add("file '$last'")
  [System.IO.File]::WriteAllLines($imageList, $imageListLines, [System.Text.Encoding]::UTF8)

  $scale = "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${CorFundo},format=yuv420p"

  Write-Host "Criando trecho novo com $($images.Count) imagem(ns)..."
  & $ffmpeg -y -f concat -safe 0 -i $imageList -vf $scale -r 30 -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -an $segment
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao criar o trecho novo."
  }

  [System.IO.File]::WriteAllLines($concatList, @(
    "file '$($videoBasePath.Replace("'", "'\''"))'",
    "file '$($segment.Replace("'", "'\''"))'"
  ), [System.Text.Encoding]::UTF8)

  Write-Host "Tentando anexar sem reprocessar o video antigo..."
  & $ffmpeg -y -f concat -safe 0 -i $concatList -c copy $safeOutput

  if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $safeOutput)) {
    Write-Host "Anexo rapido falhou; fazendo modo compativel."
    & $ffmpeg -y -i $videoBasePath -i $segment -filter_complex "[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${CorFundo},format=yuv420p[v0];[1:v]format=yuv420p[v1];[v0][v1]concat=n=2:v=1:a=0[v]" -map "[v]" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p $safeOutput
    if ($LASTEXITCODE -ne 0) {
      throw "Falha ao juntar os videos."
    }
  }

  Write-Host ""
  Write-Host "Pronto: $safeOutput"
}
finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
