# Gerador de video de patrocinadores

Aplicacao simples para gerar um video com imagens de patrocinadores.

## Como usar

1. Abra `index.html` no navegador, ou use o endereco local informado pelo Codex quando o servidor estiver rodando.
2. Clique em **Selecionar imagens** ou arraste as imagens para a area marcada.
3. Use as setas para organizar a ordem.
4. Escolha o fundo e a resolucao, incluindo `720 x 480` quando precisar desse formato.
5. Escolha uma intro, se quiser: sem intro, intro simples com a foto da igreja ou intro em video.
6. Escolha uma transicao, se quiser: sem transicao, fade, deslizar ou zoom suave.
7. Escolha o formato: WebM direto ou MP4 via conversor.
8. Clique em **Gerar video**.
9. Quando terminar, clique em **Baixar video**.

Cada imagem fica na tela por 5 segundos. Com 55 fotos e sem intro/transicao, o video fica com cerca de 4 minutos e 35 segundos. O navegador gera `.webm` de forma direta e confiavel. Para MP4, baixe o WebM e converta com `.\ConverterParaMP4.ps1`. A intro em video entra sem audio, porque o gerador exporta apenas a faixa visual.

## Converter WebM para MP4

Rode `.\InstalarFFmpeg.ps1` uma vez. Depois use:

```powershell
.\ConverterParaMP4.ps1 -Entrada ".\patrocinadores.webm"
```

Para escolher o nome de saida:

```powershell
.\ConverterParaMP4.ps1 -Entrada ".\patrocinadores.webm" -Saida ".\patrocinadores.mp4"
```

## Adicionar imagens no final de um video pronto

Para nao gerar tudo de novo quando chegarem novas imagens:

1. Rode `.\InstalarFFmpeg.ps1` uma vez, para preparar o FFmpeg portatil.
2. Coloque as novas imagens na pasta `novas-imagens`.
3. Deixe o video atual na raiz do projeto. Por padrao, o script usa o arquivo `.mp4`.
4. Rode:

```powershell
.\AdicionarFotos.ps1
```

O script cria `video-atualizado.mp4`, anexando as novas fotos no final. Cada imagem nova fica 5 segundos. Se o video base tiver outro nome, use:

```powershell
.\AdicionarFotos.ps1 -VideoBase ".\meu-video.mp4" -Saida ".\video-atualizado.mp4"
```
