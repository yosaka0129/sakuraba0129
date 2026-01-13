// ===============================
// 写真読み込み（← photo を最初に宣言するのが重要）
// ===============================
let photo = new Image();
photo.src = sessionStorage.getItem("croppedPhoto");
photo.onload = () => draw();

// ===============================
// Canvas 初期設定
// ===============================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.6;

// ===============================
// 素材管理
// ===============================
let placed = [];      // スタンプ・フレーズ
let selected = null;  // 選択中の素材
let currentFrame = null; // フレームは1つだけ

// ===============================
// Undo 用
// ===============================
let history = [];

function saveHistory() {
  const snapshot = placed.map(o => ({
    src: o.src,
    x: o.x,
    y: o.y,
    w: o.w,
    h: o.h,
    scale: o.scale,
    angle: o.angle
  }));
  history.push(JSON.stringify(snapshot));
}

// ===============================
// 当たり判定用オフスクリーンCanvas
// ===============================
function createHitCanvas(imageObj) {
  const off = document.createElement("canvas");
  off.width = imageObj.width;
  off.height = imageObj.height;
  off.getContext("2d").drawImage(imageObj, 0, 0);
  return off;
}

// ===============================
// 描画処理
// ===============================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ---- 写真 ----
  if (photo.complete) {
    const scale = Math.min(canvas.width / photo.width, canvas.height / photo.height);
    const w = photo.width * scale;
    const h = photo.height * scale;
    ctx.drawImage(photo, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }

  // ---- スタンプ・フレーズ ----
  placed.forEach(obj => {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.angle);
    ctx.scale(obj.scale, obj.scale);
    ctx.drawImage(obj.img, -obj.w / 2, -obj.h / 2, obj.w, obj.h);

    if (obj === selected) {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 6;
      ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);

      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);

      ctx.shadowColor = "rgba(255,0,0,0.7)";
      ctx.shadowBlur = 20;
      ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
    }

    ctx.restore();
  });

  // ---- フレーム（最前面） ----
  if (currentFrame) {
    ctx.drawImage(currentFrame, 0, 0, canvas.width, canvas.height);
  }
}

// ===============================
// フレーム処理
// ===============================
function loadFrames() {
  fetch("assets/frames/list.json")
    .then(res => res.json())
    .then(files => {
      const box = document.getElementById("frames");
      box.innerHTML = "";

      files.forEach(file => {
        const img = document.createElement("img");
        img.src = `assets/frames/${file}`;
        img.onclick = () => setFrame(img.src);
        box.appendChild(img);
      });
    });
}

function setFrame(src) {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    currentFrame = img;
    draw();
  };
}

// ===============================
// 素材配置
// ===============================
function placeStamp(imageObj) {
  saveHistory();

  let initialScale = 1;

  // フレームはぴったり
  if (imageObj.src.includes("frames")) {
    initialScale = Math.min(canvas.width / imageObj.width, canvas.height / imageObj.height);
  } else {
    initialScale = 0.35; // スタンプは小さめ
  }

  const obj = {
    img: imageObj,
    src: imageObj.src,
    x: canvas.width / 2,
    y: canvas.height / 2,
    w: imageObj.width,
    h: imageObj.height,
    scale: initialScale,
    angle: 0,
    hitCanvas: createHitCanvas(imageObj)
  };

  placed.push(obj);
  selected = obj;

  draw();
}

// ===============================
// 素材一覧読み込み
// ===============================
function loadCategory(name) {
  fetch(`assets/${name}/list.json`)
    .then(res => res.json())
    .then(files => {
      const box = document.getElementById(name);
      box.innerHTML = "";

      files.forEach(file => {
        const img = document.createElement("img");
        img.src = `assets/${name}/${file}`;
        img.style.objectFit = "contain";
        img.style.margin = "4px";

        img.onclick = () => {
          const imageObj = new Image();
          imageObj.src = img.src;
          imageObj.onload = () => placeStamp(imageObj);
        };

        box.appendChild(img);
      });
    });
}

// ===============================
// カテゴリ切り替え
// ===============================
function showCategory(name) {
  document.querySelectorAll(".category").forEach(c => c.style.display = "none");
  document.getElementById(name).style.display = "block";
}
window.showCategory = showCategory;

