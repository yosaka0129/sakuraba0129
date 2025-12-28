// launcher.js
import * as THREE from 'https://unpkg.com/three@0.181.0/build/three.module.js';
import { fireworks, MAX_FIREWORKS, MAX_BACKGROUND, FireworkBall, ShapeExplosion } from './fireworks.js';

export function launchMainFireworks() {
  setInterval(() => {
    if (fireworks.length < MAX_FIREWORKS) {
      const numBalls = 2 + Math.floor(Math.random() * 4);

      for (let i = 0; i < numBalls; i++) {
        fireworks.push(new FireworkBall(new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          -3 + Math.random() * 2.0,
          -6 + Math.random() * 6
        )));
      }
    }
  }, 1500);
}

export function launchBackgroundFireworks() {
  setInterval(() => {
    if (Math.random() < 0.6) {
      const numSpecial = Math.floor(Math.random() * 2) + 3;

      for (let i = 0; i < numSpecial; i++) {
        const type = Math.random() < 0.5 ? "heart" : "sakura";

        fireworks.push(new ShapeExplosion(new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          -1 + Math.random() * 6,
          -10 + Math.random() * 4
        ), type));
      }
    }
  }, 1000);
}