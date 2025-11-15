import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.181.0/examples/jsm/loaders/GLTFLoader.js';

const video = document.getElementById("camera");
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
  .then((stream) => {
    video.srcObject = stream;
  });

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.01, 100);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const loader = new GLTFLoader();
loader.load('./pinkcube.glb', (gltf) => {
  scene.add(gltf.scene);
}, undefined, (error) => {
  console.error(error);
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();