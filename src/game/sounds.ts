// Процедурные звуки без внешних файлов — всё через WebAudio
export class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch { /* ignore */ }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.value = m ? 0 : 0.35;
    }
  }

  private tone(freqFrom: number, freqTo: number, dur: number, type: OscillatorType = 'square', vol = 1, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freqFrom, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.5, delay = 0, lowpass = 1200) {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lowpass;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  }

  shoot() {
    this.ensure();
    this.tone(900 + Math.random() * 200, 180, 0.14, 'square', 0.5);
    this.tone(1600, 300, 0.08, 'sawtooth', 0.25);
    this.noise(0.06, 0.25, 0, 4000);
  }
  shotgun() {
    this.ensure();
    this.tone(300, 60, 0.25, 'sawtooth', 0.9);
    this.noise(0.2, 0.7, 0, 900);
  }
  hit() {
    this.tone(500, 700, 0.07, 'square', 0.4);
  }
  kill() {
    this.tone(700, 100, 0.3, 'sawtooth', 0.6);
    this.tone(1200, 200, 0.25, 'square', 0.3, 0.05);
    this.noise(0.25, 0.5, 0, 800);
  }
  hurt() {
    this.tone(220, 70, 0.25, 'sawtooth', 0.8);
    this.noise(0.15, 0.4, 0, 500);
  }
  pickup() {
    this.tone(500, 500, 0.08, 'square', 0.4);
    this.tone(750, 750, 0.08, 'square', 0.4, 0.08);
    this.tone(1000, 1000, 0.12, 'square', 0.4, 0.16);
  }
  heal() {
    this.tone(400, 900, 0.3, 'sine', 0.6);
    this.tone(600, 1200, 0.3, 'sine', 0.4, 0.1);
  }
  wave() {
    [440, 554, 659, 880].forEach((f, i) => this.tone(f, f, 0.18, 'square', 0.4, i * 0.12));
  }
  overheat() {
    this.tone(200, 100, 0.3, 'square', 0.5);
  }
  empty() {
    this.tone(150, 120, 0.08, 'square', 0.3);
  }
  victory() {
    [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, f, 0.22, 'square', 0.45, i * 0.15));
  }
  defeat() {
    [400, 350, 300, 200, 150].forEach((f, i) => this.tone(f, f * 0.9, 0.25, 'sawtooth', 0.5, i * 0.18));
  }
  step() {
    this.noise(0.05, 0.08, 0, 600);
  }
}
