"""Сборка атласа: лист PNG, метаданные в формате Aseprite, QA-контактные листы."""
import json
import os
import time

import components
import pngio
from canvas import Canvas, C
from packer import pack

DIGITS = {
    "0": ("111", "101", "101", "101", "111"),
    "1": ("010", "110", "010", "010", "111"),
    "2": ("111", "001", "111", "100", "111"),
    "3": ("111", "001", "111", "001", "111"),
    "4": ("101", "101", "111", "001", "001"),
    "5": ("111", "100", "111", "001", "111"),
    "6": ("111", "100", "111", "101", "111"),
    "7": ("111", "001", "001", "001", "001"),
    "8": ("111", "101", "111", "101", "111"),
    "9": ("111", "101", "111", "001", "111"),
}

GROUP_ORDER = ["fills", "panels", "decor", "buttons", "slots", "bars", "globes", "scroll", "rarity", "icons", "fx", "cursor"]


def _order(s):
    g = s["group"]
    return (GROUP_ORDER.index(g) if g in GROUP_ORDER else 99, g)


def plan(names=None):
    """Список спеков в стабильном порядке (группа → имя)."""
    specs = [s for s in components.SPECS if names is None or s["name"] in names]
    return sorted(specs, key=lambda s: (_order(s), s["name"]))


def paint_all(names=None):
    out = {}
    for s in plan(names):
        out[s["name"]] = components.paint(s)
    return out


def build(names=None, max_w=1024, max_h=4096, pad=2):
    specs = plan(names)
    canvases = {}
    items = []
    for s in specs:
        cv = components.paint(s)
        canvases[s["name"]] = cv
        items.append({"name": s["name"], "w": cv.w, "h": cv.h})
    aw, ah, rects, fill = pack(items, max_w, max_h, pad)
    sheet = Canvas(aw, ah)
    for name, (x, y, w, h) in rects.items():
        sheet.blit(canvases[name], x, y)
    return {
        "specs": specs,
        "canvases": canvases,
        "rects": rects,
        "sheet": sheet,
        "w": aw,
        "h": ah,
        "fill": fill,
        "pad": pad,
    }


def palette_of(canvases, limit=256):
    counts = {}
    for cv in canvases.values():
        for j in range(cv.h):
            for i in range(cv.w):
                p = cv.get(i, j)
                if p[3]:
                    counts[p] = counts.get(p, 0) + 1
    items = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    if items and (0, 0, 0, 0) not in counts:
        items = [((0, 0, 0, 0), 0)] + items
    return [c for c, _ in items[:limit]], len(counts)


def frame_tags(specs):
    """Теги анимаций из подряд идущих кадров с одинаковым tag."""
    tags = []
    idx = {s["name"]: i for i, s in enumerate(specs)}
    i = 0
    while i < len(specs):
        t = specs[i]["tag"]
        if t:
            j = i
            while j + 1 < len(specs) and specs[j + 1]["tag"] == t:
                j += 1
            fps = specs[i].get("fps", 12)
            tags.append(
                {
                    "name": t,
                    "from": idx[specs[i]["name"]],
                    "to": idx[specs[j]["name"]],
                    "direction": "forward",
                    "fps": fps,
                    "duration": int(round(1000.0 / fps)),
                    "frames": [specs[k]["name"] for k in range(i, j + 1)],
                }
            )
            i = j + 1
        else:
            i += 1
    return tags


