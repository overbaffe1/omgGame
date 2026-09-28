// Procedural score - Web Audio, no assets
// Inspired by procedural-film's chip but original implementation
export class FilmAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  isPlaying = false;
  bpm = 120;
  private timers: number[] = [];
  private oscillators: OscillatorNode[] = [];
  private startTime = 0;
  private muted = false;
  private intensity = 0.5;

  constructor(bpm = 120) {
    this.bpm = bpm;
  }

  ensure() {
    if (this.ctx) return;
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx!.createGain();
    this.master!.gain.value = 0.7;
    this.master!.connect(this.ctx!.destination);

    // slight master filter for lo-fi
    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 4200;
    this.master!.disconnect();
    this.master!.connect(filter);
    filter.connect(this.ctx!.destination);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.7;
  }

  setIntensity(v: number) {
    this.intensity = Math.max(0, Math.min(1, v));
  }

  playFilm(duration: number, getIntensityAt: (t: number) => number) {
    this.ensure();
    if (!this.ctx || !this.master) return;
    this.stop();
    this.isPlaying = true;
    this.startTime = this.ctx.currentTime + 0.1;

    const ctx = this.ctx;
    const master = this.master;

    // ---- AMBIENT PAD ----
    const padGain = ctx.createGain();
    padGain.gain.value = 0;
    padGain.connect(master);

    const createPad = (freq: number, detune: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = detune;
      f.type = 'lowpass';
      f.frequency.value = 900;
      f.Q.value = 1;
      g.gain.value = 0.08;
      o.connect(f);
      f.connect(g);
      g.connect(padGain);
      o.start(this.startTime);
      this.oscillators.push(o);
      return { osc: o, gain: g, filter: f };
    };

    const padNotes = [110, 138.59, 164.81, 220]; // A2, C#3, E3, A3
    const pads = padNotes.map((n, i) => createPad(n, (i - 1.5) * 4));

    // automate pad
    const schedulePad = () => {
      if (!this.isPlaying) return;
      const now = ctx.currentTime - this.startTime;
      const inten = getIntensityAt(now);
      padGain.gain.linearRampToValueAtTime(0.15 + inten * 0.25, ctx.currentTime + 1.2);
      pads.forEach((p, i) => {
        const mod = Math.sin(now * 0.3 + i) * 200 + 800 + inten * 600;
        p.filter.frequency.linearRampToValueAtTime(mod, ctx.currentTime + 0.8);
      });
    };

    // ---- BASS ----
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.22;
    bassGain.connect(master);
    let bassOsc: OscillatorNode | null = null;
    const playBass = (freq: number, when: number, dur: number) => {
      if (!this.ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = 'sine';
      o.frequency.value = freq;
      f.type = 'lowpass';
      f.frequency.value = 320;
      g.gain.value = 0;
      o.connect(f);
      f.connect(g);
      g.connect(bassGain);
      const t = this.startTime + when;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.55, t + 0.06);
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.start(t);
      o.stop(t + dur + 0.1);
    };

    // ---- ARPEGGIO / PLUCK ----
    const arpGain = ctx.createGain();
    arpGain.gain.value = 0.18;
    arpGain.connect(master);
    const playPluck = (freq: number, when: number, dur = 0.8) => {
      if (!this.ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = 'triangle';
      o.frequency.value = freq;
      f.type = 'lowpass';
      f.frequency.value = 2800;
      f.Q.value = 1.2;
      g.gain.value = 0;
      o.connect(f);
      f.connect(g);
      g.connect(arpGain);
      const t = this.startTime + when;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.42, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      f.frequency.setValueAtTime(3200, t);
      f.frequency.exponentialRampToValueAtTime(700, t + dur);
      o.start(t);
      o.stop(t + dur + 0.05);
    };

    // ---- DRUMS ----
    const drumGain = ctx.createGain();
    drumGain.gain.value = 0.35;
    drumGain.connect(master);

    const playKick = (when: number) => {
      if (!this.ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 160;
      g.gain.value = 0;
      o.connect(g);
      g.connect(drumGain);
      const t = this.startTime + when;
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.14);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.9, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      o.start(t);
      o.stop(t + 0.4);
    };

    const playHat = (when: number, open = false) => {
      if (!this.ctx) return;
      const bufferSize = Math.floor(ctx.sampleRate * (open ? 0.18 : 0.06));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 6200;
      const g = ctx.createGain();
      g.gain.value = open ? 0.18 : 0.11;
      src.connect(f);
      f.connect(g);
      g.connect(drumGain);
      src.start(this.startTime + when);
    };

    // ---- COMPOSE LOOP ----
    const beat = 60 / this.bpm;
    const totalBeats = Math.ceil(duration / beat);
    // schedule all events ahead
    for (let b = 0; b < totalBeats; b++) {
      const t = b * beat;
      const inten = getIntensityAt(t);

      // kick on 1 and 3
      if (b % 4 === 0 || b % 4 === 2) {
        if (inten > 0.25) playKick(t);
      }
      // hat every beat with variation
      if (b % 2 === 1) {
        if (Math.random() < 0.7 + inten * 0.3) playHat(t, false);
      } else if (Math.random() < 0.25) {
        playHat(t, true);
      }

      // bass every 2 beats
      if (b % 8 === 0) {
        const bassNotes = [55, 65.41, 73.42, 82.41, 55]; // A1, C2, D2, E2
        const note = bassNotes[Math.floor(b / 8) % bassNotes.length];
        playBass(note, t, beat * 3.5);
      }

      // arpeggio - more frequent when intense
      if (b % 2 === 0 && inten > 0.3) {
        const arpPool = [
          [220, 277.18, 329.63, 415.30],
          [196, 246.94, 293.66, 392],
          [174.61, 220, 261.63, 329.63],
        ];
        const pool = arpPool[Math.floor(b / 8) % arpPool.length];
        const freq = pool[(b / 2) % pool.length];
        playPluck(freq * (inten > 0.7 ? 2 : 1), t, beat * 1.2);
      }
    }

    // periodic pad updates
    const padInterval = window.setInterval(schedulePad, 400);
    this.timers.push(padInterval as unknown as number);

    // stop at end
    const stopTimer = window.setTimeout(() => this.stop(), (duration + 0.6) * 1000);
    this.timers.push(stopTimer as unknown as number);

    schedulePad();
  }

  stop() {
    this.isPlaying = false;
    this.timers.forEach((t) => {
      clearInterval(t);
      clearTimeout(t);
    });
    this.timers = [];
    this.oscillators.forEach((o) => {
      try { o.stop(); } catch {}
      try { o.disconnect(); } catch {}
    });
    this.oscillators = [];
  }

  dispose() {
    this.stop();
    if (this.ctx) {
      try { this.ctx.close(); } catch {}
      this.ctx = null;
    }
  }
}
