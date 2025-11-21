import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';

// ===========================
// Web Audio
// ===========================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let fireworkBuffer2 = null; // 一段目
let fireworkBuffer = null;  // 二段目
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
  .then(stream => { video.srcObject = stream; })
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
// Firework ball (launch)
// ===========================
class FireworkBall {
  constructor(position = new THREE.Vector3(0, -2, -5)) {
    this.age = 0;
    this.lifespan = 50;

    this.geometry = new THREE.BufferGeometry();
    // PointsGeometry expects some position; we keep a single vertex at origin of the Points object
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
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

    // Upward velocity with slight horizontal randomness
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      0.12,
      0
    );

    // simple trail positions buffer
    this.trailPositions = [];
    this.maxTrail = 12;
  }

  update() {
    this.age++;

    // move
    this.points.position.add(this.velocity);
    this.velocity.y -= 0.002; // gravity

    // trail: store positions and render faint glow sprites
    this.trailPositions.push(this.points.position.clone());
    if (this.trailPositions.length > this.maxTrail) this.trailPositions.shift();

    // draw trail as lightweight transient points
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
      // remove tiny trail point shortly to avoid resource buildup
      setTimeout(() => { scene.remove(p); geo.dispose(); mat.dispose(); }, 160);
    }

    // transition to explosion
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
// Explosion (uniform color per firework)
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

    // Choose a unified color per explosion
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

    // sound
    playSound(isSecond ? firework : fireworkBuffer2);
  }

  update() {
    this.age++;

    // physics update
    for (let i = 0; i < this.velocities.length; i++) {
      const v = this.velocities[i];
      v.multiplyScalar(0.983); // mild drag for cohesion
      v.add(this.gravity);
      this.positions[i * 3 + 0] += v.x;
      this.positions[i * 3 + 1] += v.y;
      this.positions[i * 3 + 2] += v.z;
    }
    this.geometry.attributes.position.needsUpdate = true;

    // flash phase then decay
    if (this.age < 10) {
      // intense flash
      this.material.opacity = 1.0;
      this.material.size = 0.10;
    } else {
      const t = this.age / this.lifespan;
      this.material.opacity = Math.pow(1 - t, 3);
      this.material.size = 0.085;
    }

    // second burst
    if (this.age === 30 && this.shouldExplodeTwice && !this.explodedOnce) {
      fireworks.push(new Explosion(this.points.position.clone(), true));
      // two-stage sound second time
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
// Launch management
// ===========================
const fireworks = [];
const MAX_FIREWORKS = 24;

function launchFireworkSet() {
  const numBalls = 2 + Math.floor(Math.random() * 3); // 2〜4個
  for (let i = 0; i < numBalls; i++) {
    fireworks.push(new FireworkBall(new THREE.Vector3(
      (Math.random() - 0.5) * 4,     // X
      -2 + Math.random() * 0.5,      // Y slight variation
      -5 + Math.random() * 2         // Z depth variation
    )));
  }
}

setInterval(() => {
  if (fireworks.length < MAX_FIREWORKS) {
    launchFireworkSet();
  }
}, 1500); // 少し遅めの間隔

// ===========================
// Render loop
// ===========================
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