import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.181.0/examples/jsm/loaders/GLTFLoader.js';

const video = document.getElementById("camera");

// カメラ映像の取得
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error("カメラの取得に失敗しました:", err);
  });

// Three.jsの初期化
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  alpha: true,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// モデルの読み込み
const loader = new GLTFLoader();
loader.load('./pinkcube.glb', (gltf) => {
  const model = gltf.scene;
  model.position.set(0, 0, 0);
  scene.add(model);
}, undefined, (error) => {
  console.error("モデルの読み込みに失敗しました:", error);
});

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();