def meta_json(built, image="darkui.png", app="omgGame darkui-mcp/1.0"):
    specs, rects = built["specs"], built["rects"]
    tags = frame_tags(specs)
    frames = []
    comps = {}
    layers = []
    for i, s in enumerate(specs):
        x, y, w, h = rects[s["name"]]
        if s["group"] not in layers:
            layers.append(s["group"])
        frames.append(
            {
                "filename": s["name"],
                "name": s["name"],
                "group": s["group"],
                "frame": {"x": x, "y": y, "w": w, "h": h},
                "rotated": False,
                "trimmed": False,
                "spriteSourceSize": {"x": 0, "y": 0, "w": w, "h": h},
                "sourceSize": {"w": w, "h": h},
                "duration": next((t["duration"] for t in tags if t["from"] <= i <= t["to"]), 100),
                "nineSlice": dict(zip(("l", "t", "r", "b"), s["nine"])) if s["nine"] else None,
                "desc": s["desc"],
            }
        )
        comps[s["name"]] = {
            "group": s["group"],
            "w": w,
            "h": h,
            "nine": list(s["nine"]) if s["nine"] else None,
            "tag": s["tag"],
            "desc": s["desc"],
            "layer": layers.index(s["group"]),
        }
    slices = []
    for i, s in enumerate(specs):
        if not s["nine"]:
            continue
        x, y, w, h = rects[s["name"]]
        l, t, r, b = s["nine"]
        slices.append(
            {
                "name": s["name"],
                "color": "#ff00ff7f",
                "keys": [
                    {
                        "frame": i,
                        "bounds": {"x": x, "y": y, "w": w, "h": h},
                        "center": {"x": l, "y": t, "w": max(1, w - l - r), "h": max(1, h - t - b)},
                    }
                ],
            }
        )
    return {
        "frames": frames,
        "meta": {
            "app": app,
            "version": "1.0",
            "image": image,
            "format": "RGBA8888",
            "size": {"w": built["w"], "h": built["h"]},
            "scale": "1",
            "padding": built["pad"],
            "fillRatio": round(built["fill"], 4),
            "frameTags": [
                {"name": t["name"], "from": t["from"], "to": t["to"], "direction": t["direction"], "fps": t["fps"]}
                for t in tags
            ],
            "layers": [{"name": n, "opacity": 255, "blendMode": "normal"} for n in layers],
            "slices": slices,
            "components": comps,
            "groups": [{"name": g, "count": sum(1 for s in specs if s["group"] == g)} for g in layers],
            "animations": {t["name"]: {"frames": t["frames"], "fps": t["fps"]} for t in tags},
            "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
    }


def write_sheet(built, path):
    return pngio.write_png(path, built["w"], built["h"], built["sheet"].px)


def write_meta(built, path, image=None):
    data = meta_json(built, image or os.path.basename(path).replace(".json", ".png"))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write("\n")
    return len(data["frames"])


def write_aseprite(built, path, compress=True):
    """Один кадр = один компонент, слои = группы, теги = анимации, срезы = 9-patch."""
    import ase

    specs, rects, canvases = built["specs"], built["rects"], built["canvases"]
    layers = []
    for s in specs:
        if s["group"] not in layers:
            layers.append(s["group"])
    cw = max(c.w for c in canvases.values())
    ch = max(c.h for c in canvases.values())
    frames = []
    slices = []
    for i, s in enumerate(specs):
        cv = canvases[s["name"]]
        frames.append(
            {
                "name": s["name"],
                "duration": next((t["duration"] for t in frame_tags(specs) if t["from"] <= i <= t["to"]), 100),
                "cels": [
                    {
                        "layer": layers.index(s["group"]),
                        "x": 0,
                        "y": 0,
                        "w": cv.w,
                        "h": cv.h,
                        "rgba": cv.px,
                        "text": s["desc"],
                    }
                ],
            }
        )
        if s["nine"]:
            l, t, r, b = s["nine"]
            slices.append(
                {
                    "name": s["name"],
                    "nine": True,
                    "keys": [
                        {
                            "frame": i,
                            "x": 0,
                            "y": 0,
                            "w": cv.w,
                            "h": cv.h,
                            "center": (l, t, max(1, cv.w - l - r), max(1, cv.h - t - b)),
                        }
                    ],
                }
            )
    tags = []
    for t in frame_tags(specs):
        tags.append({"name": t["name"], "from": t["from"], "to": t["to"], "dir": 0, "color": (255, 128, 64, 255)})
    pal, total = palette_of(canvases)
    size = ase.write_aseprite(
        path,
        cw,
        ch,
        frames,
        layers,
        tags=tags,
        slices=slices,
        palette=pal,
        compress=compress,
    )
    return {"bytes": size, "canvas": [cw, ch], "frames": len(frames), "layers": layers, "tags": [t["name"] for t in tags], "slices": len(slices), "palette": len(pal), "unique_colors": total}


def _label(cv, x, y, text, color):
    for ch_i, ch in enumerate(text):
        g = DIGITS.get(ch)
        if not g:
            continue
        for ry, row in enumerate(g):
            for rx, bit in enumerate(row):
                if bit == "1":
                    cv.put(x + ch_i * 4 + rx, y + ry, color)


def contact_sheet(built, path, groups=None, scale=3, cols=8, cell_pad=6, numbered=True):
    """QA-лист: компоненты сеткой на шахматном фоне, с номерами."""
    specs = [s for s in built["specs"] if groups is None or s["group"] in groups]
    canvases, rects = built["canvases"], built["rects"]
    cw = max(canvases[s["name"]].w for s in specs) + cell_pad * 2
    chh = max(canvases[s["name"]].h for s in specs) + cell_pad * 2 + (8 if numbered else 0)
    cols = max(1, min(cols, len(specs)))
    rows = (len(specs) + cols - 1) // cols
    W, H = cols * cw * scale, rows * chh * scale
    big = Canvas(cols * cw, rows * chh)
    for k, s in enumerate(specs):
        cx, cy = (k % cols) * cw, (k // cols) * chh
        cv = canvases[s["name"]]
        # шахматный фон ячейки
        for j in range(chh):
            for i in range(cw):
                big.put(cx + i, cy + j, (26, 24, 21, 255) if ((i // 4 + j // 4) % 2 == 0) else (36, 33, 29, 255))
        big.blit(cv, cx + (cw - cv.w) // 2, cy + (chh - cv.h) // 2 + (4 if numbered else 0))
        big.frame(cx, cy, cw, chh, (60, 54, 46, 255))
        if numbered:
            _label(big, cx + 3, cy + 2, str(k), (232, 196, 95, 255))
    out = Canvas(W, H)
    for j in range(H):
        for i in range(W):
            out.put(i, j, big.get(i // scale, j // scale))
    return pngio.write_png(path, W, H, out.px)


def preview(built, name, path, scale=6):
    cv = built["canvases"][name]
    out = Canvas(cv.w * scale, cv.h * scale)
    for j in range(out.h):
        for i in range(out.w):
            out.put(i, j, cv.get(i // scale, j // scale))
    return pngio.write_png(path, out.w, out.h, out.px)
