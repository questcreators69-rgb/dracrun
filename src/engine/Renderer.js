/**
 * Renderer.js
 * Canvas 2D Pseudo-3D Perspective Renderer for DracRun.
 * Renders sky, procedural moon with craters, distant gothic castle horizon, cobblestone track, particles, & entities.
 */
export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;

    // Viewport dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Camera & Perspective Settings
    this.fov = 320; // Perspective focal length
    this.cameraY = 2.4; // Camera elevation height off ground
    this.cameraZ = 0;
    this.vanishingPointY = 0.42; // Horizon position (42% down screen)

    // Camera Shake
    this.shakeAmount = 0;

    // Cobblestone road texture offset for infinite scrolling
    this.roadScrollZ = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  addCameraShake(amount) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  // 3D to 2D Screen Projection Transformation Math
  project(x, y, z) {
    if (z <= 0.1) return null; // Behind camera

    const vpX = this.width / 2;
    const vpY = this.height * this.vanishingPointY;

    // Perspective scaling factor inversely proportional to distance Z
    const scale = this.fov / (this.fov + z * 14);

    const screenX = vpX + x * scale * 100;
    const screenY = vpY + (this.cameraY - y) * scale * 100;

    return { x: screenX, y: screenY, scale };
  }

  render(dt, speedZ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Update camera shake decay
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeAmount > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeAmount * 18;
      shakeY = (Math.random() - 0.5) * this.shakeAmount * 18;
      this.shakeAmount = Math.max(0, this.shakeAmount - dt * 2.5);
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. Draw Midnight Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * this.vanishingPointY);
    skyGrad.addColorStop(0, '#05030a');
    skyGrad.addColorStop(0.6, '#0b0817');
    skyGrad.addColorStop(1, '#1b1233');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * this.vanishingPointY + 2);

    // 2. Draw Procedural Crater-Shaded Moon & Bloom
    this.drawMoon(ctx, w / 2, h * 0.18, 75);

    // 3. Draw Background Gothic Castle & Spires Skyline
    this.drawSkyline(ctx, w, h * this.vanishingPointY);

    // 4. Draw Cobblestone Track & 3 Lanes (Subway Surfers perspective)
    this.roadScrollZ += speedZ * dt;
    this.drawCobblestoneTrack(ctx, w, h, speedZ);

    // 5. Render Object Pools: Obstacles, Pickups, Particles
    this.game.pickups.render(ctx, this);
    this.game.obstacles.render(ctx, this);
    this.drawParticles(ctx);

    // 6. Render Player Dracula / Bat
    const playerPos = this.project(this.game.player.x, this.game.player.y, this.game.player.z);
    if (playerPos) {
      this.game.player.render(ctx, playerPos, playerPos.scale);
    }

    ctx.restore();
  }

  // Draw Massive Procedural Moon with Craters and Ambient Glow
  drawMoon(ctx, x, y, radius) {
    ctx.save();

    // Outer soft moon bloom
    const moonBloom = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 2.2);
    moonBloom.addColorStop(0, 'rgba(236, 239, 241, 0.4)');
    moonBloom.addColorStop(0.5, 'rgba(236, 239, 241, 0.15)');
    moonBloom.addColorStop(1, 'rgba(236, 239, 241, 0)');
    ctx.fillStyle = moonBloom;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Moon disc with surface gradient
    const moonGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    moonGrad.addColorStop(0, '#ffffff');
    moonGrad.addColorStop(0.7, '#eceff1');
    moonGrad.addColorStop(1, '#b0bec5');

    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Procedural Crater Shading
    ctx.fillStyle = 'rgba(144, 164, 174, 0.35)';
    const craters = [
      { cx: -0.3, cy: -0.2, r: 0.22 },
      { cx: 0.25, cy: 0.15, r: 0.18 },
      { cx: -0.15, cy: 0.35, r: 0.15 },
      { cx: 0.4, cy: -0.25, r: 0.14 },
      { cx: -0.45, cy: 0.1, r: 0.12 }
    ];

    craters.forEach(c => {
      ctx.beginPath();
      ctx.arc(x + c.cx * radius, y + c.cy * radius, c.r * radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // Draw Distant Silhouettes of Gothic Castle Spires, Gargoyles, & Tombstones
  drawSkyline(ctx, w, horizonY) {
    ctx.save();
    ctx.fillStyle = '#070412';

    // Left Castle Spires
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(0, horizonY - 60);
    ctx.lineTo(w * 0.05, horizonY - 140); // Main Spire
    ctx.lineTo(w * 0.08, horizonY - 70);
    ctx.lineTo(w * 0.12, horizonY - 180); // High Tower
    ctx.lineTo(w * 0.15, horizonY - 90);
    ctx.lineTo(w * 0.22, horizonY - 110);
    ctx.lineTo(w * 0.28, horizonY - 30);
    ctx.lineTo(w * 0.32, horizonY);
    ctx.fill();

    // Right Castle Spires & Dead Trees
    ctx.beginPath();
    ctx.moveTo(w, horizonY);
    ctx.lineTo(w, horizonY - 80);
    ctx.lineTo(w * 0.95, horizonY - 160);
    ctx.lineTo(w * 0.91, horizonY - 85);
    ctx.lineTo(w * 0.86, horizonY - 200); // Cathedral Pinnacle
    ctx.lineTo(w * 0.82, horizonY - 95);
    ctx.lineTo(w * 0.74, horizonY - 120);
    ctx.lineTo(w * 0.68, horizonY - 35);
    ctx.lineTo(w * 0.65, horizonY);
    ctx.fill();

    ctx.restore();
  }

  // Draw Cobblestone Track with 3 Lanes converging to horizon
  drawCobblestoneTrack(ctx, w, h, speedZ) {
    const horizonY = h * this.vanishingPointY;
    const trackBottomWidth = w * 0.85;
    const trackTopWidth = w * 0.08;

    const vpX = w / 2;

    // Track Ground Base (Gothic Dark Slate/Cobblestone)
    ctx.save();
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    groundGrad.addColorStop(0, '#0a0714');
    groundGrad.addColorStop(0.5, '#120d24');
    groundGrad.addColorStop(1, '#05030a');

    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.moveTo(vpX - trackTopWidth / 2, horizonY);
    ctx.lineTo(vpX + trackTopWidth / 2, horizonY);
    ctx.lineTo(vpX + trackBottomWidth / 2, h);
    ctx.lineTo(vpX - trackBottomWidth / 2, h);
    ctx.closePath();
    ctx.fill();

    // Side Borders (Crimson glowing coping stones)
    ctx.strokeStyle = '#8b0000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(vpX - trackTopWidth / 2, horizonY);
    ctx.lineTo(vpX - trackBottomWidth / 2, h);
    ctx.moveTo(vpX + trackTopWidth / 2, horizonY);
    ctx.lineTo(vpX + trackBottomWidth / 2, h);
    ctx.stroke();

    // 3 Distinct Lane Lines (Left, Center, Right borders)
    const laneWidthBottom = trackBottomWidth / 3;
    const laneWidthTop = trackTopWidth / 3;

    ctx.strokeStyle = 'rgba(230, 0, 57, 0.4)';
    ctx.lineWidth = 2;

    for (let lane = -1; lane <= 1; lane++) {
      if (lane === 0) continue; // Center line divider

      const xTop = vpX + (lane * laneWidthTop / 2);
      const xBottom = vpX + (lane * laneWidthBottom / 2);

      ctx.beginPath();
      ctx.moveTo(xTop, horizonY);
      ctx.lineTo(xBottom, h);
      ctx.stroke();
    }

    // Cobblestone Perspective Horizontal Lines (Moving forward)
    const lineCount = 20;
    ctx.strokeStyle = 'rgba(236, 239, 241, 0.12)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < lineCount; i++) {
      // Exponential distribution for 3D perspective spacing
      let progress = ((i / lineCount) + (this.roadScrollZ * 0.05)) % 1;
      let y = horizonY + Math.pow(progress, 2.5) * (h - horizonY);

      if (y > horizonY && y < h) {
        const currentWidth = trackTopWidth + (trackBottomWidth - trackTopWidth) * progress;
        ctx.beginPath();
        ctx.moveTo(vpX - currentWidth / 2, y);
        ctx.lineTo(vpX + currentWidth / 2, y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // Draw Object-Pooled Particles (Mist, Bats, Smoke, Sparks, Ash)
  drawParticles(ctx) {
    const particles = this.game.particles.activeParticles;

    particles.forEach(p => {
      ctx.save();

      if (p.type === 'bat') {
        // Moon Bat Silhouette
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        const batX = (p.x * 0.5 + 0.5) * this.width;
        const batY = p.y * this.height * 0.3;
        const batSize = p.size * 18;
        const wing = Math.sin(p.wingPhase) * batSize * 0.5;

        ctx.translate(batX, batY);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-batSize, -wing, -batSize * 1.5, 0);
        ctx.quadraticCurveTo(-batSize * 0.8, batSize * 0.5, 0, batSize * 0.2);
        ctx.quadraticCurveTo(batSize * 0.8, batSize * 0.5, batSize * 1.5, 0);
        ctx.quadraticCurveTo(batSize, -wing, 0, 0);
        ctx.fill();
      } else {
        // 3D projected particles (mist, smoke, spark, ash)
        const pos = this.project(p.x, p.y, p.z);
        if (pos) {
          ctx.translate(pos.x, pos.y);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;

          const renderSize = Math.max(1, p.size * pos.scale * 30);

          if (p.type === 'spark') {
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.fillRect(-renderSize / 2, -renderSize / 2, renderSize, renderSize);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, renderSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    });
  }
}
