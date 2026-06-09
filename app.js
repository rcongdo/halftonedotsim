const canvas = document.querySelector("#halftoneCanvas");
const controlStrip = document.querySelector("#controlStrip");
const modeTitle = document.querySelector("#modeTitle");
const modeButtons = document.querySelectorAll(".mode-button");
const singleMeter = document.querySelector("#singleMeter");
const singleControls = document.querySelector("#singleControls");
const cmykControls = document.querySelector("#cmykControls");
const singleSlider = document.querySelector("#coverageSlider");
const singleValue = document.querySelector("#coverageValue");
const singleAngleSlider = document.querySelector("#singleAngleSlider");
const singleAngleValue = document.querySelector("#singleAngleValue");
const ctx = canvas.getContext("2d");
const dotGainInput = document.querySelector("#dotGainInput");
const minDotInput = document.querySelector("#minDotInput");
const minDotPrintedInput = document.querySelector("#minDotPrintedInput");
const dotGainApplyButton = document.querySelector("#dotGainApplyButton");
const dotGainTrigger = document.querySelector("#dotGainTrigger");
const dotGainPopover = document.querySelector("#dotGainPopover");
const lpiSlider = document.querySelector("#lpiSlider");
const lpiValue = document.querySelector("#lpiValue");
const paperRgb = [255, 250, 240];
// GRACoL2013 CRPC6 CMYK-to-sRGB samples for paper, primaries, and overprints.
const gracolNeugebauerRgb = [
  [255, 255, 255],
  [0, 162, 227],
  [230, 0, 125],
  [47, 44, 132],
  [255, 237, 0],
  [0, 151, 64],
  [227, 9, 15],
  [50, 50, 47],
  [28, 28, 26],
  [0, 11, 31],
  [37, 0, 1],
  [0, 0, 3],
  [25, 32, 0],
  [0, 16, 0],
  [30, 0, 0],
  [0, 0, 0],
];

const gracolChannelOrder = ["c", "m", "y", "k"];
const gracolCoatedTviAt50 = {
  c: 0.12,
  m: 0.14,
  y: 0.13,
  k: 0.18,
};

const inkScreens = [
  {
    angle: 15,
    channel: "c",
    color: "rgb(0, 162, 227)",
    angleOutput: document.querySelector("#cyanAngleValue"),
    angleSlider: document.querySelector("#cyanAngleSlider"),
    output: document.querySelector("#cyanValue"),
    slider: document.querySelector("#cyanSlider"),
  },
  {
    angle: 75,
    channel: "m",
    color: "rgb(230, 0, 125)",
    angleOutput: document.querySelector("#magentaAngleValue"),
    angleSlider: document.querySelector("#magentaAngleSlider"),
    output: document.querySelector("#magentaValue"),
    slider: document.querySelector("#magentaSlider"),
  },
  {
    angle: 0,
    channel: "y",
    color: "rgb(255, 237, 0)",
    angleOutput: document.querySelector("#yellowAngleValue"),
    angleSlider: document.querySelector("#yellowAngleSlider"),
    output: document.querySelector("#yellowValue"),
    slider: document.querySelector("#yellowSlider"),
  },
  {
    angle: 45,
    channel: "k",
    color: "rgb(28, 28, 26)",
    angleOutput: document.querySelector("#blackAngleValue"),
    angleSlider: document.querySelector("#blackAngleSlider"),
    output: document.querySelector("#blackValue"),
    slider: document.querySelector("#blackSlider"),
  },
];

let mode = "single";
let singleCoverage = Number(singleSlider.value);

function readDotGainInputs() {
  return {
    dotGain: Math.max(0, Number(dotGainInput.value) / 100) || 0,
    minDot: Math.max(0, Number(minDotInput.value) / 100) || 0,
    minDotPrinted: Math.max(0, Number(minDotPrintedInput.value) / 100) || 0,
  };
}

let appliedDotGainParams = readDotGainInputs();

function getDotGainParams() {
  return appliedDotGainParams;
}

function dotGainInputsMatchApplied() {
  const live = readDotGainInputs();

  return (
    live.dotGain === appliedDotGainParams.dotGain &&
    live.minDot === appliedDotGainParams.minDot &&
    live.minDotPrinted === appliedDotGainParams.minDotPrinted
  );
}

