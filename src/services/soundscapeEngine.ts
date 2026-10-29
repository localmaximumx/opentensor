// Web Audio API ambient soundscape synthesis and focus chime engine
// 100% self-contained, offline-friendly, zero external audio asset dependencies

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private currentTrack: string | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.35;
  private masterGain: GainNode | null = null;
  private nodes: (AudioNode | number)[] = [];
  private loopInterval: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): string | null {
    return this.currentTrack;
  }

  public stop() {
    if (this.loopInterval) {
      window.clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.nodes.forEach(node => {
      try {
        if (typeof node !== 'number') {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        }
      } catch (e) {}
    });
    this.nodes = [];
    this.isPlaying = false;
    this.currentTrack = null;
    this.notifyState();
  }

  public playTrack(trackId: 'rain' | 'lofi' | 'coffee' | 'binaural' | 'keyboard') {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.currentTrack === trackId && this.isPlaying) {
      this.stop();
      return;
    }

    this.stop();
    this.currentTrack = trackId;
    this.isPlaying = true;

    switch (trackId) {
      case 'rain':
        this.startRainSoundscape();
        break;
      case 'lofi':
        this.startLofiSoundscape();
        break;
      case 'coffee':
        this.startCoffeeSoundscape();
        break;
      case 'binaural':
        this.startBinauralSoundscape();
        break;
      case 'keyboard':
        this.startKeyboardSoundscape();
        break;
    }
    this.notifyState();
  }

  // 🌧️ Pink Noise Rain with Modulated Filter
  private startRainSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    // Subtle LFO modulation for rain gusts
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
    this.nodes.push(whiteNoise, filter, lfo, lfoGain);
  }

  // 🎹 Generative Lo-Fi Chill Synth Chord Progression (Relaxing Neo-Soul / Jazz Chords)
  private startLofiSoundscape() {
    if (!this.ctx || !this.masterGain) return;

    // Chords in C minor / Eb major: Cm9, Fm9, Abmaj7, Gm7
    const chords = [
      [261.63, 311.13, 392.00, 466.16, 587.33], // C, Eb, G, Bb, D
      [174.61, 207.65, 261.63, 311.13, 392.00], // F, Ab, C, Eb, G
      [207.65, 261.63, 311.13, 392.00, 466.16], // Ab, C, Eb, G, Bb
      [196.00, 233.08, 293.66, 349.23, 440.00]  // G, Bb, D, F, A
    ];

    let chordIdx = 0;
    const playChord = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const currentNotes = chords[chordIdx % chords.length];
      chordIdx++;

      const now = this.ctx.currentTime;
      currentNotes.forEach((freq, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        // Soft warm lowpass
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.045 / currentNotes.length, now + 0.8 + i * 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(now + i * 0.04);
        osc.stop(now + 4.0);
      });
    };

    playChord();
    this.loopInterval = window.setInterval(playChord, 3800);
  }

  // ☕ Warm Coffeehouse Ambient Murmur
  private startCoffeeSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(110, this.ctx.currentTime); // Low warm hum
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(165, this.ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start();
    osc2.start();
    this.nodes.push(osc1, osc2, filter, gainNode);
  }

  // 🌌 432 Hz + 8 Hz Theta Binaural Focus Drone
  private startBinauralSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const leftOsc = this.ctx.createOscillator();
    const rightOsc = this.ctx.createOscillator();
    const merger = this.ctx.createChannelMerger(2);
    const droneGain = this.ctx.createGain();

    // 432 Hz carrier with 8 Hz binaural difference (432 Hz & 440 Hz)
    leftOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(432, this.ctx.currentTime);
    rightOsc.type = 'sine';
    rightOsc.frequency.setValueAtTime(440, this.ctx.currentTime);

    droneGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    leftOsc.connect(merger, 0, 0);
    rightOsc.connect(merger, 0, 1);
    merger.connect(droneGain);
    droneGain.connect(this.masterGain);

    leftOsc.start();
    rightOsc.start();
    this.nodes.push(leftOsc, rightOsc, merger, droneGain);
  }

  // ⌨️ Mechanical Keyboard ASMR Clatter
  private startKeyboardSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const triggerClick = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 800, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 + Math.random() * 400, now);
      filter.Q.setValueAtTime(4, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    };

    triggerClick();
    this.loopInterval = window.setInterval(() => {
      if (Math.random() > 0.15) {
        triggerClick();
        if (Math.random() > 0.6) {
          window.setTimeout(triggerClick, 75 + Math.random() * 50);
        }
      }
    }, 180);
  }

  // 🔔 Soothing Tibetan Bowl / Completion Bell Chime
  public playCompletionChime() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [528, 1056, 1584]; // 528 Hz transformation frequency harmonics
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 3.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 3.3);
    });
  }

  private notifyState() {
    window.dispatchEvent(
      new CustomEvent('toniclite_soundscape_change', {
        detail: {
          isPlaying: this.isPlaying,
          currentTrack: this.currentTrack,
          volume: this.volume
        }
      })
    );
  }
}

export const soundscapeEngine = new SoundscapeEngine();
