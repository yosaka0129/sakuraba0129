const canvas = document.getElementById('canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.6;

  // トリミング済み写真を読み込む
  let photo = new Image();
  photo.src = sessionStorage.getItem("croppedPhoto");
  photo.onload = () => draw();

  // スタンプやフレームの管理
  let placedStamps = [];
  let selectedStamp = null;
  let currentStamp = null;
  let currentFrame = null;

  // 描画処理
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 写真をキャンバス中央にフィット
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
      ctx.rotate(s.angle * Math.PI / 180);
      ctx.drawImage(s.img, -s.size / 2, -s.size / 2, s.size, s.size);

      if (s === selectedStamp) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.strokeRect(-s.size / 2, -s.size / 2, s.size, s.size);
      }
      ctx.restore();
    });

    // フレーム描画
    if (currentFrame) {
      ctx.drawImage(currentFrame, 0, 0, canvas.width, canvas.height);
    }
  }

  // キャンバスクリック
  canvas.onclick = e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    selectedStamp = placedStamps.find(s =>
      x >= s.x - s.size / 2 && x <= s.x + s.size / 2 &&
      y >= s.y - s.size / 2 && y <= s.y + s.size / 2
    );

    if (!selectedStamp && currentStamp) {
      placedStamps.push({ img: currentStamp, x, y, size: 80, angle: 0 });
      draw();
    }
  };

  // 戻る
  document.getElementById('undoBtn').onclick = () => {
    placedStamps.pop();
    draw();
  };

  // 削除
  document.getElementById('deleteBtn').onclick = () => {
    if (selectedStamp) {
      placedStamps = placedStamps.filter(s => s !== selectedStamp);
      selectedStamp = null;
      draw();
    }
  };

  // 保存
  document.getElementById('saveBtn').onclick = () => {
    const link = document.createElement('a');
    link.download = 'decorated.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // ★ json を使った素材読み込み
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
      })
      .catch(err => console.error("JSON 読み込みエラー:", err));
  }

  // カテゴリ切り替え
  function showCategory(name) {
    document.querySelectorAll('.category').forEach(div => {
      div.style.display = 'none';
    });
    document.getElementById(name).style.display = 'flex';
  }
  window.showCategory = showCategory;

  // 初期化
  ["frames", "stamps", "phrases"].forEach(loadCategory);
  showCategory("stamps");
}