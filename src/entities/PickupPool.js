/**
 * PickupPool.js
 * Object-pooled Blood Drop collectibles with ruby specular highlights and parabolic arc layouts.
 */
export class PickupPool {
  constructor(game, poolSize = 40) {
    this.game = game;
    this.poolSize = poolSize;
    this.pool = [];
    this.activePickups = [];
    this.laneWidth = 2.4;

    this.spawnTimer = 0;
    this.spawnInterval = 1.6;

    for (let i = 0; i < poolSize; i++) {
      this.pool.push({
        active: false,
        lane: 0,
        x: 0,
        y: 0,
        z: 0,
        rotation: 0,
        hoverPhase: 0,
        collected: false
      });
    }
  }

  reset() {
    this.activePickups.forEach(p => p.active = false);
    this.activePickups.length = 0;
    this.spawnTimer = 0;
  }

  getPickup() {
    for (let i = 0; i < this.poolSize; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    return null;
  }

  // Spawn a pattern of blood droplets (straight lane cluster OR parabolic jump arc)
  spawnPattern(speedZ) {
    const lane = Math.floor(Math.random() * 3) - 1;
    const isJumpArcPattern = Math.random() < 0.45;
    const clusterCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < clusterCount; i++) {
      const p = this.getPickup();
      if (!p) break;

      const offsetZ = 120 + i * 4.5;
      let heightY = 0.6; // Hover slightly off ground

      if (isJumpArcPattern) {
        // Parabolic arc trajectory matching Dracula's jump arc
        const progress = i / (clusterCount - 1);
        heightY = 0.6 + Math.sin(progress * Math.PI) * 2.2;
      }

      p.active = true;
      p.collected = false;
      p.lane = lane;
      p.x = lane * this.laneWidth;
      p.y = heightY;
      p.z = offsetZ;
      p.rotation = Math.random() * Math.PI * 2;
      p.hoverPhase = Math.random() * Math.PI * 2;

      this.activePickups.push(p);
    }
  }

  update(dt, speedZ) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnPattern(speedZ);
    }

    const player = this.game.player;

    for (let i = this.activePickups.length - 1; i >= 0; i--) {
      const p = this.activePickups[i];

      p.z -= speedZ * dt;
      p.rotation += dt * 3.5;
      p.hoverPhase += dt * 5;

      // Recycle pickups behind camera
      if (p.z < -4) {
        p.active = false;
        this.activePickups.splice(i, 1);
        continue;
      }

      // Collision Detection with Player
      if (!p.collected && p.z > 0.5 && p.z < 3.5 && !player.isDead) {
        const dx = Math.abs(player.x - p.x);
        const dy = Math.abs(player.y - p.y);

        if (dx < 1.1 && dy < 1.3) {
          // Collected!
          p.collected = true;
          p.active = false;
          this.activePickups.splice(i, 1);

          // Audio, score bonus (+50), health restore (+3%)
          this.game.audio.playBloodPickup();
          this.game.addBloodCount(1);
          this.game.addScore(50);
          player.heal(3.0);

          // Particle sparkle burst
          this.game.particles.spawnSparks(p.x, p.y, p.z, 6);
        }
      }
    }
  }

  render(ctx, renderer) {
    // Sort back-to-front by depth Z
    const sorted = [...this.activePickups].sort((a, b) => b.z - a.z);

    sorted.forEach(p => {
      if (p.z < 0 || p.z > 130) return;

      const hoverY = p.y + Math.sin(p.hoverPhase) * 0.15;
      const screenPos = renderer.project(p.x, hoverY, p.z);
      if (!screenPos) return;

      const scale = screenPos.scale;

      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);

      this.drawBloodDrop(ctx, scale, p);

      ctx.restore();
    });
  }

  // Draw Procedural Glowing Ruby Blood Drop with Specular Highlight
  drawBloodDrop(ctx, scale, p) {
    const size = 28 * scale;

    ctx.scale(Math.cos(p.rotation), 1); // 3D spin flip effect

    // Glowing outer crimson halo
    ctx.shadowColor = '#e60039';
    ctx.shadowBlur = 15;

    // Tear drop path
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.8, -size * 0.2, size * 0.8, size * 0.4);
    ctx.arc(0, size * 0.4, size * 0.8, 0, Math.PI);
    ctx.quadraticCurveTo(-size * 0.8, -size * 0.2, 0, -size);
    ctx.closePath();

    // Ruby Gradient fill
    const grad = ctx.createRadialGradient(-size * 0.2, -size * 0.2, 2, 0, 0, size);
    grad.addColorStop(0, '#ff4d6d');
    grad.addColorStop(0.4, '#e60039');
    grad.addColorStop(1, '#590012');

    ctx.fillStyle = grad;
    ctx.fill();

    // Specular Highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.25, -size * 0.2, size * 0.25, size * 0.12, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