function syncDotGainApplyButton() {
  dotGainApplyButton.disabled = dotGainInputsMatchApplied();
}

function applyDotGainSettings() {
  appliedDotGainParams = readDotGainInputs();
  syncDotGainApplyButton();
  drawVisualizer();
}

function syncSingleControl() {
  singleCoverage = Number(singleSlider.value);
  singleSlider.style.setProperty("--track-fill", `${singleCoverage}%`);
  singleValue.textContent = String(singleCoverage);
}

function syncSingleAngleControl() {
  const angle = Number(singleAngleSlider.value);
  const fillPercent = (angle / 90) * 100;

  singleAngleSlider.style.setProperty("--track-fill", `${fillPercent}%`);
  singleAngleValue.textContent = `${angle}°`;
}

function syncCmykControls() {
  inkScreens.forEach((screen) => {
    const amount = Number(screen.slider.value);

    screen.slider.style.setProperty("--track-fill", `${amount}%`);
    screen.output.textContent = `${amount}%`;
  });
}

function syncCmykAngleControls() {
  inkScreens.forEach((screen) => {
    const angle = Number(screen.angleSlider.value);
    const fillPercent = (angle / 90) * 100;

    screen.angleSlider.style.setProperty("--track-fill", `${fillPercent}%`);
    screen.angleOutput.textContent = `${angle}°`;
  });
}

function syncLpiValue() {
  const lpi = Number(lpiSlider.value);
  const fillPercent = ((lpi - 25) / (200 - 25)) * 100;

  lpiSlider.style.setProperty("--track-fill", `${fillPercent}%`);
  lpiValue.textContent = String(lpi);
}

function setMode(nextMode) {
  mode = nextMode;
  controlStrip.dataset.mode = mode;
  modeTitle.textContent = mode === "single" ? "Dot coverage" : "CMYK screens";
  singleMeter.hidden = mode !== "single";
  singleControls.hidden = mode !== "single";
  cmykControls.hidden = mode !== "cmyk";

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  drawVisualizer();
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.round(bounds.width * ratio);
  canvas.height = Math.round(bounds.height * ratio);
  drawVisualizer();
}

function drawPaper(width, height) {
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
}

function smoothstep(start, end, current) {
  const progress = Math.min(Math.max((current - start) / (end - start), 0), 1);

  return progress * progress * (3 - 2 * progress);
}

function bell(c) {
  return 4 * c * (1 - c);
}

function bloomDecay(c, minDotFrac) {
  const range = 0.5 - minDotFrac;

  if (range <= 0) {
    return 0;
  }

  const t = (c - minDotFrac) / range;

  return Math.max(0, Math.min(1, 1 - t));
}

function pressChannelScale(channel) {
  const channelTvi = gracolCoatedTviAt50[channel];

  if (channelTvi === undefined || gracolCoatedTviAt50.k === 0) {
    return 1;
  }

  return channelTvi / gracolCoatedTviAt50.k;
}

function pressEffectiveCoverage(cFrac, params, channelScale) {
  if (cFrac <= 0) {
    return 0;
  }

  if (cFrac < params.minDot) {
    return 0;
  }

  if (cFrac >= 1) {
    return 1;
  }

  const scale = channelScale ?? 1;
  const bloomAmplitude = Math.max(0, params.minDotPrinted - params.minDot);
  const bloomTerm = bloomAmplitude * bloomDecay(cFrac, params.minDot);
  const spreadTerm = params.dotGain * scale * bell(cFrac);

  return Math.min(1, cFrac + bloomTerm + spreadTerm);
}

function pressEffectiveAmount(rawAmount, channelScale) {
  const cFrac = rawAmount / 100;
  const effective = pressEffectiveCoverage(
    cFrac,
    getDotGainParams(),
    channelScale,
  );

  return effective * 100;
}

function applyGracolTvi(cFrac, channel) {
  if (cFrac <= 0) {
    return 0;
  }

  if (cFrac >= 1) {
    return 1;
  }

  const tviAt50 = gracolCoatedTviAt50[channel] ?? 0;

  return Math.min(1, cFrac + tviAt50 * bell(cFrac));
}

