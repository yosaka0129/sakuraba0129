// ===============================
// Canvas 初期設定
// ===============================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.6;

// ===============================
// 写真読み込み
// ===============================
let photo = new Image();
photo.src = sessionStorage.getItem("croppedPhoto");
photo.onload = () => draw();

// ===============================
// 素材管理
// ===============================
let placed = [];      // スタンプ・フレーズのみ
let selected = null;  // 今動かせる素材（常に最新 or Undo 後の最後）
let currentFrame = null; // フレームは 1 つだけ

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
// フレーム処理（タブ方式）
// ===============================
function loadFrames() {
  fetch("assets/frames/list.json")
    .then(res => res.json())
    .then(files => {
      const box = document.getElementById("frames");
      box.innerHTML = "";

      // フレーム一覧のみ（フレームなしボタンは作らない）
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
// 素材配置（スタンプ・フレーズ）
// ===============================
function placeStamp(imageObj) {
  saveHistory();

  const obj = {
    img: imageObj,
    src: imageObj.src,
    x: canvas.width / 2,
    y: canvas.height / 2,
    w: imageObj.width,
    h: imageObj.height,
    scale: 1,
    angle: 0,
    hitCanvas: createHitCanvas(imageObj)
  };

  placed.push(obj);

  // ★ 最新の素材だけ操作対象にする
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
// マウスドラッグ移動（selected だけ）
// ===============================
let dragging = false;

canvas.addEventListener("mousedown", e => {
  if (!selected) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const dx = x - selected.x;
  const dy = y - selected.y;

  if (Math.abs(dx) < selected.w / 2 && Math.abs(dy) < selected.h / 2) {
    dragging = true;
  }
});

canvas.addEventListener("mousemove", e => {
  if (!dragging || !selected) return;

  const rect = canvas.getBoundingClientRect();
  selected.x = e.clientX - rect.left;
  selected.y = e.clientY - rect.top;

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
  }

  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  if (!selected) return;

  if (e.touches.length === 1 && dragging) {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    selected.x = t.clientX - rect.left;
    selected.y = t.clientY - rect.top;
    draw();
    e.preventDefault();
    return;
  }
}, { passive: false });

canvas.addEventListener("touchend", () => dragging = false);

// ===============================
// スマホ：2本指ピンチ拡大・回転（selected だけ）
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
// Undo（戻る：最後の素材を削除し、前のを選択状態に）
// ===============================
document.getElementById("undoBtn").onclick = () => {
  if (history.length === 0) return;

  const snapshot = JSON.parse(history.pop());

  placed = snapshot.map(data => {
    const img = new Image();
    img.src = data.src;

    const obj = {
      img,
      src: data.src,
      x: data.x,
      y: data.y,
      w: data.w,
      h: data.h,
      scale: data.scale,
      angle: data.angle,
      hitCanvas: null
    };

    img.onload = () => {
      obj.hitCanvas = createHitCanvas(img);
      draw();
    };

    return obj;
  });

  // ★ 復元後の最後の素材を選択状態にする
  selected = placed.length > 0 ? placed[placed.length - 1] : null;

  draw();
};

// ===============================
// 保存
// ===============================
document.getElementById("saveBtn").onclick = () => {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "decoration.png";
  link.click();
};

// ===============================
// 初期化
// ===============================
["frames", "stamps", "phrases"].forEach(loadCategory);
showCategory("frames");