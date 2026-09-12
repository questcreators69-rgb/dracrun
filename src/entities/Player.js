/**
 * Player.js
 * Dracula character with Bat morph transformation, 3-lane switching, and physics.
 */
export class Player {
  constructor(game) {
    this.game = game;

    // Lane logic: -1 (Left), 0 (Center), 1 (Right)
    this.currentLane = 0;
    this.targetLane = 0;
    this.laneWidth = 2.4; // 3D world units between lane centers

    // 3D position
    this.x = 0; // Calculated from lane lerp
    this.y = 0; // Height off ground (jumping)
    this.z = 2; // Fixed player distance from camera

    // Jump / Bat Flight physics
    this.isJumping = false;
    this.isBat = false;
    this.jumpVy = 0;
    this.gravity = -24;
    this.jumpImpulse = 9.5;

    // Health / Sunlight Burn Meter
    this.maxHp = 100;
    this.hp = 100;
    this.isBurning = false;
    this.burnTimer = 0;

    // Animations & Timers
    this.runAnimTimer = 0;
    this.wingFlapTimer = 0;

    // Status
    this.isDead = false;
  }

  reset() {
    this.currentLane = 0;
    this.targetLane = 0;
    this.x = 0;
    this.y = 0;
    this.z = 2;
    this.isJumping = false;
    this.isBat = false;
    this.jumpVy = 0;
    this.hp = 100;
    this.isBurning = false;
    this.burnTimer = 0;
    this.isDead = false;
  }

  moveLeft() {
    if (this.isDead) return;
    if (this.targetLane > -1) {
      this.targetLane--;
    }
  }

  moveRight() {
    if (this.isDead) return;
    if (this.targetLane < 1) {
      this.targetLane++;
    }
  }

  jump() {
    if (this.isDead) return;
    if (!this.isJumping) {
      this.isJumping = true;
      this.isBat = true;
      this.jumpVy = this.jumpImpulse;

      // Audio & Particle smoke puff on morph into Bat
      this.game.audio.playBatJump();
      this.game.particles.spawnSmokeBurst(this.x, this.y + 0.8, this.z, 14);
    }
  }

  takeDamage(amount, dt) {
    if (this.isDead) return;

    this.hp = Math.max(0, this.hp - amount * dt);
    this.isBurning = true;
    this.burnTimer = 0.2; // Flash burn for 200ms

    // Trigger sizzle sound & sparks
    this.game.audio.playSizzle(amount / 20);
    this.game.particles.spawnSparks(this.x, this.y + 0.5, this.z, 3);

    if (this.hp <= 0 && !this.isDead) {
      this.die();
    }
  }

  heal(amount) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  die() {
    this.isDead = true;
    this.game.particles.spawnAshCloud(this.x, this.y, this.z, 45);
    this.game.audio.playGameOver();
    this.game.triggerGameOver();
  }

