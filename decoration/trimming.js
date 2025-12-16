const canvas = document.getElementById("trimCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

const frameW = canvas.width * 0.8;
const frameH = frameW * 4 / 3;
const frameX = (canvas.width - frameW) / 2;
const frameY = (canvas.height - frameH) / 2;

let img = null;
let scale = 1;
let angle = 0;
let offsetX = 0;
let offsetY = 0;

function drawFrame() {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 5;
  ctx.strokeRect(frameX, frameY, frameW, frameH);
}

function drawPhoto() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (!img) {
    drawFrame();
    return;
  }
  ctx.save();
  ctx.translate(canvas.width/2 + offsetX, canvas.height/2 + offsetY);
  ctx.rotate(angle * Math.PI/180);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width/2, -img.height/2);
  ctx.restore();
  drawFrame();
}

document.getElementById("upload").onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    img = new Image();
    img.onload = () => {
      scale = Math.min(frameW / img.width, frameH / img.height);
      offsetX = 0;
      offsetY = 0;
      drawPhoto();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

document.getElementById("scaleRange").oninput = e => {
  scale = parseFloat(e.target.value);
  drawPhoto();
};
document.getElementById("rotateRange").oninput = e => {
  angle = parseFloat(e.target.value);
  drawPhoto();
};

document.getElementById("moveUp").onclick = () => { offsetY -= 10; drawPhoto(); };
document.getElementById("moveDown").onclick = () => { offsetY += 10; drawPhoto(); };
document.getElementById("moveLeft").onclick = () => { offsetX -= 10; drawPhoto(); };
document.getElementById("moveRight").onclick = () => { offsetX += 10; drawPhoto(); };

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

drawPhoto();