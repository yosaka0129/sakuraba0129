import * as THREE from 'three';

import { initAudio, audioReady } from './audio.js';
import { initCamera } from './camera.js';
import { fireworks, initFireworks } from './fireworks.js';
import { launchMainFireworks, launchBackgroundFireworks } from './launcher.js';

await audioReady;
initAudio();

initCamera();

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

initFireworks(scene);

launchMainFireworks();
launchBackgroundFireworks();

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