  update(dt) {
    if (this.isDead) return;

    // Smooth horizontal lane transition (lerp)
    const targetX = this.targetLane * this.laneWidth;
    this.x += (targetX - this.x) * 15 * dt;

    // Jump physics
    if (this.isJumping) {
      this.y += this.jumpVy * dt;
      this.jumpVy += this.gravity * dt;

      this.wingFlapTimer += dt * 20;

      // Landing check
      if (this.y <= 0) {
        this.y = 0;
        this.isJumping = false;
        this.isBat = false;
        this.jumpVy = 0;

        // Smoke puff on landing morph back to Dracula
        this.game.particles.spawnSmokeBurst(this.x, 0.5, this.z, 12);
      }
    } else {
      this.runAnimTimer += dt * 12;
    }

    // Burn state decay
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      if (this.burnTimer <= 0) {
        this.isBurning = false;
      }
    }
  }

  // Draw Dracula or Bat procedurally onto screen
  render(ctx, screenPos, scale) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    const charScale = scale * 1.6;
    ctx.scale(charScale, charScale);

    // Damage flash (red/white)
    if (this.isBurning) {
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 20;
    }

    if (this.isBat) {
      this.drawBat(ctx);
    } else {
      this.drawDracula(ctx);
    }

    ctx.restore();
  }

  // Procedural Dracula (Fluttering crimson-lined cape, pale skin, slick hair, red eyes)
  drawDracula(ctx) {
    const bob = Math.sin(this.runAnimTimer) * 4;
    const stride = Math.cos(this.runAnimTimer) * 8;

    ctx.translate(0, bob);

    // Shadow on ground
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 48 - bob, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fluttering Crimson-lined Black Cape (Back layer)
    const capeFlutter = Math.sin(this.runAnimTimer * 1.5) * 12;
    ctx.fillStyle = '#8b0000'; // Crimson interior
    ctx.beginPath();
    ctx.moveTo(-18, -25);
    ctx.quadraticCurveTo(-35 + capeFlutter, 10, -28 + capeFlutter, 40);
    ctx.lineTo(28 - capeFlutter, 40);
    ctx.quadraticCurveTo(35 - capeFlutter, 10, 18, -25);
    ctx.fill();

    ctx.fillStyle = '#0b0817'; // Outer black cape
    ctx.beginPath();
    ctx.moveTo(-16, -25);
    ctx.quadraticCurveTo(-30 + capeFlutter, 10, -22 + capeFlutter, 42);
    ctx.lineTo(22 - capeFlutter, 42);
    ctx.quadraticCurveTo(30 - capeFlutter, 10, 16, -25);
    ctx.fill();

    // Dracula Suit & Body
    ctx.fillStyle = '#05030a'; // Suit jacket
    ctx.fillRect(-12, -22, 24, 34);

    // Crimson Vest & White Shirt
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.moveTo(-6, -22);
    ctx.lineTo(0, -6);
    ctx.lineTo(6, -22);
    ctx.fill();

    ctx.fillStyle = '#eceff1'; // Shirt collar
    ctx.beginPath();
    ctx.moveTo(-4, -22);
    ctx.lineTo(0, -14);
    ctx.lineTo(4, -22);
    ctx.fill();

    // Gold Brooch / Ruby Medallion
    ctx.fillStyle = '#e60039';
    ctx.beginPath();
    ctx.arc(0, -14, 3, 0, Math.PI * 2);
    ctx.fill();

    // High Vampire Collar
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.moveTo(-14, -26);
    ctx.lineTo(-20, -42);
    ctx.lineTo(-8, -32);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(14, -26);
    ctx.lineTo(20, -42);
    ctx.lineTo(8, -32);
    ctx.fill();

    // Legs / Running Stride
    ctx.fillStyle = '#080511';
    ctx.fillRect(-8, 12, 6, 28 + stride);
    ctx.fillRect(2, 12, 6, 28 - stride);

    // Vampire Head
    ctx.fillStyle = '#e2e6e7'; // Pale skin tone
    ctx.beginPath();
    ctx.arc(0, -36, 10, 0, Math.PI * 2);
    ctx.fill();

    // Slick Black Hair with Widow's Peak
    ctx.fillStyle = '#05030a';
    ctx.beginPath();
    ctx.arc(0, -38, 10.5, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, -38);
    ctx.lineTo(0, -32); // Widow's peak
    ctx.lineTo(10, -38);
    ctx.lineTo(0, -46);
    ctx.fill();

    // Glowing Crimson Eyes
    ctx.fillStyle = this.isBurning ? '#ffffff' : '#e60039';
    ctx.shadowColor = '#e60039';
    ctx.shadowBlur = 6;
    ctx.fillRect(-5, -37, 3, 2);
    ctx.fillRect(2, -37, 3, 2);
    ctx.shadowBlur = 0;
  }

  // Procedural Vampire Bat Mode (Jump state)
  drawBat(ctx) {
    const wingAngle = Math.sin(this.wingFlapTimer) * 0.6;

    // Bat Shadow on Ground
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 50, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Flapping Bat Wings
    ctx.fillStyle = '#0b0817';
    ctx.strokeStyle = '#8b0000';
    ctx.lineWidth = 1.5;

    // Left Wing
    ctx.save();
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.quadraticCurveTo(-20, -25, -36, -8);
    ctx.quadraticCurveTo(-26, 6, -18, -2);
    ctx.quadraticCurveTo(-12, 10, -4, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.rotate(-wingAngle);
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.quadraticCurveTo(20, -25, 36, -8);
    ctx.quadraticCurveTo(26, 6, 18, -2);
    ctx.quadraticCurveTo(12, 10, 4, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Bat Body & Ears
    ctx.fillStyle = '#05030a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(-9, -18);
    ctx.lineTo(-2, -10);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(6, -8);
    ctx.lineTo(9, -18);
    ctx.lineTo(2, -10);
    ctx.fill();

    // Glowing Red Eyes
    ctx.fillStyle = '#e60039';
    ctx.shadowColor = '#e60039';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-3, -3, 1.8, 0, Math.PI * 2);
    ctx.arc(3, -3, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Tiny Fangs
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#eceff1';
    ctx.fillRect(-2, 3, 1, 3);
    ctx.fillRect(1, 3, 1, 3);
  }
}
