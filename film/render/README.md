# Офлайн-рендер фильма в MP4

Пайплайн превращает `film/misha.html` (интерактивный WebGL-фильм) в готовый
`film/misha.mp4` без браузера: WebGL заменён программным растеризатором,
WebAudio — собственным DSP, видео кодирует ffmpeg.

## Зависимости

```bash
npm i @napi-rs/canvas @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe
```

(`node_modules` и артефакты рендера в git не кладём — только эти скрипты.)

## Файлы

| файл | что делает |
|---|---|
| `miniaudio.mjs` | мини-WebAudio офлайн: Param с set/lin/exp-рампами, Gain, Biquad (RBJ), осцилляторы с частотной автоматизацией, буферы, `OfflineAC`, `writeWav` PCM16 |
| `audio.mjs` | декодирует `film/misha-voices/*.mp3` (ffmpeg → f32le), инъектирует через `__MISHA_SETVOICES`, считает партитуру `__MISHA_SCORE` → мастер `tanh(mix*1.25)*0.92` → `audio.wav` |
| `render2.mjs` | растеризатор three.js-сцен на 2D-canvas (текстурированные треугольники, группы материалов, туман, alpha/additive-слои, толпа-бакеты) + быстрый bloom/CA/grain/vignette пост; режимы `bench` / `worker a b out.mp4` / `master` |

## Запуск (полный)

```bash
node audio.mjs                 # → audio.wav (303 c, звук партитуры + голоса)
node render2.mjs bench         # тайминги + пробные кадры bench-*.png
node render2.mjs master        # 2 воркера → chunk0/1.mp4 → mux с audio.wav → ../misha.mp4
```

Воркеры пишут RGBA-сырец в `ffmpeg -f rawvideo -framerate 24 -s 1920x1080`
→ libx264 veryfast crf20 g48 yuv420p; мастер склеивает concat-демуксером и
мучит звук в AAC 192k с `+faststart`.

Трюки совместимости: `window=global`, WebGLRenderer-стаб, `document.createElement`
→ реестр канвасов, кадр через `__MISHA_FRAME(t)`. Голоса в фильм-скрипт
попадают хуком `__MISHA_SETVOICES` (патч в `misha-film.js`).