function getDotRadius(cell, amount) {
  const areaRadius = Math.sqrt(amount / 100) * cell * 0.48;
  const mergeAmount = smoothstep(72, 99, amount);
  const nearlySolidRadius = cell * 0.69;

  return areaRadius + (nearlySolidRadius - areaRadius) * mergeAmount;
}

function blendChannel(start, end, amount) {
  return Math.round(start + (end - start) * amount);
}

function toLinearRgb(value) {
  const channel = value / 255;

  if (channel <= 0.04045) {
    return channel / 12.92;
  }

  return ((channel + 0.055) / 1.055) ** 2.4;
}

function toSrgbValue(value) {
  const channel =
    value <= 0.0031308
      ? value * 12.92
      : 1.055 * value ** (1 / 2.4) - 0.055;

  return Math.round(Math.min(Math.max(channel, 0), 1) * 255);
}

function getPaperRelativeRgb(rgb) {
  return rgb.map((channel, index) =>
    Math.round((channel / 255) * paperRgb[index]),
  );
}

function getScreenCoverages() {
  return inkScreens.map((screen) => Number(screen.slider.value) / 100);
}

function neugebauerToneColor(coverages) {
  const linearRgb = [0, 0, 0];

  gracolNeugebauerRgb.forEach((rgb, mask) => {
    const weight = coverages.reduce((area, coverage, index) => {
      return area * ((mask & (1 << index)) === 0 ? 1 - coverage : coverage);
    }, 1);
    const paperRelativeRgb = getPaperRelativeRgb(rgb);

    linearRgb[0] += toLinearRgb(paperRelativeRgb[0]) * weight;
    linearRgb[1] += toLinearRgb(paperRelativeRgb[1]) * weight;
    linearRgb[2] += toLinearRgb(paperRelativeRgb[2]) * weight;
  });

  return `rgb(${toSrgbValue(linearRgb[0])}, ${toSrgbValue(
    linearRgb[1],
  )}, ${toSrgbValue(linearRgb[2])})`;
}

function getSingleToneColor() {
  return neugebauerToneColor([0, 0, 0, applyGracolTvi(singleCoverage / 100, "k")]);
}

function getGracolReferenceCoverages() {
  return inkScreens.map((screen, index) => {
    const raw = Number(screen.slider.value) / 100;

    return applyGracolTvi(raw, gracolChannelOrder[index]);
  });
}

function getProfiledCmykToneColor() {
  return neugebauerToneColor(getGracolReferenceCoverages());
}

function getPressSingleToneColor() {
  const params = getDotGainParams();
  const effective = pressEffectiveCoverage(singleCoverage / 100, params);

  return neugebauerToneColor([0, 0, 0, effective]);
}

function getPressCmykToneColor() {
  const params = getDotGainParams();
  const coverages = inkScreens.map((screen) => {
    const raw = Number(screen.slider.value) / 100;

    return pressEffectiveCoverage(raw, params, pressChannelScale(screen.channel));
  });

  return neugebauerToneColor(coverages);
}

function highLpiCrossfadeAlpha(cell) {
  return Math.max(0, Math.min(1, (4 - cell) / 1));
}

function drawDivider(splitX, height, cell) {
  const dividerOpacity = 0.18 * (1 - highLpiCrossfadeAlpha(cell));

  if (dividerOpacity <= 0) {
    return;
  }

  ctx.fillStyle = `rgba(16, 16, 16, ${dividerOpacity})`;
  ctx.fillRect(splitX - 0.5, 0, 1, height);
}

function drawHighLpiSmoothing(toneColor, splitX, height, cell) {
  const alpha = highLpiCrossfadeAlpha(cell);

  if (alpha <= 0) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = toneColor;
  ctx.fillRect(0, 0, splitX, height);
  ctx.restore();
}

// Render one ink screen to its own offscreen canvas using normal compositing,
// so overlapping dots of the same ink merge into a single flat shape rather
// than darkening each other. The returned canvas is later composited onto the
// main canvas with `multiply`, so cross-ink overlaps still darken correctly.
const offscreenPool = new Map();
const patternCache = new Map();
const PATTERN_SUPERSAMPLE = 2;

