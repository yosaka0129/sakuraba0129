const canvas = document.getElementById("trimCanvas");
const ctx = canvas.getContext("2d");

// キャンバスサイズ
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

// 3:4 赤枠
const frameW = canvas.width * 0.8;
const frameH = (frameW * 4) / 3;
const frameX = (canvas.width - frameW) / 2;
const frameY = (canvas.height - frameH) / 2;

let img = null;
let baseScale = 1; // 初期フィットサイズ
let scale = 1;     // 実際の描画スケール（= baseScale × 倍率）
let angle = 0;
let offsetX = 0;
let offsetY = 0;
const moveStep = 30; // 移動量を増加

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
  ctx.rotate((angle * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
  drawFrame();
}

// アップロード
document.getElementById("upload").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    img = new Image();
    img.onload = () => {
      baseScale = Math.min(frameW / img.width, frameH / img.height); // 基準を保持
      scale = baseScale;
      angle = 0;
      offsetX = 0;
      offsetY = 0;
      // スライダーを基準倍率に合わせる
      const scaleRange = document.getElementById("scaleRange");
      scaleRange.value = 1;
      drawPhoto();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// 拡大縮小（基準 × 倍率）
document.getElementById("scaleRange").oninput = (e) => {
  const factor = parseFloat(e.target.value); // 0.5〜3.0
  scale = baseScale * factor;
  drawPhoto();
};

// 回転
document.getElementById("rotateRange").oninput = (e) => {
  angle = parseFloat(e.target.value);
  drawPhoto();
};

// 移動（方向を修正：通常通りの上下左右）
document.getElementById("moveUp").onclick = () => {
  offsetY -= moveStep; // 上へ
  drawPhoto();
};
document.getElementById("moveDown").onclick = () => {
  offsetY += moveStep; // 下へ
  drawPhoto();
};
document.getElementById("moveLeft").onclick = () => {
  offsetX -= moveStep; // 左へ
  drawPhoto();
};
document.getElementById("moveRight").onclick = () => {
  offsetX += moveStep; // 右へ
  drawPhoto();
};

// 確定：枠内トリミング
document.getElementById("confirmBtn").onclick = () => {
  if (!img) {
    alert("まず写真をアップロードしてください！");
    return;
  }
  const trimmed = ctx.getImageData(frameX, frameY, frameW, frameH);
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