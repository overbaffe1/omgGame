"""Реестр компонентов атласа: панели, кнопки, слоты, глобусы, полосы, скроллбары.

Каждый компонент — функция без аргументов, возвращающая Canvas. Метаданные
(nine-slice, группа, тег анимации) живут рядом, чтобы экспортироваться и в JSON,
и в .aseprite (срезы/теги).
"""
import math

from canvas import Canvas, C, mix, shade, darken, lighten, ramp
import palette as P
from brushes import (
    stone_texture,
    parch_texture,
    raised,
    sunken,
    frame_by_distance,
    stud,
    gold_line,
    flourish,
    spike,
    skull,
    gem,
    flask,
    blade,
    vnoise,
)

SPECS = []
_BY_NAME = {}


def spec(name, group, fn, nine=None, tag=None, desc="", fps=12):
    s = {
        "name": name,
        "group": group,
        "fn": fn,
        "nine": tuple(nine) if nine else None,
        "tag": tag,
        "desc": desc,
        "fps": fps,
    }
    SPECS.append(s)
    _BY_NAME[name] = s
    return s


def get(name):
    return _BY_NAME[name]


def groups():
    out = {}
    for s in SPECS:
        out.setdefault(s["group"], []).append(s["name"])
    return out


def paint(spec_or_name):
    s = spec_or_name if isinstance(spec_or_name, dict) else _BY_NAME[spec_or_name]
    return s["fn"]()


