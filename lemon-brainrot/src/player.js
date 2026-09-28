// player.js : the player chrome + a WebM recorder so the film can go straight
// to YouTube. Playback clock follows the audio clock; recording captures the
// canvas stream + the score through MediaRecorder in real time.
(function () {
  'use strict';
  const FILM = window.FILM;

  function fmt(s) {
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function el(tag, cls, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  function init() {
    const root = document.getElementById('film');
    if (!root) return;

    root.classList.add('film-root');
    const stage = el('div', 'film-stage', root);
    const canvas = el('canvas', 'film-canvas', stage);
    FILM.attach(canvas);

    const overlay = el('div', 'film-overlay', stage);
    overlay.classList.add('film-overlay-show');
    const ovTitle = el('div', 'film-ov-title', overlay);
    ovTitle.textContent = 'ЛИМОННЫЙ БРЕЙНРОТ';
    const ovSub = el('div', 'film-ov-sub', overlay);
    ovSub.textContent = 'СКИБИДИ ДОП ДОП · ДА ДА ЕС ЕС';
    const ovBtn = el('button', 'film-ov-btn', overlay);
    ovBtn.textContent = 'Синтезирую бит…';
    ovBtn.disabled = true;
    const ovHint = el('div', 'film-ov-hint', overlay);
    ovHint.textContent = 'нарисовано в JavaScript · озвучено в Web Audio · можно записать в WebM и залить на YouTube';

    const bar = el('div', 'film-bar', root);
    const btnPlay = el('button', 'film-btn', bar);
    btnPlay.textContent = '▶';
    const btnReplay = el('button', 'film-btn', bar);
    btnReplay.textContent = '⟲';

    const scrub = el('input', 'film-scrub', bar);
    scrub.type = 'range';
    scrub.min = '0';
    scrub.max = '10000';
    scrub.value = '0';

    const time = el('div', 'film-time', bar);
    time.textContent = '0:00 / 0:00';

    const btnMute = el('button', 'film-btn', bar);
    btnMute.textContent = '♪';
    const btnRec = el('button', 'film-rec', bar);
    btnRec.textContent = '⏺ Записать WebM';
    const btnFull = el('button', 'film-btn', bar);
    btnFull.textContent = '⛶';

    // ---- audio state ----
    const AC = window.AudioContext || window.webkitAudioContext;
    let actx = null;
    let buffer = null;
    let source = null;
    let gain = null;
    let playing = false;
    let playhead = 0;
    let startedAt = 0;
    let startOffset = 0;
    let muted = false;
    let ready = false;
    let ended = false;

    const DURATION = FILM.TIMELINE ? FILM.prepare().duration : FILM.MUSIC.duration;

    function currentT() {
      if (!playing) return playhead;
      const now = actx ? actx.currentTime : performance.now() / 1000;
      return Math.min(DURATION, startOffset + (now - startedAt));
    }

    function stopSource() {
      if (source) {
        try {
          source.onended = null;
          source.stop();
        } catch (e) { /* already stopped */ }
        source = null;
      }
    }

    function startSource() {
      if (!buffer || !actx) return;
      stopSource();
      source = actx.createBufferSource();
      source.buffer = buffer;
      if (!gain) {
        gain = actx.createGain();
        gain.connect(actx.destination);
      }
      gain.gain.value = muted ? 0 : 1;
      source.connect(gain);
      source.start(0, Math.min(startOffset, DURATION - 0.01));
      startedAt = actx.currentTime;
    }

    function play() {
      if (!ready) {
        // still synthesising — say so instead of doing nothing
        ovBtn.textContent = '⏳ Синтезирую бит… секунду';
        return;
      }
      ensureCtx(); // safe here: play() always runs from a user gesture
      if (ended || playhead >= DURATION - 0.02) {
        playhead = 0;
        ended = false;
      }
      startOffset = playhead;
      startedAt = actx ? actx.currentTime : performance.now() / 1000;
      startSource();
      playing = true;
      btnPlay.textContent = '❚❚';
      overlay.classList.remove('film-overlay-show');
    }

    function pause() {
      if (!playing) return;
      playhead = currentT();
      playing = false;
      stopSource();
      btnPlay.textContent = '▶';
    }

    function toggle() {
      if (playing) pause();
      else play();
    }

    function seek(t) {
      t = Math.max(0, Math.min(DURATION, t));
      if (playing) {
        startOffset = t;
        playhead = t;
        ended = false;
        startSource();
      } else {
        playhead = t;
        ended = t >= DURATION - 0.02;
        FILM.renderFrame(t);
        updateChrome();
      }
    }

    function replay() {
      seek(0);
      play();
    }

    // ---- recorder ----
    let rec = null;
    let chunks = [];

    function pickMime() {
      const list = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm',
      ];
      for (const m of list) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
      }
      return '';
    }

    function finishRecording() {
      if (!rec) return;
      const r = rec;
      rec = null;
      if (r.state !== 'inactive') r.stop();
      btnRec.textContent = '⏺ Записать WebM';
      btnRec.classList.remove('film-rec-on');
    }

    function startRecording() {
      if (!window.MediaRecorder || !canvas.captureStream) {
        btnRec.textContent = 'запись не поддерживается';
        return;
      }
      if (!ready) return;
      ensureCtx();
      const mime = pickMime();
      const stream = canvas.captureStream(60);
      if (gain && actx) {
        const dest = actx.createMediaStreamDestination();
        gain.connect(dest);
        for (const tr of dest.stream.getAudioTracks()) stream.addTrack(tr);
      }
      chunks = [];
      try {
        rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8000000 } : undefined);
      } catch (e) {
        rec = new MediaRecorder(stream);
      }
      rec.ondataavailable = function (e) {
        if (e.data && e.data.size) chunks.push(e.data);
      };
      rec.onstop = function () {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lemon-brainrot.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          URL.revokeObjectURL(url);
          a.remove();
        }, 4000);
      };
      rec.start(250);
      btnRec.textContent = '⏹ Стоп и скачать';
      btnRec.classList.add('film-rec-on');
      seek(0);
      play();
    }

    btnRec.addEventListener('click', function () {
      if (rec) {
        finishRecording();
        pause();
      } else {
        startRecording();
      }
    });

    // ---- chrome sync ----
    let scrubbing = false;
    function updateChrome() {
      const T = currentT();
      if (!scrubbing) scrub.value = String(Math.round((T / DURATION) * 10000));
      time.textContent = fmt(T) + ' / ' + fmt(DURATION);
    }

    // ---- frame loop ----
    function frame() {
      const T = currentT();
      FILM.renderFrame(T);
      updateChrome();
      if (playing && T >= DURATION - 0.01) {
        playing = false;
        ended = true;
        playhead = DURATION;
        btnPlay.textContent = '▶';
        ovBtn.textContent = 'Смотреть снова';
        overlay.classList.add('film-overlay-show');
        if (rec) finishRecording();
      }
      requestAnimationFrame(frame);
    }

    // ---- events ----
    btnPlay.addEventListener('click', toggle);
    btnReplay.addEventListener('click', replay);
    ovBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (ended) replay();
      else play();
    });
    // click anywhere on the card to start
    overlay.addEventListener('click', function () {
      if (ended) replay();
      else play();
    });
    btnMute.addEventListener('click', function () {
      muted = !muted;
      if (gain) gain.gain.value = muted ? 0 : 1;
      btnMute.textContent = muted ? '✕' : '♪';
    });
    btnFull.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (root.requestFullscreen) root.requestFullscreen();
    });

    scrub.addEventListener('input', function () {
      scrubbing = true;
      const t = (Number(scrub.value) / 10000) * DURATION;
      if (!playing) {
        playhead = t;
        FILM.renderFrame(t);
      }
    });
    scrub.addEventListener('change', function () {
      const t = (Number(scrub.value) / 10000) * DURATION;
      scrubbing = false;
      seek(t);
    });

    window.addEventListener('keydown', function (e) {
      if (e.target === scrub) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'ArrowRight') {
        seek(currentT() + 2);
      } else if (e.code === 'ArrowLeft') {
        seek(currentT() - 2);
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
        btnMute.click();
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        replay();
      } else if (e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А') {
        btnFull.click();
      }
    });

    window.addEventListener('resize', function () {
      FILM.resize();
      FILM.renderFrame(currentT());
    });

    // ---- boot: nothing here may ever break the buttons ----
    window.addEventListener('pointerdown', function () { ensureCtx(); }, { once: true });
    window.addEventListener('keydown', function () { ensureCtx(); }, { once: true });

    FILM.renderFrame(0);
    updateChrome();
    requestAnimationFrame(frame);

    // synthesize the score; failure must not kill the player
    (function bootAudio() {
      // some browsers throw if an AudioContext is created before a gesture
      let sr = 44100;
      try {
        if (AC) sr = new AC().sampleRate || 44100;
      } catch (e) { sr = 44100; }
      let p;
      try {
        p = FILM.MUSIC.render(sr);
      } catch (e) {
        p = Promise.reject(e);
      }
      Promise.resolve(p).then(function (buf) {
        buffer = buf || null;
        ready = true;
        ovBtn.disabled = false;
        ovBtn.textContent = '▶ Смотреть';
      }, function (err) {
        ready = true; // visuals still play without audio
        ovBtn.disabled = false;
        ovBtn.textContent = '▶ Смотреть без звука';
        if (window.console) console.error(err);
      });
    })();

    function ensureCtx() {
      if (!AC) return null;
      try {
        if (!actx) {
          actx = new AC();
          gain = actx.createGain();
          gain.gain.value = muted ? 0 : 1;
          gain.connect(actx.destination);
        }
        if (actx.state === 'suspended') actx.resume();
      } catch (e) {
        actx = null; // no audio support: video still plays via rAF
      }
      return actx;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
