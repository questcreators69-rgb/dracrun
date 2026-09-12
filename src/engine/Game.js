/**
 * Game.js
 * Core Game Loop, State Machine, High Scores, and UI Synchronization for DracRun.
 */
import { Renderer } from './Renderer.js';
import { AudioSynthesizer } from './AudioSynthesizer.js';
import { InputManager } from '../controls/InputManager.js';
import { Player } from '../entities/Player.js';
import { ObstaclePool } from '../entities/ObstaclePool.js';
import { PickupPool } from '../entities/PickupPool.js';
import { ParticleSystem } from '../entities/ParticleSystem.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = 'START'; // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'

    // Core Systems
    this.audio = new AudioSynthesizer();
    this.renderer = new Renderer(canvas, this);
    this.input = new InputManager(this);
    this.particles = new ParticleSystem(350);

    // Entities
    this.player = new Player(this);
    this.obstacles = new ObstaclePool(this, 30);
    this.pickups = new PickupPool(this, 40);

    // Game Metrics & Score
    this.score = 0;
    this.distance = 0;
    this.bloodCount = 0;
    this.highScore = parseInt(localStorage.getItem('dracrun_highscore') || '0', 10);
    this.isNewHighScore = false;

    // Difficulty Curve
    this.baseSpeed = 22.0;
    this.currentSpeed = 22.0;
    this.maxSpeed = 55.0;
    this.difficultyFactor = 0; // 0 to 1 scaling over distance

    // Frame Loop Timing
    this.lastTime = 0;
    this.maxDelta = 0.1; // Cap delta to prevent lag spikes

    // DOM UI Elements
    this.bindUI();
    this.updateHUD();
  }

  bindUI() {
    this.uiHud = document.getElementById('hud-overlay');
    this.uiStart = document.getElementById('screen-start');
    this.uiPause = document.getElementById('screen-pause');
    this.uiGameOver = document.getElementById('screen-gameover');
    this.uiTouchControls = document.getElementById('touch-controls');

    this.elVitalityBar = document.getElementById('vitality-bar');
    this.elVitalityText = document.getElementById('vitality-text');
    this.elScoreDisplay = document.getElementById('score-display');
    this.elBloodDisplay = document.getElementById('blood-display');
    this.elHighScoreDisplay = document.getElementById('highscore-display');

    this.elFinalScore = document.getElementById('final-score');
    this.elFinalDistance = document.getElementById('final-distance');
    this.elFinalBlood = document.getElementById('final-blood');
    this.elFinalBest = document.getElementById('final-best');
    this.elHighScoreBanner = document.getElementById('high-score-banner');

    this.elBurnOverlay = document.getElementById('burn-overlay');
    this.elDamageVignette = document.getElementById('damage-vignette');

    // UI Buttons
    document.getElementById('btn-start')?.addEventListener('click', () => this.startGame());
    document.getElementById('btn-resume')?.addEventListener('click', () => this.togglePause());
    document.getElementById('btn-restart-pause')?.addEventListener('click', () => this.restartGame());
    document.getElementById('btn-restart')?.addEventListener('click', () => this.restartGame());

    document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
      const muted = this.audio.toggleMute();
      const btn = document.getElementById('btn-sound-toggle');
      if (btn) btn.textContent = muted ? '🔇' : '🔊';
    });

    document.getElementById('btn-touch-toggle')?.addEventListener('click', () => {
      this.uiTouchControls.classList.toggle('hidden');
    });

    document.getElementById('btn-pause')?.addEventListener('click', () => this.togglePause());
  }

  startGame() {
    this.audio.ensureContext();
    this.state = 'PLAYING';

    this.uiStart.classList.add('hidden');
    this.uiPause.classList.add('hidden');
    this.uiGameOver.classList.add('hidden');
    this.uiHud.classList.remove('hidden');

    this.resetStats();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.uiPause.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.uiPause.classList.add('hidden');
    }
  }

  restartGame() {
    this.audio.ensureContext();
    this.state = 'PLAYING';

    this.uiPause.classList.add('hidden');
    this.uiGameOver.classList.add('hidden');
    this.uiStart.classList.add('hidden');
    this.uiHud.classList.remove('hidden');

    this.resetStats();
  }

  resetStats() {
    this.score = 0;
    this.distance = 0;
    this.bloodCount = 0;
    this.currentSpeed = this.baseSpeed;
    this.difficultyFactor = 0;
    this.isNewHighScore = false;

    this.player.reset();
    this.obstacles.reset();
    this.pickups.reset();
    this.particles.clear();

    this.updateHUD();
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';

    // High Score check
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHighScore = true;
      localStorage.setItem('dracrun_highscore', this.highScore.toString());
    }

    // Update Game Over UI
    if (this.elFinalScore) this.elFinalScore.textContent = Math.floor(this.score).toString();
    if (this.elFinalDistance) this.elFinalDistance.textContent = `${Math.floor(this.distance)}m`;
    if (this.elFinalBlood) this.elFinalBlood.textContent = this.bloodCount.toString();
    if (this.elFinalBest) this.elFinalBest.textContent = this.highScore.toString();

    if (this.elHighScoreBanner) {
      if (this.isNewHighScore) {
        this.elHighScoreBanner.classList.remove('hidden');
      } else {
        this.elHighScoreBanner.classList.add('hidden');
      }
    }

    setTimeout(() => {
      this.uiGameOver.classList.remove('hidden');
    }, 600);
  }

  addScore(pts) {
    this.score += pts;
    this.updateHUD();
  }

  addBloodCount(cnt = 1) {
    this.bloodCount += cnt;
    this.updateHUD();
  }

  // Core Game Loop using requestAnimationFrame & Normalized deltaTime
  startLoop() {
    this.lastTime = performance.now();
    const loop = (currentTime) => {
      const dt = Math.min((currentTime - this.lastTime) / 1000, this.maxDelta);
      this.lastTime = currentTime;

      this.update(dt);
      this.render(dt);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    // Ambient fog particles spawn continuously
    if (Math.random() < 0.3) {
      this.particles.spawnMist(0, 0, 100);
    }
    if (Math.random() < 0.05) {
      this.particles.spawnMoonBat(-1, 2.5, 0);
    }

    if (this.state !== 'PLAYING') return;

    // Difficulty scaling curve based on distance
    this.distance += this.currentSpeed * dt;
    this.difficultyFactor = Math.min(1.0, this.distance / 1500);
    this.currentSpeed = this.baseSpeed + (this.maxSpeed - this.baseSpeed) * this.difficultyFactor;

    // Score = Distance + Blood collected
    this.score += this.currentSpeed * dt * 0.4;

    // Entity updates
    this.player.update(dt);
    this.obstacles.update(dt, this.currentSpeed, this.difficultyFactor);
    this.pickups.update(dt, this.currentSpeed);
    this.particles.update(dt, this.currentSpeed);

    // Screen Burn / Damage VFX update
    if (this.player.isBurning) {
      this.elBurnOverlay.style.opacity = '0.6';
      this.elDamageVignette.style.opacity = '0.8';
      this.renderer.addCameraShake(0.4);
    } else {
      this.elBurnOverlay.style.opacity = '0';
      this.elDamageVignette.style.opacity = '0';
    }

    this.updateHUD();
  }

  render(dt) {
    this.renderer.render(dt, this.currentSpeed);
  }

  updateHUD() {
    const hpPercent = Math.max(0, Math.min(100, Math.floor(this.player.hp)));
    if (this.elVitalityBar) {
      this.elVitalityBar.style.width = `${hpPercent}%`;
      const vial = this.elVitalityBar.parentElement;
      if (vial) {
        if (hpPercent <= 25) {
          vial.classList.add('low');
        } else {
          vial.classList.remove('low');
        }
      }
    }
    if (this.elVitalityText) this.elVitalityText.textContent = `${hpPercent}%`;

    const formattedScore = Math.floor(this.score).toString().padStart(6, '0');
    if (this.elScoreDisplay) this.elScoreDisplay.textContent = formattedScore;
    if (this.elBloodDisplay) this.elBloodDisplay.textContent = `🩸 ${this.bloodCount}`;
    if (this.elHighScoreDisplay) this.elHighScoreDisplay.textContent = `🏆 ${this.highScore}`;
  }
}