function acquireOffscreen(channel, deviceWidth, deviceHeight) {
  const key = channel ?? "single";
  let offscreen = offscreenPool.get(key);

  if (!offscreen) {
    offscreen = document.createElement("canvas");
    offscreenPool.set(key, offscreen);
  }

  if (offscreen.width !== deviceWidth || offscreen.height !== deviceHeight) {
    offscreen.width = deviceWidth;
    offscreen.height = deviceHeight;
  } else {
    offscreen.width = deviceWidth;
  }

  return offscreen;
}

function getDotPattern(color, cell, radius, ratio) {
  const cacheKey = `${color}|${cell.toFixed(3)}|${radius.toFixed(3)}|${ratio}`;
  const cached = patternCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const deviceCell = Math.max(2, Math.round(cell * ratio));
  const tileCell = deviceCell * PATTERN_SUPERSAMPLE;
  const tileRadius = Math.max(0.5, radius * ratio * PATTERN_SUPERSAMPLE);
  const pCanvas = document.createElement("canvas");

  pCanvas.width = tileCell;
  pCanvas.height = tileCell;

  const pCtx = pCanvas.getContext("2d");
  const corners = [
    [0, 0],
    [tileCell, 0],
    [0, tileCell],
    [tileCell, tileCell],
  ];

  pCtx.fillStyle = color;
  pCtx.beginPath();

  for (const [cx, cy] of corners) {
    pCtx.moveTo(cx + tileRadius, cy);
    pCtx.arc(cx, cy, tileRadius, 0, Math.PI * 2);
  }

  pCtx.fill();

  if (patternCache.size > 64) {
    patternCache.clear();
  }

  patternCache.set(cacheKey, pCanvas);

  return pCanvas;
}

function getScreenAngle(screen) {
  return Number(screen.angleSlider?.value ?? screen.angle);
}

function renderInkScreen(screen, clip, width, height, cell) {
  const rawAmount = Number(screen.slider?.value ?? screen.amount);
  const amount = pressEffectiveAmount(rawAmount, pressChannelScale(screen.channel));

  if (amount <= 0) {
    return null;
  }

  const ratio = window.devicePixelRatio || 1;
  const offscreen = acquireOffscreen(
    screen.channel,
    Math.round(width * ratio),
    Math.round(height * ratio),
  );
  const offCtx = offscreen.getContext("2d");

  offCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  offCtx.beginPath();
  offCtx.rect(clip.x, clip.y, clip.width, clip.height);
  offCtx.clip();
  offCtx.fillStyle = screen.color;

  if (amount >= 100) {
    offCtx.fillRect(clip.x, clip.y, clip.width, clip.height);
    return offscreen;
  }

  const radius = getDotRadius(cell, amount);

  if (radius <= 0.08) {
    return null;
  }

  const diagonal = Math.hypot(width, height);
  const margin = Math.ceil(Math.max(diagonal - width, diagonal - height) / 2 + cell);

  offCtx.translate(width / 2, height / 2);
  offCtx.rotate((getScreenAngle(screen) * Math.PI) / 180);
  offCtx.translate(-width / 2, -height / 2);

  const patternCanvas = getDotPattern(screen.color, cell, radius, ratio);
  const pattern = offCtx.createPattern(patternCanvas, "repeat");

  if (pattern.setTransform) {
    pattern.setTransform(
      new DOMMatrix().scaleSelf(1 / PATTERN_SUPERSAMPLE),
    );
  }

  offCtx.imageSmoothingEnabled = true;
  offCtx.imageSmoothingQuality = "high";
  offCtx.fillStyle = pattern;
  offCtx.fillRect(-margin, -margin, width + 2 * margin, height + 2 * margin);

  return offscreen;
}

function compositeInkScreen(offscreen, width, height) {
  if (!offscreen) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(offscreen, 0, 0, width, height);
  ctx.restore();
}

function drawInkScreen(screen, clip, width, height, cell) {
  compositeInkScreen(renderInkScreen(screen, clip, width, height, cell), width, height);
}

function drawCmykTone(splitX, width, height) {
  ctx.fillStyle = getProfiledCmykToneColor();
  ctx.fillRect(splitX, 0, width - splitX, height);
}

