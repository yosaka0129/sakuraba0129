import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';

// ===========================
// Web Audio
// ===========================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let fireworkBuffer2 = null; // 上昇〜爆発直前など
let fireworkBuffer = null;  // 爆発音（セカンドにも利用）
let audioEnabled = false;

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

// ===========================
// Camera video background
// ===========================
const video = document.getElementById("camera");
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
  .then(stream => {
    video.srcObject = stream;
    video.play().catch(err => console.error("再生失敗:", err));
  })
  .catch(err => console.error("カメラ取得失敗:", err));

// ===========================
// Three.js setup
// ===========================
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===========================
// Textures
// ===========================
const glowTexture = new THREE.TextureLoader().load('./textures/glow.png');

// ===========================
// Shared arrays and limits
// ===========================
const fireworks = [];         // FireworkBall と Explosion/ShapeExplosion を混在で管理
const MAX_FIREWORKS = 24;     // 同時上限（メイン打ち上げ）
const MAX_BACKGROUND = 18;    // 背景演出の同時上限（控えめ）

// ===========================
// FireworkBall class
// ===========================
class FireworkBall {
  constructor(position = new THREE.Vector3(0, -2, -5)) {
    this.age = 0;
    this.lifespan = 50;

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3)
    );
    this.material = new THREE.PointsMaterial({
      map: glowTexture,
      color: 0xffffff,
      size: 0.18,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.position.copy(position);
    scene.add(this.points);

    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      0.09 + Math.random() * 0.03, // 打ち上げ速度 0.09〜0.12
      0
    );
    this.trailPositions = [];
    this.maxTrail = 12;
  }

  update() {
    this.age++;
    this.points.position.add(this.velocity);
    this.velocity.y -= 0.002; // 重力

    // 残像（トレイル）
    this.trailPositions.push(this.points.position.clone());
    if (this.trailPositions.length > this.maxTrail) this.trailPositions.shift();

    for (let i = 0; i < this.trailPositions.length; i++) {
      const pos = this.trailPositions[i];
      const alpha = 1 - i / this.trailPositions.length;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
      const mat = new THREE.PointsMaterial({
        map: glowTexture,
        color: 0xffffff,
        size: 0.06,
        transparent: true,
        opacity: alpha * 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });
      const p = new THREE.Points(geo, mat);
      p.position.copy(pos);
      scene.add(p);
      setTimeout(() => {
        scene.remove(p);
        geo.dispose();
        mat.dispose();
      }, 160);
    }

    // 寿命で爆発
    if (this.age >= this.lifespan) {
      fireworks.push(new Explosion(this.points.position.clone(), false));
      scene.remove(this.points);
      this.geometry.dispose();
      this.material.dispose();
      playSound(fireworkBuffer2);
    }
  }

  isDead() { return this.age >= this.lifespan; }
}

