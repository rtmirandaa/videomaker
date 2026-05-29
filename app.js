const SLIDE_SECONDS = 5;
const INTRO_SECONDS = 4;
const TRANSITION_SECONDS = 0.75;
const FRAME_RATE = 15;
const WEBM_QUALITY = 0.95;
const INTRO_IMAGE_SRC = window.INTRO_IMAGE_DATA_URL || "assets/intro-igreja.png";
const COMMUNITY_NAME = "IGREJA EVANGÉLICA DE RINCÃO DEL REY";

const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const imageList = document.querySelector("#imageList");
const previewCanvas = document.querySelector("#previewCanvas");
const backgroundColor = document.querySelector("#backgroundColor");
const resolution = document.querySelector("#resolution");
const introMode = document.querySelector("#introMode");
const introVideoControl = document.querySelector("#introVideoControl");
const introVideoInput = document.querySelector("#introVideoInput");
const transitionMode = document.querySelector("#transitionMode");
const outputFormat = document.querySelector("#outputFormat");
const generateButton = document.querySelector("#generateButton");
const clearButton = document.querySelector("#clearButton");
const progress = document.querySelector("#progress");
const progressFill = document.querySelector("#progressFill");
const progressText = document.querySelector("#progressText");
const result = document.querySelector("#result");
const resultVideo = document.querySelector("#resultVideo");
const downloadLink = document.querySelector("#downloadLink");
const formatHelp = document.querySelector("#formatHelp");

const previewContext = previewCanvas.getContext("2d");
let slides = [];
let lastVideoUrl = "";
let introVideo = null;
let introVideoUrl = "";
const introBackgroundImage = new Image();
introBackgroundImage.crossOrigin = "anonymous";
introBackgroundImage.src = INTRO_IMAGE_SRC;

document.documentElement.dataset.encoder = window.WebMWriter ? "ready" : "missing";
drawEmptyPreview();

fileInput.addEventListener("change", (event) => {
  addFiles(event.target.files);
  fileInput.value = "";
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  addFiles(event.dataTransfer.files);
});

backgroundColor.addEventListener("input", () => {
  drawPreview();
});

resolution.addEventListener("change", () => {
  const { width, height } = getResolution();
  previewCanvas.width = width;
  previewCanvas.height = height;
  drawPreview();
});

introMode.addEventListener("change", () => {
  introVideoControl.hidden = introMode.value !== "video";
});

introVideoInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  introVideo = file ? await loadIntroVideo(file) : null;
});

generateButton.addEventListener("click", generateVideo);
clearButton.addEventListener("click", clearSlides);

function addFiles(fileList) {
  const imageFiles = [...fileList].filter((file) => file.type.startsWith("image/"));

  if (!imageFiles.length) {
    return;
  }

  Promise.all(imageFiles.map(loadSlide)).then((newSlides) => {
    slides = [...slides, ...newSlides];
    renderList();
    drawPreview();
    setButtons();
  });
}

