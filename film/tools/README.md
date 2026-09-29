# Инструменты «Анатомии страсти»

Каждая серия — самостоятельный `film/greysN.html`. Новая серия собирается из предыдущей скриптом `build_epN.py`.

Конвейер (пример для 4-й серии):
```bash
python3 film/tools/build_ep4.py                     # собрать film/greys4.html
python3 -c "import sys;sys.path.insert(0,'film/tools');import epkit;epkit.lines('greys4.html','e4','/tmp/l4.json')"
python film/voices/synth_silero.py /tmp/l4.json      # озвучка (torch + Silero model.pt, см. скрипт)
python3 -c "import sys;sys.path.insert(0,'film/tools');import epkit;epkit.durations('ffmpeg')"
FILE=greys4.html node film/tools/render_check.js T   # проверка кадров → .arena/T*.jpg
python3 film/serve.py                                # http://localhost:8080/film/
```
