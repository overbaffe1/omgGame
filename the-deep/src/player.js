// player.js : the HTML player chrome — play/pause, scrub, mute, keyboard,
// and the requestAnimationFrame loop that drives FILM.renderFrame(T).
//
// The video clock follows the audio clock while playing, so picture and score
// never drift. Scrubbing restarts the buffer source at the new offset.
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

    // ---- layout ----
    root.classList.add('film-root');
    const stage = el('div', 'film-stage', root);
    const canvas = el('canvas', 'film-canvas', stage);
    FILM.attach(canvas);

    const overlay = el('div', 'film-overlay', stage);
    overlay.classList.add('film-overlay-show');
    const ovTitle = el('div', 'film-ov-title', overlay);
    ovTitle.textContent = 'ГЛУБИНА';
    const ovSub = el('div', 'film-ov-sub', overlay);
    ovSub.textContent = 'THE DEEP · процедурный фильм';
    const ovBtn = el('button', 'film-ov-btn', overlay);
    ovBtn.textContent = 'Синтезирую саундтрек…';
    ovBtn.disabled = true;
    const ovHint = el('div', 'film-ov-hint', overlay);
    ovHint.textContent = 'каждый кадр нарисован в JavaScript · каждый звук синтезирован в Web Audio';

    const bar = el('div', 'film-bar', root);
    const btnPlay = el('button', 'film-btn', bar);
    btnPlay.textContent = '▶';
    btnPlay.title = 'пробел — воспроизведение';
    const btnReplay = el('button', 'film-btn', bar);
    btnReplay.textContent = '⟲';
    btnReplay.title = 'R — сначала';

    const scrub = el('input', 'film-scrub', bar);
    scrub.type = 'range';
    scrub.min = '0';
    scrub.max = '10000';
    scrub.value = '0';

    const time = el('div', 'film-time', bar);
    time.textContent = '0:00 / 0:00';

    const shotLabel = el('div', 'film-shot', bar);
    shotLabel.textContent = '…';

    const btnMute = el('button', 'film-btn', bar);
    btnMute.textContent = '♪';
    btnMute.title = 'M — звук';

    const btnFull = el('button', 'film-btn', bar);
    btnFull.textContent = '⛶';
    btnFull.title = 'F — на весь экран';

    // ---- audio state ----
    const AC = window.AudioContext || window.webkitAudioContext;
    let actx = null;
    let buffer = null;
    let source = null;
    let gain = null;
    let playing = false;
    let playhead = 0;
    let startedAt = 0; // actx.currentTime at (re)start
    let startOffset = 0; // playhead at (re)start
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
      gain = gain || actx.createGain();
      gain.gain.value = muted ? 0 : 1;
      source.connect(gain);
      gain.connect(actx.destination);
      source.onended = function () {
        if (playing && currentT() >= DURATION - 0.15) {
          playing = false;
          playhead = DURATION;
          ended = true;
          ovBtn.textContent = 'Смотреть снова';
          overlay.classList.add('film-overlay-show');
          btnPlay.textContent = '▶';
        }
      };
      source.start(0, Math.min(startOffset, DURATION - 0.01));
      startedAt = actx.currentTime;
    }

    function play() {
      if (!ready) {
        ovBtn.textContent = '⏳ Синтезирую саундтрек… секунду';
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

    // ---- chrome sync ----
    let scrubbing = false;
    function updateChrome() {
      const T = currentT();
      if (!scrubbing) scrub.value = String(Math.round((T / DURATION) * 10000));
      time.textContent = fmt(T) + ' / ' + fmt(DURATION);
      const s = FILM.shotAt(T);
      const idx = s ? String(s.i + 1).padStart(2, '0') : '--';
      shotLabel.textContent = idx + ' · ' + ((s && s.shot && s.shot.title) || '');
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

    // render the score; failure must not kill the player
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
        // Visuals still work without audio.
        ready = true;
        ovBtn.disabled = false;
        ovBtn.textContent = '▶ Смотреть без звука';
        if (window.console) console.error(err);
      });
    })();

    // A gesture creates the AudioContext (autoplay policies).
    function ensureCtx() {
      if (!AC) return null;
      try {
        if (!actx) actx = new AC();
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
