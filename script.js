import * as THREE from "three";
let w;
let h;
let canvas;
let scene;
let camera;
let renderer;
let object;

const initThree = () => {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas = document.getElementById("canvas");
  setScene();
  setCamera();
  setObject();
  setRenderer();
};

const setScene = () => {
  scene = new THREE.Scene();
};

const setCamera = () => {
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 30);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  scene.add(camera);
};

const setObject = () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshNormalMaterial();
  object = new THREE.Mesh(geometry, material);
  object.position.set(0, 0, 0);
  scene.add(object);
};

const setRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas,
  });
  renderer.setClearColor(0x0000ff, 1.0);
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setAnimationLoop(() => {
    render();
  });
};

const render = () => {
  object.rotation.x += 0.01;
  object.rotation.y += 0.01;
  renderer.render(scene, camera);
};

window.onload = () => {
  initThree();
};