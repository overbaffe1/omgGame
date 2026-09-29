"""Адаптер к настоящему Aseprite CLI.

Если на машине есть `aseprite` (или LibreSprite), экспорт листа уходит ему:
он сам режет кадры, тримит прозрачность и пишет JSON. Мы лишь переименовываем
кадры по нашему реестру и дописываем 9-slice/описания, которых в CLI-экспорте
нет. Если бинарника нет — сервер честно сообщает об этом и работает своим
кодеком (формат JSON при этом идентичный).
"""
import json
import os
import shutil
import subprocess

CANDIDATES = [
    os.environ.get("ASEPRITE_BIN"),
    "aseprite",
    "Aseprite",
    "libresprite",
    "LibreSprite",
    "/Applications/Aseprite.app/Contents/MacOS/aseprite",
    "/usr/bin/aseprite",
    "/usr/local/bin/aseprite",
    "C:/Program Files/Aseprite/Aseprite.exe",
]


def find_binary(explicit=None):
    for c in [explicit] + CANDIDATES:
        if not c:
            continue
        if os.path.sep in c or c.endswith(".exe"):
            if os.path.exists(c):
                return c
        else:
            p = shutil.which(c)
            if p:
                return p
    return None


def version(binary):
    try:
        out = subprocess.run([binary, "--version"], capture_output=True, text=True, timeout=20)
        return (out.stdout or out.stderr).strip().splitlines()[0]
    except Exception as e:  # pragma: no cover
        return "не удалось узнать версию: %s" % e


def export(doc, out_png, out_json, binary=None, padding=2, timeout=180):
    """aseprite -b doc.aseprite --trim --sheet … --data … --list-tags --list-slices"""
    binary = find_binary(binary)
    if not binary:
        return {"used_cli": False, "reason": "aseprite не найден в PATH (укажите ASEPRITE_BIN)"}
    cmd = [
        binary,
        "-b",
        doc,
        "--trim",
        "--border-padding",
        str(padding),
        "--shape-padding",
        str(padding),
        "--sheet",
        out_png,
        "--data",
        out_json,
        "--format",
        "json-array",
        "--list-tags",
        "--list-slices",
    ]
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    ok = os.path.exists(out_png) and os.path.exists(out_json)
    return {
        "used_cli": ok,
        "binary": binary,
        "version": version(binary),
        "cmd": cmd,
        "returncode": p.returncode,
        "stdout": p.stdout[-2000:],
        "stderr": p.stderr[-2000:],
    }


def merge_cli_json(cli_json_path, built, image="darkui.png"):
    """Переименовать кадры Aseprite по нашему реестру и добавить nine-slice."""
    import export as E

    with open(cli_json_path, encoding="utf-8") as f:
        data = json.load(f)
    specs = built["specs"]
    frames = data.get("frames", [])
    out_frames = []
    for i, fr in enumerate(frames):
        s = specs[i] if i < len(specs) else None
        if not s:
            out_frames.append(fr)
            continue
        fr = dict(fr)
        fr["filename"] = s["name"]
        fr["name"] = s["name"]
        fr["group"] = s["group"]
        fr["nineSlice"] = dict(zip(("l", "t", "r", "b"), s["nine"])) if s["nine"] else None
        fr["desc"] = s["desc"]
        out_frames.append(fr)
    data["frames"] = out_frames
    meta = data.setdefault("meta", {})
    meta["image"] = image
    meta["components"] = {
        s["name"]: {
            "group": s["group"],
            "nine": list(s["nine"]) if s["nine"] else None,
            "tag": s["tag"],
            "desc": s["desc"],
        }
        for s in specs
    }
    meta["animations"] = {t["name"]: {"frames": t["frames"], "fps": t["fps"]} for t in E.frame_tags(specs)}
    with open(cli_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    return len(out_frames)
