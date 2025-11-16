import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.181.0/examples/jsm/loaders/GLTFLoader.js';

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

// GLBモデルを読み込み
const loader = new GLTFLoader();
loader.load('./Duck.glb', (gltf) => {
  gltf.scene.scale.set(1, 1, 1); // サイズ調整（必要に応じて変更）
  gltf.scene.position.set(0, 0, 0); // 位置調整
  scene.add(gltf.scene);
}, undefined, (error) => {
  console.error('モデル読み込み失敗:', error);
});

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();