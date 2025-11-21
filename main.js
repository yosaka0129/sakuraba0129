import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';

// Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let fireworkBuffer = null;
let audioEnabled = false;

fetch('./sounds/firework.mp3')
  .then(res => res.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { fireworkBuffer = buffer; });

function playFireworkSound() {
  if (!audioEnabled || !fireworkBuffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = fireworkBuffer;
  source.connect(audioCtx.destination);
  source.start(0);
}

document.getElementById("enableSound").addEventListener("click", () => {
  audioCtx.resume().then(() => {
    audioEnabled = true;
    document.getElementById("enableSound").style.display = "none";
  });
});

// カメラ映像
const video = document.getElementById("camera");
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
  .then(stream => { video.srcObject = stream; })
  .catch(err => console.error("カメラ取得失敗:", err));

// Three.js セットアップ
const scene = new THREE.Scene();

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
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;

// 花火クラス
class Firework {
  constructor(position = new THREE.Vector3(0, 0, 0)) {
    const count = 600;
    this.positions = new Float32Array(count * 3);
    this.velocities = [];
    this.gravity = new THREE.Vector3(0, -0.002, 0);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = Math.random() * 0.07 + 0.03;

      const vx = speed * Math.sin(phi) * Math.cos(theta);
      const vy = speed * Math.sin(phi) * Math.sin(theta);
      const vz = speed * Math.cos(phi);

      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = 0;
      this.positions[i * 3 + 2] = 0;

      this.velocities.push(new THREE.Vector3(vx, vy, vz));
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const hue = Math.random();
    this.material = new THREE.PointsMaterial({
      color: new THREE.Color().setHSL(hue, 1, 0.4),
      size: 0.04,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true // ← 奥行き感を有効化
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.position.copy(position);
    scene.add(this.points);

    this.age = 0;
    this.lifespan = 80;
    this.explodedOnce = false;
    this.shouldExplodeTwice = Math.random() < 0.3;

    playFireworkSound();
  }

  update() {
    this.age++;
    for (let i = 0; i < this.velocities.length; i++) {
      const v = this.velocities[i];
      v.multiplyScalar(0.98);
      v.add(this.gravity);

      this.positions[i * 3] += v.x;
      this.positions[i * 3 + 1] += v.y;
      this.positions[i * 3 + 2] += v.z;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.material.opacity = Math.pow(1 - this.age / this.lifespan, 2);

    if (this.age === 30 && this.shouldExplodeTwice && !this.explodedOnce) {
      fireworks.push(new Firework(this.points.position.clone()));
      this.explodedOnce = true;
    }
  }

  isDead() { return this.age > this.lifespan; }

  dispose() {
    scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

const fireworks = [];
const MAX_FIREWORKS = 10;

setInterval(() => {
  if (fireworks.length < MAX_FIREWORKS) {
    fireworks.push(new Firework(new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 4 + 2,
      -5 + Math.random() * -5 // ← Z方向に奥行きをランダム付与
    )));
  }
}, 1200);

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);

  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    if (fireworks[i].isDead()) {
      fireworks[i].dispose();
      fireworks.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}
animate();