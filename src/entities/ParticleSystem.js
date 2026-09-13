/**
 * ParticleSystem.js
 * High-performance object-pooled particle manager for DracRun.
 */
export class ParticleSystem {
  constructor(maxParticles = 300) {
    this.maxParticles = maxParticles;
    this.pool = [];
    this.activeParticles = [];

    // Pre-allocate pool objects
    for (let i = 0; i < maxParticles; i++) {
      this.pool.push({
        active: false,
        type: 'mist', // 'mist', 'bat', 'smoke', 'spark', 'ash'
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        size: 1,
        maxSize: 1,
        life: 0,
        maxLife: 1,
        color: '#ffffff',
        alpha: 1,
        rotation: 0,
        vRot: 0,
        wingPhase: 0
      });
    }
  }

  getParticle() {
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    return null; // Pool exhausted
  }

  // Spawn ambient drifting mist/fog particle
  spawnMist(x, y, z) {
    const p = this.getParticle();
    if (!p) return;

    p.active = true;
    p.type = 'mist';
    p.x = x + (Math.random() - 0.5) * 8;
    p.y = y + Math.random() * 2;
    p.z = z + Math.random() * 40;
    p.vx = (Math.random() - 0.5) * 0.05;
    p.vy = 0.01;
    p.vz = 0;
    p.size = 2.5 + Math.random() * 3.5;
    p.life = 0;
    p.maxLife = 4 + Math.random() * 4;
    p.color = '#eceff1';
    p.alpha = 0.15 + Math.random() * 0.2;
    this.activeParticles.push(p);
  }

  // Spawn flapping background bat silhouette drifting across moon
  spawnMoonBat(x, y, z) {
    const p = this.getParticle();
    if (!p) return;

    p.active = true;
    p.type = 'bat';
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = 0.08 + Math.random() * 0.08;
    p.vy = (Math.random() - 0.5) * 0.03;
    p.vz = 0;
    p.size = 0.4 + Math.random() * 0.4;
    p.life = 0;
    p.maxLife = 6 + Math.random() * 4;
    p.color = '#05030a';
    p.alpha = 0.85;
    p.wingPhase = Math.random() * Math.PI * 2;
    this.activeParticles.push(p);
  }

  // Spawn dark shadow smoke puff when morphing
  spawnSmokeBurst(x, y, z, count = 16) {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;

      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 0.05 + Math.random() * 0.08;

      p.active = true;
      p.type = 'smoke';
      p.x = x;
      p.y = y;
      p.z = z;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed + 0.03;
      p.vz = (Math.random() - 0.5) * 0.1;
      p.size = 0.8 + Math.random() * 0.8;
      p.life = 0;
      p.maxLife = 0.6 + Math.random() * 0.4;
      p.color = Math.random() > 0.4 ? '#0b0817' : '#8b0000';
      p.alpha = 0.8;
      this.activeParticles.push(p);
    }
  }

  // Spawn sizzling sparks when in light beam
  spawnSparks(x, y, z, count = 5) {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;

      p.active = true;
      p.type = 'spark';
      p.x = x + (Math.random() - 0.5) * 1.5;
      p.y = y + Math.random() * 2;
      p.z = z;
      p.vx = (Math.random() - 0.5) * 0.15;
      p.vy = 0.1 + Math.random() * 0.2;
      p.vz = (Math.random() - 0.5) * 0.1;
      p.size = 0.2 + Math.random() * 0.3;
      p.life = 0;
      p.maxLife = 0.3 + Math.random() * 0.3;
      p.color = Math.random() > 0.5 ? '#fff7b2' : '#e60039';
      p.alpha = 1;
      this.activeParticles.push(p);
    }
  }

  // Spawn ash disintegration on game over
  spawnAshCloud(x, y, z, count = 40) {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;

      p.active = true;
      p.type = 'ash';
      p.x = x + (Math.random() - 0.5) * 1.2;
      p.y = y + Math.random() * 2;
      p.z = z;
      p.vx = (Math.random() - 0.5) * 0.12;
      p.vy = 0.08 + Math.random() * 0.15;
      p.vz = (Math.random() - 0.5) * 0.1;
      p.size = 0.3 + Math.random() * 0.5;
      p.life = 0;
      p.maxLife = 1.5 + Math.random() * 1.0;
      p.color = '#333333';
      p.alpha = 0.9;
      this.activeParticles.push(p);
    }
  }

  update(dt, speedZ = 0) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        p.active = false;
        this.activeParticles.splice(i, 1);
        continue;
      }

      // Update positions
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.z += (p.vz - speedZ) * dt * 60;

      if (p.type === 'bat') {
        p.wingPhase += dt * 15;
      }

      if (p.type === 'mist') {
        p.alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.25;
      } else if (p.type === 'smoke') {
        p.alpha = 1 - p.life / p.maxLife;
        p.size += dt * 1.5;
      } else if (p.type === 'spark') {
        p.alpha = 1 - p.life / p.maxLife;
      } else if (p.type === 'ash') {
        p.alpha = 1 - p.life / p.maxLife;
      }
    }
  }

  clear() {
    this.activeParticles.forEach(p => p.active = false);
    this.activeParticles.length = 0;
  }
}
