export class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.5;

    this.ambientGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientFilter = null;
    this.lfoOsc = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this.setupAmbientDrone();
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15 * this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // Low detuned sawtooth gothic drone
  setupAmbientDrone() {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12 * this.masterVolume, now);

    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.setValueAtTime(220, now);
    this.ambientFilter.Q.setValueAtTime(3, now);

    // Filter modulation LFO
    this.lfoOsc = this.ctx.createOscillator();
    this.lfoOsc.type = 'sine';
    this.lfoOsc.frequency.setValueAtTime(0.1, now);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(90, now);

    this.lfoOsc.connect(lfoGain);
    lfoGain.connect(this.ambientFilter.frequency);

    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = 'sawtooth';
    this.ambientOsc1.frequency.setValueAtTime(55, now);

    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = 'sawtooth';
    this.ambientOsc2.frequency.setValueAtTime(55.4, now);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(27.5, now);

    this.ambientOsc1.connect(this.ambientFilter);
    this.ambientOsc2.connect(this.ambientFilter);
    subOsc.connect(this.ambientFilter);

    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    this.ambientOsc1.start();
    this.ambientOsc2.start();
    subOsc.start();
    this.lfoOsc.start();
  }

  // High-pitched crystalline chime
  playBloodPickup() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.15 * this.masterVolume, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.22);
    });
  }

  // Wing flap / bat jump whoosh
  playBatJump() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.exponentialRampToValueAtTime(750, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(110, now + 0.25);
    filter.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Flashlight sizzling burn sound
  playSizzle(intensity = 1) {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, now);

    const gain = this.ctx.createGain();
    const volume = Math.min(0.35 * intensity * this.masterVolume, 0.35);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Heavy gothic impact hit
  playDamageImpact() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    gain.gain.setValueAtTime(0.4 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Creepy minor chord disintegration
  playGameOver() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [392, 311.13, 261.63, 196.00];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.18 * this.masterVolume, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.7);
    });
  }
}
