// fireworks.js
import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';
import { playSound, fireworkBuffer, fireworkBuffer2 } from './audio.js';

export const fireworks = [];
export const MAX_FIREWORKS = 24;
export const MAX_BACKGROUND = 18;

export let scene = null;
export let glowTexture = null;

export function initFireworks(sharedScene) {
  scene = sharedScene;
  glowTexture = new THREE.TextureLoader().load('./textures/glow.png');
}

// ---------------- FireworkBall ----------------
export class FireworkBall {
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
      0.09 + Math.random() * 0.03,
      0
    );

    this.trailPositions = [];
    this.maxTrail = 12;
  }

  update() {
    this.age++;
    this.points.position.add(this.velocity);
    this.velocity.y -= 0.002;

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

      // 🔥 分割前と同じ：即時再生
      playSound(fireworkBuffer2);
    }
  }

  isDead() { return this.age >= this.lifespan; }
}

// ---------------- Explosion ----------------
export class Explosion {
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

    // 🔥 分割前と同じ：即時再生
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

    // 二段爆発
    if (this.age === 30 && this.shouldExplodeTwice && !this.explodedOnce) {
      fireworks.push(new Explosion(this.points.position.clone(), true));

      // 🔥 分割前と同じ：即時再生
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

// ---------------- ShapeExplosion ----------------
export class ShapeExplosion {
  constructor(position, type = "heart") {
    this.type = type;

    const count = 500;
    this.positions = new Float32Array(count * 3);
    this.velocities = [];
    this.gravity = new THREE.Vector3(0, -0.0015, 0);

    const angle = (Math.random() - 0.5) * (Math.PI / 6);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    for (let i = 0; i < count; i++) {
      let x, y, rx, ry, vz;

      if (type === "heart") {
        const t = Math.random() * 2 * Math.PI;
        x = 8 * Math.pow(Math.sin(t), 3);
        y = 6.5 * Math.cos(t) - 2.5 * Math.cos(2*t)
          - 1 * Math.cos(3*t) - 0.5*Math.cos(4*t);

        rx = x * cosA - y * sinA;
        ry = x * sinA + y * cosA;
        vz = (Math.random() - 0.5) * 0.02;

        this.positions[i*3+0] = 0;
        this.positions[i*3+1] = 0;
        this.positions[i*3+2] = 0;

        this.velocities.push(new THREE.Vector3(rx * 0.01, ry * 0.01, vz));

      } else if (type === "sakura") {
        const spikes = 5;
        const baseAngle = Math.floor(Math.random() * spikes) * (2 * Math.PI / spikes);
        const radius = 0.35 + Math.random() * 0.1;

        x = Math.cos(baseAngle) * radius;
        y = Math.sin(baseAngle) * radius;

        rx = x * cosA - y * sinA;
        ry = x * sinA + y * cosA;
        vz = (Math.random() - 0.5) * 0.02;

        this.positions[i*3+0] = 0;
        this.positions[i*3+1] = 0;
        this.positions[i*3+2] = 0;

        this.velocities.push(new THREE.Vector3(rx * 0.07, ry * 0.07, vz));
      }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.colors = [];
    for (let i = 0; i < count; i++) {
      let color;
      if (type === "sakura") {
        color = new THREE.Color().setHSL(0.95 + Math.random()*0.02, 0.9 + Math.random()*0.1, 0.45 + Math.random()*0.1);
      } else {
        color = new THREE.Color().setHSL(0.95 + Math.random()*0.02, 0.7 + Math.random()*0.2, 0.55 + Math.random()*0.15);
      }
      this.colors.push(color.r, color.g, color.b);
    }
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      map: glowTexture,
      size: type === "sakura" ? 0.20 : 0.17,
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

      if (this.type === "heart") {
        v.multiplyScalar(0.80);
      } else if (this.type === "sakura") {
        v.multiplyScalar(0.99);
      }

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