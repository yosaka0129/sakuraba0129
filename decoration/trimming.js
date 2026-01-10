const canvas = document.getElementById("trimCanvas");
const ctx = canvas.getContext("2d");

let img = null;

// ===== レイアウト調整（スクロールなしで画面にフィット） =====
function resizeCanvas() {
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const titleH = 40;
  const uploadH = 50;
  const buttonH = 80;

  const availableH = screenH - (titleH + uploadH + buttonH);

  canvas.width = screenW * 0.95;
  canvas.height = availableH * 0.95;

  frameW = canvas.width * 0.8;
  frameH = frameW * 0.75; // 4:3
  frameX = (canvas.width - frameW) / 2;
  frameY = (canvas.height - frameH) / 2;

  drawPhoto();
}

let frameW, frameH, frameX, frameY;

// ===== 画像変換パラメータ =====
let baseScale = 1;
let scale = 1;
let angle = 0;
let offsetX = 0;
let offsetY = 0;

// ===== 描画 =====
function drawFrame() {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 5;
  ctx.strokeRect(frameX, frameY, frameW, frameH);
}

function drawPhoto() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!img) {
    drawFrame();
    return;
  }

  ctx.save();
  ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  drawFrame();
}

// ===== アップロード =====
document.getElementById("upload").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    img = new Image();
    img.onload = () => {
      baseScale = Math.min(frameW / img.width, frameH / img.height);
      scale = baseScale;
      angle = 0;
      offsetX = 0;
      offsetY = 0;
      drawPhoto();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// ===== ジェスチャー操作 =====
let lastDist = 0;
let lastAngle = 0;
let lastX = 0;
let lastY = 0;

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();

  if (e.touches.length === 1) {
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }

  if (e.touches.length === 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    lastDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    lastAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
  }
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();

  if (!img) return;

  // 1本指 → 移動
  if (e.touches.length === 1) {
    const t = e.touches[0];
    offsetX += t.clientX - lastX;
    offsetY += t.clientY - lastY;
    lastX = t.clientX;
    lastY = t.clientY;
  }

  // 2本指 → 拡大縮小＋回転
  if (e.touches.length === 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];

    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;

    const dist = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);

    if (lastDist > 0) scale *= dist / lastDist;
    if (lastAngle !== null) angle += ang - lastAngle;

    lastDist = dist;
    lastAngle = ang;
  }

  drawPhoto();
}, { passive: false });

canvas.addEventListener("touchend", () => {
  lastDist = 0;
  lastAngle = 0;
});

// ===== トリミング =====
document.getElementById("confirmBtn").onclick = () => {
  if (!img) {
    alert("まず写真をアップロードしてください！");
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  const trimmed = ctx.getImageData(frameX, frameY, frameW, frameH);

  drawPhoto();

  const trimCanvas = document.createElement("canvas");
  trimCanvas.width = frameW;
  trimCanvas.height = frameH;
  trimCanvas.getContext("2d").putImageData(trimmed, 0, 0);

  const dataUrl = trimCanvas.toDataURL("image/png");
  sessionStorage.setItem("croppedPhoto", dataUrl);

  window.location.href = "decoration.html";
};

// 初期化
resizeCanvas();
window.addEventListener("resize", resizeCanvas);