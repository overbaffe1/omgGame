#!/usr/bin/env python3
"""MCP-сервер «darkui-atlas» — stdio, JSON-RPC 2.0, протокол MCP.

Даёт агенту (или человеку через `client.py`) инструменты Aseprite-пайплайна:
спланировать атлас, нарисовать компонент, упаковать, экспортировать лист PNG,
JSON-метаданные и настоящий .aseprite с тегами/слоями/9-patch-срезами.

Запуск:  python3 server.py            (ждёт JSON-RPC в stdin)
Проверка: python3 client.py           (клиентская сессия + транскрипт)
"""
import json
import os
import sys
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import aseprite_cli  # noqa: E402
import components  # noqa: E402
import export  # noqa: E402
import pngio  # noqa: E402

SERVER_NAME = "darkui-atlas"
SERVER_VERSION = "1.0.0"
PROTOCOL_VERSION = "2024-11-05"

_STATE = {"built": None, "drawn": {}, "plan": None}

TOOLS = [
    {
        "name": "atlas_plan",
        "description": "Реестр компонентов атласа: группы, размеры, 9-slice, теги анимаций. Ничего не рисует.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "group": {"type": "string", "description": "Фильтр по группе (panels, buttons, icons, fx…)"},
            },
        },
    },
    {
        "name": "draw_component",
        "description": "Нарисовать один компонент процедурно и положить в кэш. Возвращает размер и статистику пикселей.",
        "inputSchema": {
            "type": "object",
            "properties": {"name": {"type": "string", "description": "Имя компонента из atlas_plan"}},
            "required": ["name"],
        },
    },
    {
        "name": "draw_all",
        "description": "Нарисовать все (или только указанные) компоненты атласа.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "groups": {"type": "array", "items": {"type": "string"}, "description": "Рисовать только эти группы"},
            },
        },
    },
    {
        "name": "pack_atlas",
        "description": "Упаковать нарисованное skyline-алгоритмом в лист. Возвращает размер атласа, процент заполнения и раскладку.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "max_width": {"type": "integer", "default": 1024},
                "padding": {"type": "integer", "default": 2, "description": "Зазор между кадрами (shape padding)"},
                "groups": {"type": "array", "items": {"type": "string"}},
            },
        },
    },
    {
        "name": "export_sheet",
        "description": "Записать лист атласа в PNG (чистый кодек, без зависимостей).",
        "inputSchema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
    {
        "name": "export_meta",
        "description": "Записать JSON-метаданные в формате Aseprite (frames + meta.frameTags/layers/slices) плюс nine-slice.",
        "inputSchema": {
            "type": "object",
            "properties": {"path": {"type": "string"}, "image": {"type": "string", "description": "Имя PNG внутри meta.image"}},
            "required": ["path"],
        },
    },
    {
        "name": "export_aseprite",
        "description": "Собрать редактируемый .aseprite: кадр = компонент, слой = группа, теги = анимации, срезы = 9-patch.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "compress": {"type": "boolean", "default": True, "description": "Сжатые cel'ы (zlib). false — сырые, для старых версий"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "export_via_aseprite_cli",
        "description": "Если в системе есть aseprite/LibreSprite — пересобрать лист им (aseprite -b --trim --sheet --data). Иначе вернёт used_cli=false.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "doc": {"type": "string", "description": "Путь к .aseprite"},
                "png": {"type": "string"},
                "json_path": {"type": "string"},
                "binary": {"type": "string", "description": "Явный путь к aseprite (или ASEPRITE_BIN)"},
            },
            "required": ["doc", "png", "json_path"],
        },
    },
    {
        "name": "preview_frame",
        "description": "Лупа одного компонента (nearest-neighbour) — для визуальной проверки.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "path": {"type": "string"},
                "scale": {"type": "integer", "default": 6},
            },
            "required": ["name", "path"],
        },
    },
    {
        "name": "contact_sheet",
        "description": "Контактный лист группы(групп) с номерами кадров — QA-превью всего атласа.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "groups": {"type": "array", "items": {"type": "string"}},
                "scale": {"type": "integer", "default": 3},
                "columns": {"type": "integer", "default": 8},
            },
            "required": ["path"],
        },
    },
    {
        "name": "atlas_stats",
        "description": "Сводка по собранному атласу: размеры, количество кадров, групп, тегов, вес файлов.",
        "inputSchema": {"type": "object", "properties": {}},
    },
]

