"""QA-превью сцены лабы без браузера.

Зеркалит раскладку `lab.js` (стенд 640×480) на питоне: те же nine-slice,
тайлы, глобусы, полосы — чтобы компоновку можно было посмотреть глазами
и поймать перекрытия до запуска в браузере. Текст рисуется габаритными
плашками (ширина = 6px на символ, как в лабе).

  python3 darkui/mcp/scene_preview.py [out.png] [scale]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pngio  # noqa: E402
from canvas import Canvas, C  # noqa: E402

ATLAS = os.path.join(HERE, "..", "atlas")
meta = json.load(open(os.path.join(ATLAS, "darkui.json"), encoding="utf-8"))
W0, H0 = meta["meta"]["size"]["w"], meta["meta"]["size"]["h"]
AW, AH, APX = pngio.read_png(os.path.join(ATLAS, "darkui.png"))
FR = {f["name"]: f for f in meta["frames"]}

SCALE = int(sys.argv[2]) if len(sys.argv) > 2 else 2
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ATLAS, "qa", "scene-preview.png")

cv = Canvas(640, 480)


def blit_src(sx, sy, sw, sh, dx, dy, dw, dh):
    for j in range(dh):
        syj = sy + (j * sh // dh if dh else 0)
        for i in range(dw):
            sxi = sx + (i * sw // dw if dw else 0)
            c = APX[(syj * AW + sxi) * 4 : (syj * AW + sxi) * 4 + 4]
            if c[3]:
                cv.set(dx + i, dy + j, tuple(c))


def spr(name, x, y, w=None, h=None):
    f = FR[name]["frame"]
    blit_src(f["x"], f["y"], f["w"], f["h"], x, y, w or f["w"], h or f["h"])


def nine(name, x, y, w, h):
    f = FR[name]
    s, n = f["frame"], f["nineSlice"]
    if not n:
        blit_src(s["x"], s["y"], s["w"], s["h"], x, y, w, h)
        return
    l, t, r, b = n["l"], n["t"], n["r"], n["b"]
    sw, sh = s["w"] - l - r, s["h"] - t - b
    dw, dh = max(1, w - l - r), max(1, h - t - b)
    P = [
        (0, 0, l, t, 0, 0, l, t), (l, 0, sw, t, l, 0, dw, t), (s["w"] - r, 0, r, t, w - r, 0, r, t),
        (0, t, l, sh, 0, t, l, dh), (l, t, sw, sh, l, t, dw, dh), (s["w"] - r, t, r, sh, w - r, t, r, dh),
        (0, s["h"] - b, l, b, 0, h - b, l, b), (l, s["h"] - b, sw, b, l, h - b, dw, b),
        (s["w"] - r, s["h"] - b, r, b, w - r, h - b, r, b),
    ]
    for q in P:
        if q[2] > 0 and q[3] > 0 and q[6] > 0 and q[7] > 0:
            blit_src(s["x"] + q[0], s["y"] + q[1], q[2], q[3], x + q[4], y + q[5], q[6], q[7])


def tile(name, x, y, w, h):
    f = FR[name]["frame"]
    for j in range(0, h, f["h"]):
        for i in range(0, w, f["w"]):
            cw, ch = min(f["w"], w - i), min(f["h"], h - j)
            blit_src(f["x"], f["y"], cw, ch, x + i, y + j, cw, ch)


def text(s, x, y, color="#e0cfa3", center=False, right=False):
    w = len(s) * 6 + 2
    if center:
        x -= w // 2
    if right:
        x -= w
    cv.rect(x + 1, y + 1, w, 11, (0, 0, 0, 200))
    col = C(color)
    for i, ch in enumerate(s):
        if ch == " ":
            continue
        cx = x + 1 + i * 6
        cv.rect(cx, y + 3, 4, 6, (col[0], col[1], col[2], 190))
        cv.rect(cx, y + 2, 4, 1, (col[0], col[1], col[2], 120))


def bar(x, y, w, kind, frac, label=None):
    if label:
        text(label, x, y - 12, "#a08a5a")
    nine("bar_frame", x, y, w, 16)
    iw = max(0, int((w - 12) * frac))
    if iw > 2:
        tile("bar_fill_" + kind, x + 5, y + 4, iw, 8)


# ---------------- фон
tile("fill_dark", 0, 0, 640, 480)
tile("fill_stone", 0, 336, 640, 144)
cv.rect(0, 336, 640, 3, (0, 0, 0, 140))
for j in range(480):  # виньетка
    for i in range(0, 640, 2):
        d = (((i - 320) / 420.0) ** 2 + ((j - 240) / 420.0) ** 2) ** 0.5
        if d > 0.45:
            a = int(min(180, (d - 0.45) * 260))
            cv.set(i, j, (0, 0, 0, a))
            cv.set(i + 1, j, (0, 0, 0, a))

# факелы
for tx in (0, 616):
    spr("torch", tx, 120)
    spr("fx_flame_3", tx + 12 - 15, 120 + 12 - 38, 30, 38)
    spr("glow_red", tx + 12 - 28, 110, 56, 56)

# заголовок
nine("banner_title", 170, 8, 300, 40)
text("СКЛЕП ЗАБВЕНИЯ", 320, 21, "#fbe89c", center=True)
spr("skull_ornament", 122, 10)
spr("skull_ornament", 470, 10)

# левое окно
nine("panel_frame_heavy", 24, 64, 300, 268)
tile("fill_stone", 48, 88, 252, 220)
for i, (name, act) in enumerate([("ИНВЕНТАРЬ", True), ("ГЕРОЙ", False)]):
    x = 40 + i * 100
    nine("tab_active" if act else "tab_normal", x, 42, 96, 28)
    text(name, x + 48, 50, "#fbe89c" if act else "#8d7859", center=True)
for i in range(20):
    cx, cy = 46 + (i % 5) * 48, 96 + (i // 5) * 48
    spr("slot_hover" if i == 0 else "slot_empty", cx, cy)
    if i in (0, 2, 4, 5, 7, 9, 10, 12, 15):
        icon = ["icon_sword", None, "icon_shield", None, "icon_rune", "icon_gem", None, "icon_helm", None,
                "icon_book", "icon_amulet", None, "icon_bow", None, None, "icon_coin"][i]
        rar = ["unique", None, "magic", None, "rare", "normal", None, "set", None,
               "unique", "rare", None, "magic", None, None, "normal"][i]
        nine("rarity_" + rar, cx, cy, 44, 44)
        spr(icon, cx + 6, cy + 6, 32, 32)
nine("divider_ornate", 60, 288, 220, 12)
text("ЗОЛОТО: 1248", 170, 296, "#e8c45f", center=True)

# правое окно
nine("panel_frame_ornate", 340, 64, 276, 268)
tile("fill_dark", 364, 88, 228, 220)
text("СОСТОЯНИЕ ГЕРОЯ", 478, 90, "#e8c45f", center=True)
nine("divider_simple", 372, 104, 212, 4)
bar(372, 118, 212, "blood", 0.74, "ЗДОРОВЬЕ 74")
bar(372, 150, 212, "mana", 0.58, "МАНА 58")
bar(372, 182, 212, "stamina", 0.88, "ВЫНОСЛИВОСТЬ 88")
nine("btn_blood_normal", 372, 206, 104, 28)
text("АТАКА", 424, 214, "#f4e9cd", center=True)
nine("btn_iron_hover", 484, 206, 104, 28)
text("ОБОРОНА", 536, 214, "#f4e9cd", center=True)
spr("checkbox_on", 372, 240)
text("АВТОПОДБОР ЗОЛОТА", 394, 242, "#e0cfa3")
for i in range(4):
    text("> СТРОКА ЖУРНАЛА %d" % (i + 1), 374, 258 + 44 - 11 * (i + 1), "#e0cfa3" if i == 0 else "#7d6741")
nine("scroll_track", 572, 258, 16, 44)
spr("scroll_arrow_up", 572, 258, 16, 16)
nine("scroll_thumb_normal", 572, 278, 16, 12)
spr("scroll_arrow_down", 572, 286, 16, 16)

# низ
for gx, kind, lvl, num, col in ((24, "blood", 0.74, "74", "#f7a48c"), (540, "mana", 0.58, "58", "#7cc6f5")):
    spr("globe_base", gx, 368)
    top = 368 + 38 + 28 - int(lvl * 56)
    for j in range(top, 444):
        for i in range(gx, gx + 76):
            d = ((i + 0.5 - gx - 38) / 28.0) ** 2 + ((j + 0.5 - 406) / 28.0) ** 2
            if d <= 1:
                f = FR["globe_liquid_%s_2" % kind]["frame"]
                sj = min(29, j - top)
                c = APX[((f["y"] + sj) * AW + f["x"] + (i - gx)) * 4 : ((f["y"] + sj) * AW + f["x"] + (i - gx)) * 4 + 4]
                if c[3]:
                    cv.put(i, j, tuple(c))
                elif j > top + 30:
                    cv.put(i, j, (94, 16, 16, 255) if kind == "blood" else (16, 58, 110, 255))
    spr("globe_glass", gx, 368)
    spr("globe_frame", gx, 368)
    text(num, gx + 38, 400, col, center=True)
bar(120, 440, 400, "xp", 0.37, "ОПЫТ ДО СЛЕДУЮЩЕГО УРОВНЯ")
for i in range(6):
    x = 180 + i * 47
    spr("slot_empty", x, 368)
    if i in (0, 1, 2):
        icon = ["icon_potion_health", "icon_potion_mana", "icon_scroll"][i]
        nine("rarity_normal", x, 368, 44, 44)
        spr(icon, x + 6, 374, 32, 32)
text("1", 202, 414, "#7d6741", center=True)
text("6", 437, 414, "#7d6741", center=True)

# курсор
spr("cursor_hand", 200, 150)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
big = Canvas(640 * SCALE, 480 * SCALE)
for j in range(big.h):
    for i in range(big.w):
        big.put(i, j, cv.get(i // SCALE, j // SCALE))
pngio.write_png(OUT, big.w, big.h, big.px)
print("превью сцены:", OUT, big.w, "x", big.h)
