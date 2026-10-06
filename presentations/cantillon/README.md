# Кантильон: 3D-презентация

Результат — `exports/cantillon-3d-presentation.pptx`: 17 слайдов 16:9.

- **3D-экспонаты.** На каждом слайде стоит настоящая 3D-модель (.glb, PowerPoint 3D Model).
- **Morph.** Экспонаты улетают и влетают с поворотом при смене слайда.
- **Шкала прогресса.** По ней катится золотой луидор 1720 года.
- **Анимации.** Элементы появляются по очереди сами, без кликов.
- **Заметки докладчика.** Текст выступления есть в заметках и в файле `exports/cantillon-presentation-script.md`.

Движок общий с презентацией о Шумпетере: `../schumpeter/lib.js`, `../schumpeter/pptx3d.js`, `../schumpeter/models/render.py`, хелперы моделирования из `../schumpeter/models/make_models.py`. Зависимости npm тоже берутся из `../schumpeter/node_modules`.

| | |
|---|---|
| `models/make_models.py` | 15 процедурных экспонатов (bpy) → `models/glb/` |
| `models/rasters/` | кэш Cycles-рендеров (статичная картинка модели внутри .pptx) |
| `stage.py` | тёплый «свечной» фон, свечение и тень → `assets/` |
| `build.js` | слайды, заметки, хореография Morph |

```bash
(cd ../schumpeter && npm install)
python3 models/make_models.py      # пересобрать модели (нужен bpy)
node build.js                      # .pptx + текст выступления
node build.js --preview            # плюс PNG-превью в preview/
```

3D видно в PowerPoint 2019/2021/365 и PowerPoint для Mac 16+. В других программах вместо модели будет её рендер, а вместо Morph — Fade.