HANDLERS = {}


def tool(fn):
    HANDLERS[fn.__name__.replace("tool_", "")] = fn
    return fn


def _require_built():
    if _STATE["built"] is None:
        raise RuntimeError("сначала вызовите pack_atlas")
    return _STATE["built"]


@tool
def tool_atlas_plan(args):
    group = args.get("group")
    specs = components.SPECS if not group else [s for s in components.SPECS if s["group"] == group]
    groups = {}
    for s in specs:
        groups.setdefault(s["group"], []).append(
            {"name": s["name"], "tag": s["tag"], "nine": list(s["nine"]) if s["nine"] else None, "desc": s["desc"]}
        )
    tags = export.frame_tags(export.plan([s["name"] for s in specs]))
    return {
        "components": len(specs),
        "groups": groups,
        "animations": [{"name": t["name"], "frames": len(t["frames"]), "fps": t["fps"]} for t in tags],
        "nine_slice": sum(1 for s in specs if s["nine"]),
    }


@tool
def tool_draw_component(args):
    name = args["name"]
    s = components.get(name)
    if not s:
        raise KeyError("нет компонента %r; есть: %s" % (name, ", ".join(x["name"] for x in components.SPECS[:8]) + "…"))
    cv = components.paint(s)
    _STATE["drawn"][name] = cv
    st = cv.stats()
    return {"name": name, "w": cv.w, "h": cv.h, "group": s["group"], "pixels": st["pixels"], "colors": st["colors"], "nine": list(s["nine"]) if s["nine"] else None}


@tool
def tool_draw_all(args):
    groups = args.get("groups")
    out = {}
    for s in components.SPECS:
        if groups and s["group"] not in groups:
            continue
        cv = components.paint(s)
        _STATE["drawn"][s["name"]] = cv
        out[s["group"]] = out.get(s["group"], 0) + 1
    return {"drawn": sum(out.values()), "by_group": out}


@tool
def tool_pack_atlas(args):
    groups = args.get("groups")
    names = [s["name"] for s in components.SPECS if not groups or s["group"] in groups]
    built = export.build(names, max_w=int(args.get("max_width", 1024)), pad=int(args.get("padding", 2)))
    _STATE["built"] = built
    _STATE["drawn"].update(built["canvases"])
    return {
        "atlas": {"w": built["w"], "h": built["h"]},
        "frames": len(built["rects"]),
        "fill_ratio": round(built["fill"], 4),
        "padding": built["pad"],
        "largest": sorted(((v[2] * v[3], k) for k, v in built["rects"].items()), reverse=True)[:5],
    }


@tool
def tool_export_sheet(args):
    b = _require_built()
    path = args["path"]
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    n = export.write_sheet(b, path)
    return {"path": path, "bytes": n, "size": [b["w"], b["h"]]}


@tool
def tool_export_meta(args):
    b = _require_built()
    path = args["path"]
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    n = export.write_meta(b, path, args.get("image"))
    return {"path": path, "frames": n, "tags": [t["name"] for t in export.frame_tags(b["specs"])], "slices": len(b["specs"])}


@tool
def tool_export_aseprite(args):
    b = _require_built()
    path = args["path"]
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    info = export.write_aseprite(b, path, compress=bool(args.get("compress", True)))
    import ase

    info["path"] = path
    info["readback"] = ase.read_summary(path)
    return info


@tool
def tool_export_via_aseprite_cli(args):
    res = aseprite_cli.export(args["doc"], args["png"], args["json_path"], args.get("binary"))
    if res.get("used_cli"):
        b = _STATE["built"]
        if b:
            res["frames_merged"] = aseprite_cli.merge_cli_json(args["json_path"], b, os.path.basename(args["png"]))
    return res