// ===========================
// Explosion class (球状＋二段爆発)
// ===========================
class Explosion {
  constructor(position, isSecond = false) {
    const count = 700;
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

      this.positions[i * 3 + 0] = 0;
      this.positions[i * 3 + 1] = 0;
      this.positions[i * 3 + 2] = 0;
      this.velocities.push(new THREE.Vector3(vx, vy, vz));
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const hue = Math.random();
    this.material = new THREE.PointsMaterial({
      map: glowTexture,
      color: new THREE.Color().setHSL(hue, 1, 0.55),
      size: 0.085,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.position.copy(position);
    scene.add(this.points);

    this.age = 0;
    this.lifespan = 90;
    this.explodedOnce = false;
    this.shouldExplodeTwice = Math.random() < 0.4;

    playSound(isSecond ? fireworkBuffer : fireworkBuffer2);
  }

  update() {
    this.age++;
    for (let i = 0; i < this.velocities.length; i++) {
      const v = this.velocities[i];
      v.multiplyScalar(0.983);
      v.add(this.gravity);
      this.positions[i * 3 + 0] += v.x;
      this.positions[i * 3 + 1] += v.y;
      this.positions[i * 3 + 2] += v.z;
    }
    this.geometry.attributes.position.needsUpdate = true;

    if (this.age < 10) {
      this.material.opacity = 1.0;
      this.material.size = 0.10;
    } else {
      const t = this.age / this.lifespan;
      this.material.opacity = Math.pow(1 - t, 3);
      this.material.size = 0.085;
    }

    if (this.age === 30 && this.shouldExplodeTwice && !this.explodedOnce) {
      fireworks.push(new Explosion(this.points.position.clone(), true));
      playSound(fireworkBuffer);
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

// ===========================
// ShapeExplosion class (ハート・桜花火、ピンク限定)
// ===========================
// ===========================
// ShapeExplosion class (ハート・桜花火、ピンク限定)
// ===========================
class ShapeExplosion {
  constructor(position, type = "heart") {
    const count = 500;
    this.positions = new Float32Array(count * 3);
    this.velocities = [];
    this.gravity = new THREE.Vector3(0, -0.0015, 0);

    for (let i = 0; i < count; i++) {
      let vx, vy, vz;

      if (type === "heart") {
        const t = Math.random() * 2 * Math.PI;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2*t)
                - 2 * Math.cos(3*t) - Math.cos(4*t);

        // ランダム傾き
        const angle = (Math.random() - 0.5) * 0.9; // -25°〜+25°
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const rx = x * cosA - y * sinA;
        const ry = x * sinA + y * cosA;

        const scale = 0.009;
        vx = rx * scale;
        vy = ry * scale;
        vz = (Math.random() - 0.5) * 0.02;
      } else if (type === "sakura") {
        const spikes = 5;
        const angle = Math.floor(Math.random() * spikes) * (2 * Math.PI / spikes);
        const radius = 0.08 + Math.random() * 0.04;
        let sx = Math.cos(angle) * radius;
        let sy = Math.sin(angle) * radius;

        // 桜もランダム傾き
        const tilt = (Math.random() - 0.5) * 0.9; // -25°〜+25°
        const cosT = Math.cos(tilt);
        const sinT = Math.sin(tilt);
        const rx = sx * cosT - sy * sinT;
        const ry = sx * sinT + sy * cosT;

        vx = rx + (Math.random() - 0.5) * 0.02;
        vy = ry + (Math.random() - 0.5) * 0.02;
        vz = (Math.random() - 0.5) * 0.02;
      }

      this.positions[i*3+0] = 0;
      this.positions[i*3+1] = 0;
      this.positions[i*3+2] = 0;
      this.velocities.push(new THREE.Vector3(vx, vy, vz));
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // ピンク系カラー（桜は濃ゆく太く）
    this.colors = [];
    for (let i = 0; i < count; i++) {
      let color;
      if (type === "sakura") {
        color = new THREE.Color().setHSL(
          0.95 + Math.random()*0.02,
          0.9 + Math.random()*0.1,   // 彩度高め
          0.45 + Math.random()*0.1   // 明度低めで濃ゆく
        );
      } else {
        color = new THREE.Color().setHSL(
          0.95 + Math.random()*0.02,
          0.7 + Math.random()*0.2,
          0.55 + Math.random()*0.15
        );
      }
      this.colors.push(color.r, color.g, color.b);
    }
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      map: glowTexture,
      size: type === "sakura" ? 0.09 : 0.06, // 桜は太め
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      vertexColors: true
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.position.copy(position);
    scene.add(this.points);

    this.age = 0;
    this.lifespan = 80;
  }

  update() {
    this.age++;
    for (let i = 0; i < this.velocities.length; i++) {
      const v = this.velocities[i];
      v.multiplyScalar(0.985);
      v.add(this.gravity);
      this.positions[i*3+0] += v.x;
      this.positions[i*3+1] += v.y;
      this.positions[i*3+2] += v.z;
    }
    this.geometry.attributes.position.needsUpdate = true;

    const t = this.age / this.lifespan;
    this.material.opacity = Math.pow(1 - t, 1.5);
  }

  isDead() { return this.age > this.lifespan; }

  dispose() {
    scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

// ===========================
// Launch management (メイン花火)
// ===========================
function launchFireworkSet() {
  const numBalls = 2 + Math.floor(Math.random() * 4); // 2〜4個
  for (let i = 0; i < numBalls; i++) {
    fireworks.push(new FireworkBall(new THREE.Vector3(
      (Math.random() - 0.5) * 6,   // 横方向を広く
      -3 + Math.random() * 2.0,    // 下〜上の方からもスタート
      -6 + Math.random() * 6       // 奥行きもばらつかせる
    )));
  }
}

// 花火を定期的に打ち上げる（メイン）
setInterval(() => {
  if (fireworks.length < MAX_FIREWORKS) {
    launchFireworkSet();
  }
}, 1500); // 少し遅めの間隔

// ===========================
// Background演出 (ハート・桜花火)
// ===========================
setInterval(() => {
  if (Math.random() < 0.6) { // 40%の確率
    const numSpecial = Math.floor(Math.random() * 3) + 2; // 2〜4個
    for (let i = 0; i < numSpecial; i++) {
      const type = Math.random() < 0.5 ? "heart" : "sakura";
      fireworks.push(new ShapeExplosion(new THREE.Vector3(
        (Math.random() - 0.5) * 6,   // 横方向
        -1 + Math.random() * 3,      // 縦方向
        -10 + Math.random() * 4      // 奥行き（背景に配置）
      ), type));
    }
  }
}, 1000); // 2秒ごとに判定

// ===========================
// Render loop
// ===========================
function animate() {
  requestAnimationFrame(animate);

  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    if (fireworks[i].isDead()) {
      fireworks[i].dispose?.();
      fireworks.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}
animate();