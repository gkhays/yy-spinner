const canvas = document.getElementById('yy-canvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const rpmSlider = document.getElementById('rpm-slider');
const rpmValue = document.getElementById('rpm-value');
const degreesPerFrameValue = document.getElementById('degrees-per-frame-value');
const demoToggle = document.getElementById('demo-toggle');
const fpsOptions = document.querySelectorAll('input[name="fps"]');
const fidgetToggle = document.getElementById('fidget-toggle');
const controlsPanel = document.querySelector('.controls');
const menuToggle = document.getElementById('menu-toggle');
const spinnerMenu = document.getElementById('spinner-menu');
const spinnerSelect = document.getElementById('spinner-select');

let spinning = false;
let angle = 0;
let degreesPerFrame = 2.2;
let demoMode = demoToggle.checked;
let fidgetMode = fidgetToggle.checked;
let selectedSpinner = spinnerSelect.value;
let selectedFps = parseInt(document.querySelector('input[name="fps"]:checked').value, 10);
let lastFrameTime = 0;
let touchStartY = null;
let touchStartX = null;
let lastFidgetSwipeTime = 0;
let spiralCache = null;
let ignoreNextMenuClick = false;

const minDegreesPerFrame = 2.2;
const maxDegreesPerFrame = 360;
const demoAccelerationPerSecond = 30; // Preserves legacy 60fps * 0.5 acceleration
const fidgetSwipeBoost = 8;
const fidgetSwipeThreshold = 40;
const fidgetSwipeIdleDelayMs = 200;
const fidgetDecayPerSecond = 0.35;
const fidgetStopThreshold = 0.05;
const isIphoneOrAndroid = /iphone|android/i.test(window.navigator.userAgent);

function resizeCanvas() {
  const maxCanvasSize = 400;
  const minCanvasSize = 220;
  const horizontalPadding = 24;
  const availableWidth = window.innerWidth - horizontalPadding;
  const size = Math.max(minCanvasSize, Math.min(maxCanvasSize, Math.floor(availableWidth)));

  canvas.width = size;
  canvas.height = size;
  drawCurrentSpinner();
}

function degreesPerFrameToRpm(dpf) {
  return (dpf * selectedFps) / 6;
}

function updateMetrics() {
  rpmValue.textContent = Math.round(degreesPerFrameToRpm(degreesPerFrame));
  degreesPerFrameValue.textContent = degreesPerFrame.toFixed(2);
}

function drawCurrentSpinner() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.45;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (selectedSpinner === 'spiral') {
    drawSpiral(cx, cy, radius, angle);
    return;
  }

  drawYinYang(cx, cy, radius, angle);
}

function drawYinYang(cx, cy, r, rotation) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const strokeW = Math.max(3, r * 0.045);

  // Fill entire circle white
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Fill left half black (6 o'clock to 12 o'clock clockwise = left semicircle)
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  ctx.closePath();
  ctx.fillStyle = '#000000';
  ctx.fill();

  // Upper small circle (top half, center at top) — fill white to create S-curve bulge
  ctx.beginPath();
  ctx.arc(0, -r / 2, r / 2, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Lower small circle (bottom half, center at bottom) — fill black to create S-curve bulge
  ctx.beginPath();
  ctx.arc(0, r / 2, r / 2, 0, 2 * Math.PI);
  ctx.fillStyle = '#000000';
  ctx.fill();

  // Small black dot in upper white area
  ctx.beginPath();
  ctx.arc(0, -r / 2, r / 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#000000';
  ctx.fill();

  // Small white dot in lower black area
  ctx.beginPath();
  ctx.arc(0, r / 2, r / 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Thick outer border
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, 2 * Math.PI);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = strokeW;
  ctx.stroke();

  ctx.restore();
}

function drawSpiral(cx, cy, r, rotation) {
  const spiralTexture = getSpiralTexture(r);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.drawImage(spiralTexture, -r, -r, r * 2, r * 2);

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, 2 * Math.PI);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(3, r * 0.045);
  ctx.stroke();

  ctx.restore();
}

