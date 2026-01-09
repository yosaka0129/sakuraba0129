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
// スマホでのピンチ時に画面が動かないようにする
// ===============================
canvas.addEventListener("touchstart", e => {
  if (e.touches.length >= 2) e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  if (e.touches.length >= 2) e.preventDefault();
}, { passive: false });

// ===============================
// 描画処理
// ===============================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ---- 写真 ----
  if (photo) {
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
  if (currentFrame) {
    ctx.drawImage(currentFrame, 0, 0, canvas.width, canvas.height);
  }
}

// ===============================
// 素材を置く・選択する
// ===============================
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // ---- 既存素材の選択判定（矩形判定）----
  selected = placed.find(obj => {
    const dx = x - obj.x;
    const dy = y - obj.y;
    return Math.abs(dx) < obj.w / 2 && Math.abs(dy) < obj.h / 2;
  });

  if (selected) {
    draw();
    return;
  }
});

// ===============================
// ドラッグ移動
// ===============================
let dragging = false;

canvas.addEventListener("mousedown", () => {
  if (selected) dragging = true;
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
// ピンチ拡大・回転（スマホ操作）
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

  // 拡大縮小
  if (lastDist !== 0) {
    selected.scale *= dist / lastDist;
  }

  // 回転
  if (lastAngle !== 0) {
    selected.angle += angle - lastAngle;
  }

  lastDist = dist;
  lastAngle = angle;

  draw();
});

canvas.addEventListener("touchend", () => {
  lastDist = 0;
  lastAngle = 0;
});

// ===============================
// 戻る（Undo）
// ===============================
document.getElementById("undoBtn").onclick = () => {
  if (history.length > 0) {
    placed = JSON.parse(history.pop());
    selected = null;
    draw();
  }
};

// ===============================
// 削除（Delete）
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
// 素材をタップしたら即キャンバス中央に配置
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
    angle: 0
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
  document.getElementById(name).style.display = "flex";
}
window.showCategory = showCategory;

// ===============================
// 初期化
// ===============================
["frames", "stamps", "phrases"].forEach(loadCategory);
showCategory("stamps");