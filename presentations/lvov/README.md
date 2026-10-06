# 3D-презентация: Дмитрий Семёнович Львов (1930–2007)

Использует тот же движок, что и `../schumpeter`: `lib.js`, `pptx3d.js`, `models/render.py`, а также `node_modules` из `../schumpeter`.
Модели строятся скриптом `models/make_models.py`. Он берёт палитру материалов из `../schumpeter/models/make_models.py`, а хелперы (текст, сетки) — из `../cantillon/models/make_models.py`.

```bash
cd ../schumpeter && npm i && cd ../lvov
LD_LIBRARY_PATH=/tmp/bstub python3 models/make_models.py   # 14 моделей .glb → models/glb (нужен pip-пакет bpy)
python3 stage.py                                           # фон и свечение (малахитовая палитра) → assets/
node build.js --preview                                    # → ../../exports/lvov-3d-presentation.pptx
```

Чтобы собрать быстрый черновик с растрами в низком разрешении, используйте `FAST=1`. Флаг `--only=2,5` пересобирает превью только для указанных слайдов.

Экспонаты: станок-качалка, кремлёвская башня, штангенциркуль с шестернёй, лента Мёбиуса ЦЭМИ, книги, пирамида укладов, нефтяная бочка, 3D-диаграмма «75%», сейф, счёты, росток из монет, микрочип, микрофон и серебряный рубль «1930», который катится по шкале прогресса.