# ============================================================ каменные конструкции
def _gothic_frame(cv, b, stone=None, gold=True, light=0.08, dark=0.26, seed=11):
    """Рамка окна: камень + латунная внутренняя кромка. Цвет зависит только от
    расстояния до края — поэтому 9-slice тянется без швов. Середина прозрачна."""
    stone = stone or P.STONE
    stone_texture(cv, 0, 0, cv.w, cv.h, stone[1:6], seed=seed, cell=8)
    k = len(stone)
    order = []
    # d=0 контур, d=1..b-3 камень, d=b-2..b-1 золото
    gb = b - 2 if gold else b
    for d in range(gb):
        if d == 0:
            order.append(P.INK)
        elif d == 1:
            order.append(stone[1])
        else:
            t = (d - 1) / float(max(1, gb - 2))
            idx = int(1 + t * (min(5, k - 1) - 1))
            order.append(stone[min(k - 1, idx)])
    if gold:
        order += [P.GOLD[1], P.GOLD[4]]
    frame_by_distance(cv, b, order, light=light, dark=dark)
    # середина прозрачна: внутрь ляжет тайл-заливка
    w, h = cv.w, cv.h
    for j in range(h):
        for i in range(w):
            if min(i, j, w - 1 - i, h - 1 - j) >= b:
                cv.put(i, j, (0, 0, 0, 0))
    # фактура только на самой раме: зерно + трещины
    import random as _rnd
    rnd = _rnd.Random(seed * 991)
    for j in range(h):
        for i in range(w):
            d = min(i, j, w - 1 - i, h - 1 - j)
            if 2 <= d < b - 2:
                cv.grain(i, j, 1, 1, 0.16, seed + i * 7 + j)
    for _ in range(max(6, (w + h) // 8)):
        horiz = rnd.random() < 0.5
        if horiz:
            j = rnd.choice([rnd.randrange(2, b - 2), h - 1 - rnd.randrange(2, b - 2)])
            i0 = rnd.randrange(b, w - b)
            ln = rnd.randrange(3, 9)
            for i in range(i0, min(w - 2, i0 + ln)):
                jj = j + (1 if rnd.random() < 0.3 else 0)
                cv.set(i, jj, (10, 8, 6, 110))
        else:
            i = rnd.choice([rnd.randrange(2, b - 2), w - 1 - rnd.randrange(2, b - 2)])
            j0 = rnd.randrange(b, h - b)
            ln = rnd.randrange(3, 9)
            for j in range(j0, min(h - 2, j0 + ln)):
                ii = i + (1 if rnd.random() < 0.3 else 0)
                cv.set(ii, j, (10, 8, 6, 110))


def panel_ornate_frame(S=96, b=16):
    def paint():
        cv = Canvas(S, S)
        _gothic_frame(cv, b, seed=11)
        # золотой уголок в каждой corner-зоне + заклёпка
        for (cx, cy, fx, fy) in [
            (0, 0, False, False),
            (S, 0, True, False),
            (0, S, False, True),
            (S, S, True, True),
        ]:
            c = Canvas(b, b)
            for k in range(3):
                c.line(1 + k, b - 2 - k, b - 2 - k, 1 + k, P.GOLD[2 + k * 2])
            c.line(1, b - 4, b - 4, 1, P.GOLD[1])
            c.line(4, b - 1, b - 1, 4, P.GOLD[6])
            stud(c, b // 2, b // 2, 2.6, P.GOLD[2:7])
            c.set(2, 2, P.GOLD[7])
            c.set(3, 2, P.GOLD[5])
            c.set(2, 3, P.GOLD[5])
            if fx:
                c = c.mirror_x(c)
            if fy:
                c = c.mirror_y(c)
            cv.blit(c, cx - b if fx else cx, cy - b if fy else cy)
        return cv

    return paint


def panel_heavy_frame(S=112, b=22):
    """Тяжёлая рама для главного окна: шипы по углам, двойное золото."""

    def paint():
        cv = Canvas(S, S)
        _gothic_frame(cv, b, stone=P.STONE, seed=23, light=0.18, dark=0.28)
        # вторая золотая нить ближе к внешнему краю
        for j in range(S):
            for i in range(S):
                d = min(i, j, S - 1 - i, S - 1 - j)
                if d == 3:
                    cv.put(i, j, P.GOLD[2])
                elif d == 4:
                    cv.put(i, j, P.GOLD[0])
        for (cx, cy, fx, fy) in [
            (0, 0, False, False),
            (S, 0, True, False),
            (0, S, False, True),
            (S, S, True, True),
        ]:
            c = Canvas(b + 6, b + 6)
            nb = b + 6
            c.line(2, nb - 3, nb - 3, 2, P.GOLD[2])
            c.line(3, nb - 3, nb - 3, 3, P.GOLD[5])
            c.line(4, nb - 4, nb - 4, 4, P.GOLD[1])
            c.line(6, nb - 6, nb - 6, 6, P.GOLD[3])
            stud(c, nb // 2, nb // 2, 3.2, P.GOLD[2:7])
            flourish(c, 3, 3, color=P.GOLD)
            if fx:
                c = c.mirror_x(c)
            if fy:
                c = c.mirror_y(c)
            cv.blit(c, cx - nb if fx else cx - 3, cy - nb if fy else cy - 3)
        return cv

    return paint


def _tile(fn, S=32):
    def paint():
        cv = Canvas(S, S)
        fn(cv)
        return cv

    return paint


def _fill_stone(cv):
    stone_texture(cv, 0, 0, 32, 32, P.STONE[0:5], seed=7, cell=8, wrap=True)
    cv.grain(0, 0, 32, 32, 0.06, 99)


def _fill_parchment(cv):
    parch_texture(cv, 0, 0, 32, 32, P.PARCH[1:6], seed=13, cell=8, wrap=True)


def _fill_dark(cv):
    stone_texture(cv, 0, 0, 32, 32, ["#0a0908", "#100e0c", "#15120f", "#0d0b09"], seed=17, cell=8, wrap=True)
    cv.noise(0, 0, 32, 32, [C("#1d1815") + (90,)], 0.06, seed=19, alpha=60)


def _fill_wood(cv):
    for x in range(32):
        band = 0 if x < 16 else 1
        for y in range(32):
            t = (y % 16) / 16.0
            idx = int(1 + t * 4)
            cv.put(x, y, P.WOOD[min(len(P.WOOD) - 1, idx + band)])
    n = vnoise(32, 32, 6, 29, 2, True)
    for y in range(32):
        for x in range(32):
            if n[y * 32 + x] > 0.62:
                cv.put(x, y, darken(cv.get(x, y), 0.25))
    cv.vline(0, 0, 32, P.WOOD[0])
    cv.vline(15, 0, 32, P.WOOD[1])
    cv.vline(16, 0, 32, P.WOOD[5])
    cv.grain(0, 0, 32, 32, 0.07, 31)


def _fill_bloodstone(cv):
    stone_texture(cv, 0, 0, 32, 32, P.STONE[1:6], seed=37, cell=8, wrap=True)
    n = vnoise(32, 32, 5, 41, 2, True)
    for y in range(32):
        for x in range(32):
            if n[y * 32 + x] > 0.66:
                cv.put(x, y, mix(P.BLOOD[1], cv.get(x, y), 0.45))


# ========================================================================= кнопки
BTN_W, BTN_H, BTN_NINE = 96, 28, (16, 9, 16, 9)


def button(style="stone", state="normal", w=BTN_W, h=BTN_H):
    styles = {
        "stone": dict(ramp=P.STONE, trim=P.GOLD, body=[1, 5]),
        "gold": dict(ramp=P.GOLD, trim=P.GOLD, body=[2, 6]),
        "blood": dict(ramp=P.BLOOD, trim=P.GOLD, body=[1, 5]),
        "iron": dict(ramp=P.IRON, trim=P.IRON, body=[2, 6]),
    }
    st = styles[style]

    def paint():
        cv = Canvas(w, h)
        base = st["ramp"]
        if state == "disabled":
            rampc = [mix(base[1], "#4a4640", 0.7), mix(base[2], "#575249", 0.7), mix(base[3], "#5f594f", 0.7)]
            trim = mix(P.GOLD[2], "#6b655c", 0.6)
            trim_hi = mix(P.GOLD[4], "#837c70", 0.6)
        elif state == "pressed":
            rampc = [base[1], base[2], base[3]]
            trim, trim_hi = st["trim"][1], st["trim"][3]
        elif state == "hover":
            k = 1.28 if style != "gold" else 1.14
            rampc = [shade(base[2], k), shade(base[3], k), shade(base[4], k), shade(base[5], k)]
            trim, trim_hi = st["trim"][5], st["trim"][7]
        else:
            rampc = [base[1], base[2], base[3], base[4]]
            trim, trim_hi = st["trim"][3], st["trim"][5]

        body = rampc if state != "pressed" else list(reversed(rampc))
        cv.gradient(0, 0, w, h, [C(c) for c in body], "v", True)
        cv.grain(0, 0, w, h, 0.05, 5)
        # контур
        cv.frame(0, 0, w, h, P.INK)
        # верхний блик / нижняя тень
        if state == "pressed":
            cv.hline(1, 1, w - 2, (0, 0, 0, 150))
            cv.hline(1, 2, w - 2, (0, 0, 0, 90))
            cv.hline(1, h - 2, w - 2, trim)
        else:
            cv.hline(1, 1, w - 2, mix(body[-1], "#f4d9a0", 0.45))
            cv.hline(1, 2, w - 2, (244, 217, 160, 40) if state == "hover" else (244, 217, 160, 18))
            cv.hline(1, h - 2, w - 2, darken(body[0], 0.5))
        # золотая нить у внутреннего края
        cv.hline(2, h - 3, w - 4, trim)
        cv.hline(2, h - 4, w - 4, (C(trim_hi)[0], C(trim_hi)[1], C(trim_hi)[2], 120))
        # торцевые крышки (не тянутся в 9-slice)
        cap = BTN_NINE[0]
        for cx in (cap, w - cap - 1):
            cv.vline(cx, 2, h - 4, P.INK)
            cv.vline(cx + 1 if cx < w // 2 else cx - 1, 2, h - 4, (C(trim)[0], C(trim)[1], C(trim)[2], 160))
        for sx in (cap // 2, w - cap // 2):
            stud(cv, sx, h // 2, 2.6, [trim, P.GOLD[3], P.GOLD[4], trim_hi, P.GOLD[7]] if style == "stone" else st["trim"][2:7])
        if state == "hover":
            cv.frame(1, 1, w - 2, h - 2, (C(P.GOLD[6])[0], C(P.GOLD[6])[1], C(P.GOLD[6])[2], 90))
        return cv

    return paint


def round_button(state="normal", S=40):
    def paint():
        cv = Canvas(S, S)
        cx = cy = S / 2.0
        r = S / 2.0 - 1
        if state == "pressed":
            body = [P.STONE[1], P.STONE[2], P.STONE[3]]
        elif state == "hover":
            body = [P.STONE[3], P.STONE[4], P.STONE[5], P.STONE[6]]
        elif state == "disabled":
            body = ["#2a2724", "#35312c", "#3d3833"]
        else:
            body = [P.STONE[2], P.STONE[3], P.STONE[4], P.STONE[5]]
        for j in range(S):
            for i in range(S):
                d = math.hypot(i + 0.5 - cx, j + 0.5 - cy)
                if d > r + 0.5:
                    continue
                if d > r - 1.2:
                    cv.put(i, j, P.INK)
                    continue
                t = (d - 1.2) / (r - 1.2)
                # свет сверху-слева
                ang = math.atan2(j + 0.5 - cy, i + 0.5 - cx)
                li = 0.5 - 0.5 * math.cos(ang - math.radians(-135))
                f = max(0.0, min(1.0, t * 0.75 + (1 - li) * 0.45))
                idx = int((1 - f) * (len(body) - 1))
                idx = max(0, min(len(body) - 1, idx))
                cv.put(i, j, body[idx])
        # латунное кольцо
        rr = r - 3.2
        for a in range(0, 360, 2):
            ang = math.radians(a)
            x = int(round(cx + math.cos(ang) * rr))
            y = int(round(cy + math.sin(ang) * rr))
            k = 3 if 90 <= a <= 270 else 5
            cv.set(x, y, P.GOLD[k])
            cv.set(int(round(cx + math.cos(ang) * (rr - 1))), int(round(cy + math.sin(ang) * (rr - 1))), P.GOLD[max(1, k - 2)])
        for a in (45, 135, 225, 315):
            ang = math.radians(a)
            stud(cv, int(cx + math.cos(ang) * (rr - 4.6)), int(cy + math.sin(ang) * (rr - 4.6)), 2.2, P.GOLD[2:7])
        if state == "pressed":
            cv.ellipse(cx, cy, rr - 3, rr - 3, (0, 0, 0, 70), True, None)
        if state == "hover":
            cv.ellipse(cx, cy, r - 0.5, r - 0.5, (C(P.GOLD[6])[0], C(P.GOLD[6])[1], C(P.GOLD[6])[2], 80), False, None)
        for j in range(S):
            for i in range(S):
                d = math.hypot(i + 0.5 - cx, j + 0.5 - cy)
                if rr - 4 < d < rr - 1.2:
                    cv.set(i, j, (0, 0, 0, int(70 * (d - (rr - 4)) / 2.8)))
        cv.ellipse(cx - r * 0.32, cy - r * 0.36, r * 0.24, r * 0.14, (255, 244, 214, 20), True, None)
        return cv

    return paint


def tab(state="normal", w=72, h=30):
    def paint():
        cv = Canvas(w, h)
        if state == "active":
            raised(cv, 0, 0, w, h - 2, [P.STONE[2], P.STONE[3], P.STONE[4], P.STONE[5]], outline=P.INK)
            cv.frame(1, 1, w - 2, h - 3, (C(P.GOLD[4])[0], C(P.GOLD[4])[1], C(P.GOLD[4])[2], 200))
            cv.hline(2, 2, w - 4, P.GOLD[6])
            cv.clear(0, h - 2, w, 2)  # срастается с панелью
            stud(cv, 6, h // 2 - 1, 2.0, P.GOLD[2:7])
            stud(cv, w - 7, h // 2 - 1, 2.0, P.GOLD[2:7])
        else:
            sunken(cv, 0, 2, w, h - 2, [P.STONE[0], P.STONE[1], P.STONE[2]], outline=P.INK, depth=1)
            cv.hline(1, 2, w - 2, (255, 255, 255, 16))
            cv.frame(2, 4, w - 4, h - 6, (0, 0, 0, 60))
        return cv

    return paint


def checkbox(state="off", S=16):
    def paint():
        cv = Canvas(S, S)
        sunken(cv, 0, 0, S, S, ["#100e0c", "#1a1714", "#241f1a"], outline=P.INK, depth=2)
        cv.frame(1, 1, S - 2, S - 2, (C(P.GOLD[2])[0], C(P.GOLD[2])[1], C(P.GOLD[2])[2], 160))
        if state == "hover":
            cv.frame(2, 2, S - 4, S - 4, (C(P.GOLD[5])[0], C(P.GOLD[5])[1], C(P.GOLD[5])[2], 110))
        if state == "on":
            cv.line(3, S - 5, S // 2, S - 3, P.BLOOD[5])
            cv.line(S // 2, S - 3, S - 3, 3, P.BLOOD[5])
            cv.line(3, S - 6, S // 2, S - 4, P.BLOOD[6])
            cv.line(S // 2, S - 4, S - 3, 2, P.BLOOD[6])
            cv.line(4, S - 5, S // 2, S - 2, P.BLOOD[3])
        return cv

    return paint


# ====================================================================== слоты
def slot(state="empty", S=44):
    def paint():
        cv = Canvas(S, S)
        sunken(cv, 0, 0, S, S, ["#0b0a09", "#15120f", "#1e1a16"], outline=P.INK, depth=3)
        cv.noise(2, 2, S - 4, S - 4, [C("#2a241e")], 0.05, seed=7, alpha=70)
        cv.hline(1, S - 2, S - 2, (255, 255, 255, 22))
        if state == "hover":
            cv.frame(1, 1, S - 2, S - 2, (C(P.GOLD[5])[0], C(P.GOLD[5])[1], C(P.GOLD[5])[2], 170))
            cv.frame(2, 2, S - 4, S - 4, (C(P.GOLD[3])[0], C(P.GOLD[3])[1], C(P.GOLD[3])[2], 90))
        elif state == "selected":
            cv.frame(0, 0, S, S, P.GOLD[6])
            cv.frame(1, 1, S - 2, S - 2, P.GOLD[3])
            for (cx, cy) in [(0, 0), (S - 1, 0), (0, S - 1), (S - 1, S - 1)]:
                cv.rect(cx - 1, cy - 1, 3, 3, P.GOLD[7])
        elif state == "drop":
            cv.frame(1, 1, S - 2, S - 2, (C(P.POISON[4])[0], C(P.POISON[4])[1], C(P.POISON[4])[2], 200))
        return cv

    return paint


def socket(kind="empty", S=24):
    gems = {
        "ruby": P.BLOOD,
        "sapphire": P.MANA,
        "emerald": P.POISON,
        "topaz": ["#2b1c04", "#5c3d08", "#8f6410", "#c99a1e", "#eec93c", "#ffe883", "#fff6cf", "#ffffff"],
        "amethyst": ["#1a0a2b", "#33125c", "#521f8f", "#7a35c2", "#a862e8", "#cd9bf5", "#ecd6ff", "#ffffff"],
        "diamond": ["#1b2226", "#33404a", "#556a78", "#82a0b0", "#b6d4e2", "#dff0f8", "#ffffff", "#ffffff"],
    }

    def paint():
        cv = Canvas(S, S)
        cx = cy = S / 2.0
        r = S / 2.0 - 1.5
        for j in range(S):
            for i in range(S):
                dx, dy = i + 0.5 - cx, j + 0.5 - cy
                d = math.hypot(dx, dy)
                if d > r + 1.6:
                    continue
                if d > r - 0.2:
                    ang = math.atan2(dy, dx)
                    li = 0.5 - 0.5 * math.cos(ang - math.radians(-130))
                    cv.put(i, j, P.GOLD[max(1, min(6, int(1 + li * 5)))])
                else:
                    t = d / r
                    cv.put(i, j, ["#070605", "#100d0b", "#191512", "#221c17"][min(3, int(t * 4))])
        for a in (45, 135, 225, 315):
            ang = math.radians(a)
            stud(cv, int(cx + math.cos(ang) * (r + 0.6)), int(cy + math.sin(ang) * (r + 0.6)), 1.6, P.GOLD[2:6])
        if kind != "empty":
            g = gems[kind]
            gem(cv, int(cx), int(cy), S - 10, S - 10, g)
        return cv

    return paint


# ===================================================================== полоски
def bar_frame(w=96, h=16):
    def paint():
        cv = Canvas(w, h)
        raised(cv, 0, 0, w, h, [P.STONE[1], P.STONE[2], P.STONE[3]], outline=P.INK)
        sunken(cv, 3, 3, w - 6, h - 6, ["#070605", "#100e0c", "#191512"], outline=None, depth=1)
        cv.hline(3, 3, w - 6, (0, 0, 0, 200))
        cv.hline(1, 1, w - 2, P.GOLD[2])
        cv.hline(1, h - 2, w - 2, P.GOLD[1])
        stud(cv, 3, h // 2, 1.8, P.GOLD[2:6])
        stud(cv, w - 4, h // 2, 1.8, P.GOLD[2:6])
        return cv

    return paint


def bar_fill(kind="blood", w=32, h=10):
    ramps = {"blood": P.BLOOD[1:7], "mana": P.MANA[1:7], "xp": P.GOLD[1:7], "poison": P.POISON[1:6], "stamina": ["#3a2a10", "#6b4d18", "#a37a22", "#d8ab3c"]}

    def paint():
        cv = Canvas(w, h)
        r = list(reversed(ramps[kind]))
        cv.gradient(0, 0, w, h, [C(c) for c in r], "v", True)
        cv.hline(0, 0, w, lighten(r[0], 0.35))
        cv.hline(0, 1, w, (255, 255, 255, 60))
        cv.hline(0, h - 1, w, darken(r[0], 0.5))
        # диагональные штрихи (период 8 — тайлится)
        for x in range(w):
            for y in range(h):
                if (x + y) % 8 == 0:
                    cv.set(x, y, (255, 255, 255, 18))
                elif (x + y) % 8 == 4:
                    cv.set(x, y, (0, 0, 0, 22))
        return cv

    return paint


# ======================================================================= глобус
GLOBE = 76


def globe_frame():
    """Латунный обод + стекло. Центр прозрачный — под него кладём жидкость."""

    def paint():
        cv = Canvas(GLOBE, GLOBE)
        cx = cy = GLOBE / 2.0
        R = GLOBE / 2.0 - 1
        ring_out, ring_in = R, R - 9
        for j in range(GLOBE):
            for i in range(GLOBE):
                dx, dy = i + 0.5 - cx, j + 0.5 - cy
                d = math.hypot(dx, dy)
                if d > ring_out:
                    continue
                if d < ring_in:
                    continue
                ang = math.atan2(dy, dx)
                li = 0.5 - 0.5 * math.cos(ang - math.radians(-130))
                t = (d - ring_in) / (ring_out - ring_in)
                edge = min(1.0, abs(t - 0.45) * 2.6)
                f = max(0.0, min(1.0, li * 0.75 + (1 - edge) * 0.35))
                idx = int(f * (len(P.GOLD) - 1))
                if d > ring_out - 1.1 or d < ring_in + 0.7:
                    cv.put(i, j, P.INK)
                else:
                    cv.put(i, j, P.GOLD[max(1, min(len(P.GOLD) - 1, idx))])
        # внутренняя тень под ободом
        for j in range(GLOBE):
            for i in range(GLOBE):
                d = math.hypot(i + 0.5 - cx, j + 0.5 - cy)
                if ring_in - 4 < d < ring_in:
                    a = int(150 * (1 - (ring_in - d) / 4.0))
                    cv.set(i, j, (0, 0, 0, a))
        for a in range(0, 360, 45):
            ang = math.radians(a + 22)
            stud(cv, int(cx + math.cos(ang) * (R - 4.5)), int(cy + math.sin(ang) * (R - 4.5)), 2.6, P.GOLD[1:7])
        # «лапы», держащие сферу
        for a in (0, 180):
            ang = math.radians(a)
            bx, by = int(cx + math.cos(ang) * (R - 1)), int(cy + math.sin(ang) * (R - 1))
            cv.poly([(bx - 3, by - 5), (bx + 3, by - 5), (bx + 2, by + 5), (bx - 2, by + 5)], P.GOLD[3], P.INK)
        return cv

    return paint


def globe_base():
    """Пустая сфера: тёмное стекло с внутренней тенью."""

    def paint():
        cv = Canvas(GLOBE, GLOBE)
        cx = cy = GLOBE / 2.0
        r = GLOBE / 2.0 - 10
        rampc = ["#050404", "#0c0a09", "#151110", "#1e1917", "#2a2320"]
        for j in range(GLOBE):
            for i in range(GLOBE):
                d = math.hypot(i + 0.5 - cx, j + 0.5 - cy)
                if d > r:
                    continue
                ang = math.atan2(j + 0.5 - cy, i + 0.5 - cx)
                li = 0.5 + 0.5 * math.cos(ang - math.radians(50))
                idx = int(min(len(rampc) - 1, (d / r * 0.75 + li * 0.25) * len(rampc)))
                cv.put(i, j, rampc[idx])
        return cv

    return paint


def globe_liquid(kind="blood", phase=0, frames=6, w=GLOBE, h=30):
    """Гребень волны: кадр анимации. Лаба кладёт его поверх сферы по уровню."""
    ramps = {"blood": P.BLOOD, "mana": P.MANA}

    def paint():
        cv = Canvas(w, h)
        r = ramps[kind]
        for x in range(w):
            top = int(
                6
                + 3.0 * math.sin((x / float(w)) * 2 * math.pi + phase * 2 * math.pi / frames)
                + 1.4 * math.sin((x / float(w)) * 4 * math.pi - phase * 2 * math.pi / frames)
            )
            for y in range(top, h):
                t = (y - top) / float(max(1, h - top - 1))
                idx = int(max(1, min(len(r) - 1, 6 - t * 5)))
                cv.put(x, y, r[idx])
            cv.put(x, top, lighten(r[6], 0.3))
            cv.put(x, top + 1, r[6])
            if (x + phase * 3) % 11 == 0:
                cv.put(x, top + 2, r[7])
            cv.put(x, h - 1, darken(r[1], 0.5))
        cv.hline(0, h - 1, w, darken(r[1], 0.4))
        return cv

    return paint


def globe_glass():
    """Блики стекла поверх жидкости."""

    def paint():
        cv = Canvas(GLOBE, GLOBE)
        cx = cy = GLOBE / 2.0
        r = GLOBE / 2.0 - 10
        for a in range(150, 250, 3):
            ang = math.radians(a)
            for k in range(2):
                x = int(cx + math.cos(ang) * (r - 3 - k))
                y = int(cy + math.sin(ang) * (r - 3 - k))
                cv.set(x, y, (255, 255, 255, 92 - k * 40))
        for a in range(300, 350, 4):
            ang = math.radians(a)
            x = int(cx + math.cos(ang) * (r - 4))
            y = int(cy + math.sin(ang) * (r - 4))
            cv.set(x, y, (255, 255, 255, 40))
        cv.ellipse(cx - r * 0.42, cy - r * 0.45, r * 0.2, r * 0.12, (255, 255, 255, 70), True, None)
        # виньетка снизу
        for j in range(GLOBE):
            for i in range(GLOBE):
                d = math.hypot(i + 0.5 - cx, j + 0.5 - cy)
                if r - 5 < d <= r:
                    cv.set(i, j, (0, 0, 0, int(90 * (d - (r - 5)) / 5.0)))
        return cv

    return paint


# ==================================================================== скроллы
def scroll_track(w=16, h=80):
    def paint():
        cv = Canvas(w, h)
        sunken(cv, 0, 0, w, h, ["#0a0908", "#141110", "#1c1815"], outline=P.INK, depth=2)
        cv.noise(2, 2, w - 4, h - 4, [C("#241f1a")], 0.04, seed=3, alpha=60)
        return cv

    return paint


def scroll_thumb(state="normal", w=16, h=44):
    def paint():
        cv = Canvas(w, h)
        r = [P.STONE[3], P.STONE[4], P.STONE[5]] if state == "normal" else [P.STONE[4], P.STONE[5], P.STONE[6]]
        raised(cv, 0, 0, w, h, r, outline=P.INK)
        cv.hline(2, 1, w - 4, P.GOLD[2])
        cv.hline(2, h - 2, w - 4, P.GOLD[1])
        for y in range(h // 2 - 4, h // 2 + 5, 3):
            cv.hline(3, y, w - 6, darken(r[0], 0.5))
            cv.hline(3, y + 1, w - 6, lighten(r[-1], 0.2))
        return cv

    return paint


def scroll_arrow(direction="up", S=16):
    def paint():
        cv = Canvas(S, S)
        raised(cv, 0, 0, S, S, [P.STONE[2], P.STONE[3], P.STONE[4]], outline=P.INK)
        c = Canvas(9, 6)
        for j in range(6):
            c.hline(j, j, 9 - 2 * j, P.GOLD[5])
        if direction == "up":
            c = c.mirror_y(c)
        cv.blit_center(c, S // 2, S // 2)
        cv.hline(S // 2 - 4, S // 2 + 3 if direction == "up" else S // 2 - 3, 9, P.GOLD[1])
        return cv

    return paint


# ==================================================================== прочее
def tooltip_frame(w=88, h=64, b=10):
    def paint():
        cv = Canvas(w, h)
        parch_texture(cv, 0, 0, w, h, ["#241d13", "#33291a", "#413522"], seed=17, cell=4)
        cv.frame(0, 0, w, h, P.INK)
        cv.frame(1, 1, w - 2, h - 2, P.GOLD[3])
        cv.frame(2, 2, w - 4, h - 4, P.GOLD[1])
        cv.frame(3, 3, w - 6, h - 6, (0, 0, 0, 120))
        cv.noise(0, 0, w, h, [C("#0d0b08")], 0.02, seed=21, alpha=44)
        for (cx, cy) in [(3, 3), (w - 4, 3), (3, h - 4), (w - 4, h - 4)]:
            cv.rect(cx, cy, 2, 2, P.GOLD[6])
        cv.hline(4, 4, w - 8, (C(P.GOLD[5])[0], C(P.GOLD[5])[1], C(P.GOLD[5])[2], 110))
        return cv

    return paint


def rarity_frame(kind="magic", S=56, b=9):
    hi, lo = P.RARITY[kind]

    def paint():
        cv = Canvas(S, S)
        ch = C(hi)
        cl = C(lo)
        for j in range(S):
            for i in range(S):
                d = min(i, j, S - 1 - i, S - 1 - j)
                if d >= b:
                    continue
                t = d / float(b)
                a = int(255 * (1 - t ** 1.5 * 0.8))
                col = mix(cl, ch, (1 - t) ** 0.8)
                col = mix(col, "#000000", 0.35) if d == 0 else col
                cv.set(i, j, (col[0], col[1], col[2], a))
        cv.frame(1, 1, S - 2, S - 2, (mix(ch, "#ffffff", 0.3)[0], mix(ch, "#ffffff", 0.3)[1], mix(ch, "#ffffff", 0.3)[2], 230))
        cv.frame(b - 1, b - 1, S - 2 * b + 2, S - 2 * b + 2, (cl[0], cl[1], cl[2], 235))
        for (cx, cy) in [(0, 0), (S - 1, 0), (0, S - 1), (S - 1, S - 1)]:
            cv.rect(cx, cy, 2, 2, (mix(ch, "#fff6cf", 0.5)[0], mix(ch, "#fff6cf", 0.5)[1], mix(ch, "#fff6cf", 0.5)[2], 255))
        return cv

    return paint


def divider(w=96, h=12, b=28):
    def paint():
        cv = Canvas(w, h)
        cy = h // 2
        cv.hline(0, cy, w, P.GOLD[0])
        cv.hline(0, cy - 1, w, P.GOLD[3])
        cv.hline(0, cy - 2, w, P.GOLD[1])
        # центральный ромб
        cx = w // 2
        for k in range(5):
            cv.hline(cx - k, cy - 3 + k, k * 2 + 1, P.GOLD[5 - min(4, k)])
            cv.hline(cx - k, cy + 3 - k, k * 2 + 1, P.GOLD[2 + min(3, k)])
        cv.rect(cx - 1, cy - 1, 3, 3, P.GOLD[7])
        # завитки к краям
        for sgn in (-1, 1):
            for k in range(3):
                x = cx + sgn * (8 + k * 5)
                cv.line(x, cy - 1, x + sgn * 3, cy - 3 - k, P.GOLD[3])
                cv.set(x + sgn * 3, cy - 4 - k, P.GOLD[5])
        for x in (1, w - 2):
            cv.vline(x, cy - 3, 7, P.GOLD[2])
        return cv

    return paint


def divider_simple(w=32, h=4):
    def paint():
        cv = Canvas(w, h)
        cv.hline(0, 0, w, P.GOLD[1])
        cv.hline(0, 1, w, P.GOLD[4])
        cv.hline(0, 2, w, P.GOLD[0])
        return cv

    return paint


def corner_ornament(fl="tl", S=34):
    def paint():
        c = Canvas(S, S)
        for k in range(4):
            col = [P.GOLD[2], P.GOLD[5], P.GOLD[3], P.GOLD[1]][k]
            c.hline(k, k, S - 2 * k - 2, col)
            c.vline(k, k, S - 2 * k - 2, col)
        c.hline(4, 5, S - 12, P.GOLD[6])
        c.vline(5, 4, S - 12, P.GOLD[6])
        flourish(c, 4, 4, color=P.GOLD)
        stud(c, 8, 8, 3.2, P.GOLD[2:7])
        # шип наружу из угла
        for k in range(6):
            c.line(1 + k, 14 - k, 14 - k, 1 + k, P.IRON[5 - k % 3])
        c.line(1, 14, 14, 1, P.IRON[2])
        c.line(2, 12, 12, 2, P.IRON[7])
        if "r" in fl:
            c = c.mirror_x(c)
        if "b" in fl:
            c = c.mirror_y(c)
        return c

    return paint


def rivet(S=10):
    def paint():
        cv = Canvas(S, S)
        stud(cv, S // 2, S // 2, S / 2.0 - 1.2, P.GOLD[1:7])
        return cv

    return paint


def skull_ornament(w=48, h=40):
    def paint():
        cv = Canvas(w, h)
        skull(cv, w // 2, h // 2 - 1, 2.1, P.BONE)
        # скрещенные кости под черепом
        for sgn in (-1, 1):
            x0 = w // 2 + sgn * 16
            cv.line(x0, h - 4, w // 2 - sgn * 6, h - 12, P.BONE[3])
            cv.line(x0, h - 5, w // 2 - sgn * 6, h - 13, P.BONE[4])
            for k in (-1, 1):
                cv.disc(x0 + k * 2, h - 4 + k, 2, P.BONE[4], P.BONE[1])
        for sx in (-6, 6):
            cv.disc(w // 2 + sx, h // 2 - 3, 1.4, (C(P.BLOOD[5])[0], C(P.BLOOD[5])[1], C(P.BLOOD[5])[2], 210))
        return cv

    return paint


def banner(w=176, h=40, b=26):
    def paint():
        cv = Canvas(w, h)
        raised(cv, 0, 0, w, h, [P.STONE[1], P.STONE[2], P.STONE[3], P.STONE[4]], outline=P.INK)
        stone_texture(cv, 1, 1, w - 2, h - 2, P.STONE[1:5], seed=43, cell=8)
        cv.frame(0, 0, w, h, P.INK)
        cv.frame(1, 1, w - 2, h - 2, P.GOLD[2])
        cv.frame(2, 2, w - 4, h - 4, P.GOLD[4])
        cv.frame(3, 3, w - 6, h - 6, P.GOLD[0])
        cv.hline(4, 4, w - 8, (C(P.GOLD[6])[0], C(P.GOLD[6])[1], C(P.GOLD[6])[2], 90))
        for cx in (b // 2, w - b // 2):
            stud(cv, cx, h // 2, 3.4, P.GOLD[2:7])
            for a in range(0, 360, 90):
                ang = math.radians(a + 45)
                cv.set(int(cx + math.cos(ang) * 7), int(h // 2 + math.sin(ang) * 7), P.GOLD[5])
        for sgn, x0 in ((-1, b - 2), (1, w - b + 2)):
            cv.vline(x0, 6, h - 12, P.GOLD[2])
            cv.vline(x0 + sgn, 6, h - 12, P.GOLD[4])
        cv.noise(4, 4, w - 8, h - 8, [C("#0a0908")], 0.02, seed=47, alpha=40)
        return cv

    return paint


def cursor(kind="hand", w=22, h=26):
    def paint():
        cv = Canvas(w, h)
        # латная перчатка: кожа + стальные пластины
        skin = ["#4a3c2b", "#6b5a44", "#8d7859", "#b09a72"]
        steel = [P.IRON[3], P.IRON[5], P.IRON[6]]
        if kind == "hand":
            cv.rect(5, 1, 5, 11, skin[2])
            cv.vline(6, 2, 9, skin[3])
            cv.vline(9, 2, 9, skin[1])
            cv.rect(4, 0, 7, 2, steel[1])  # ногтевая пластина
            cv.rect(2, 11, 16, 12, skin[1])
            cv.hline(2, 11, 16, skin[3])
            for y in (14, 17, 20):
                cv.hline(3, y, 14, skin[2])
                cv.hline(3, y + 1, 14, skin[0])
            cv.rect(15, 12, 6, 7, skin[2])
            cv.hline(15, 12, 6, skin[3])
            cv.rect(2, 22, 16, 2, steel[1])  # манжета
            cv.hline(2, 22, 16, steel[2])
        else:
            cv.rect(3, 5, 16, 16, skin[1])
            cv.hline(3, 5, 16, skin[3])
            for y in (8, 11, 14, 17):
                cv.hline(4, y, 14, skin[2])
                cv.hline(4, y + 1, 14, skin[0])
            cv.rect(15, 6, 6, 8, skin[2])
            cv.hline(15, 6, 6, skin[3])
            cv.rect(3, 20, 16, 3, steel[1])
            cv.hline(3, 20, 16, steel[2])
            cv.rect(4, 2, 6, 3, skin[2])  # костяшки
        cv.outline(P.INK)
        return cv

    return paint


def torch(w=24, h=52):
    """Настенный факел: рукоять + чаша (пламя — отдельная анимация)."""

    def paint():
        cv = Canvas(w, h)
        cx = w // 2
        # рукоять
        cv.rect(cx - 3, 20, 7, h - 22, P.WOOD[3])
        cv.frame(cx - 3, 20, 7, h - 22, P.WOOD[1])
        for y in range(20, h - 2, 4):
            cv.hline(cx - 3, y, 7, P.WOOD[5])
            cv.hline(cx - 3, y + 1, 7, P.WOOD[2])
        cv.vline(cx - 2, 20, h - 22, P.WOOD[6])
        # обмотка
        for y in (28, 29, 38, 39):
            cv.hline(cx - 4, y, 9, P.PARCH[3])
            cv.hline(cx - 4, y + 1, 9, P.PARCH[1])
        # чаша
        cv.poly([(cx - 9, 13), (cx + 9, 13), (cx + 6, 24), (cx - 6, 24)], P.IRON[3], P.INK)
        cv.hline(cx - 9, 13, 19, P.GOLD[4])
        cv.hline(cx - 8, 14, 17, P.IRON[6])
        cv.poly([(cx - 7, 22), (cx + 7, 22), (cx + 4, 28), (cx - 4, 28)], P.IRON[2], P.INK)
        stud(cv, cx - 7, 17, 1.8, P.GOLD[2:6])
        stud(cv, cx + 7, 17, 1.8, P.GOLD[2:6])
        # угли в чаше
        cv.hline(cx - 6, 13, 13, P.EMBER[4])
        cv.hline(cx - 5, 12, 11, P.EMBER[6])
        cv.hline(cx - 3, 11, 7, P.EMBER[7])
        return cv

    return paint


# ================================================================ регистрация
def _register():
    g = lambda n, grp, fn, **kw: spec(n, grp, fn, **kw)

    # панели
    g("panel_frame_ornate", "panels", panel_ornate_frame(), nine=(16, 16, 16, 16), desc="Рама окна, 9-slice")
    g("panel_frame_heavy", "panels", panel_heavy_frame(), nine=(24, 24, 24, 24), desc="Тяжёлая рама, 9-slice")
    g("tooltip_frame", "panels", tooltip_frame(), nine=(10, 10, 10, 12), desc="Подсказка, 9-slice")
    g("banner_title", "panels", banner(), nine=(26, 10, 26, 10), desc="Табличка заголовка")
    g("fill_stone", "fills", _tile(_fill_stone), desc="Тайл камня 32×32")
    g("fill_parchment", "fills", _tile(_fill_parchment), desc="Тайл пергамента")
    g("fill_dark", "fills", _tile(_fill_dark), desc="Тайл тёмного фона")
    g("fill_wood", "fills", _tile(_fill_wood), desc="Тайл дерева")
    g("fill_bloodstone", "fills", _tile(_fill_bloodstone), desc="Тайл кровавого камня")
    for fl in ("tl", "tr", "bl", "br"):
        g("corner_" + fl, "decor", corner_ornament(fl), desc="Угловой орнамент " + fl)
    g("rivet", "decor", rivet(), desc="Заклёпка")
    g("skull_ornament", "decor", skull_ornament(), desc="Череп с костями")
    g("divider_ornate", "decor", divider(), nine=(28, 0, 28, 0), desc="Золотой разделитель")
    g("divider_simple", "decor", divider_simple(), desc="Тонкий разделитель (тайл)")
    g("torch", "decor", torch(), desc="Факел (пламя — fx_flame)")

    # кнопки
    for style in ("stone", "gold", "blood", "iron"):
        for state in ("normal", "hover", "pressed", "disabled"):
            g(
                "btn_%s_%s" % (style, state),
                "buttons",
                button(style, state),
                nine=BTN_NINE,
                desc="Кнопка %s / %s" % (style, state),
            )
    for state in ("normal", "hover", "pressed", "disabled"):
        g("btn_round_%s" % state, "buttons", round_button(state), desc="Круглая кнопка / " + state)
    for state in ("normal", "active", "hover"):
        g("tab_%s" % state, "buttons", tab("normal" if state == "hover" else state), nine=(12, 10, 12, 8), desc="Вкладка / " + state)
    for state in ("off", "on", "hover"):
        g("checkbox_%s" % state, "buttons", checkbox(state), desc="Флажок / " + state)

    # слоты
    for state in ("empty", "hover", "selected", "drop"):
        g("slot_%s" % state, "slots", slot(state), desc="Ячейка инвентаря / " + state)
    g("socket_empty", "slots", socket("empty"), desc="Гнездо под камень")
    for k in ("ruby", "sapphire", "emerald", "topaz", "amethyst", "diamond"):
        g("socket_" + k, "slots", socket(k), desc="Гнездо: " + k)

    # полосы и глобусы
    g("bar_frame", "bars", bar_frame(), nine=(8, 5, 8, 5), desc="Оправа полосы")
    for k in ("blood", "mana", "xp", "poison", "stamina"):
        g("bar_fill_%s" % k, "bars", bar_fill(k), desc="Заполнение: " + k)
    g("globe_frame", "globes", globe_frame(), desc="Обод глобуса")
    g("globe_base", "globes", globe_base(), desc="Пустая сфера")
    g("globe_glass", "globes", globe_glass(), desc="Блики стекла")
    for i in range(6):
        g("globe_liquid_blood_%d" % i, "globes", globe_liquid("blood", i), tag="wave_blood", desc="Волна крови, кадр %d" % i)
        g("globe_liquid_mana_%d" % i, "globes", globe_liquid("mana", i), tag="wave_mana", desc="Волна маны, кадр %d" % i)

    # скроллбары
    g("scroll_track", "scroll", scroll_track(), nine=(5, 10, 5, 10), desc="Жёлоб скроллбара")
    for st in ("normal", "hover"):
        g("scroll_thumb_%s" % st, "scroll", scroll_thumb(st), nine=(5, 8, 5, 8), desc="Ползунок / " + st)
    for d in ("up", "down"):
        g("scroll_arrow_%s" % d, "scroll", scroll_arrow(d), desc="Стрелка " + d)

    # редкость
    for k in P.RARITY:
        g("rarity_%s" % k, "rarity", rarity_frame(k), nine=(9, 9, 9, 9), desc="Рамка редкости: " + k)

    # курсоры
    for k in ("hand", "fist"):
        g("cursor_%s" % k, "cursor", cursor(k), desc="Курсор: " + k)

    import icons  # локальный импорт, чтобы не зациклиться
    import fx

    icons.register(g)
    fx.register(g)


_register()
