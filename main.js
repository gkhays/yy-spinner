const canvas = document.getElementById('yy-canvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const rpmSlider = document.getElementById('rpm-slider');
const rpmValue = document.getElementById('rpm-value');

let spinning = false;
let angle = 0;
let lastTimestamp = null;
let rpm = 30;

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

function animate(ts) {
  if (!spinning) return;
  if (!lastTimestamp) lastTimestamp = ts;
  const delta = ts - lastTimestamp;
  lastTimestamp = ts;
  // Convert RPM to radians per ms
  const radPerMs = (rpm * 2 * Math.PI) / 60000;
  angle += radPerMs * delta;
  drawYinYang(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.45, angle);
  requestAnimationFrame(animate);
}

spinBtn.addEventListener('click', () => {
  spinning = !spinning;
  spinBtn.textContent = spinning ? 'Stop' : 'Spin';
  lastTimestamp = null;
  if (spinning) {
    requestAnimationFrame(animate);
  }
});

rpmSlider.addEventListener('input', (e) => {
  rpm = parseInt(e.target.value, 10);
  rpmValue.textContent = rpm;
});

// Initial draw
rpmValue.textContent = rpm;
drawYinYang(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.45, angle);
