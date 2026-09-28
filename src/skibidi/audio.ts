export class SkibidiAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  isPlaying = false;
  private timers: number[] = [];
  private nextNoteTime = 0;
  private beat = 0;
  bpm = 140;
  private muted = false;
  private reverbNode: ConvolverNode | null = null;

  ensure() {
    if (this.ctx) return;
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.6;

    // master filter for warmth
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 11000;
    lowpass.Q.value = 0.5;

    // slight compressor for loudness
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 20;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.15;

    this.master.connect(lowpass);
    lowpass.connect(comp);
    comp.connect(this.ctx.destination);

    // create fake reverb buffer
    const len = this.ctx.sampleRate * 1.2;
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2) * 0.25;
      }
    }
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = buf;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.6;
  }

  play() {
    this.ensure();
    if (!this.ctx || !this.master || this.isPlaying) return;
    this.isPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    this.beat = 0;
    this.schedule();
  }

  stop() {
    this.isPlaying = false;
    this.timers.forEach(t => { clearTimeout(t); clearInterval(t); });
    this.timers = [];
  }

  private schedule() {
    if (!this.ctx || !this.isPlaying) return;
    const ctx = this.ctx;
    const master = this.master!;

    const playKick = (when: number, pitch = 140) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = pitch;
      g.gain.value = 0;
      o.connect(g);
      g.connect(master);
      const t = when;
      o.frequency.setValueAtTime(pitch, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.13);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.95, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      o.start(t);
      o.stop(t + 0.45);
    };

    const playHat = (when: number, open = false) => {
      const size = Math.floor(ctx.sampleRate * (open ? 0.18 : 0.055));
      const buf = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < size; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, open ? 1.2 : 2.5);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = open ? 4500 : 6800;
      const g = ctx.createGain();
      g.gain.value = open ? 0.14 : 0.11;
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start(when);
    };

    const playBass = (when: number, freq: number, long = false) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = 'sine';
      o.frequency.value = freq;
      f.type = 'lowpass';
      f.frequency.value = 320;
      o.connect(f);
      f.connect(g);
      g.connect(master);
      const dur = long ? 0.65 : 0.38;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.52, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur);
      o.start(when);
      o.stop(when + dur + 0.05);
    };

    const playVocal = (when: number, freq: number, isBrr = false) => {
      // HQ vocal: two detuned oscillators + formant
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      const f1 = ctx.createBiquadFilter();
      const f2 = ctx.createBiquadFilter();
      const f3 = ctx.createBiquadFilter();

      o1.type = isBrr ? 'sawtooth' : 'triangle';
      o2.type = 'sine';
      o1.frequency.value = freq;
      o2.frequency.value = freq * 1.007;
      o1.detune.value = -3;
      o2.detune.value = 3;

      f1.type = 'bandpass';
      f1.frequency.value = isBrr ? 750 : 1150;
      f1.Q.value = 1.8;
      f2.type = 'bandpass';
      f2.frequency.value = isBrr ? 1350 : 2100;
      f2.Q.value = 1.2;
      f3.type = 'lowpass';
      f3.frequency.value = 3200;

      const g2 = ctx.createGain();
      g2.gain.value = 0.55;

      o1.connect(f1);
      o2.connect(f2);
      f1.connect(g);
      f2.connect(g2);
      g2.connect(g);
      g.connect(f3);
      f3.connect(master);

      const dur = isBrr ? 0.32 : 0.22;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(isBrr ? 0.38 : 0.32, when + 0.018);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur);

      if (isBrr) {
        o1.frequency.setValueAtTime(freq * 1.45, when);
        o1.frequency.exponentialRampToValueAtTime(freq * 0.82, when + dur);
      }

      o1.start(when);
      o2.start(when);
      o1.stop(when + dur + 0.05);
      o2.stop(when + dur + 0.05);
    };

    const beatDur = 60 / this.bpm;
    const now = ctx.currentTime;

    while (this.nextNoteTime < now + 0.6) {
      const b = this.beat % 16;

      if (b % 4 === 0) playKick(this.nextNoteTime, 150);
      else if (b % 4 === 2) playKick(this.nextNoteTime, 110);

      if (b % 2 === 1) playHat(this.nextNoteTime, false);
      else if (b % 8 === 6) playHat(this.nextNoteTime, true);

      const bassNotes = [55, 55, 65.41, 55, 55, 58.27, 65.41, 73.42, 55, 55, 65.41, 55, 51.91, 55, 61.74, 65.41];
      const isLong = b % 4 === 0;
      playBass(this.nextNoteTime, bassNotes[b], isLong);

      // vocal chops - skibidi dop dop yes yes
      if (b === 0) playVocal(this.nextNoteTime, 175, true);
      if (b === 2) playVocal(this.nextNoteTime, 220, false);
      if (b === 3) playVocal(this.nextNoteTime, 246, false);
      if (b === 4) playVocal(this.nextNoteTime, 196, false);
      if (b === 5) playVocal(this.nextNoteTime, 196, false);
      if (b === 6) playVocal(this.nextNoteTime, 293, false);
      if (b === 7) playVocal(this.nextNoteTime, 329, false);
      if (b === 8) playVocal(this.nextNoteTime, 175, true);
      if (b === 10) playVocal(this.nextNoteTime, 220, false);
      if (b === 12) playVocal(this.nextNoteTime, 196, false);
      if (b === 14) playVocal(this.nextNoteTime, 293, false);

      this.nextNoteTime += beatDur / 2;
      this.beat++;
    }

    const timer = window.setTimeout(() => this.schedule(), 90);
    this.timers.push(timer as unknown as number);
  }

  dispose() {
    this.stop();
    if (this.ctx) {
      try { this.ctx.close(); } catch {}
      this.ctx = null;
    }
  }
}