function drawSingleView(width, height, cell, splitX) {
  ctx.fillStyle = getSingleToneColor();
  ctx.fillRect(splitX, 0, width - splitX, height);

  if (singleCoverage >= 100) {
    ctx.fillStyle = "#101010";
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (highLpiCrossfadeAlpha(cell) < 1) {
    drawInkScreen(
      {
        amount: singleCoverage,
        angleSlider: singleAngleSlider,
        channel: "k",
        color: "#101010",
      },
      { height, width: splitX, x: 0, y: 0 },
      width,
      height,
      cell,
    );
  }

  drawHighLpiSmoothing(getPressSingleToneColor(), splitX, height, cell);
  drawDivider(splitX, height, cell);
}

function drawCmykView(width, height, cell, splitX) {
  drawCmykTone(splitX, width, height);

  if (highLpiCrossfadeAlpha(cell) < 1) {
    inkScreens.forEach((screen) => {
      drawInkScreen(
        screen,
        { height, width: splitX, x: 0, y: 0 },
        width,
        height,
        cell,
      );
    });
  }

  drawHighLpiSmoothing(getPressCmykToneColor(), splitX, height, cell);
  drawDivider(splitX, height, cell);
}

function drawVisualizer() {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.width / ratio;
  const height = canvas.height / ratio;
  const lpi = Number(lpiSlider.value);
  const cell = Math.max(2, 600 / lpi);
  const splitX = width / 2;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  drawPaper(width, height);

  if (mode === "single") {
    drawSingleView(width, height, cell, splitX);
  } else {
    drawCmykView(width, height, cell, splitX);
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
  });
});

let drawScheduled = false;
function requestDraw() {
  if (drawScheduled) {
    return;
  }

  drawScheduled = true;
  requestAnimationFrame(() => {
    drawScheduled = false;
    drawVisualizer();
  });
}

singleSlider.addEventListener("input", () => {
  syncSingleControl();

  if (mode === "single") {
    requestDraw();
  }
});

singleAngleSlider.addEventListener("input", () => {
  syncSingleAngleControl();

  if (mode === "single") {
    requestDraw();
  }
});

inkScreens.forEach((screen) => {
  screen.slider.addEventListener("input", () => {
    syncCmykControls();

    if (mode === "cmyk") {
      requestDraw();
    }
  });

  screen.angleSlider.addEventListener("input", () => {
    syncCmykAngleControls();

    if (mode === "cmyk") {
      requestDraw();
    }
  });
});

[dotGainInput, minDotInput, minDotPrintedInput].forEach((input) => {
  input.addEventListener("input", syncDotGainApplyButton);
  input.addEventListener("change", syncDotGainApplyButton);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !dotGainApplyButton.disabled) {
      event.preventDefault();
      applyDotGainSettings();
    }
  });
});

dotGainApplyButton.addEventListener("click", applyDotGainSettings);

function isDotGainPopoverOpen() {
  return dotGainTrigger.getAttribute("aria-expanded") === "true";
}

function openDotGainPopover() {
  dotGainTrigger.setAttribute("aria-expanded", "true");
  dotGainPopover.hidden = false;
  document.addEventListener("mousedown", handleDotGainOutsideClick);
  document.addEventListener("keydown", handleDotGainEscape);
}

function closeDotGainPopover() {
  dotGainTrigger.setAttribute("aria-expanded", "false");
  dotGainPopover.hidden = true;
  document.removeEventListener("mousedown", handleDotGainOutsideClick);
  document.removeEventListener("keydown", handleDotGainEscape);
}

function handleDotGainOutsideClick(event) {
  if (
    !dotGainPopover.contains(event.target) &&
    !dotGainTrigger.contains(event.target)
  ) {
    closeDotGainPopover();
  }
}

function handleDotGainEscape(event) {
  if (event.key === "Escape") {
    closeDotGainPopover();
    dotGainTrigger.focus();
  }
}

dotGainTrigger.addEventListener("click", () => {
  if (isDotGainPopoverOpen()) {
    closeDotGainPopover();
  } else {
    openDotGainPopover();
  }
});

lpiSlider.addEventListener("input", () => {
  syncLpiValue();
  requestDraw();
});

window.addEventListener("resize", resizeCanvas);

syncSingleControl();
syncSingleAngleControl();
syncCmykControls();
syncCmykAngleControls();
syncLpiValue();
setMode("single");
resizeCanvas();
