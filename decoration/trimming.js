const canvas = document.getElementById("trimCanvas");
const ctx = canvas.getContext("2d");

// ==== 元コードそのまま：キャンバス初期設定 ====
canvas.width = window.innerWidth * 0.9;

// まず横幅から赤枠サイズを決める
const frameW = canvas.width * 0.8;
const frameH = (frameW * 4) / 3;

// 赤枠が必ず収まるようにキャンバス高さを調整（元コード）
canvas.height = frameH + 200; // 上下100pxずつ余白

// 赤枠の位置（元コード）
const frameX = (canvas.width - frameW) / 2;
const frameY = (canvas.height - frameH) / 2;

let img = null;
let baseScale = 1;
let scale = 1;
let angle = 0; // ラジアンに変更
let offsetX = 0;
let offsetY = 0;

// ==== 元コード：赤枠描画 ====
function drawFrame() {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 5;
  ctx.strokeRect(frameX, frameY, frameW, frameH);
}

// ==== 元コード：描画処理 ====
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

// ==== 元コード：アップロード ====
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

// ==== ★追加：ジェスチャー操作（元コードを壊さない） ====
let lastX = 0;
let lastY = 0;
let lastDist = 0;
let lastAngle = 0;

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();

  if (e.touches.length === 1) {
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }

  if (e.touches.length === 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    lastDist = Math.hypot(dx, dy);
    lastAngle = Math.atan2(dy, dx);
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
    angle += ang - lastAngle;

    lastDist = dist;
    lastAngle = ang;
  }

  drawPhoto();
}, { passive: false });

canvas.addEventListener("touchend", () => {
  lastDist = 0;
  lastAngle = 0;
});

// ==== 元コード：トリミング ====
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

// 初期表示
drawPhoto();