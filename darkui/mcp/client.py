#!/usr/bin/env python3
"""MCP-клиент: поднимает `server.py` по stdio и прогоняет сессию сборки атласа.

Пишет артефакты в darkui/atlas/ и транскрипт разговора в mcp-session.jsonl —
его удобно читать, чтобы понять, какие инструменты и в каком порядке дёргались.

  python3 client.py            # полная сборка
  python3 client.py --qa       # только контактные листы для проверки
"""
import argparse
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ATLAS = os.path.abspath(os.path.join(HERE, "..", "atlas"))
QA = os.path.join(ATLAS, "qa")


class MCPClient:
    def __init__(self, cmd, transcript):
        self.p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1)
        self.next_id = 0
        self.transcript = transcript

    def _log(self, direction, obj):
        rec = {"t": round(time.time(), 3), "dir": direction, "msg": obj}
        self.transcript.append(rec)

    def send(self, obj):
        line = json.dumps(obj, ensure_ascii=False)
        self.p.stdin.write(line + "\n")
        self.p.stdin.flush()
        self._log("→", obj)

    def request(self, method, params=None):
        self.next_id += 1
        mid = self.next_id
        self.send({"jsonrpc": "2.0", "id": mid, "method": method, "params": params or {}})
        while True:
            line = self.p.stdout.readline()
            if not line:
                raise RuntimeError("сервер закрыл stdout (метод %s)" % method)
            line = line.strip()
            if not line:
                continue
            msg = json.loads(line)
            self._log("←", msg)
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError("MCP-ошибка %s: %s" % (method, msg["error"]))
                return msg.get("result")

    def notify(self, method, params=None):
        self.send({"jsonrpc": "2.0", "method": method, "params": params or {}})

    def call(self, name, args=None):
        res = self.request("tools/call", {"name": name, "arguments": args or {}})
        if res.get("isError"):
            raise RuntimeError("инструмент %s вернул ошибку:\n%s" % (name, res["content"][0]["text"]))
        text = res["content"][0]["text"]
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return text

    def close(self):
        try:
            self.p.stdin.close()
            self.p.wait(timeout=10)
        except Exception:
            self.p.kill()


def say(*a):
    print(*a, flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--qa", action="store_true", help="только контактные листы")
    ap.add_argument("--width", type=int, default=1024)
    ap.add_argument("--padding", type=int, default=2)
    ap.add_argument("--out", default=ATLAS)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    transcript = []
    t0 = time.time()
    client = MCPClient([sys.executable, os.path.join(HERE, "server.py")], transcript)

    init = client.request(
        "initialize",
        {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "darkui-build", "version": "1.0"},
        },
    )
    say("MCP: сервер %s v%s, протокол %s" % (init["serverInfo"]["name"], init["serverInfo"]["version"], init["protocolVersion"]))
    client.notify("notifications/initialized")

    tools = client.request("tools/list")["tools"]
    say("MCP: доступно инструментов — %d: %s" % (len(tools), ", ".join(t["name"] for t in tools)))

    plan = client.call("atlas_plan")
    say("План: %d компонентов, %d с 9-slice, анимации: %s"
        % (plan["components"], plan["nine_slice"], ", ".join("%s(%dк@%dfps)" % (a["name"], a["frames"], a["fps"]) for a in plan["animations"])))

    drawn = client.call("draw_all")
    say("Нарисовано: %d (%s)" % (drawn["drawn"], ", ".join("%s:%d" % kv for kv in drawn["by_group"].items())))

    packed = client.call("pack_atlas", {"max_width": args.width, "padding": args.padding})
    say("Упаковано: %d×%d, %d кадров, заполнение %.1f%%"
        % (packed["atlas"]["w"], packed["atlas"]["h"], packed["frames"], packed["fill_ratio"] * 100))

    png_path = os.path.join(args.out, "darkui.png")
    json_path = os.path.join(args.out, "darkui.json")
    ase_path = os.path.join(args.out, "darkui.aseprite")

    sheet = client.call("export_sheet", {"path": png_path})
    say("Лист: %s (%d КБ)" % (sheet["path"], sheet["bytes"] // 1024))

    meta = client.call("export_meta", {"path": json_path, "image": "darkui.png"})
    say("Метаданные: %s (%d кадров, теги: %s)" % (meta["path"], meta["frames"], ", ".join(meta["tags"])))

    ase = client.call("export_aseprite", {"path": ase_path})
    say("Aseprite-документ: %s (%d КБ, %d кадров, %d слоёв, %d тегов, %d срезов)"
        % (ase["path"], ase["bytes"] // 1024, ase["frames"], len(ase["layers"]), len(ase["tags"]), ase["slices"]))
    rb = ase["readback"]
    say("  self-check: magic ok, размер %d=%d, чанки %s" % (rb["file_size"], rb["declared_size"], rb["chunks"]))

    cli = client.call(
        "export_via_aseprite_cli",
        {"doc": ase_path, "png": os.path.join(args.out, "darkui-cli.png"), "json_path": os.path.join(args.out, "darkui-cli.json")},
    )
    if cli.get("used_cli"):
        say("Экспорт через настоящий Aseprite: %s (%s), кадров слито: %s" % (cli["binary"], cli.get("version"), cli.get("frames_merged")))
    else:
        say("Настоящий aseprite не найден (%s) — лист собран встроенным кодеком, формат тот же" % cli.get("reason"))

    stats = client.call("atlas_stats")
    say("Статистика: %s" % json.dumps(stats["groups"], ensure_ascii=False))

    groups = sorted(stats["groups"])
    for g in groups:
        p = os.path.join(QA, "qa-%s.png" % g)
        client.call("contact_sheet", {"path": p, "groups": [g], "scale": 3, "columns": 8})
    say("QA-листы: %s" % QA)
    p = os.path.join(QA, "qa-all.png")
    client.call("contact_sheet", {"path": p, "scale": 2, "columns": 10})

    client.close()

    tr_path = os.path.join(args.out, "mcp-session.jsonl")
    with open(tr_path, "w", encoding="utf-8") as f:
        for rec in transcript:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    say("Транскрипт: %s (%d сообщений, %.1f с)" % (tr_path, len(transcript), time.time() - t0))


if __name__ == "__main__":
    main()
