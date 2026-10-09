/* Isolated player for the new minute film. Does not modify film/player.js. */
(async function () {
  'use strict';
  const $ = id => document.getElementById(id), data = window.BODY51_DAY;
  const params = new URLSearchParams(location.search), live = params.get('live') === '1';
  const video = $('video'), canvas = $('live-canvas'), media = live ? $('live-audio') : video;
  const start = $('start'), toggle = $('toggle'), seek = $('seek'), status = $('status');
  const names = ['Начальник Гуччи', 'Сервис для кота', 'Кошачье ревью', 'На турничок', 'Тихая фабрика', 'Нейромеч', 'Ещё промптик', 'Итог дня'];
  const format = value => `${Math.floor(Math.max(0, value) / 60)}:${String(Math.floor(Math.max(0, value) % 60)).padStart(2, '0')}`;
  const duration = () => Number.isFinite(media.duration) ? Math.min(data.total, media.duration) : data.total;
  let movie = null, raf = 0, lastScene = -1, hasPlayed = false;
  if (live) {
    video.pause(); video.removeAttribute('src'); video.load(); video.hidden = true; canvas.hidden = false;
    // Load every used weight before the first live frame; static TTFs match Skia.
    await Promise.all([400, 600, 700, 800].map(w => document.fonts.load(`${w} 30px Manrope`, 'Артём Гуччи')));
    movie = window.Body51Day.create(canvas, data);
    movie.draw(0);
    $('mode-link').textContent = 'Смотреть готовое видео ↗';
    $('mode-link').href = 'body51-min.html';
    status.textContent = 'Живая рисовка кодом · тот же монтаж и звук';
    media.preload = 'metadata';
  }
  video.controls = false;
  start.hidden = false; $('transport').hidden = false; seek.max = data.total;
  $('duration').textContent = format(Math.round(data.total));
  const chapterButtons = data.scenes.map((s, i) => {
    const button = document.createElement('button');
    button.className = 'chapter'; button.type = 'button';
    const num = document.createElement('span'); num.className = 'num'; num.textContent = String(i + 1).padStart(2, '0');
    const name = document.createElement('span'); name.textContent = s.chapterLabel || names[i] || s.title.join(' ');
    const time = document.createElement('time'); time.textContent = format(s.start);
    button.append(num, name, time);
    button.addEventListener('click', () => { jump(s.start); play(); });
    $('chapters').append(button); return button;
  });
  function update() {
    const t = Math.min(media.currentTime || 0, data.total);
    seek.value = t; seek.setAttribute('aria-valuetext', `${format(t)} из ${format(Math.round(data.total))}`);
    $('current').textContent = format(t);
    // Rounded scene durations can overlap the next start by a few microseconds.
    // Pick the latest started scene, so clicking a chapter highlights that
    // chapter immediately instead of briefly keeping its predecessor active.
    let idx = 0;
    for (let i = data.scenes.length - 1; i >= 0; i--) {
      if (t + .00001 >= data.scenes[i].start) { idx = i; break; }
    }
    if (idx !== lastScene && idx >= 0) {
      chapterButtons.forEach((button, i) => { button.classList.toggle('active', i === idx); if (i === idx) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current'); });
      lastScene = idx;
    }
    if (movie) movie.draw(t);
  }
  function loop() {
    cancelAnimationFrame(raf);
    update();
    if (!media.paused && !media.ended) raf = requestAnimationFrame(loop);
  }
  async function play() {
    try {
      if (media.ended || media.currentTime >= duration() - .04) media.currentTime = 0;
      await media.play();
      status.textContent = live ? 'Живая рисовка кодом · тот же монтаж и звук' : 'Пробел — пауза · ← → — перемотка · F — полный экран';
    } catch (error) {
      status.textContent = error.name === 'NotAllowedError' ? 'Нажмите «Смотреть», чтобы включить звук.' : 'Не удалось запустить видео. Можно скачать MP4 по ссылке ниже.';
      start.hidden = false;
    }
  }
  function togglePlayback() { media.paused ? play() : media.pause(); }
  function jump(to) {
    const t = Math.max(0, Math.min(duration() - .03, to));
    media.currentTime = t;
    if (movie) movie.draw(t);
    update();
  }
  start.addEventListener('click', play);
  toggle.addEventListener('click', togglePlayback);
  video.addEventListener('click', togglePlayback);
  canvas.addEventListener('click', togglePlayback);
  seek.addEventListener('input', () => jump(Number(seek.value)));
  $('mute').addEventListener('click', () => { media.muted = !media.muted; });
  media.addEventListener('volumechange', () => {
    const muted = media.muted || media.volume === 0;
    $('mute').classList.toggle('muted', muted);
    $('mute').setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук');
  });
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ($('player').requestFullscreen) await $('player').requestFullscreen();
      else if (!live && video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    } catch { status.textContent = 'Полный экран недоступен в этом окне. Видео можно открыть отдельно.'; }
  }
  $('fullscreen').addEventListener('click', fullscreen);
  media.addEventListener('play', () => {
    hasPlayed = true; start.hidden = true; toggle.classList.add('playing'); toggle.setAttribute('aria-label', 'Пауза'); loop();
  });
  media.addEventListener('pause', () => { toggle.classList.remove('playing'); toggle.setAttribute('aria-label', 'Воспроизвести'); cancelAnimationFrame(raf); update(); });
  media.addEventListener('ended', () => {
    start.hidden = false; $('start-label').textContent = 'Ещё один обычный день';
    status.textContent = 'Такие пирожочки. Можно пересмотреть или скачать.';
  });
  media.addEventListener('error', () => { status.textContent = 'Не получилось загрузить файл. Попробуйте скачать MP4 или открыть рисовку кодом.'; });
  media.addEventListener('timeupdate', update);
  media.addEventListener('seeked', () => { if (hasPlayed) start.hidden = true; update(); });
  media.addEventListener('loadedmetadata', () => {
    const requested = Number(params.get('t'));
    if (Number.isFinite(requested) && requested > 0) { jump(requested); start.hidden = true; }
    update();
  }, {once: true});
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (event.code === 'Space' && event.target.tagName !== 'BUTTON') { event.preventDefault(); togglePlayback(); }
    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') { event.preventDefault(); jump(media.currentTime + (event.code === 'ArrowRight' ? 5 : -5)); }
    if (event.code === 'KeyF') fullscreen();
    if (event.code === 'KeyM') media.muted = !media.muted;
    if (event.code === 'KeyN' || event.code === 'KeyP') { const i = Math.max(0, Math.min(data.scenes.length - 1, lastScene + (event.code === 'KeyN' ? 1 : -1))); jump(data.scenes[i].start); }
    if (/^Digit[1-9]$/.test(event.code)) { const chapter = data.scenes[Number(event.code.slice(-1)) - 1]; if (chapter) jump(chapter.start); }
    if (event.code === 'Digit0' && data.scenes[9]) jump(data.scenes[9].start);
    if (event.code === 'Home') { event.preventDefault(); jump(0); }
    if (event.code === 'End') { event.preventDefault(); jump(data.scenes.at(-1).start); }
  });
  // A tab restored from the back-forward cache may already have metadata.
  if (media.readyState >= 1) {
    const t = Number(params.get('t')); if (t > 0 && !hasPlayed) { jump(t); start.hidden = true; }
  }
  update();
  // Developer hook for visual parity tests, not a separate rendering path.
  window.__body51DayPlayer = {media, movie, jump, data, live};
})();
