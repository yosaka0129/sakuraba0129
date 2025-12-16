let cropper;
const upload = document.getElementById('upload');
const cropArea = document.getElementById('cropArea');
const confirmBtn = document.getElementById('confirmBtn');
const rotateHandle = document.getElementById('rotateHandle');

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

      img.onload = () => {
        cropper = new Cropper(img, {
          aspectRatio: 1,
          viewMode: 1,
          movable: true,
          zoomable: true,
          rotatable: true,
          scalable: true,
          ready() {
            // 赤い枠を表示
            const overlay = document.createElement("div");
            overlay.style.position = "absolute";
            overlay.style.border = "5px solid red";
            overlay.style.width = "300px";
            overlay.style.height = "300px";
            overlay.style.top = "50%";
            overlay.style.left = "50%";
            overlay.style.transform = "translate(-50%, -50%)";
            cropArea.appendChild(overlay);
          }
        });
      };
    };
    reader.readAsDataURL(file);
  };
}

// 回転ハンドルで回転
let rotating = false;
rotateHandle.addEventListener("mousedown", () => rotating = true);
document.addEventListener("mouseup", () => rotating = false);
document.addEventListener("mousemove", e => {
  if (rotating && cropper) {
    const rect = rotateHandle.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    cropper.rotateTo(angle);
  }
});

if (confirmBtn) {
  confirmBtn.onclick = () => {
    if (!cropper) {
      alert("まず写真をアップロードしてください！");
      return;
    }
    const croppedCanvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
    if (!croppedCanvas) {
      alert("画像がまだ読み込まれていません。少し待ってから確定してください！");
      return;
    }
    const dataUrl = croppedCanvas.toDataURL("image/png");
    sessionStorage.setItem("croppedPhoto", dataUrl);
    window.location.href = "decoration.html";
  };
}