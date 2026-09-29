# DARKUI — спрайт-атлас интерфейса в стиле Dark Fantasy (Diablo II)

Атлас нарисован **кодом**, собран через **MCP-сервер** и упакован в форматы,
которые понимает Aseprite. Ни одного пикселя не нарисовано вручную.

```
darkui/
├── index.html            ← ЛАБА: стенд 640×480 из атласа + CSS-виджеты + инспектор
├── lab.css / lab.js      ← рантайм лабы (nine-slice, теги анимаций, курсор из атласа)
├── atlas/
│   ├── darkui.png        ← лист 1024×320, 141 кадр, RGBA
│   ├── darkui.json       ← метаданные в формате Aseprite + nine-slice + анимации
│   ├── darkui.aseprite   ← редактируемый документ: кадры, слои, теги, 9-patch срезы
│   ├── mcp-session.jsonl ← транскрипт MCP-сессии сборки
│   └── qa/               ← контактные листы по группам + превью сцены
└── mcp/
    ├── server.py         ← MCP-сервер (stdio, JSON-RPC 2.0): 11 инструментов
    ├── client.py         ← клиент: поднимает сервер и прогоняет сессию сборки
    ├── lab-smoke.js      ← смоук-тест лабы в node (без браузера)
    ├── scene_preview.py  ← QA-превью сцены лабы без браузера
    ├── components.py     ← реестр компонентов (панели, кнопки, глобусы, иконки…)
    ├── icons.py / fx.py  ← иконки предметов и анимации (пламя, угли, руны, дым)
    ├── brushes.py        ← кисти: камень, латунь, фаски, заклёпки, черепа, самоцветы
    ├── canvas.py         ← пиксельный холст: рампы, дизеринг Байера, без сглаживания
    ├── packer.py         ← skyline-упаковщик листа
    ├── ase.py            ← писатель бинарного .aseprite (ASE) по официальной спецификации
    ├── aseprite_cli.py   ← адаптер к настоящему `aseprite -b`, если он установлен
    ├── export.py         ← лист PNG, JSON-мета, контактные листы
    ├── palette.py        ← палитра: камень, латунь, кровь, пергамент, кость, мана, угли
    └── pngio.py          ← PNG-кодек на чистом stdlib
```

## Посмотреть лабу

```bash
python3 -m http.server 8000     # из корня репозитория
# открыть http://localhost:8000/darkui/
```

На стенде: инвентарь с перетаскиванием предметов и подсказками по редкости,
глобусы здоровья/маны с анимированной волной (тег `wave_blood`/`wave_mana`),
факелы с пламенем (тег `flame`), углями и дымом, журнал со скроллбаром из атласа,
кнопки с состояниями, курсор-перчатка из кадра `cursor_hand`.
Справа — те же кадры в чистом CSS (`border-image` + nine-slice из JSON)
и инспектор листа с песочницей nine-slice.

## Пересобрать атлас

```bash
python3 darkui/mcp/client.py                 # своим кодеком (без зависимостей)
ASEPRITE_BIN=/path/to/aseprite python3 darkui/mcp/client.py
                                             # лист и JSON пересоберёт настоящий Aseprite:
                                             # aseprite -b darkui.aseprite --trim --sheet --data
node darkui/mcp/lab-smoke.js                 # прогнать лабу в заглушках
python3 darkui/mcp/scene_preview.py          # превью композиции сцены
```

## MCP-сессия сборки

`client.py` поднимает `server.py` по stdio и дёргает инструменты в таком порядке:

| # | инструмент | что делает |
|---|---|---|
| 1 | `atlas_plan` | реестр: 141 компонент, 35 с nine-slice, 6 тегов анимаций |
| 2 | `draw_all` | процедурная отрисовка всех компонентов |
| 3 | `pack_atlas` | skyline-упаковка в лист 1024×320 (заполнение ~75%) |
| 4 | `export_sheet` | `atlas/darkui.png` |
| 5 | `export_meta` | `atlas/darkui.json` (frames + meta.frameTags/layers/slices) |
| 6 | `export_aseprite` | `atlas/darkui.aseprite`: кадр = компонент, слой = группа, тег = анимация, срез = 9-patch |
| 7 | `export_via_aseprite_cli` | делегирует лист настоящему Aseprite, если он есть |
| 8 | `contact_sheet` / `atlas_stats` | QA-листы по группам и сводка |

Сервер говорит по протоколу MCP (JSON-RPC 2.0, `initialize` / `tools/list` /
`tools/call`), поэтому его можно подключить и к любому MCP-клиенту:

```json
{ "mcpServers": { "darkui-atlas": { "command": "python3", "args": ["darkui/mcp/server.py"] } } }
```

## Формат метаданных

`darkui.json` — это формат экспорта Aseprite (`json-array`) плюс поля, нужные UI:

```json
{ "frames": [ { "filename": "btn_stone_normal",
                "frame": {"x":0,"y":0,"w":96,"h":28},
                "nineSlice": {"l":16,"t":9,"r":16,"b":9},
                "group": "buttons", "desc": "Кнопка stone / normal" } ],
  "meta": { "size": {"w":1024,"h":320},
            "frameTags": [{"name":"flame","from":0,"to":7,"direction":"forward","fps":12}],
            "slices": [ …9-patch… ], "layers": [ … ], "animations": { … } } }
```
