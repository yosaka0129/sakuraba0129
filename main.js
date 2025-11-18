import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

// カメラ映像を取得してvideoに表示
const video = document.getElementById("camera");
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error("カメラ取得失敗:", err);
  });

// Three.jsの基本セットアップ
const scene = new THREE.Scene();

// ライト追加
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  alpha: true,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 花火生成関数（ピンク色）
function createFirework() {
  const count = 150;
  const geometry = new THREE.BufferGeometry();
  const positions = [];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * 1.5;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions.push(x, y, z);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({ color: 0xff66cc, size: 0.05 });
  const points = new THREE.Points(geometry, material);

  points.position.set(0, 0, -5); // 奥の方に配置
  scene.add(points);

  // 2秒後に消す
  setTimeout(() => scene.remove(points), 2000);
}

// 花火を定期的に生成
setInterval(createFirework, 3000);

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();