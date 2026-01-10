const canvas = document.getElementById("trimCanvas");
const ctx = canvas.getContext("2d");

let img = null;
let baseScale = 1;
let scale = 1;
let angle = 0;        // ラジアンで扱う
let offsetX = 0;
let offsetY = 0;
const moveStep = 30;  // もう使っていないが残しても問題はない

// ==== キャンバスと赤枠の初期設定（元コード＋はみ出し防止） ====
function setupCanvas() {
  // キャンバス幅
  canvas.width = window.innerWidth * 0.9;

  // まず横幅から赤枠サイズを決める（元のロジック）
  let frameW = canvas.width * 0.8;
  let frameH = (frameW * 4) / 3;

  // 赤枠が必ず収まるようにキャンバス高さを調整
  // 元は frameH + 200 だったが、画面からはみ出さないように制限
  const desiredHeight = frameH + 200; // 上下100pxずつ余白
  const maxHeight = window.innerHeight * 0.8; // 画面の80%以内
  canvas.height = Math.min(desiredHeight, maxHeight);

  // 赤枠の位置
  frameX = (canvas.width - frameW) / 2;
  frameY = (canvas.height - frameH) / 2;

  FRAME_W = frameW;
  FRAME_H = frameH;

  drawPhoto();
}

// 赤枠情報をグローバル変数に（元コード準拠）
let FRAME_W = 0;
let FRAME_H = 0;
let frameX = 0;
let frameY = 0;

function drawFrame() {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 5;
  ctx.strokeRect(frameX, frameY, FRAME_W, FRAME_H);
}

function drawPhoto() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!img) {
    // 画像がなくても赤枠だけは表示
    if (FRAME_W > 0 && FRAME_H > 0) {
      drawFrame();
    }
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

// アップロード（元コードをベースに）
document.getElementById("upload").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    img = new Image();
    img.onload = () => {
      // 赤枠に合わせてベーススケール決定（元ロジック準拠）
      baseScale = Math.min(FRAME_W / img.width, FRAME_H / img.height);
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

// ==== ジェスチャー操作（1本指移動 & 2本指ピンチ＋回転） ====

// タッチジェスチャー用の一時変数
let lastX = 0;
let lastY = 0;
let lastDist = 0;
let lastAngle = 0;

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();

  if (e.touches.length === 1) {
    const t = e.touches[0];
    lastX = t.clientX;
    lastY = t.clientY;
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

    if (lastDist > 0) {
      const s = dist / lastDist;
      scale *= s;
    }

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

// ==== トリミング（元コードそのままのロジック） ====
document.getElementById("confirmBtn").onclick = () => {
  if (!img) {
    alert("まず写真をアップロードしてください！");
    return;
  }

  // ① 赤枠なしで再描画
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  // ② 赤枠内だけ切り取る
  const trimmed = ctx.getImageData(frameX, frameY, FRAME_W, FRAME_H);

  // ③ 元の表示に戻す
  drawPhoto();

  // ④ 切り取った画像を次ページへ渡す
  const trimCanvas = document.createElement("canvas");
  trimCanvas.width = FRAME_W;
  trimCanvas.height = FRAME_H;
  trimCanvas.getContext("2d").putImageData(trimmed, 0, 0);

  const dataUrl = trimCanvas.toDataURL("image/png");
  sessionStorage.setItem("croppedPhoto", dataUrl);

  window.location.href = "decoration.html";
};

// 初期表示（赤枠をまず出す）
setupCanvas();

// 画面回転などにも一応対応するなら↓を残しても良い
window.addEventListener("resize", () => {
  setupCanvas();
  // 画像がある場合はスケール再計算
  if (img) {
    baseScale = Math.min(FRAME_W / img.width, FRAME_H / img.height);
    // 今のズーム量を保ちたいなら scale はそのままでも良いが、
    // 「枠にフィットし直す」なら scale = baseScale; にしても良い
  }
  drawPhoto();
});