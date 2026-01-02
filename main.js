import * as THREE from 'three';

import { initAudio, audioReady } from './audio.js';
import { initCamera } from './camera.js';
import { fireworks, initFireworks } from './fireworks.js';
import { launchMainFireworks, launchBackgroundFireworks } from './launcher.js';

// 3D Text
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

function addBirthdayText(scene) {
  const loader = new FontLoader();

  loader.load('./fonts/helvetiker_regular.typeface.json', (font) => {

    const geometry = new TextGeometry('お誕生日おめでとう！', {
      font: font,
      size: 0.45,
      height: 0.01,     // ← 奥行きを極薄に
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 2
    });

    const material = new THREE.MeshPhongMaterial({
      color: 0xff66cc,
      emissive: 0x330022,
      shininess: 80
    });

    const mesh = new THREE.Mesh(geometry, material);

    // ← 近づけてパース歪みをほぼゼロに
    mesh.position.set(-1.5, 1.2, -1.8);

    // ← 初期角度だけ
    mesh.rotation.y = 0.15;

    scene.add(mesh);
  });
}

// Audio
await audioReady;
initAudio();

// Camera
initCamera();

// Three.js setup
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

// Fireworks
initFireworks(scene);
addBirthdayText(scene);

// Launchers
launchMainFireworks();
launchBackgroundFireworks();

// Render loop
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