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

      img.onload = () => {
        cropper = new Cropper(img, {
          aspectRatio: 1,
          viewMode: 1,
          movable: true,
          zoomable: true,
          rotatable: true,
          scalable: true
        });
      };
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
      alert("画像がまだ読み込まれていません。少し待ってから確定してください！");
      return;
    }
    const dataUrl = croppedCanvas.toDataURL("image/png");
    sessionStorage.setItem("croppedPhoto", dataUrl);
    window.location.href = "decoration.html";
  };
}