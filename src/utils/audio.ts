import { SoundPackId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientTimer: number | null = null;
  private isAmbientPlaying: boolean = false;
  private sfxVolume: number = 0.8;
  private ambientVolume: number = 0.4;
  private soundPack: SoundPackId = 'whoosh';

  // Pentatonic scale frequencies for combo rise
  private pentatonicScale: number[] = [
    261.63, 293.66, 329.63, 392.00, 440.00, // C4, D4, E4, G4, A4
    523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
    1046.50 // C6
  ];

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setConfig(soundPack: SoundPackId, sfxVolPercent: number, ambientVolPercent: number, ambientEnabled: boolean) {
    this.soundPack = soundPack;
    this.sfxVolume = (sfxVolPercent / 100) * 0.8;
    this.ambientVolume = (ambientVolPercent / 100) * 0.35;

    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }

    if (ambientEnabled) {
      this.startAmbient();
    } else {
      this.stopAmbient();
    }
  }

  public playArrowExit(comboStep: number = 0) {
    if (this.soundPack === 'silent') return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const scaleIdx = Math.min(comboStep, this.pentatonicScale.length - 1);
    const baseFreq = this.pentatonicScale[scaleIdx];
    const now = this.ctx.currentTime;

    switch (this.soundPack) {
      case 'whoosh':
        this.synthWhoosh(now, baseFreq);
        break;
      case 'wind':
        this.synthWind(now, baseFreq);
        break;
      case 'paper':
        this.synthPaper(now, baseFreq);
        break;
      case 'bubble':
        this.synthBubble(now, baseFreq);
        break;
    }
  }

  // 1. Soft Whoosh: filtered noise burst + smooth tone sweep
  private synthWhoosh(now: number, freq: number) {
    if (!this.ctx || !this.sfxGain) return;

    // Soft sine tonal element
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.9, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.18);

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.25, now + 0.04);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);

    // Filtered noise swoosh
    const bufferSize = this.ctx.sampleRate * 0.2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 0.8, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 2.5, now + 0.18);
    filter.Q.setValueAtTime(2.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.22);
  }

  // 2. Wind: resonant bandpass airy breeze
  private synthWind(now: number, freq: number) {
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate * 0.28;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 1.2, now);
    filter.frequency.linearRampToValueAtTime(freq * 2.2, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.28);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.29);
  }

  // 3. Paper Slide: textured gentle friction sweep
  private synthPaper(now: number, freq: number) {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.14);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // 4. Bubble Pop: clean sine pop with pitch drop
  private synthBubble(now: number, freq: number) {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.8, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.12);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Gentle, calm wooden tap for invalid move (no harsh buzzer!)
  public playInvalidTap() {
    if (this.soundPack === 'silent') return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.09);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Gentle tick for first tap on two-tap arrow
  public playTwoTapTick() {
    if (this.soundPack === 'silent') return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Unlock chime
  public playUnlock() {
    if (this.soundPack === 'silent') return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    [1046.5, 1318.5].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.26);
    });
  }

  // Level cleared victory chord (warm, peaceful arpeggio)
  public playVictory() {
    if (this.soundPack === 'silent') return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [392.00, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.1 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.65);
    });
  }

  // Power-up activation chime
  public playPowerUp() {
    if (this.soundPack === 'silent') return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Ambient generative music
  public startAmbient() {
    this.init();
    if (!this.ctx || !this.ambientGain || this.isAmbientPlaying) return;

    this.isAmbientPlaying = true;
    const now = this.ctx.currentTime;
    this.ambientGain.gain.setValueAtTime(0, now);
    this.ambientGain.gain.linearRampToValueAtTime(this.ambientVolume, now + 2);

    // Warm chord pad drone
    const chordFrequencies = [130.81, 196.00, 246.94]; // C3, G3, B3
    this.ambientOscillators = [];

    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.setValueAtTime(280, now);

    chordFrequencies.forEach((freq) => {
      if (!this.ctx || !this.ambientFilter) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle detune for lush warmth
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

      osc.connect(this.ambientFilter);
      osc.start();
      this.ambientOscillators.push(osc);
    });

    this.ambientFilter.connect(this.ambientGain);

    // Periodic gentle chimes
    this.scheduleNextChime();
  }

  private scheduleNextChime() {
    if (!this.isAmbientPlaying || !this.ctx) return;

    const delay = 4000 + Math.random() * 4000;
    this.ambientTimer = window.setTimeout(() => {
      if (!this.isAmbientPlaying || !this.ctx || !this.ambientGain) return;
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00];
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const now = this.ctx.currentTime;

      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(freq, now);

      chimeGain.gain.setValueAtTime(0, now);
      chimeGain.gain.linearRampToValueAtTime(this.ambientVolume * 0.4, now + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ambientGain);

      chimeOsc.start(now);
      chimeOsc.stop(now + 2.6);

      this.scheduleNextChime();
    }, delay);
  }

  public stopAmbient() {
    if (!this.isAmbientPlaying || !this.ctx || !this.ambientGain) return;
    this.isAmbientPlaying = false;
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }

    const now = this.ctx.currentTime;
    this.ambientGain.gain.linearRampToValueAtTime(0, now + 1);

    setTimeout(() => {
      this.ambientOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      this.ambientOscillators = [];
    }, 1100);
  }
}

export const sound = new SoundEngine();