@tool
def tool_preview_frame(args):
    b = _require_built()
    path = args["path"]
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    n = export.preview(b, args["name"], path, int(args.get("scale", 6)))
    return {"path": path, "bytes": n}


@tool
def tool_contact_sheet(args):
    b = _require_built()
    path = args["path"]
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    n = export.contact_sheet(
        b,
        path,
        groups=args.get("groups"),
        scale=int(args.get("scale", 3)),
        cols=int(args.get("columns", 8)),
    )
    return {"path": path, "bytes": n, "groups": args.get("groups") or "все"}


@tool
def tool_atlas_stats(args):
    b = _require_built()
    specs = b["specs"]
    tags = export.frame_tags(specs)
    total_px = sum(c.w * c.h for c in b["canvases"].values())
    return {
        "atlas": {"w": b["w"], "h": b["h"], "fill_ratio": round(b["fill"], 4)},
        "frames": len(specs),
        "groups": {g: sum(1 for s in specs if s["group"] == g) for g in sorted({s["group"] for s in specs})},
        "animations": {t["name"]: {"frames": len(t["frames"]), "fps": t["fps"]} for t in tags},
        "nine_slice_frames": sum(1 for s in specs if s["nine"]),
        "source_pixels": total_px,
        "atlas_pixels": b["w"] * b["h"],
    }


# ------------------------------------------------------------------ JSON-RPC
def _resp(mid, result):
    return {"jsonrpc": "2.0", "id": mid, "result": result}


def _err(mid, code, message, data=None):
    e = {"code": code, "message": message}
    if data is not None:
        e["data"] = data
    return {"jsonrpc": "2.0", "id": mid, "error": e}


def handle(msg):
    method = msg.get("method")
    mid = msg.get("id")
    params = msg.get("params") or {}

    if method == "initialize":
        return _resp(
            mid,
            {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {"listChanged": False}},
                "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION, "title": "Dark Fantasy UI Atlas"},
                "instructions": (
                    "Сервер собирает UI-атлас в стиле Diablo II: atlas_plan → draw_all → pack_atlas → "
                    "export_sheet / export_meta / export_aseprite → contact_sheet для проверки."
                ),
            },
        )
    if method in ("notifications/initialized", "notifications/cancelled"):
        return None
    if method == "ping":
        return _resp(mid, {})
    if method == "tools/list":
        return _resp(mid, {"tools": TOOLS})
    if method == "tools/call":
        name = params.get("name")
        args = params.get("arguments") or {}
        fn = HANDLERS.get(name)
        if not fn:
            return _err(mid, -32602, "неизвестный инструмент: %s" % name, sorted(HANDLERS))
        try:
            out = fn(args)
            text = json.dumps(out, ensure_ascii=False, indent=1, default=str)
            return _resp(mid, {"content": [{"type": "text", "text": text}], "isError": False, "structuredContent": out})
        except Exception:
            return _resp(
                mid,
                {"content": [{"type": "text", "text": "ОШИБКА в %s:\n%s" % (name, traceback.format_exc())}], "isError": True},
            )
    if mid is None:
        return None
    return _err(mid, -32601, "метод не найден: %s" % method)


def log(*a):
    print("[darkui-mcp]", *a, file=sys.stderr, flush=True)


def main():
    log("запуск, pid=%d, инструменты: %s" % (os.getpid(), ", ".join(sorted(HANDLERS))))
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError as e:
            sys.stdout.write(json.dumps(_err(None, -32700, "parse error: %s" % e)) + "\n")
            sys.stdout.flush()
            continue
        log("← %s" % msg.get("method"))
        resp = handle(msg)
        if resp is not None:
            sys.stdout.write(json.dumps(resp, ensure_ascii=False, default=str) + "\n")
            sys.stdout.flush()
            log("→ id=%s" % resp.get("id"))
    log("stdin закрыт, выход")


if __name__ == "__main__":
    main()
