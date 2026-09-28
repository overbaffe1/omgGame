// music.js : the score for «ГЛУБИНА». Everything is synthesised in Web Audio —
// oscillators, filtered noise and a generated reverb impulse. No samples.
//
// 120 bpm: a beat is 0.5 s, a bar is 2 s. Cues land on the same beat grid as
// the cuts in timeline.js. The whole 36.5 s score is rendered once through an
// OfflineAudioContext and then just played back, so scrubbing stays sample-true.
(function () {
  'use strict';
  const FILM = (window.FILM = window.FILM || {});

  // Note table (equal temperament, A4 = 440).
  const N = {
    D2: 73.42, F2: 87.31, G2: 98.0, A2: 110.0, Bb2: 116.54, C3: 130.81,
    D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, Bb3: 233.08,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0,
    Bb4: 466.16, C5: 523.25, D5: 587.33, E5: 659.26, F5: 698.46, G5: 783.99,
    A5: 880.0,
  };

  const BPM = 120;
  const BEAT = 60 / BPM; // 0.5 s
  const DURATION = 36.5;

  function whiteNoise(oc, seconds) {
    const len = Math.ceil(oc.sampleRate * seconds);
    const buf = oc.createBuffer(1, len, oc.sampleRate);
    const d = buf.getChannelData(0);
    let s = 123456789;
    for (let i = 0; i < len; i++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      d[i] = (s / 2147483648 - 1) * 0.9;
    }
    return buf;
  }

  function brownNoise(oc, seconds) {
    const len = Math.ceil(oc.sampleRate * seconds);
    const buf = oc.createBuffer(1, len, oc.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    let s = 987654321;
    for (let i = 0; i < len; i++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const w = s / 2147483648 - 1;
      last = (last + 0.021 * w) / 1.021;
      d[i] = last * 3.2;
    }
    return buf;
  }

  function impulse(oc, seconds, decay) {
    const len = Math.ceil(oc.sampleRate * seconds);
    const buf = oc.createBuffer(2, len, oc.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let s = 22222222 + c * 11111;
      for (let i = 0; i < len; i++) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const w = s / 2147483648 - 1;
        d[i] = w * Math.pow(1 - i / len, decay);
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
    master.gain.value = 0.9;
    const comp = oc.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 5;
    comp.attack.value = 0.004;
    comp.release.value = 0.24;
    master.connect(comp);
    comp.connect(oc.destination);

    const dry = oc.createGain();
    dry.gain.value = 1;
    dry.connect(master);

    const verb = oc.createConvolver();
    verb.buffer = impulse(oc, 2.6, 2.4);
    const verbGain = oc.createGain();
    verbGain.gain.value = 0.55;
    verb.connect(verbGain);
    verbGain.connect(master);
    const send = oc.createGain();
    send.gain.value = 1;
    send.connect(verb);

    const white = whiteNoise(oc, 8);
    const brown = brownNoise(oc, 8);

    // ---- voices ----

    function pad(t, freqs, dur, gain, cutoff, type) {
      const g = oc.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + dur * 0.3);
      g.gain.setValueAtTime(Math.max(0.0002, gain), t + dur * 0.62);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const f = oc.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff || 900;
      f.Q.value = 0.4;
      g.connect(f);
      f.connect(dry);
      const sendG = oc.createGain();
      sendG.gain.value = 0.7;
      f.connect(sendG);
      sendG.connect(send);
      for (const fr of freqs) {
        for (const det of [-5, 5]) {
          const o = oc.createOscillator();
          o.type = type || 'sawtooth';
          o.frequency.value = fr;
          o.detune.value = det;
          o.connect(g);
          o.start(t);
          o.stop(t + dur + 0.05);
        }
      }
    }

    function pluck(t, freq, gain, dur) {
      dur = dur || 0.42;
      const o = oc.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      const g = oc.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const f = oc.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 2200;
      o.connect(g);
      g.connect(f);
      f.connect(dry);
      const s = oc.createGain();
      s.gain.value = 0.5;
      f.connect(s);
      s.connect(send);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    function bell(t, freq, gain, dur) {
      dur = dur || 1.8;
      for (const [mult, lvl] of [[1, 1], [2.76, 0.28], [5.4, 0.1]]) {
        const o = oc.createOscillator();
        o.type = 'sine';
        o.frequency.value = freq * mult;
        const g = oc.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain * lvl, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur / mult);
        o.connect(g);
        g.connect(dry);
        const s = oc.createGain();
        s.gain.value = 0.8;
        g.connect(s);
        s.connect(send);
        o.start(t);
        o.stop(t + dur);
      }
    }

    function sub(t, freq, dur, gain, drop) {
      const o = oc.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (drop) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * drop), t + dur);
      const g = oc.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.08, dur * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(dry);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    function tick(t, gain, freq) {
      const src = oc.createBufferSource();
      src.buffer = white;
      const f = oc.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq || 4800;
      f.Q.value = 6;
      const g = oc.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(f);
      f.connect(g);
      g.connect(dry);
      src.start(t, (t * 1.7) % 6, 0.08);
    }

    function kick(t, gain) {
      sub(t, 110, 0.32, gain, 0.36);
    }

    function whoosh(t, dur, f0, f1, gain) {
      const src = oc.createBufferSource();
      src.buffer = white;
      const f = oc.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 1.1;
      f.frequency.setValueAtTime(f0, t);
      f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = oc.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(dry);
      const s = oc.createGain();
      s.gain.value = 1.1;
      g.connect(s);
      s.connect(send);
      src.start(t, (t * 2.3) % 6, dur + 0.1);
    }

    function rumble(t, dur, gain) {
      const src = oc.createBufferSource();
      src.buffer = brown;
      const f = oc.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 140;
      const g = oc.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3);
      g.gain.setValueAtTime(gain, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(dry);
      src.start(t, (t * 1.1) % 6, dur + 0.1);
    }

    function wash(t, dur, gain, freq) {
      const src = oc.createBufferSource();
      src.buffer = white;
      const f = oc.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq || 520;
      f.Q.value = 0.7;
      // slow amplitude drift
      const g = oc.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + dur * 0.3);
      g.gain.linearRampToValueAtTime(gain * 0.55, t + dur * 0.65);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(dry);
      const s = oc.createGain();
      s.gain.value = 0.85;
      g.connect(s);
      s.connect(send);
      src.start(t, (t * 0.7) % 5, dur + 0.1);
    }

    function ping(t, freq) {
      for (const [dt, lvl] of [[0, 1], [0.34, 0.45], [0.68, 0.2]]) {
        const o = oc.createOscillator();
        o.type = 'sine';
        o.frequency.value = freq;
        const g = oc.createGain();
        g.gain.setValueAtTime(0.0001, t + dt);
        g.gain.exponentialRampToValueAtTime(0.32 * lvl, t + dt + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.9);
        o.connect(g);
        g.connect(dry);
        const s = oc.createGain();
        s.gain.value = 1.2;
        g.connect(s);
        s.connect(send);
        o.start(t + dt);
        o.stop(t + dt + 1);
      }
    }

    function snapFX(t) {
      // noise crack + falling sub + a tiny metallic ring
      const src = oc.createBufferSource();
      src.buffer = white;
      const f = oc.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(3200, t);
      f.frequency.exponentialRampToValueAtTime(420, t + 0.18);
      f.Q.value = 1.4;
      const g = oc.createGain();
      g.gain.setValueAtTime(0.75, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      src.connect(f);
      f.connect(g);
      g.connect(dry);
      const s = oc.createGain();
      s.gain.value = 1.2;
      g.connect(s);
      s.connect(send);
      src.start(t, 0.5, 0.3);
      sub(t, 90, 0.5, 0.85, 0.3);
      bell(t + 0.01, 1245, 0.12, 0.7);
    }

    // =====================================================================
    // THE SCORE
    // =====================================================================

    // -- 0–3 s · title-surface : dawn wash, one low hit, a Dm pad breathing in
    wash(0, 3.4, 0.16, 700);
    sub(0, N.D2, 2.6, 0.5);
    pad(0.5, [N.D3, N.F3, N.A3], 2.6, 0.055, 780);
    bell(1.5, N.A4, 0.14);
    bell(2.5, N.D5, 0.1);

    // -- 3–5.5 s · sunbeams : arpeggio enters, brighter wash
    whoosh(3.0, 1.1, 240, 1800, 0.11);
    pad(3.0, [N.D3, N.F3, N.A3], 2.6, 0.075, 1100);
    wash(3.0, 2.6, 0.1, 900);
    for (let i = 0; i < 8; i++) {
      const t = 3.5 + i * 0.25;
      pluck(t, [N.D3, N.A3, N.F3, N.A3, N.D4, N.A3, N.F3, N.E3][i], 0.16);
    }
    sub(3.0, N.D2, 1.6, 0.34);
    sub(4.5, N.A2, 1.2, 0.26);

    // -- 5.5–8.5 s · reef : the groove starts, Bb colour
    for (let i = 0; i < 12; i++) {
      const t = 5.5 + i * 0.25;
      pluck(t, [N.D3, N.A3, N.F3, N.A3, N.D4, N.A3, N.F3, N.E3, N.F3, N.C4, N.A3, N.F3][i], 0.17);
    }
    pad(5.5, [N.D3, N.F3, N.A3], 3.2, 0.08, 1300);
    pad(7.0, [N.Bb2, N.D3, N.F3], 1.7, 0.07, 1100);
    for (let b = 0; b < 6; b++) {
      const t = 5.5 + b * BEAT;
      if (b % 2 === 0) kick(t, 0.4);
      tick(t + BEAT / 2, 0.05, 6200);
    }
    sub(5.5, N.D2, 1.6, 0.4);
    sub(7.0, N.Bb2, 1.6, 0.34);
    // bubble blips
    for (let i = 0; i < 4; i++) pluck(5.6 + i * 0.17, [N.D5, N.F5, N.A5, N.D5][i], 0.05, 0.18);

    // -- 8.5–11 s · descent : darker, slower arpeggio, a deep whoosh
    whoosh(8.5, 1.6, 900, 180, 0.16);
    pad(8.5, [N.G2, N.Bb2, N.D3], 2.7, 0.085, 800);
    for (let i = 0; i < 6; i++) {
      pluck(9.0 + i * 0.42, [N.G3, N.D4, N.Bb3, N.D4, N.G4, N.F4][i], 0.15, 0.55);
    }
    sub(8.5, N.G2, 1.8, 0.42);
    sub(10.0, N.D2, 1.4, 0.36);
    bell(10.5, N.D5, 0.12, 2.2);

    // -- 11–14 s · jelly-bloom : F major swell, bells on the beats
    pad(11.0, [N.F3, N.A3, N.C4], 3.2, 0.1, 1200);
    wash(11.0, 3.0, 0.08, 640);
    for (let b = 0; b < 6; b++) {
      const t = 11.0 + b * BEAT;
      bell(t, [N.C5, N.A4, N.F4, N.A4, N.C5, N.E5][b], 0.12, 1.6);
    }
    for (let i = 0; i < 8; i++) {
      pluck(11.25 + i * 0.375, [N.F3, N.C4, N.A3, N.C4, N.F4, N.C4, N.A3, N.G3][i], 0.12);
    }
    sub(11.0, N.F2, 2.2, 0.38);
    sub(13.0, N.C3, 1.4, 0.3);

    // -- 14–17 s · depth-chart : the instrument becomes a clock
    for (let i = 0; i < 24; i++) {
      const t = 14.0 + i * 0.125;
      tick(t, i % 2 === 0 ? 0.06 : 0.028, 5200 + (i % 4) * 400);
    }
    pad(14.0, [N.A2, N.C3, N.E3], 3.2, 0.05, 700);
    sub(14.0, N.A2, 2.4, 0.3);
    bell(15.5, N.E5, 0.1, 1.6);
    pluck(16.5, N.A4, 0.1);

    // -- 17–19 s · angler-chart : ticks tighten, a tritone rises
    for (let i = 0; i < 16; i++) {
      const t = 17.0 + i * 0.125;
      tick(t, 0.05 + i * 0.004, 5600);
    }
    pad(17.0, [N.A2, N.C3, N.E3], 2.2, 0.055, 900);
    // rising dissonance: A4 and Eb5 glissando-ish steps
    for (let i = 0; i < 6; i++) {
      pluck(18.0 + i * 0.16, i % 2 === 0 ? N.A4 : N.Bb4 * 1.1892, 0.11 + i * 0.012, 0.3);
    }
    sub(18.5, N.A2, 0.9, 0.34);

    // -- 19–22 s · anglerfish : near silence, the snap at 21.0
    rumble(19.0, 3.2, 0.11);
    pad(19.0, [N.D2, N.A2], 3.2, 0.035, 320, 'sine');
    sub(19.0, N.D2, 2.2, 0.3);
    // tiny lure ticks on the beat
    for (let b = 0; b < 4; b++) tick(19.5 + b * BEAT, 0.045, 7400);
    snapFX(21.0);
    // after: a thin high tone fading into the dark
    bell(21.35, N.D5, 0.08, 2.6);
    pad(21.2, [N.D2, N.F2], 1.6, 0.03, 260, 'sine');

    // -- 22–25.5 s · whale-fall : slow Bb elegy
    pad(22.0, [N.Bb2, N.D3, N.F3], 3.6, 0.085, 850);
    wash(22.0, 3.6, 0.06, 420);
    sub(22.0, N.Bb2, 2.4, 0.4);
    sub(24.0, N.F2, 1.8, 0.32);
    bell(22.75, N.Bb4, 0.1, 2.2);
    bell(23.75, N.F4, 0.09, 2.2);
    bell(24.75, N.D4, 0.08, 2.2);
    for (let i = 0; i < 6; i++) {
      pluck(22.5 + i * 0.5, [N.Bb3, N.F4, N.D4, N.F4, N.Bb3, N.D4][i], 0.09, 0.7);
    }

    // -- 25.5–29 s · vent : the earth rumbles, tension rises Gm -> A
    rumble(25.5, 3.6, 0.2);
    pad(25.5, [N.G2, N.Bb2, N.D3], 1.9, 0.085, 750);
    pad(27.5, [N.A2, N.C3, N.E3], 1.7, 0.095, 900);
    for (let b = 0; b < 7; b++) {
      const t = 25.5 + b * BEAT;
      if (b % 2 === 0) kick(t, 0.5);
      tick(t + BEAT / 2, 0.05, 3400);
    }
    sub(25.5, N.G2, 1.8, 0.45);
    sub(27.5, N.A2, 1.7, 0.42);
    whoosh(28.6, 0.9, 300, 2200, 0.12);

    // -- 29–33 s · trench : the deep hits back, arpeggio an octave up
    sub(29.0, N.D2, 2.6, 0.62);
    pad(29.0, [N.Bb2, N.D3, N.F3], 2.1, 0.11, 1050);
    pad(31.0, [N.C3, N.E3, N.G3], 2.1, 0.115, 1150);
    ping(29.5, N.A5);
    ping(31.0, N.E5);
    for (let i = 0; i < 16; i++) {
      const t = 29.25 + i * 0.25;
      pluck(t, [N.D4, N.A4, N.F4, N.A4, N.D5, N.A4, N.F4, N.E4, N.F4, N.C5, N.A4, N.F4, N.G4, N.D5, N.Bb4, N.D5][i], 0.14);
    }
    for (let b = 0; b < 8; b++) {
      const t = 29.0 + b * BEAT;
      if (b % 2 === 0) kick(t, 0.5);
      tick(t + BEAT / 2, 0.055, 5200);
    }
    sub(31.0, N.C3, 2.0, 0.5);

    // -- 33–36.5 s · credits : resolve to Dm and thin out
    pad(33.0, [N.D3, N.F3, N.A3, N.D4], 3.6, 0.1, 1000);
    sub(33.0, N.D2, 2.8, 0.5);
    bell(33.0, N.D5, 0.14, 3.0);
    bell(34.0, N.A4, 0.11, 3.0);
    for (let i = 0; i < 6; i++) {
      pluck(33.25 + i * 0.5, [N.D4, N.A4, N.F4, N.A4, N.D5, N.A4][i], 0.1, 0.8);
    }
    wash(33.0, 3.5, 0.09, 560);
    bell(35.25, N.F5, 0.09, 2.2);
    bell(36.0, N.D5, 0.08, 1.4);
    sub(35.0, N.D2, 1.5, 0.3);

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
