import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';

// Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let fireworkBuffer2 = null; // 一段目
let fireworkBuffer = null;  // 二段目
let audioEnabled = false;

// 音声ファイルをロード
fetch('./sounds/firework2.mp3')
  .then(res => res.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { fireworkBuffer2 = buffer; });

fetch('./sounds/firework.mp3')
  .then(res => res.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { fireworkBuffer = buffer; });

function playSound(buffer) {
  if (!audioEnabled || !buffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
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
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  alpha: true, antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;

// 打ち上げ玉クラス
class FireworkBall {
  constructor(position = new THREE.Vector3(0, -2, -5)) {
    this.age = 0;
    this.lifespan = 50; // ヒューの時間
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(3);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.position.copy(position);
    scene.add(this.points);

    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      0.12,
      0
    );
  }

  update() {
    this.age++;
    this.points.position.add(this.velocity);
    this.velocity.y -= 0.002;

    if (this.age === this.lifespan) {
      fireworks.push(new Explosion(this.points.position.clone(), false));
      scene.remove(this.points);
      this.geometry.dispose();
      this.material.dispose();
      playSound(fireworkBuffer2); // 一段目の音
    }
  }

  isDead() { return this.age >= this.lifespan; }
}

// 爆発クラス（二段爆発あり）
class Explosion {
  constructor(position, isSecond = false) {
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
      color: new THREE.Color().setHSL(hue, 1, 0.5),
      size: 0.04, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.position.copy(position);
    scene.add(this.points);

    this.age = 0;
    this.lifespan = 80;
    this.explodedOnce = false;
    this.shouldExplodeTwice = Math.random() < 0.4;

    // 爆発音を鳴らす
    if (isSecond) {
      playSound(fireworkBuffer); // 二段目の音
    } else {
      playSound(fireworkBuffer2); // 一段目の音
    }
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

    // 二段爆発
    if (this.age === 30 && this.shouldExplodeTwice && !this.explodedOnce) {
      fireworks.push(new Explosion(this.points.position.clone(), true));
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
const MAX_FIREWORKS = 20;

// 打ち上げセット（ひゅーどん）
function launchFireworkSet() {
  const numBalls = Math.random() < 0.5 ? 2 : 3;
  for (let i = 0; i < numBalls; i++) {
    fireworks.push(new FireworkBall(new THREE.Vector3(
      (Math.random() - 0.5) * 4, // 横方向ランダム
      -2 + Math.random() * 0.5,  // 縦方向も少しランダム
      -5 + Math.random() * 2     // 奥行きもランダム
    )));
  }
}

setInterval(() => {
  if (fireworks.length < MAX_FIREWORKS) {
    launchFireworkSet();
  }
}, 1500); // 打ち上げ間隔を少し遅く

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    if (fireworks[i].isDead()) {
      fireworks.splice(i, 1);
    }
  }
  renderer.render(scene, camera);
}
animate();