/**
 * ObstaclePool.js
 * Object-pooled Flashlights & Searchlights obstacles with flicker mechanics.
 */
export class ObstaclePool {
  constructor(game, poolSize = 30) {
    this.game = game;
    this.poolSize = poolSize;
    this.pool = [];
    this.activeObstacles = [];
    this.laneWidth = 2.4;

    this.spawnTimer = 0;
    this.spawnInterval = 2.2; // Seconds between obstacle spawns (scales with difficulty)

    for (let i = 0; i < poolSize; i++) {
      this.pool.push({
        active: false,
        lane: 0,
        x: 0,
        y: 0,
        z: 0,
        type: 'ground', // 'ground' (jumpable) or 'tall' (high searchlight sweep)
        isFlickering: false,
        flickerTimer: 0,
        beamIntensity: 1,
        width: 1.6,
        height: 1.8,
        zLength: 3.5
      });
    }
  }

  reset() {
    this.activeObstacles.forEach(o => o.active = false);
    this.activeObstacles.length = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 2.2;
  }

  getObstacle() {
    for (let i = 0; i < this.poolSize; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    return null;
  }

  spawnObstacle(speedZ, difficultyFactor) {
    const o = this.getObstacle();
    if (!o) return;

    // Pick random lane (-1, 0, 1)
    const lane = Math.floor(Math.random() * 3) - 1;

    // Type: 65% ground flashlight (jumpable), 35% tall searchlight sweep
    const type = Math.random() < 0.65 ? 'ground' : 'tall';

    // 40% chance of flickering light beam
    const isFlickering = Math.random() < 0.4;

    o.active = true;
    o.lane = lane;
    o.x = lane * this.laneWidth;
    o.z = 120; // Far horizon spawn
    o.type = type;
    o.isFlickering = isFlickering;
    o.flickerTimer = isFlickering ? 1.5 + Math.random() * 2.0 : 0;
    o.beamIntensity = isFlickering ? 0.2 : 1.0;

    if (type === 'ground') {
      o.y = 0;
      o.height = 1.4;
      o.width = 1.6;
    } else {
      o.y = 0; // Sweeps from ground to high sky
      o.height = 5.0; // Tall beam cannot be jumped over
      o.width = 1.8;
    }

    this.activeObstacles.push(o);
  }

  update(dt, speedZ, difficultyFactor) {
    // Update spawn timer with difficulty scaling
    this.spawnInterval = Math.max(0.7, 2.2 - difficultyFactor * 0.8);
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle(speedZ, difficultyFactor);
    }

    const player = this.game.player;

    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const o = this.activeObstacles[i];

      // Move toward player camera
      o.z -= speedZ * dt;

      // Update flickering beam state machine
      if (o.isFlickering) {
        o.flickerTimer -= dt;
        if (o.flickerTimer > 0) {
          // Rapid erratic light flicker
          o.beamIntensity = Math.random() > 0.4 ? (0.2 + Math.random() * 0.8) : 0.05;
        } else {
          // Stabilize into full intensity beam
          o.isFlickering = false;
          o.beamIntensity = 1.0;
        }
      }

      // Recycle obstacles behind camera
      if (o.z < -5) {
        o.active = false;
        this.activeObstacles.splice(i, 1);
        continue;
      }

      // Collision Detection with Player (3D Bounding Box / Distance check)
      if (o.z > 0.5 && o.z < 4.0 && o.beamIntensity > 0.3) {
        const isSameLane = player.targetLane === o.lane || Math.abs(player.x - o.x) < 1.1;

        if (isSameLane) {
          if (o.type === 'ground') {
            // Ground flashlights: Jumped over if player height > 1.2
            if (player.y < 1.2) {
              player.takeDamage(40 * o.beamIntensity, dt);
            }
          } else if (o.type === 'tall') {
            // Tall searchlight sweep: Cannot be jumped over!
            player.takeDamage(55 * o.beamIntensity, dt);
          }
        }
      }
    }
  }

  render(ctx, renderer) {
    // Sort back-to-front by depth Z for proper depth rendering
    const sorted = [...this.activeObstacles].sort((a, b) => b.z - a.z);

    sorted.forEach(o => {
      if (o.z < 0 || o.z > 130) return;

      const screenPos = renderer.project(o.x, o.y, o.z);
      if (!screenPos) return;

      const scale = screenPos.scale;

      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);

      if (o.type === 'ground') {
        this.drawGroundFlashlight(ctx, scale, o);
      } else {
        this.drawTallSearchlight(ctx, scale, o);
      }

      ctx.restore();
    });
  }

  // Draw Standard Ground Flashlight Cone
  drawGroundFlashlight(ctx, scale, o) {
    const width = 160 * scale * o.beamIntensity;
    const length = 220 * scale;

    // Glowing intense beam cone pointing towards player
    const grad = ctx.createLinearGradient(0, -length, 0, 0);
    grad.addColorStop(0, `rgba(255, 247, 178, ${0.9 * o.beamIntensity})`);
    grad.addColorStop(0.3, `rgba(255, 230, 0, ${0.7 * o.beamIntensity})`);
    grad.addColorStop(1, `rgba(230, 0, 57, ${0.1 * o.beamIntensity})`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -length);
    ctx.lineTo(-width / 2, 0);
    ctx.lineTo(width / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Beam core highlight
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * o.beamIntensity})`;
    ctx.beginPath();
    ctx.moveTo(0, -length);
    ctx.lineTo(-width / 6, 0);
    ctx.lineTo(width / 6, 0);
    ctx.closePath();
    ctx.fill();

    // Flashlight fixture base on ground
    ctx.fillStyle = '#111';
    ctx.fillRect(-12 * scale, -length - 6 * scale, 24 * scale, 12 * scale);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(-8 * scale, -length - 4 * scale, 16 * scale, 8 * scale);
  }

  // Draw Tall Searchlight Sweep Beam
  drawTallSearchlight(ctx, scale, o) {
    const width = 180 * scale * o.beamIntensity;
    const height = 450 * scale;

    // Vertical searchlight pillar sweep reaching sky
    const grad = ctx.createLinearGradient(0, -height, 0, 0);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * o.beamIntensity})`);
    grad.addColorStop(0.4, `rgba(255, 230, 0, ${0.85 * o.beamIntensity})`);
    grad.addColorStop(1, `rgba(230, 0, 57, ${0.2 * o.beamIntensity})`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-width / 4, -height);
    ctx.lineTo(width / 4, -height);
    ctx.lineTo(width / 2, 0);
    ctx.lineTo(-width / 2, 0);
    ctx.closePath();
    ctx.fill();

    // High Searchlight Spotlight Ring Base
    ctx.fillStyle = `rgba(255, 230, 0, ${0.9 * o.beamIntensity})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, width / 2, width / 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
