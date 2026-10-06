# 3D-презентация: Ричард Кантильон

Использует тот же движок, что и `../schumpeter`: `lib.js`, `pptx3d.js`, `models/render.py`, а также `node_modules` из `../schumpeter`.

```bash
cd ../schumpeter && npm i && cd ../cantillon
LD_LIBRARY_PATH=/tmp/bstub python3 models/make_models.py   # .glb → models/glb (нужен pip-пакет bpy)
python3 stage.py                                           # фон и свечение → assets/
node build.js --preview                                    # → ../../exports/cantillon-3d-presentation.pptx
```

Чтобы собрать быстрый черновик с растрами в низком разрешении, используйте `FAST=1`.