function loadSlide(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        image,
        url,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Nao foi possivel carregar ${file.name}`));
    };

    image.src = url;
  });
}

function renderList() {
  imageList.innerHTML = "";

  slides.forEach((slide, index) => {
    const item = document.createElement("li");
    item.className = "image-item";

    const thumb = document.createElement("img");
    thumb.src = slide.url;
    thumb.alt = "";

    const info = document.createElement("div");
    info.className = "image-info";
    info.innerHTML = `<strong>${escapeHtml(slide.name)}</strong><span>${index + 1} de ${slides.length} - ${formatSize(slide.size)}</span>`;

    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.append(
      makeActionButton("^", "Mover para cima", () => moveSlide(index, -1), index === 0),
      makeActionButton("v", "Mover para baixo", () => moveSlide(index, 1), index === slides.length - 1),
      makeActionButton("x", "Remover", () => removeSlide(index), false, "remove"),
    );

    item.append(thumb, info, actions);
    imageList.append(item);
  });
}

function makeActionButton(text, title, onClick, disabled = false, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.title = title;
  button.setAttribute("aria-label", title);
  button.disabled = disabled;
  if (className) {
    button.className = className;
  }
  button.addEventListener("click", onClick);
  return button;
}

function moveSlide(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= slides.length) {
    return;
  }

  [slides[index], slides[target]] = [slides[target], slides[index]];
  renderList();
  drawPreview();
}

function removeSlide(index) {
  const [removed] = slides.splice(index, 1);
  URL.revokeObjectURL(removed.url);
  renderList();
  drawPreview();
  setButtons();
}

function clearSlides() {
  slides.forEach((slide) => URL.revokeObjectURL(slide.url));
  slides = [];
  renderList();
  drawPreview();
  setButtons();
}

function setButtons() {
  generateButton.disabled = slides.length === 0;
  clearButton.disabled = slides.length === 0;
}

function drawPreview() {
  if (!slides.length) {
    drawEmptyPreview();
    return;
  }

  drawSlide(previewContext, previewCanvas, slides[0].image);
}

function drawEmptyPreview() {
  previewContext.fillStyle = backgroundColor.value;
  previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewContext.fillStyle = "#667085";
  previewContext.textAlign = "center";
  previewContext.textBaseline = "middle";
  previewContext.font = "56px system-ui, sans-serif";
  previewContext.fillText("Adicione imagens para ver a previa", previewCanvas.width / 2, previewCanvas.height / 2);
}

function drawSlide(context, canvas, image) {
  context.fillStyle = backgroundColor.value;
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMediaContain(context, canvas, image);
}

function drawMediaContain(context, canvas, media, options = {}) {
  const alpha = options.alpha ?? 1;
  const scale = options.scale ?? 1;
  const offsetX = options.offsetX ?? 0;
  const offsetY = options.offsetY ?? 0;
  const mediaWidth = media.naturalWidth || media.videoWidth || media.width;
  const mediaHeight = media.naturalHeight || media.videoHeight || media.height;
  const canvasRatio = canvas.width / canvas.height;
  const mediaRatio = mediaWidth / mediaHeight;
  const width = (mediaRatio > canvasRatio ? canvas.width : canvas.height * mediaRatio) * scale;
  const height = (mediaRatio > canvasRatio ? canvas.width / mediaRatio : canvas.height) * scale;
  const x = (canvas.width - width) / 2 + offsetX;
  const y = (canvas.height - height) / 2 + offsetY;

  context.save();
  context.globalAlpha = alpha;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(media, x, y, width, height);
  context.restore();
}

function drawMediaCover(context, canvas, media, options = {}) {
  const alpha = options.alpha ?? 1;
  const scale = options.scale ?? 1;
  const mediaWidth = media.naturalWidth || media.videoWidth || media.width;
  const mediaHeight = media.naturalHeight || media.videoHeight || media.height;
  const canvasRatio = canvas.width / canvas.height;
  const mediaRatio = mediaWidth / mediaHeight;
  const width = (mediaRatio > canvasRatio ? canvas.height * mediaRatio : canvas.width) * scale;
  const height = (mediaRatio > canvasRatio ? canvas.height : canvas.width / mediaRatio) * scale;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;

  context.save();
  context.globalAlpha = alpha;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(media, x, y, width, height);
  context.restore();
}

async function generateVideo() {
  if (!slides.length) {
    return;
  }

  if (!window.WebMWriter) {
    alert("O encoder de video nao foi carregado. Recarregue a pagina e tente novamente.");
    return;
  }

  if (introMode.value === "video" && !introVideo) {
    alert("Selecione o arquivo de video da intro antes de gerar.");
    return;
  }

  resetResult();
  setGenerationState(true);

  try {
    const { width, height } = getResolution();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const writer = new WebMWriter({
      quality: WEBM_QUALITY,
      frameDuration: 1000 / FRAME_RATE,
    });
    const totalSteps = getGenerationStepCount();
    let completedSteps = 0;

    if (introMode.value === "simple") {
      await ensureImageLoaded(introBackgroundImage);
      completedSteps = await addSimpleIntro(context, canvas, writer, completedSteps, totalSteps);
    }

    if (introMode.value === "video") {
      completedSteps = await addVideoIntro(context, canvas, writer, completedSteps, totalSteps);
    }

    for (let index = 0; index < slides.length; index += 1) {
      await addStillSlide(context, canvas, writer, slides[index].image);
      completedSteps += 1;
      updateProgress((completedSteps / totalSteps) * 90, `Preparando imagem ${index + 1} de ${slides.length}`);
      await waitForUiUpdate();

      if (index < slides.length - 1 && transitionMode.value !== "none") {
        completedSteps = await addTransition(
          context,
          canvas,
          writer,
          slides[index].image,
          slides[index + 1].image,
          completedSteps,
          totalSteps,
        );
      }
    }

    updateProgress(95, "Finalizando video...");
    const blob = await writer.complete();

    lastVideoUrl = URL.createObjectURL(blob);
    resultVideo.src = lastVideoUrl;
    resultVideo.load();
    downloadLink.href = lastVideoUrl;
    const fileName = `patrocinadores-${new Date().toISOString().slice(0, 10)}.webm`;
    downloadLink.download = fileName;
    downloadLink.textContent = outputFormat.value === "mp4" ? "Baixar WebM para converter em MP4" : "Baixar video WebM";
    formatHelp.hidden = outputFormat.value !== "mp4";
    formatHelp.textContent =
      "Para MP4, baixe este WebM e rode no PowerShell: .\\ConverterParaMP4.ps1 -Entrada \".\\Downloads\\" +
      fileName +
      "\". O navegador gera WebM de forma confiavel; o MP4 e feito pelo conversor com FFmpeg.";
    result.hidden = false;
    updateProgress(100, outputFormat.value === "mp4" ? "WebM pronto para converter em MP4." : "Video pronto para baixar.");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    alert(`Nao foi possivel gerar o video.\n\nDetalhe: ${message}`);
  } finally {
    setGenerationState(false);
  }
}

async function addStillSlide(context, canvas, writer, image) {
  const frameCount = Math.round(SLIDE_SECONDS * FRAME_RATE);

  for (let frame = 0; frame < frameCount; frame += 1) {
    drawSlide(context, canvas, image);
    writer.addFrame(canvas);
  }

  await waitForUiUpdate();
}

async function addSimpleIntro(context, canvas, writer, completedSteps, totalSteps) {
  const frameCount = Math.round(INTRO_SECONDS * FRAME_RATE);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const amount = frame / Math.max(1, frameCount - 1);
    drawIntroFrame(context, canvas, amount);
    writer.addFrame(canvas);
    completedSteps += 1 / frameCount;
    updateProgress((completedSteps / totalSteps) * 90, "Preparando intro simples");
    await waitForUiUpdate();
  }

  return completedSteps;
}

function drawIntroFrame(context, canvas, amount) {
  const eased = easeInOut(amount);
  const fadeIn = Math.min(1, amount * 4);
  const fadeOut = Math.min(1, (1 - amount) * 4);
  const alpha = Math.min(fadeIn, fadeOut);

  context.fillStyle = "#030706";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMediaCover(context, canvas, introBackgroundImage, { scale: 1 + eased * 0.035 });

  const overlay = context.createLinearGradient(0, 0, 0, canvas.height);
  overlay.addColorStop(0, "rgba(0, 0, 0, 0.58)");
  overlay.addColorStop(0.48, "rgba(0, 0, 0, 0.22)");
  overlay.addColorStop(1, "rgba(0, 0, 0, 0.76)");
  context.fillStyle = overlay;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(0, 0, 0, 0.22)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.globalAlpha = alpha;
  context.shadowColor = "rgba(0, 0, 0, 0.75)";
  context.shadowBlur = Math.max(8, canvas.width * 0.012);
  context.shadowOffsetY = Math.max(3, canvas.height * 0.006);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `800 ${Math.max(20, Math.round(canvas.width * 0.035))}px system-ui, sans-serif`;
  drawTextFit(context, COMMUNITY_NAME, canvas.width / 2, canvas.height * 0.43, canvas.width * 0.86);
  context.font = `900 ${Math.max(36, Math.round(canvas.width * 0.075))}px system-ui, sans-serif`;
  drawTextFit(context, "PATROCINADORES", canvas.width / 2, canvas.height * 0.54, canvas.width * 0.86);
  context.font = `500 ${Math.max(18, Math.round(canvas.width * 0.024))}px system-ui, sans-serif`;
  drawTextFit(context, "Obrigado pelo apoio", canvas.width / 2, canvas.height * 0.63, canvas.width * 0.72);
  context.restore();
}

async function addVideoIntro(context, canvas, writer, completedSteps, totalSteps) {
  const duration = Number.isFinite(introVideo.duration) ? introVideo.duration : 0;
  const frameCount = Math.max(1, Math.round(duration * FRAME_RATE));
  introVideo.pause();

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = Math.min(duration, frame / FRAME_RATE);
    await seekVideo(introVideo, time);
    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMediaContain(context, canvas, introVideo);
    writer.addFrame(canvas);
    completedSteps += 1 / frameCount;
    updateProgress((completedSteps / totalSteps) * 90, "Preparando intro em video");
    await waitForUiUpdate();
  }

  return completedSteps;
}

async function addTransition(context, canvas, writer, fromImage, toImage, completedSteps, totalSteps) {
  const frameCount = Math.max(1, Math.round(TRANSITION_SECONDS * FRAME_RATE));

  for (let frame = 1; frame <= frameCount; frame += 1) {
    const amount = easeInOut(frame / frameCount);
    drawTransitionFrame(context, canvas, fromImage, toImage, amount);
    writer.addFrame(canvas);
    completedSteps += 1 / frameCount;
    updateProgress((completedSteps / totalSteps) * 90, "Preparando transicoes");
    await waitForUiUpdate();
  }

  return completedSteps;
}

function drawTransitionFrame(context, canvas, fromImage, toImage, amount) {
  context.fillStyle = backgroundColor.value;
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (transitionMode.value === "slide") {
    drawMediaContain(context, canvas, fromImage, { offsetX: -canvas.width * amount });
    drawMediaContain(context, canvas, toImage, { offsetX: canvas.width * (1 - amount) });
    return;
  }

  if (transitionMode.value === "zoom") {
    drawMediaContain(context, canvas, fromImage, { alpha: 1 - amount, scale: 1 + amount * 0.05 });
    drawMediaContain(context, canvas, toImage, { alpha: amount, scale: 1.05 - amount * 0.05 });
    return;
  }

  drawMediaContain(context, canvas, fromImage, { alpha: 1 - amount });
  drawMediaContain(context, canvas, toImage, { alpha: amount });
}

function getGenerationStepCount() {
  const introSteps = introMode.value === "simple" ? 1 : introMode.value === "video" && introVideo ? 1 : 0;
  const transitionSteps = transitionMode.value === "none" ? 0 : Math.max(0, slides.length - 1);
  return Math.max(1, introSteps + slides.length + transitionSteps);
}

function loadIntroVideo(file) {
  if (introVideoUrl) {
    URL.revokeObjectURL(introVideoUrl);
  }

  introVideoUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = introVideoUrl;
    video.addEventListener("loadedmetadata", () => resolve(video), { once: true });
    video.addEventListener("error", () => reject(new Error("Nao foi possivel carregar a intro.")), { once: true });
  });
}

function seekVideo(video, time) {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.02) {
      resolve();
      return;
    }

    video.addEventListener("seeked", () => resolve(), { once: true });
    video.currentTime = time;
  });
}

function easeInOut(value) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function ensureImageLoaded(image) {
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => reject(new Error("Nao foi possivel carregar a imagem da intro.")), {
      once: true,
    });
  });
}

function drawTextFit(context, text, x, y, maxWidth) {
  const currentFont = context.font;
  const match = currentFont.match(/(\d+(?:\.\d+)?)px/);
  const originalSize = match ? Number(match[1]) : 32;
  let fontSize = originalSize;

  while (context.measureText(text).width > maxWidth && fontSize > 14) {
    fontSize -= 2;
    context.font = currentFont.replace(/(\d+(?:\.\d+)?)px/, `${fontSize}px`);
  }

  context.fillText(text, x, y);
  context.font = currentFont;
}

function waitForUiUpdate() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function setGenerationState(isGenerating) {
  generateButton.disabled = isGenerating || slides.length === 0;
  clearButton.disabled = isGenerating || slides.length === 0;
  fileInput.disabled = isGenerating;
  introMode.disabled = isGenerating;
  introVideoInput.disabled = isGenerating;
  transitionMode.disabled = isGenerating;
  outputFormat.disabled = isGenerating;
  if (isGenerating) {
    progress.hidden = false;
    updateProgress(0, "Preparando video...");
  }
}

function updateProgress(percent, text) {
  progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  progressText.textContent = text;
}

function resetResult() {
  if (lastVideoUrl) {
    URL.revokeObjectURL(lastVideoUrl);
    lastVideoUrl = "";
  }

  result.hidden = true;
  formatHelp.hidden = true;
  formatHelp.textContent = "";
  resultVideo.removeAttribute("src");
  resultVideo.load();
}

function getResolution() {
  const [width, height] = resolution.value.split("x").map(Number);
  return { width, height };
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}