// ===============================
// マウスドラッグ移動
// ===============================
let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

canvas.addEventListener("mousedown", e => {
  if (!selected) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const dx = x - selected.x;
  const dy = y - selected.y;

  if (Math.abs(dx) < selected.w / 2 && Math.abs(dy) < selected.h / 2) {
    dragging = true;
    dragOffsetX = dx;
    dragOffsetY = dy;
  }
});

canvas.addEventListener("mousemove", e => {
  if (!dragging || !selected) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  selected.x = x - dragOffsetX;
  selected.y = y - dragOffsetY;

  draw();
});

canvas.addEventListener("mouseup", () => dragging = false);

// ===============================
// スマホ：1本指ドラッグ移動
// ===============================
canvas.addEventListener("touchstart", e => {
  if (!selected) return;
  if (e.touches.length !== 1) return;

  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = t.clientX - rect.left;
  const y = t.clientY - rect.top;

  const dx = x - selected.x;
  const dy = y - selected.y;

  if (Math.abs(dx) < selected.w / 2 && Math.abs(dy) < selected.h / 2) {
    dragging = true;
    dragOffsetX = dx;
    dragOffsetY = dy;
  }

  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  if (!selected) return;

  if (e.touches.length === 1 && dragging) {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    selected.x = x - dragOffsetX;
    selected.y = y - dragOffsetY;

    draw();
    e.preventDefault();
    return;
  }
}, { passive: false });

canvas.addEventListener("touchend", () => dragging = false);

// ===============================
// スマホ：2本指ピンチ拡大・回転
// ===============================
let lastDist = 0;
let lastAngle = 0;

canvas.addEventListener("touchmove", e => {
  if (!selected || e.touches.length < 2) return;

  const t1 = e.touches[0];
  const t2 = e.touches[1];

  const dx = t2.clientX - t1.clientX;
  const dy = t2.clientY - t1.clientY;

  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  if (lastDist !== 0) selected.scale *= dist / lastDist;
  if (lastAngle !== 0) selected.angle += angle - lastAngle;

  lastDist = dist;
  lastAngle = angle;

  draw();
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", () => {
  lastDist = 0;
  lastAngle = 0;
});

// ===============================
// ★ 選択変更（ループ）
// ===============================
document.getElementById("cycleBtn").onclick = () => {
  if (placed.length === 0) return;

  let index = placed.indexOf(selected);
  index = (index + 1) % placed.length;

  selected = placed[index];
  draw();
};

// ===============================
/* ★ 消去（自動で次を選択） */
// ===============================
document.getElementById("deleteBtn").onclick = () => {
  if (!selected) return;
  if (placed.length === 0) return;

  const index = placed.indexOf(selected);
  placed.splice(index, 1);

  if (placed.length > 0) {
    selected = placed[index % placed.length];
  } else {
    selected = null;
  }

  draw();
};

// ===============================
// 保存（余白なしで保存）
// ===============================
document.getElementById("saveBtn").onclick = () => {
  const scale = Math.min(canvas.width / photo.width, canvas.height / photo.height);
  const w = photo.width * scale;
  const h = photo.height * scale;
  const offsetX = (canvas.width - w) / 2;
  const offsetY = (canvas.height - h) / 2;

  const saveCanvas = document.createElement("canvas");
  saveCanvas.width = w;
  saveCanvas.height = h;
  const sctx = saveCanvas.getContext("2d");

  sctx.drawImage(photo, 0, 0, w, h);

  placed.forEach(obj => {
    sctx.save();
    sctx.translate(obj.x - offsetX, obj.y - offsetY);
    sctx.rotate(obj.angle);
    sctx.scale(obj.scale, obj.scale);
    sctx.drawImage(obj.img, -obj.w / 2, -obj.h / 2, obj.w, obj.h);
    sctx.restore();
  });

  if (currentFrame) {
    sctx.drawImage(currentFrame, 0, 0, w, h);
  }

  const link = document.createElement("a");
  link.href = saveCanvas.toDataURL("image/png");
  link.download = "decoration.png";
  link.click();
};

// ===============================
// 初期化
// ===============================
["frames", "stamps", "phrases"].forEach(loadCategory);
showCategory("frames");