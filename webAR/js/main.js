// main.js
import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';

import { initAudio } from './audio.js';
import { initCamera } from './camera.js';
import { fireworks, initFireworks } from './fireworks.js';
import { launchMainFireworks, launchBackgroundFireworks } from './launcher.js';

// ---------------- Audio & Camera ----------------
initAudio();
initCamera();

// ---------------- Three.js setup ----------------
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------- Fireworks init ----------------
initFireworks(scene);

// ---------------- Launchers ----------------
launchMainFireworks();
launchBackgroundFireworks();

// ---------------- Render loop ----------------
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