function getSpiralTexture(radius) {
  const diameter = Math.max(1, Math.round(radius * 2));

  if (spiralCache && spiralCache.diameter === diameter) {
    return spiralCache.canvas;
  }

  const spiralCanvas = document.createElement('canvas');
  spiralCanvas.width = diameter;
  spiralCanvas.height = diameter;

  const spiralCtx = spiralCanvas.getContext('2d');
  const image = spiralCtx.createImageData(diameter, diameter);
  const data = image.data;
  const center = diameter / 2;
  const epsilon = 0.0025;
  const armCount = 14;
  const swirlStrength = 10.5;
  const extraArcRadians = 25 * (Math.PI / 180);
  const red = [216, 23, 23];
  const white = [255, 253, 249];

  for (let y = 0; y < diameter; y += 1) {
    for (let x = 0; x < diameter; x += 1) {
      const dx = (x + 0.5 - center) / radius;
      const dy = (y + 0.5 - center) / radius;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const index = (y * diameter + x) * 4;

      if (distance > 1) {
        data[index + 3] = 0;
        continue;
      }

      const theta = Math.atan2(dy, dx);
      const armTheta = theta + extraArcRadians * (1 - distance);
      const phase = armCount * armTheta + swirlStrength * Math.log(distance + epsilon);
      const stripeMix = 0.5 + 0.5 * Math.sin(phase);
      const edgeBlend = Math.min(1, Math.max(0, (1 - distance) * 18));
      const color = stripeMix >= 0.5 ? red : white;

      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = Math.round(255 * edgeBlend);
    }
  }

  spiralCtx.putImageData(image, 0, 0);
  spiralCache = { diameter, canvas: spiralCanvas };

  return spiralCanvas;
}

function setMenuOpen(isOpen) {
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  spinnerMenu.setAttribute('aria-hidden', String(!isOpen));
  document.body.classList.toggle('menu-open', isOpen);
}

function toggleMenu() {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  setMenuOpen(!isOpen);
}

function animate(timestamp) {
  if (!spinning) return;

  const frameIntervalMs = 1000 / selectedFps;
  if (lastFrameTime !== 0 && timestamp - lastFrameTime < frameIntervalMs) {
    requestAnimationFrame(animate);
    return;
  }
  lastFrameTime = timestamp;

  if (demoMode && degreesPerFrame < maxDegreesPerFrame) {
    const demoAccelerationPerFrame = demoAccelerationPerSecond / selectedFps;
    degreesPerFrame = Math.min(maxDegreesPerFrame, degreesPerFrame + demoAccelerationPerFrame);
    rpmSlider.value = degreesPerFrame;
  }

  if (fidgetMode) {
    const isSwipeIdle = lastFidgetSwipeTime === 0 || timestamp - lastFidgetSwipeTime > fidgetSwipeIdleDelayMs;
    if (isSwipeIdle && degreesPerFrame > 0) {
      // Friction-style decay feels more natural for repeated touch swipes.
      const decayPerFrame = Math.pow(fidgetDecayPerSecond, 1 / selectedFps);
      degreesPerFrame *= decayPerFrame;
      if (degreesPerFrame < fidgetStopThreshold) {
        degreesPerFrame = 0;
      }
      rpmSlider.value = degreesPerFrame;
    }
  }

  updateMetrics();

  angle += degreesPerFrame * (Math.PI / 180);
  drawCurrentSpinner();

  if (fidgetMode && degreesPerFrame === 0) {
    spinning = false;
    return;
  }

  requestAnimationFrame(animate);
}

