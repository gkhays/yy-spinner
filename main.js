const canvas = document.getElementById('yy-canvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const rpmSlider = document.getElementById('rpm-slider');
const rpmValue = document.getElementById('rpm-value');
const degreesPerFrameValue = document.getElementById('degrees-per-frame-value');
const demoToggle = document.getElementById('demo-toggle');
const fpsOptions = document.querySelectorAll('input[name="fps"]');

let spinning = false;
let angle = 0;
let degreesPerFrame = 2.2;
let demoMode = demoToggle.checked;
let selectedFps = parseInt(document.querySelector('input[name="fps"]:checked').value, 10);
let lastFrameTime = 0;

const minDegreesPerFrame = 2.2;
const maxDegreesPerFrame = 360;
const demoAccelerationPerSecond = 30; // Preserves legacy 60fps * 0.5 acceleration

function resizeCanvas() {
  const maxCanvasSize = 400;
  const minCanvasSize = 220;
  const horizontalPadding = 24;
  const availableWidth = window.innerWidth - horizontalPadding;
  const size = Math.max(minCanvasSize, Math.min(maxCanvasSize, Math.floor(availableWidth)));

  canvas.width = size;
  canvas.height = size;
  drawYinYang(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.45, angle);
}

function degreesPerFrameToRpm(dpf) {
  return (dpf * selectedFps) / 6;
}

function updateMetrics() {
  rpmValue.textContent = Math.round(degreesPerFrameToRpm(degreesPerFrame));
  degreesPerFrameValue.textContent = degreesPerFrame.toFixed(2);
}

function drawYinYang(cx, cy, r, rotation) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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

  updateMetrics();

  angle += degreesPerFrame * (Math.PI / 180);
  drawYinYang(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.45, angle);
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
