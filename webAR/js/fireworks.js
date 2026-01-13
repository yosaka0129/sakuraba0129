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

  // ★ 変更：デフォルト位置を画面全体に散らす
  constructor(position = null) {
    this.age = 0;
    this.lifespan = 50;

    if (!position) {
      const x = (Math.random() - 0.5) * 6.0;   // 左右いっぱい
      const y = -2.5 + Math.random() * 2.5;    // 下〜中央
      const z = -4.5 + Math.random() * 1.0;    // 奥行き少しランダム
      position = new THREE.Vector3(x, y, z);
    }

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

    // ★ 変更：上昇速度もランダム化して開く高さを散らす
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      0.08 + Math.random() * 0.05,
      (Math.random() - 0.5) * 0.01
    );

    // ★ trail（軌跡）
    this.maxTrail = 12;
    this.trail = [];

    for (let i = 0; i < this.maxTrail; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3)
      );

      const mat = new THREE.PointsMaterial({
        map: glowTexture,
        color: 0xffffff,
        size: 0.06,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      const p = new THREE.Points(geo, mat);
      p.visible = false;
      scene.add(p);

      this.trail.push({ p, geo, mat });
    }
  }

  update() {
    this.age++;
    this.points.position.add(this.velocity);
    this.velocity.y -= 0.002;

    for (let i = this.maxTrail - 1; i > 0; i--) {
      const prev = this.trail[i - 1].p.position;
      this.trail[i].p.position.copy(prev);
    }

    this.trail[0].p.position.copy(this.points.position);

    for (let i = 0; i < this.maxTrail; i++) {
      const t = 1 - i / this.maxTrail;
      const item = this.trail[i];
      item.mat.opacity = t * 0.8;
      item.p.visible = true;
    }

    if (this.age >= this.lifespan) {
      fireworks.push(new Explosion(this.points.position.clone(), false));
      scene.remove(this.points);
      this.geometry.dispose();
      this.material.dispose();

      for (const item of this.trail) {
        scene.remove(item.p);
        item.geo.dispose();
        item.mat.dispose();
      }

      playSound(fireworkBuffer2);
    }
  }

  isDead() {
    return this.age >= this.lifespan;
  }
}

// ---------------- Explosion（普通の花火） ----------------
export class Explosion {
  constructor(position, isSecond = false) {
    const count = 700;
    this.positions = new Float32Array(count * 3);
    this.velocities = [];
    this.gravity = new THREE.Vector3(0, -0.002, 0);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      // ★ 変更：広がりを強くして画面全体に広がる
      const speed = Math.random() * 0.09 + 0.04;

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

// ---------------- ShapeExplosion（ハート・さくら） ----------------
// ---------------- ShapeExplosion（ハート・さくら） ----------------
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

        // ★ ハートを少し小さく（全体を 0.8 倍）
        x = 11.2 * Math.pow(Math.sin(t), 3);
        y = 8.8 * Math.cos(t)
            - 3.2 * Math.cos(2*t)
            - 1.28 * Math.cos(3*t)
            - 0.64 * Math.cos(4*t);

        rx = x * cosA - y * sinA;
        ry = x * sinA + y * cosA;
        vz = (Math.random() - 0.5) * 0.02;

        this.positions[i*3+0] = 0;
        this.positions[i*3+1] = 0;
        this.positions[i*3+2] = 0;

        // ★ 広がりも少し弱める（0.025 → 0.020）
        this.velocities.push(new THREE.Vector3(rx * 0.020, ry * 0.020, vz));

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

        this.velocities.push(new THREE.Vector3(rx * 0.14, ry * 0.14, vz));
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