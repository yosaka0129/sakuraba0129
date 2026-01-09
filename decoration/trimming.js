const canvas = document.getElementById("trimCanvas");
const ctx = canvas.getContext("2d");

// キャンバス幅
canvas.width = window.innerWidth * 0.9;

// まず横幅から赤枠サイズを決める
const frameW = canvas.width * 0.8;
const frameH = (frameW * 4) / 3;

// 赤枠が必ず収まるようにキャンバス高さを調整
canvas.height = frameH + 200; // 上下100pxずつ余白

// 赤枠の位置
const frameX = (canvas.width - frameW) / 2;
const frameY = (canvas.height - frameH) / 2;

let img = null;
let baseScale = 1;
let scale = 1;
let angle = 0;
let offsetX = 0;
let offsetY = 0;
const moveStep = 30;

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
      baseScale = Math.min(frameW / img.width, frameH / img.height);
      scale = baseScale;
      angle = 0;
      offsetX = 0;
      offsetY = 0;

      document.getElementById("scaleRange").value = 1;
      drawPhoto();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// 拡大縮小
document.getElementById("scaleRange").oninput = (e) => {
  scale = baseScale * parseFloat(e.target.value);
  drawPhoto();
};

// 回転
document.getElementById("rotateRange").oninput = (e) => {
  angle = parseFloat(e.target.value);
  drawPhoto();
};

// 移動
document.getElementById("moveUp").onclick = () => { offsetY -= moveStep; drawPhoto(); };
document.getElementById("moveDown").onclick = () => { offsetY += moveStep; drawPhoto(); };
document.getElementById("moveLeft").onclick = () => { offsetX -= moveStep; drawPhoto(); };
document.getElementById("moveRight").onclick = () => { offsetX += moveStep; drawPhoto(); };

// ★ 赤枠を含めずにトリミング
document.getElementById("confirmBtn").onclick = () => {
  if (!img) {
    alert("まず写真をアップロードしてください！");
    return;
  }

  // ① 赤枠なしで再描画
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  // ② 赤枠内だけ切り取る
  const trimmed = ctx.getImageData(frameX, frameY, frameW, frameH);

  // ③ 元の表示に戻す
  drawPhoto();

  // ④ 切り取った画像を次ページへ渡す
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