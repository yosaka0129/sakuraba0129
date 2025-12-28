// camera.js
export function initCamera() {
  const video = document.getElementById("camera");

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false
  })
  .then(stream => {
    video.srcObject = stream;
    video.play().catch(err => console.error("再生失敗:", err));
  })
  .catch(err => console.error("カメラ取得失敗:", err));
}