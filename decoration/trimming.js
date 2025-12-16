const canvas = document.getElementById("trimCanvas");
const ctx = canvas.getContext("2d");

const upload = document.getElementById("upload");
const scaleRange = document.getElementById("scaleRange");
const rotateRange = document.getElementById("rotateRange");
const confirmBtn = document.getElementById("confirmBtn");

// 赤枠の位置とサイズ
const frameX = 50, frameY = 50, frameW = 300, frameH = 300;

let img = null;
let scale = 1;
let angle = 0;

// 赤枠を描画
function drawFrame() {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 5;
  ctx.strokeRect(frameX, frameY, frameW, frameH);
}

// 写真を描画
function drawPhoto() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (!img) {
    drawFrame();
    return;
  }
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(angle * Math.PI/180);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width/2, -img.height/2);
  ctx.restore();
  drawFrame();
}

// 写真アップロード
upload.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    img = new Image();
    img.onload = () => drawPhoto();
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// スライダー操作
scaleRange.oninput = e => {
  scale = parseFloat(e.target.value);
  drawPhoto();
};
rotateRange.oninput = e => {
  angle = parseFloat(e.target.value);
  drawPhoto();
};

// 確定 → 枠内トリミング
confirmBtn.onclick = () => {
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

// 初期表示（赤枠だけ）
drawPhoto();