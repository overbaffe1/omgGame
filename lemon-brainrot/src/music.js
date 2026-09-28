// music.js : the score for «ЛИМОННЫЙ БРЕЙНРОТ».
// Hardbass-turbo at 150 bpm + robotic formant chants ("СКИ-БИ-ДИ ДОП ДОП
// ДА ДА ЕС ЕС"). Everything synthesised in Web Audio — oscillators, filtered
// noise and vowel formants. Rendered once offline, played back afterwards.
(function () {
  'use strict';
  const FILM = (window.FILM = window.FILM || {});

  const N = {
    E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47, C3: 130.81,
    D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0,
    B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.26,
  };

  const BPM = 150;
  const BEAT = 60 / BPM; // 0.4 s
  const BAR = BEAT * 4; // 1.6 s
  const DURATION = 38;

  // vowel formants [F1, F2, F3]
  const V = {
    EE: [270, 2300, 3000],
    AH: [700, 1200, 2600],
    OH: [500, 900, 2500],
    EH: [530, 1800, 2600],
  };

  function whiteNoise(oc, seconds) {
    const len = Math.ceil(oc.sampleRate * seconds);
    const buf = oc.createBuffer(1, len, oc.sampleRate);
    const d = buf.getChannelData(0);
    let s = 0x27d4eb2d;
    for (let i = 0; i < len; i++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      d[i] = (s / 2147483648 - 1) * 0.9;
    }
    return buf;
  }

  function impulse(oc, seconds, decay) {
    const len = Math.ceil(oc.sampleRate * seconds);
    const buf = oc.createBuffer(2, len, oc.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let s = 42424242 + c * 777;
      for (let i = 0; i < len; i++) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        d[i] = (s / 2147483648 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function renderScore(sampleRate) {
    const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return Promise.reject(new Error('OfflineAudioContext is not available'));
    const oc = new OC(2, Math.ceil(DURATION * sampleRate), sampleRate);

    // ---- buses ----
    const master = oc.createGain();
    master.gain.value = 0.92;
    const comp = oc.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.12;
    master.connect(comp);
    comp.connect(oc.destination);

    const dry = oc.createGain();
    dry.connect(master);

    const verb = oc.createConvolver();
    verb.buffer = impulse(oc, 1.1, 3.2);
    const verbGain = oc.createGain();
    verbGain.gain.value = 0.32;
    verb.connect(verbGain);
    verbGain.connect(master);
    const send = oc.createGain();
    send.connect(verb);

    const white = whiteNoise(oc, 6);

    // ---- voices ----

    function kick(t, gain) {
      const o = oc.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(155, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
      const g = oc.createGain();
      g.gain.setValueAtTime(gain || 0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      o.connect(g);
      g.connect(dry);
      o.start(t);
      o.stop(t + 0.3);
      // click
      const src = oc.createBufferSource();
      src.buffer = white;
      const hp = oc.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1800;
      const cg = oc.createGain();
      cg.gain.setValueAtTime(0.22, t);
      cg.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      src.connect(hp);
      hp.connect(cg);
      cg.connect(dry);
      src.start(t, (t * 7) % 4, 0.04);
    }

    function donk(t, freq, gain) {
      const o = oc.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      const f = oc.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq * 2.2;
      f.Q.value = 2.2;
      const g = oc.createGain();
      g.gain.setValueAtTime(gain || 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
      o.connect(f);
      f.connect(g);
      g.connect(dry);
      o.start(t);
      o.stop(t + 0.22);
    }

    function sub(t, freq, dur, gain) {
      const o = oc.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const g = oc.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(dry);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    function clap(t, gain) {
      for (const [dt, lvl] of [[0, 1], [0.012, 0.7], [0.024, 0.5]]) {
        const src = oc.createBufferSource();
        src.buffer = white;
        const f = oc.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1700;
        f.Q.value = 1.1;
        const g = oc.createGain();
        g.gain.setValueAtTime((gain || 0.35) * lvl, t + dt);
        g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.09);
        src.connect(f);
        f.connect(g);
        g.connect(dry);
        const s = oc.createGain();
        s.gain.value = 0.6;
        g.connect(s);
        s.connect(send);
        src.start(t + dt, (t * 3) % 4, 0.12);
      }
    }

    function hat(t, gain, open) {
      const src = oc.createBufferSource();
      src.buffer = white;
      const f = oc.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 7200;
      const g = oc.createGain();
      g.gain.setValueAtTime(gain || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.14 : 0.035));
      src.connect(f);
      f.connect(g);
      g.connect(dry);
      src.start(t, (t * 5) % 3, 0.18);
    }

    function tom(t, freq, gain) {
      const o = oc.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq * 1.5, t);
      o.frequency.exponentialRampToValueAtTime(freq, t + 0.12);
      const g = oc.createGain();
      g.gain.setValueAtTime(gain || 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g);
      g.connect(dry);
      o.start(t);
      o.stop(t + 0.35);
    }

    function lead(t, freq, dur, gain) {
      for (const det of [-7, 7]) {
        const o = oc.createOscillator();
        o.type = 'square';
        o.frequency.value = freq;
        o.detune.value = det;
        const f = oc.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 3600;
        const g = oc.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(f);
        f.connect(g);
        g.connect(dry);
        const s = oc.createGain();
        s.gain.value = 0.22;
        g.connect(s);
        s.connect(send);
        o.start(t);
        o.stop(t + dur + 0.03);
      }
    }

    function zap(t, f0, f1, dur, gain) {
      const o = oc.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = oc.createGain();
      g.gain.setValueAtTime(gain || 0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(dry);
      const s = oc.createGain();
      s.gain.value = 1.1;
      g.connect(s);
      s.connect(send);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    function riser(t, dur, gain) {
      const src = oc.createBufferSource();
      src.buffer = white;
      const f = oc.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 1.4;
      f.frequency.setValueAtTime(320, t);
      f.frequency.exponentialRampToValueAtTime(4200, t + dur);
      const g = oc.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.85);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(dry);
      src.start(t, (t * 1.7) % 3, dur + 0.1);
    }

    function boom(t, gain) {
      sub(t, 55, 0.9, gain || 0.9);
      const src = oc.createBufferSource();
      src.buffer = white;
      const f = oc.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 900;
      const g = oc.createGain();
      g.gain.setValueAtTime(0.32, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      src.connect(f);
      f.connect(g);
      g.connect(dry);
      src.start(t, 1.1, 0.35);
    }

    // robotic syllable: consonant burst + formant vowel
    function vox(t, dur, cons, vowel, freq, gain) {
      if (cons) {
        const src = oc.createBufferSource();
        src.buffer = white;
        const f = oc.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = cons === 's' ? 5200 : cons === 'y' ? 2400 : 1650;
        f.Q.value = 2.4;
        const g = oc.createGain();
        g.gain.setValueAtTime(cons === 's' ? 0.09 : 0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.032);
        src.connect(f);
        f.connect(g);
        g.connect(dry);
        src.start(t, (t * 3.1) % 4, 0.05);
      }
      const o = oc.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq * 1.045, t);
      o.frequency.linearRampToValueAtTime(freq, t + 0.05);
      const amp = oc.createGain();
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(gain, t + 0.014);
      amp.gain.setValueAtTime(gain, t + dur * 0.62);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(amp);
      const levels = [1, 0.62, 0.3];
      for (let i = 0; i < 3; i++) {
        const bp = oc.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = vowel[i];
        bp.Q.value = 7.5;
        const vg = oc.createGain();
        vg.gain.value = levels[i];
        amp.connect(bp);
        bp.connect(vg);
        vg.connect(dry);
        const s = oc.createGain();
        s.gain.value = 0.28;
        vg.connect(s);
        s.connect(send);
      }
      const body = oc.createGain();
      body.gain.value = 0.10;
      amp.connect(body);
      body.connect(dry);
      o.start(t);
      o.stop(t + dur + 0.03);
    }

    // СКИ-БИ-ДИ-ДОП-ДОП-ДА-ДА-ЕС-ЕС over one bar (8 eighths)
    function chantBar(t0, baseFreq, gain) {
      const seq = [
        ['s', V.EE], ['b', V.EE], ['d', V.EE], ['d', V.OH],
        ['d', V.OH], ['d', V.AH], ['d', V.AH], ['y', V.EH],
      ];
      for (let i = 0; i < 8; i++) {
        vox(t0 + i * (BAR / 8), BAR / 8 * 0.82, seq[i][0], seq[i][1], baseFreq, gain);
      }
    }

    // =====================================================================
    // THE SCORE
    // =====================================================================

    const T0 = 0;

    // -- 0–1.2 hook : riser + boom
    riser(0, 1.15, 0.3);
    boom(0, 0.95);
    for (let i = 0; i < 3; i++) vox(0.4 + i * 0.2, 0.16, 'd', V.AH, N.A3, 0.26);

    // -- 1.2–2.8 title : the beat drops
    for (let b = 0; b < 4; b++) {
      const t = 1.2 + b * BEAT;
      kick(t, 1.0);
      donk(t + BEAT / 2, N.A2, 0.5);
    }
    boom(1.2, 0.6);
    for (let i = 0; i < 8; i++) lead(1.2 + i * 0.2, [N.A4, N.A4, N.C5, N.A4, N.E5, N.D5, N.C5, N.A4][i], 0.19, 0.16);

    // -- generic groove builder for the long stretches
    function groove(t0, t1, opts) {
      opts = opts || {};
      const steps = Math.round((t1 - t0) / BEAT);
      for (let b = 0; b < steps; b++) {
        const t = t0 + b * BEAT;
        kick(t, opts.kick || 0.95);
        donk(t + BEAT / 2, opts.root || N.A2, 0.48);
        if (opts.claps && b % 2 === 1) clap(t, 0.32);
        if (opts.hats) {
          hat(t + BEAT / 2, 0.1);
          hat(t + BEAT / 4, 0.055);
        }
        if (opts.sub && b % 2 === 0) sub(t, (opts.root || N.A2) / 2, 0.34, 0.55);
      }
    }

    // -- 2.8–6.0 lemonello : groove + first chant + melody
    groove(2.8, 6.0, { root: N.A2, hats: true });
    chantBar(2.8, N.A3, 0.3);
    chantBar(4.4, N.C4, 0.3);
    for (let i = 0; i < 16; i++) {
      lead(2.8 + i * 0.2, [N.A4, N.A4, N.C5, N.A4, N.D5, N.C5, N.A4, N.E4, N.A4, N.A4, N.C5, N.D5, N.E5, N.D5, N.C5, N.A4][i], 0.19, 0.15);
    }

    // -- 6.0–9.2 toilet : heavier, clap-driven
    groove(6.0, 9.2, { root: N.A2, hats: true, claps: true, sub: true, kick: 1.0 });
    chantBar(6.0, N.A3, 0.32);
    chantBar(7.6, N.A3, 0.32);
    for (let i = 0; i < 8; i++) tom(6.0 + i * 0.4, [N.A2, N.A2, N.G2, N.G2, N.F2, N.F2, N.E2, N.E2][i], 0.4);

    // -- 9.2–12.0 parrot : lighter, playful lead
    groove(9.2, 12.0, { root: N.C3, hats: true, claps: true });
    chantBar(9.2, N.C4, 0.28);
    for (let i = 0; i < 14; i++) {
      lead(9.2 + i * 0.2, [N.E5, N.D5, N.C5, N.D5, N.E5, N.E5, N.E5, 0, N.D5, N.D5, N.D5, 0, N.C5, N.E5][i] || N.A4, 0.18, 0.14);
    }

    // -- 12.0–15.6 kaiju : big stomps (half-time toms) + heavy kick
    for (let b = 0; b < 9; b++) {
      const t = 12.0 + b * BEAT;
      if (b % 2 === 0) {
        kick(t, 1.05);
        tom(t, N.A2 * 0.75, 0.62);
        sub(t, N.A2 / 2, 0.4, 0.6);
      }
      hat(t + BEAT / 2, 0.1, b % 4 === 3);
    }
    chantBar(12.0, N.A3, 0.3);
    chantBar(13.6, N.G3, 0.3);
    zap(15.2, 900, 160, 0.35, 0.28);

    // -- 15.6–19.2 battle : half-time, zaps, explosion hits
    for (let b = 0; b < 9; b++) {
      const t = 15.6 + b * BEAT;
      if (b % 2 === 0) kick(t, 1.0);
      donk(t + BEAT / 2, b < 4 ? N.F2 : N.E2, 0.5);
    }
    boom(15.6, 0.85);
    zap(16.0, 1200, 180, 0.3, 0.3);
    boom(16.32, 0.7);
    zap(16.72, 1400, 160, 0.28, 0.28);
    boom(17.44, 0.75);
    zap(17.84, 1100, 140, 0.32, 0.3);
    boom(18.56, 0.8);
    for (let i = 0; i < 4; i++) vox(15.6 + i * 0.8, 0.5, 'd', V.AH, N.A3 * (i % 2 ? 0.75 : 1), 0.3);

    // -- 19.2–21.2 six-seven : two sacred hits
    boom(19.2, 1.0);
    sub(19.2, N.A2 / 2, 1.1, 0.7);
    vox(19.25, 0.6, 's', V.EH, N.C4, 0.3);
    boom(20.0, 1.0);
    sub(20.0, N.G2 / 2, 1.1, 0.7);
    vox(20.05, 0.6, 's', V.EH, N.B3 * 0.94, 0.3);
    riser(20.6, 0.55, 0.2);

    // -- 21.2–24.4 factory : bouncy groove
    groove(21.2, 24.4, { root: N.D3, hats: true, claps: true, sub: true });
    chantBar(21.2, N.D4, 0.26);
    chantBar(22.8, N.D4, 0.26);
    for (let i = 0; i < 16; i++) {
      lead(21.2 + i * 0.2, [N.D5, 0, N.A4, N.D5, 0, N.A4, N.F4, N.A4, N.D5, 0, N.A4, N.D5, N.E5, N.D5, N.C5, N.A4][i] || N.A4, 0.18, 0.13);
    }

    // -- 24.4–28.0 dance : full chorus
    groove(24.4, 28.0, { root: N.A2, hats: true, claps: true, sub: true, kick: 1.05 });
    chantBar(24.4, N.A3, 0.32);
    chantBar(26.0, N.C4, 0.32);
    for (let i = 0; i < 18; i++) {
      lead(24.4 + i * 0.2, [N.A4, N.A4, N.C5, N.A4, N.E5, N.D5, N.C5, N.A4, N.A4, N.A4, N.C5, N.D5, N.E5, N.D5, N.C5, N.A4, N.E5, N.A4][i], 0.19, 0.15);
    }

    // -- 28.0–31.2 aura : build — snare roll + riser
    for (let i = 0; i < 32; i++) {
      const t = 28.0 + i * 0.1;
      clap(t, 0.1 + (i / 32) * 0.3);
      if (i % 2 === 0) kick(t, 0.7);
    }
    riser(28.0, 3.0, 0.32);
    chantBar(28.0, N.A3, 0.26);
    chantBar(29.6, N.A3 * 1.12, 0.28);
    for (let i = 0; i < 8; i++) vox(30.4 + i * 0.1, 0.09, 'd', V.EE, N.A3 * 1.2, 0.22);

    // -- 31.2–33.6 versus : final drop
    groove(31.2, 33.6, { root: N.F2, hats: true, claps: true, sub: true, kick: 1.1 });
    chantBar(31.2, N.A3, 0.34);
    boom(31.2, 0.9);
    zap(32.0, 1300, 200, 0.3, 0.26);
    zap(32.8, 1500, 180, 0.3, 0.26);

    // -- 33.6–38 outro : chant slows, final hit
    groove(33.6, 36.8, { root: N.A2, hats: true, claps: true, sub: true });
    chantBar(33.6, N.A3, 0.32);
    chantBar(35.2, N.A3, 0.3);
    for (let i = 0; i < 8; i++) {
      lead(35.2 + i * 0.2, [N.A4, N.A4, N.C5, N.A4, N.E5, N.D5, N.C5, N.A4][i], 0.2, 0.14);
    }
    boom(36.8, 0.85);
    vox(36.85, 0.55, 'y', V.EH, N.A3, 0.3);
    vox(37.45, 0.5, 'd', V.AH, N.A3, 0.28);
    sub(37.6, N.A2 / 2, 0.5, 0.55);

    void T0;
    // render: Promise (modern), oncomplete (old Safari), никогда не бросаем синхронно
    return new Promise(function (resolve, reject) {
      let done = false;
      function finish(buf) { if (!done) { done = true; resolve(buf); } }
      function fail(e) { if (!done) { done = true; reject(e); } }
      try {
        if ('oncomplete' in oc) {
          oc.oncomplete = function (e) {
            finish((e && e.renderedBuffer) || (e && e.target && e.target.result) || null);
          };
        }
        const r = oc.startRendering();
        if (r && typeof r.then === 'function') {
          r.then(finish, fail);
        } else if (!('oncomplete' in oc)) {
          fail(new Error('startRendering не вернул Promise'));
        }
        // иначе ждём oncomplete
      } catch (e) { fail(e); }
    });
  }

  FILM.MUSIC = {
    duration: DURATION,
    bpm: BPM,
    beat: BEAT,
    render: function (sampleRate) {
      return renderScore(sampleRate || 44100);
    },
  };
})();