function setDemoMode(enabled) {
  demoMode = enabled;
  spinBtn.disabled = enabled;
  rpmSlider.disabled = enabled;
  lastFrameTime = 0;

  if (enabled) {
    degreesPerFrame = minDegreesPerFrame;
    rpmSlider.value = minDegreesPerFrame;
    spinning = true;
    spinBtn.textContent = 'Stop';
    requestAnimationFrame(animate);
    return;
  }

  spinning = false;
  degreesPerFrame = minDegreesPerFrame;
  spinBtn.textContent = 'Spin';
  rpmSlider.value = minDegreesPerFrame;
  updateMetrics();
}

function setFidgetMode(enabled) {
  fidgetMode = enabled;
  document.body.classList.toggle('fidget-mode', enabled);
  controlsPanel.classList.toggle('fidget-mode-active', enabled);
  demoToggle.disabled = enabled;
  fpsOptions.forEach((option) => {
    option.disabled = enabled;
  });
  lastFrameTime = 0;

  if (enabled) {
    demoMode = false;
    spinning = false;
    degreesPerFrame = 0;
    rpmSlider.value = 0;
    spinBtn.textContent = 'Spin';
    spinBtn.disabled = true;
    rpmSlider.disabled = true;
    lastFidgetSwipeTime = 0;
    updateMetrics();
    return;
  }

  setDemoMode(demoToggle.checked);
}

function handleFidgetSwipe() {
  if (!fidgetMode || !isIphoneOrAndroid) return;

  degreesPerFrame = Math.min(maxDegreesPerFrame, degreesPerFrame + fidgetSwipeBoost);
  rpmSlider.value = degreesPerFrame;
  lastFidgetSwipeTime = performance.now();

  if (!spinning) {
    spinning = true;
    spinBtn.textContent = 'Stop';
    lastFrameTime = 0;
    requestAnimationFrame(animate);
  }

  updateMetrics();
}

canvas.addEventListener('touchstart', (e) => {
  if (!fidgetMode || !isIphoneOrAndroid || e.touches.length === 0) return;

  const touch = e.touches[0];
  touchStartY = touch.clientY;
  touchStartX = touch.clientX;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (!fidgetMode || !isIphoneOrAndroid || touchStartY === null || e.changedTouches.length === 0) return;

  const touch = e.changedTouches[0];
  const deltaY = touchStartY - touch.clientY;
  const deltaX = touch.clientX - touchStartX;

  touchStartY = null;
  touchStartX = null;

  if (deltaY > fidgetSwipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
    e.preventDefault();
    handleFidgetSwipe();
  }
}, { passive: false });

menuToggle.addEventListener('pointerup', (e) => {
  if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

  ignoreNextMenuClick = true;
  toggleMenu();
});

menuToggle.addEventListener('click', () => {
  if (ignoreNextMenuClick) {
    ignoreNextMenuClick = false;
    return;
  }

  toggleMenu();
});

spinnerSelect.addEventListener('change', (e) => {
  selectedSpinner = e.target.value;
  drawCurrentSpinner();
  setMenuOpen(false);
});

document.addEventListener('pointerdown', (e) => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  if (!isOpen) return;

  if (!spinnerMenu.contains(e.target) && !menuToggle.contains(e.target)) {
    setMenuOpen(false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    setMenuOpen(false);
  }
});

spinBtn.addEventListener('click', () => {
  spinning = !spinning;
  spinBtn.textContent = spinning ? 'Stop' : 'Spin';
  lastFrameTime = 0;
  if (spinning) {
    requestAnimationFrame(animate);
  }
});

rpmSlider.addEventListener('input', (e) => {
  degreesPerFrame = parseFloat(e.target.value);
  updateMetrics();
});

demoToggle.addEventListener('change', (e) => {
  setDemoMode(e.target.checked);
});

fidgetToggle.addEventListener('change', (e) => {
  setFidgetMode(e.target.checked);
});

fpsOptions.forEach((option) => {
  option.addEventListener('change', (e) => {
    selectedFps = parseInt(e.target.value, 10);
    lastFrameTime = 0;
    updateMetrics();
  });
});

// Initial draw
updateMetrics();
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
setDemoMode(demoMode);
setFidgetMode(fidgetMode);
setMenuOpen(false);
