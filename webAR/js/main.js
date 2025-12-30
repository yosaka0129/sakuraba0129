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
      height: 0.05,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.008,
      bevelSegments: 3
    });

    const material = new THREE.MeshPhongMaterial({
      color: 0xff66cc,
      emissive: 0x330022,
      shininess: 80
    });

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(-2.5, 1.5, -5);
    mesh.rotation.y = 0.2;

    scene.add(mesh);

    function animateText() {
      requestAnimationFrame(animateText);
      mesh.rotation.y += 0.002;
      mesh.position.y = 1.5 + Math.sin(Date.now() * 0.001) * 0.05;
    }
    animateText();
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