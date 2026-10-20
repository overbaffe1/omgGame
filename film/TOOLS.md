# Инструменты для «видео из кода» — разведка по GitHub

Что нашлось и что реально помогло бы делать такие эдиты ещё круче.

## Фреймворки «видео из кода»

| Инструмент | Репо | Что даёт | Лицензия |
|---|---|---|---|
| **Remotion** | [remotion-dev/remotion](https://github.com/remotion-dev/remotion) (65k ★) | React-компоненты → MP4/WebM, Remotion Studio, AWS Lambda-рендер, AI-skills для агентов, Player. Огромная экосистема шаблонов | source-available (бесплатно до 3 чел. в компании) |
| **Revideo** | [redotvideo/revideo](https://github.com/redotvideo/revideo) | MIT-форк Motion Canvas: TypeScript-сцены, headless `renderVideo()`, REST API, React Player, переменные в шаблонах | MIT |
| **Motion Canvas** | [motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas) | TypeScript-генераторы + живой редактор с таймингом. Заточен под объясняющую анимацию | MIT (релизов давно нет, но код живёт) |
| **Editly** | [mifi/editly](https://github.com/mifi/editly) (5.5k ★) | Декларативный монтаж на Node + ffmpeg: JSON-спека, gl-transitions, свои HTML5 Canvas/Fabric-слои, GLSL-шейдеры | MIT |
| **FFCreator** | [Tencent/FFCreator](https://github.com/Tencent/FFCreator) | Node.js, GPU-ускорение, слайдшоу, готовые транзишены — хорошо для шаблонных шортсов | MIT |
| **ffmpeg-concat** | [transitive-bullshit/ffmpeg-concat](https://github.com/transitive-bullshit/ffmpeg-concat) | Склейка клипов с OpenGL-транзишенами (gl-transitions) | MIT |
| **ffmpeg-gl-transition** | [transitive-bullshit/ffmpeg-gl-transition](https://github.com/transitive-bullshit/ffmpeg-gl-transition) | GLSL-транзишены прямо в filtergraph ffmpeg | MIT |
| **Manim** | [3b1b/manim](https://github.com/3b1b/manim) / [ManimCommunity/manim](https://github.com/ManimCommunity/manim) | Математическая/объясняющая анимация, сцены через Python | MIT |
| **awesome-ffmpeg** | [transitive-bullshit/awesome-ffmpeg](https://github.com/transitive-bullshit/awesome-ffmpeg) | Курируемый список всего вокруг ffmpeg | — |
| **remotion-alternatives** | [a1adams/remotion-alternatives](https://github.com/a1adams/remotion-alternatives) | Сравнение 8 фреймворков (2026): Revideo, Motion Canvas, Editly, FFCreator и др. | — |

## Что взять нам

Наш стек (canvas-генератор в одном HTML + `@napi-rs/canvas` + ffmpeg) уже даёт полный ручной контроль над каждым кадром — поэтому и выглядит «нарисовано кодом». Но:

1. **Revideo** — если захотим автоматизацию: `renderVideo()` из Node/CI, шаблоны с переменными («собери эдит под новый мем за минуту»), параллельный рендер воркерами. MIT — можно форкнуть и встроить.
2. **Editly + gl-transitions** — готовые кинематографичные переходы между сценами (crosswarp, dreamy, directionalwarp), которые у нас сейчас рисуются вручную.
3. **Remotion** — если понадобится Player на сайт, огромные библиотеки шаблонов и AI-скиллы (docs.remotion.dev/docs/ai/skills).
4. **ffmpeg-concat / ffmpeg-gl-transition** — точечно: склейка готовых кусков с GL-переходами.
5. **Manim** — для «научных» вставок (типа супной чёрной дыры с орбитами).

Вывод: для наших мем-эдитов текущий ручной canvas-движок — правильный выбор (полный контроль над стилем), а **Revideo** и **Editly** — лучшие кандидаты, если понадобится пайплайн «мем → готовый MP4 по кнопке».
