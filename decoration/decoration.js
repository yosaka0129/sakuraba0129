// ===============================
// Canvas 初期設定
// ===============================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// レイアウトは CSS で管理するので、JS 側は固定比率だけ意識
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
let placed = [];      // 配置された素材
let selected = null;  // 選択中の素材
let currentStamp = null;
let currentFrame = null;

// ===============================
// Undo 用
// ===============================
let history = [];
function saveHistory() {
  history.push(JSON.stringify(placed));
}

// ===============================
// 当たり判定用オフスクリーンCanvas作成
// ===============================
function createHitCanvas(imageObj) {
  const off = document.createElement("canvas");
  off.width = imageObj.width;
  off.height = imageObj.height;
  const offCtx = off.getContext("2d");
  offCtx.drawImage(imageObj, 0, 0);
  return off;
}

// ===============================
// 描画処理
// ===============================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ---- 写真 ----
  if (photo && photo.complete) {
    const scale = Math.min(canvas.width / photo.width, canvas.height / photo.height);
    const w = photo.width * scale;
    const h = photo.height * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    ctx.drawImage(photo, x, y, w, h);
  }

  // ---- 素材 ----
  placed.forEach(obj => {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.angle);
    ctx.scale(obj.scale, obj.scale);
    ctx.drawImage(obj.img, -obj.w / 2, -obj.h / 2, obj.w, obj.h);

    // ---- 選択中の強調表示 ----
    if (obj === selected) {
      // 白い太枠
      ctx.strokeStyle = "white";
      ctx.lineWidth = 6;
      ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);

      // 赤い細枠
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);

      // 光る影（glow）
      ctx.shadowColor = "rgba(255,0,0,0.7)";
      ctx.shadowBlur = 20;
      ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
    }

    ctx.restore();
  });

  // ---- フレーム ----
  if (currentFrame && currentFrame.complete) {
    ctx.drawImage(currentFrame, 0, 0, canvas.width, canvas.height);
  }
}

// ===============================
// クリックでの素材選択（透明部分除去）
// ===============================
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  selected = placed.find(obj => {
    const dx = x - obj.x;
    const dy = y - obj.y;

    // 回転を逆回転してローカル座標へ
    const cos = Math.cos(-obj.angle);
    const sin = Math.sin(-obj.angle);

    const localX = (dx * cos - dy * sin) / obj.scale + obj.w / 2;
    const localY = (dx * sin + dy * cos) / obj.scale + obj.h / 2;

    if (localX < 0 || localX >= obj.w || localY < 0 || localY >= obj.h) return false;

    const pixel = obj.hitCanvas
      .getContext("2d")
      .getImageData(localX, localY, 1, 1).data;

    return pixel[3] > 0; // α値 > 0 のときだけ選択
  });

  draw();
});

// ===============================
// ドラッグ移動（マウス）
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

canvas.addEventListener("mouseup", () => {
  dragging = false;
});

// ===============================
// スマホ用：1本指ドラッグで位置移動
// ===============================
canvas.addEventListener("touchstart", e => {
  if (!selected) return;
  if (e.touches.length !== 1) return; // 1本指のみ

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

  // 1本指 → 位置移動
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

canvas.addEventListener("touchend", () => {
  dragging = false;
});

// ===============================
// ピンチ拡大・回転（スマホ・2本指）
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
// Undo
// ===============================
document.getElementById("undoBtn").onclick = () => {
  if (history.length > 0) {
    placed = JSON.parse(history.pop());
    selected = null;
    draw();
  }
};

// ===============================
// Delete
// ===============================
document.getElementById("deleteBtn").onclick = () => {
  if (selected) {
    saveHistory();
    placed = placed.filter(obj => obj !== selected);
    selected = null;
    draw();
  }
};

// ===============================
// 保存（簡易版：画像としてダウンロード）
// ===============================
document.getElementById("saveBtn").onclick = () => {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "decoration.png";
  link.click();
};

// ===============================
// 素材タップで即キャンバス中央に配置
// ===============================
function placeStamp(imageObj, name) {
  if (name === "frames") {
    currentFrame = imageObj;
    draw();
    return;
  }

  currentStamp = imageObj;

  const x = canvas.width / 2;
  const y = canvas.height / 2;

  saveHistory();
  placed.push({
    img: imageObj,
    x,
    y,
    w: imageObj.width,
    h: imageObj.height,
    scale: 1,
    angle: 0,
    hitCanvas: createHitCanvas(imageObj) // ← 透明判定用
  });

  selected = placed[placed.length - 1];
  draw();
}

// ===============================
// JSON から素材一覧を読み込む
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

          if (imageObj.complete) {
            placeStamp(imageObj, name);
          } else {
            imageObj.onload = () => placeStamp(imageObj, name);
          }
        };

        box.appendChild(img);
      });
    })
    .catch(err => console.error("JSON 読み込みエラー:", err));
}

// ===============================
// カテゴリ切り替え
// ===============================
function showCategory(name) {
  document.querySelectorAll(".category").forEach(c => {
    c.style.display = "none";
  });
  const target = document.getElementById(name);
  if (target) target.style.display = "block";
}
window.showCategory = showCategory;

// ===============================
// 初期化
// ===============================
["frames", "stamps", "phrases"].forEach(loadCategory);
showCategory("stamps");