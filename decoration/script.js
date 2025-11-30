let cropper;
const upload = document.getElementById('upload');
const cropArea = document.getElementById('cropArea');
const confirmBtn = document.getElementById('confirmBtn');
const rotateBtn = document.getElementById('rotateBtn');

if (upload) {
  upload.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement('img');
      img.src = reader.result;
      img.style.maxWidth = "100%";
      cropArea.innerHTML = "";
      cropArea.appendChild(img);

      // DOMに追加してからCropperを初期化
      cropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,       // 枠が画面外に出ないように
        movable: true,     // 枠をドラッグで移動
        zoomable: true,    // ピンチで拡大縮小
        rotatable: true,   // 回転可能
        scalable: true     // サイズ変更可能
      });
    };
    reader.readAsDataURL(file);
  };
}

if (rotateBtn) {
  rotateBtn.onclick = () => {
    if (cropper) cropper.rotate(90);
  };
}

if (confirmBtn) {
  confirmBtn.onclick = () => {
    if (!cropper) {
      alert("まず写真をアップロードしてください！");
      return;
    }
    const croppedCanvas = cropper.getCroppedCanvas();
    if (!croppedCanvas) {
      alert("トリミング範囲が選択されていません！");
      return;
    }
    const dataUrl = croppedCanvas.toDataURL("image/png");
    sessionStorage.setItem("croppedPhoto", dataUrl);
    window.location.href = "decoration.html";
  };
}

// ===== デコレーション画面 =====
const canvas = document.getElementById('canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.6;

  let photo = new Image();
  photo.src = sessionStorage.getItem("croppedPhoto");
  photo.onload = () => draw();

  let placedStamps = [];
  let selectedStamp = null;
  let currentStamp = null;
  let currentFrame = null;

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // 写真を比率維持で中央に配置
    if (photo) {
      const scale = Math.min(canvas.width / photo.width, canvas.height / photo.height);
      const drawWidth = photo.width * scale;
      const drawHeight = photo.height * scale;
      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;
      ctx.drawImage(photo, x, y, drawWidth, drawHeight);
    }

    // スタンプ描画
    placedStamps.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle * Math.PI/180);
      ctx.drawImage(s.img, -s.size/2, -s.size/2, s.size, s.size);
      if (s === selectedStamp) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.strokeRect(-s.size/2, -s.size/2, s.size, s.size);
      }
      ctx.restore();
    });

    // フレーム描画
    if (currentFrame) {
      ctx.drawImage(currentFrame,0,0,canvas.width,canvas.height);
    }
  }

  canvas.onclick = e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    selectedStamp = placedStamps.find(s =>
      x >= s.x - s.size/2 && x <= s.x + s.size/2 &&
      y >= s.y - s.size/2 && y <= s.y + s.size/2
    );
    if (!selectedStamp && currentStamp) {
      placedStamps.push({img: currentStamp, x, y, size: 80, angle: 0});
      draw();
    }
  };

  document.getElementById('undoBtn').onclick = () => {
    placedStamps.pop();
    draw();
  };

  document.getElementById('deleteBtn').onclick = () => {
    if (selectedStamp) {
      placedStamps = placedStamps.filter(s => s !== selectedStamp);
      selectedStamp = null;
      draw();
    }
  };

  document.getElementById('saveBtn').onclick = () => {
    const link = document.createElement('a');
    link.download = 'decorated.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  function loadCategory(name) {
    fetch(`assets/${name}/list.json`)
      .then(res => res.json())
      .then(files => {
        const container = document.getElementById(name);
        container.innerHTML = "";
        files.forEach(file => {
          const img = document.createElement("img");
          img.src = `assets/${name}/${file}`;
          img.onclick = () => {
            if (name === "frames") currentFrame = img;
            else currentStamp = img;
            draw();
          };
          container.appendChild(img);
        });
      });
  }

  function showCategory(name) {
  // すべてのカテゴリを非表示にする
  document.querySelectorAll('.category').forEach(div => {
    div.style.display = 'none';
  });

  // 指定されたカテゴリだけ表示する
  const target = document.getElementById(name);
  if (target) {
    target.style.display = 'block';
  }
}
  function showCategory(name) {
    // すべてのカテゴリを非表示にする
    document.querySelectorAll('.category').forEach(div => {
      div.style.display = 'none';
    });

    // 指定されたカテゴリだけ表示する
    const target = document.getElementById(name);
    if (target) {
      target.style.display = 'block';
    }
  }

  // ===== ここを追加 =====
  ["frames","stamps","phrases"].forEach(loadCategory);
  showCategory("stamps");
}