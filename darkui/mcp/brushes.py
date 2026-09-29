"""Кисти: металл, камень, фаски, заклёпки, золото, черепа, камни-самоцветы.
Всё целочисленное, без сглаживания — как в оригинальном Diablo II."""
import math
import random

from canvas import Canvas, C, mix, shade, darken, lighten, ramp, BAYER4, BAYER8
import palette as P


# --------------------------------------------------------------------------- шум
def _smooth(t):
    return t * t * (3 - 2 * t)


def vnoise(w, h, cell, seed=1, octaves=3, wrap=True):
    """Value-noise (fBm) → w*h float'ов 0..1. При wrap и w%cell==0 — бесшовно."""
    out = [0.0] * (w * h)
    amp, total = 1.0, 0.0
    c = cell
    for o in range(octaves):
        rnd = random.Random(seed * 7919 + o * 104729)
        gw = max(2, w // c)
        gh = max(2, h // c)
        lattice = [[rnd.random() for _ in range(gw + 1)] for _ in range(gh + 1)]
        ok_wrap = wrap and w % c == 0 and h % c == 0
        for y in range(h):
            fy = y / float(c)
            y0 = int(fy)
            ty = _smooth(fy - y0)
            for x in range(w):
                fx = x / float(c)
                x0 = int(fx)
                tx = _smooth(fx - x0)
                if ok_wrap:
                    a = lattice[y0 % gh][x0 % gw]
                    b = lattice[y0 % gh][(x0 + 1) % gw]
                    cc = lattice[(y0 + 1) % gh][x0 % gw]
                    d = lattice[(y0 + 1) % gh][(x0 + 1) % gw]
                else:
                    a = lattice[min(y0, gh)][min(x0, gw)]
                    b = lattice[min(y0, gh)][min(x0 + 1, gw)]
                    cc = lattice[min(y0 + 1, gh)][min(x0, gw)]
                    d = lattice[min(y0 + 1, gh)][min(x0 + 1, gw)]
                v = a + (b - a) * tx + (cc - a) * ty + (a - b - cc + d) * tx * ty
                out[y * w + x] += v * amp
        total += amp
        amp *= 0.5
        c = max(2, c // 2)
    return [v / total for v in out]


def stone_texture(cv, x, y, w, h, base=None, seed=3, cell=8, contrast=1.0, wrap=False):
    """Каменная плита: облачный шум + зерно."""
    base = base or P.STONE
    n = vnoise(w, h, cell, seed, 3, wrap)
    k = len(base)
    for j in range(h):
        for i in range(w):
            v = n[j * w + i]
            v = 0.5 + (v - 0.5) * contrast
            idx = int(max(0, min(k - 1, v * (k - 1))))
            d = BAYER4[(x + i) % 4][(y + j) % 4] / 16.0
            frac = v * (k - 1) - idx
            if frac > d and idx + 1 < k:
                idx += 1
            cv.set(x + i, y + j, base[idx])
    cv.grain(x, y, w, h, 0.09, seed * 31 + 5)


def parch_texture(cv, x, y, w, h, base=None, seed=5, cell=6, wrap=False):
    base = base or P.PARCH
    n = vnoise(w, h, cell, seed, 2, wrap)
    k = len(base)
    for j in range(h):
        for i in range(w):
            idx = int(max(0, min(k - 1, n[j * w + i] * (k - 1))))
            cv.set(x + i, y + j, base[idx])
    cv.grain(x, y, w, h, 0.05, seed * 13 + 2)
    # волокна пергамента
    rnd = random.Random(seed)
    for _ in range(int(w * h / 26)):
        i = rnd.randrange(w)
        j = rnd.randrange(h)
        ln = rnd.randrange(2, 6)
        cv.hline(x + i, y + j, ln, (C(base[2])[0], C(base[2])[1], C(base[2])[2], 70))


# ------------------------------------------------------------------- конструкции
def raised(cv, x, y, w, h, rampc, outline=None, hi=None, sh=None, dither=True, axis="v"):
    """Выпуклая пластина: градиент + тёмный контур + блик сверху-слева."""
    cv.gradient(x, y, w, h, [C(c) for c in rampc], axis, dither)
    if outline:
        cv.frame(x, y, w, h, outline)
        hi = hi or lighten(rampc[-1], 0.35)
        sh = sh or darken(rampc[0], 0.45)
        cv.hline(x + 1, y + 1, w - 2, hi)
        cv.vline(x + 1, y + 1, h - 2, hi)
        cv.hline(x + 1, y + h - 2, w - 2, sh)
        cv.vline(x + w - 2, y + 1, h - 2, sh)


def sunken(cv, x, y, w, h, rampc, outline=None, depth=2):
    """Утопленная ниша: тень сверху-слева, свет снизу-справа."""
    cv.gradient(x, y, w, h, [C(c) for c in list(reversed(rampc))], "v", True)
    if outline:
        cv.frame(x, y, w, h, outline)
    dark = darken(rampc[0], 0.55)
    light = lighten(rampc[-1], 0.2)
    for k in range(depth):
        a = int(190 * (1 - k / float(depth)))
        cv.hline(x + k, y + k, w - 2 * k, (C(dark)[0], C(dark)[1], C(dark)[2], a))
        cv.vline(x + k, y + k, h - 2 * k, (C(dark)[0], C(dark)[1], C(dark)[2], a))
        cv.hline(x + k, y + h - 1 - k, w - 2 * k, (C(light)[0], C(light)[1], C(light)[2], a))
        cv.vline(x + w - 1 - k, y + k, h - 2 * k, (C(light)[0], C(light)[1], C(light)[2], a))


def frame_by_distance(cv, b, rampc, light=0.0, dark=0.0):
    """Рамка, цвет пикселя зависит только от расстояния до края.
    Идеально для 9-slice: края тянутся без швов."""
    w, h = cv.w, cv.h
    k = len(rampc)
    for j in range(h):
        for i in range(w):
            d = min(i, j, w - 1 - i, h - 1 - j)
            if d >= b:
                continue
            t = d / float(max(1, b - 1))
            f = t * (k - 1)  # d=0 → внешний край рамы = rampc[0]
            idx = int(f)
            frac = f - idx
            if frac > BAYER4[i % 4][j % 4] / 16.0 and idx + 1 < k:
                idx += 1
            c = C(rampc[min(idx, k - 1)])
            # направленная подсветка: верх светлее, низ темнее
            if light or dark:
                top = j <= i and j <= w - 1 - i and j <= h - 1 - j
                bot = (h - 1 - j) < i and (h - 1 - j) < w - 1 - i and (h - 1 - j) < j
                if top:
                    c = shade(c, 1.0 + light * 1.7)  # мультипликативно — hue не выцветает
                elif bot:
                    c = darken(c, dark)
            cv.set(i, j, c)


def stud(cv, cx, cy, r, base=None, outline=None):
    """Заклёпка/бронзовый гвоздь."""
    base = base or P.GOLD[2:7]
    outline = outline or P.INK
    rr = int(r)
    for j in range(-rr - 1, rr + 2):
        for i in range(-rr - 1, rr + 2):
            d = math.hypot(i - 0.35, j - 0.35)
            if d <= rr + 0.6:
                if d > rr - 0.4:
                    cv.set(cx + i, cy + j, outline)
                else:
                    t = max(0.0, min(1.0, d / max(0.5, rr)))
                    idx = int((1 - t) * (len(base) - 1))
                    cv.set(cx + i, cy + j, base[min(idx, len(base) - 1)])
    cv.set(cx - max(1, rr // 3), cy - max(1, rr // 3), lighten(base[-1], 0.5))


def gold_line(cv, pts, w=1, shadow=True):
    for k in range(len(pts) - 1):
        x0, y0 = pts[k]
        x1, y1 = pts[k + 1]
        if shadow:
            cv.line(x0, y0 + w, x1, y1 + w, P.GOLD[0])
        for t in range(w):
            cv.line(x0, y0 + t, x1, y1 + t, P.GOLD[4] if t == 0 else P.GOLD[2])


def flourish(cv, x, y, s=1.0, color=None, flip_x=False, flip_y=False):
    """Золотой завиток (акант) в углу. Рисуется в локальных координатах 0..20."""
    color = color or P.GOLD
    c = Canvas(24, 24)
    pts = [
        (1, 22),
        (3, 15),
        (6, 10),
        (10, 7),
        (15, 5),
        (21, 4),
    ]
    for k in range(len(pts) - 1):
        c.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], color[5])
        c.line(pts[k][0], pts[k][1] + 1, pts[k + 1][0], pts[k + 1][1] + 1, color[3])
    c.line(1, 21, 21, 3, color[6])
    # завиток
    for a in range(0, 200, 6):
        t = a / 200.0
        rr = 4.5 - 3.2 * t
        ang = math.radians(a * 2.2)
        c.set(int(19 + math.cos(ang) * rr), int(6 + math.sin(ang) * rr), color[6])
        c.set(int(19 + math.cos(ang) * rr), int(7 + math.sin(ang) * rr), color[4])
    # листочки
    for (lx, ly) in [(6, 16), (11, 12), (16, 8)]:
        c.poly([(lx, ly), (lx + 3, ly - 2), (lx + 4, ly + 1), (lx + 1, ly + 3)], color[4], color[2])
    c.set(2, 22, color[7])
    if flip_x:
        c = c.mirror_x(c)
    if flip_y:
        c = c.mirror_y(c)
    cv.blit(c, x, y)


def spike(cv, cx, base_y, h, w=5, base=None):
    """Металлический шип вверх."""
    base = base or P.IRON
    for j in range(h):
        t = j / float(h)
        ww = max(1, int(round(w * (1 - t) / 2)))
        c = base[min(len(base) - 1, int(2 + t * 4))]
        cv.hline(cx - ww, base_y - j, ww * 2 + 1, c)
    cv.line(cx - w // 2, base_y - 1, cx, base_y - h + 1, lighten(base[-1], 0.35))
    cv.line(cx + w // 2, base_y - 1, cx, base_y - h + 1, darken(base[1], 0.4))
    cv.line(cx - w // 2 - 1, base_y, cx, base_y - h, P.INK)
    cv.line(cx + w // 2 + 1, base_y, cx, base_y - h, P.INK)


# --------------------------------------------------------------------- предметы
def skull(cv, cx, cy, s=1.0, base=None, eye=None):
    """Череп: черепная коробка, скулы, глазницы, нос, зубы."""
    base = base or P.BONE
    eye = eye or P.INK
    w = int(14 * s)
    h = int(15 * s)
    x0, y0 = cx - w // 2, cy - h // 2
    # коробка
    cv.ellipse(x0 + w / 2.0, y0 + h * 0.38, w * 0.5, h * 0.38, base[4], True, base[1])
    cv.ellipse(x0 + w / 2.0, y0 + h * 0.34, w * 0.44, h * 0.32, base[5], True, None)
    # челюсть
    cv.poly(
        [
            (x0 + w * 0.22, y0 + h * 0.55),
            (x0 + w * 0.78, y0 + h * 0.55),
            (x0 + w * 0.70, y0 + h * 0.95),
            (x0 + w * 0.30, y0 + h * 0.95),
        ],
        base[3],
        base[1],
    )
    # глазницы
    er = max(1.4, 2.6 * s)
    for sx in (-1, 1):
        ex = x0 + w / 2.0 + sx * w * 0.24
        ey = y0 + h * 0.38
        cv.ellipse(ex, ey, er, er * 1.05, eye, True, base[1])
        cv.set(int(ex), int(ey) - 1, base[1])
    # нос
    cv.poly(
        [
            (x0 + w * 0.5, y0 + h * 0.52),
            (x0 + w * 0.5 - max(1, s), y0 + h * 0.68),
            (x0 + w * 0.5 + max(1, s), y0 + h * 0.68),
        ],
        eye,
    )
    # зубы
    ty = int(y0 + h * 0.72)
    tw = max(1, int(1.6 * s))
    n = max(3, int(6 * s))
    for i in range(n):
        tx = int(x0 + w * 0.30 + i * (w * 0.40 / n))
        cv.rect(tx, ty, tw, int(h * 0.2), base[5])
        cv.vline(tx + tw, ty, int(h * 0.2), base[2])
    cv.hline(int(x0 + w * 0.28), ty - 1, int(w * 0.44), base[2])
    # блик на лбу
    cv.ellipse(x0 + w * 0.38, y0 + h * 0.2, w * 0.16, h * 0.09, base[5], True, None)
    # трещина
    cv.line(int(x0 + w * 0.62), int(y0 + h * 0.06), int(x0 + w * 0.55), int(y0 + h * 0.28), base[2])
    cv.line(int(x0 + w * 0.55), int(y0 + h * 0.28), int(x0 + w * 0.63), int(y0 + h * 0.4), base[2])


def gem(cv, cx, cy, w, h, colors, glow=None):
    """Огранённый самоцвет: ромб, фаски, блик. Рампа любой длины — индексы зажимаются."""
    n = len(colors)
    colors = [colors[min(n - 1, i)] for i in range(8)] if n < 8 else colors
    x0, y0 = cx - w // 2, cy - h // 2
    top = (cx, y0)
    right = (x0 + w - 1, cy - int(h * 0.12))
    bottom = (cx, y0 + h - 1)
    left = (x0, cy - int(h * 0.12))
    cv.poly([top, right, bottom, left], colors[2], colors[0])
    # верхняя площадка
    tw = max(2, int(w * 0.34))
    cv.poly(
        [
            (cx - tw // 2, y0 + int(h * 0.22)),
            (cx + tw // 2, y0 + int(h * 0.22)),
            (right[0] - 1, right[1]),
            (left[0] + 1, left[1]),
        ],
        colors[5],
        None,
    )
    # фаски
    cv.line(top[0], top[1], left[0], left[1], colors[4])
    cv.line(top[0], top[1], right[0], right[1], colors[3])
    cv.line(left[0], left[1], bottom[0], bottom[1], colors[2])
    cv.line(right[0], right[1], bottom[0], bottom[1], colors[1])
    cv.line(cx - tw // 2, y0 + int(h * 0.22), left[0] + 1, left[1], colors[6])
    cv.line(cx + tw // 2, y0 + int(h * 0.22), right[0] - 1, right[1], colors[4])
    cv.line(cx - tw // 2, y0 + int(h * 0.22), cx, bottom[1] - 1, colors[2])
    cv.line(cx + tw // 2, y0 + int(h * 0.22), cx, bottom[1] - 1, colors[3])
    # блик
    cv.set(cx - max(1, tw // 4), y0 + int(h * 0.3), colors[7])
    cv.set(cx - max(1, tw // 4) + 1, y0 + int(h * 0.3), colors[6])
    if glow:
        for r in range(max(w, h) // 2 + 2, max(w, h) // 2 - 1, -1):
            cv.ellipse(cx, cy, r, int(r * 1.05), (C(glow)[0], C(glow)[1], C(glow)[2], 9), True, None)


def flask(cv, cx, cy, w, h, liquid, glass=None, cork=None):
    """Флакон: пузатая колба, пробка, жидкость, блик стекла."""
    glass = glass or P.IRON
    cork = cork or P.WOOD
    x0, y0 = cx - w // 2, cy - h // 2
    neck_w = max(3, int(w * 0.30))
    neck_h = int(h * 0.30)
    body_top = y0 + neck_h
    body_h = h - neck_h
    # пробка
    cv.rect(cx - neck_w // 2 - 1, y0 - 1, neck_w + 2, 3, cork[4], cork[1])
    cv.hline(cx - neck_w // 2 - 1, y0 - 1, neck_w + 2, cork[5])
    # горлышко
    cv.rect(cx - neck_w // 2, y0 + 1, neck_w, neck_h, glass[4])
    cv.vline(cx - neck_w // 2, y0 + 1, neck_h, glass[6])
    cv.vline(cx + neck_w // 2 - 1, y0 + 1, neck_h, glass[2])
    cv.frame(cx - neck_w // 2 - 1, y0 + 2, neck_w + 2, 2, glass[5])
    # корпус
    bw = w // 2
    bh = body_h / 2.0
    ccy = body_top + bh
    cv.ellipse(cx, ccy, bw, bh, glass[3], True, glass[1])
    cv.ellipse(cx, ccy, bw - 1.4, bh - 1.4, liquid[2], True, None)
    # жидкость с градиентом
    for j in range(int(ccy - bh), int(ccy + bh) + 1):
        for i in range(int(cx - bw), int(cx + bw) + 1):
            d = ((i + 0.5 - cx) / bw) ** 2 + ((j + 0.5 - ccy) / bh) ** 2
            if d <= 0.86:
                t = (j - (ccy - bh)) / (2 * bh)
                idx = int(max(0, min(len(liquid) - 1, (0.25 + t * 0.75) * (len(liquid) - 1))))
                cv.put(i, j, liquid[idx])
    # мениск
    cv.ellipse(cx, ccy - bh * 0.15, bw * 0.72, bh * 0.2, liquid[5], True, None)
    # блик стекла
    cv.line(cx - int(bw * 0.55), int(ccy - bh * 0.35), cx - int(bw * 0.2), int(ccy - bh * 0.7), glass[7])
    cv.line(cx - int(bw * 0.5), int(ccy - bh * 0.2), cx - int(bw * 0.3), int(ccy - bh * 0.5), glass[6])
    cv.set(cx + int(bw * 0.45), int(ccy + bh * 0.4), glass[6])


def blade(cv, pts, width, rampc, edge=None):
    """Клинок по ломаной: тело с градиентом поперёк + светлая кромка."""
    edge = edge or lighten(rampc[-1], 0.45)
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1 - x0, y1 - y0
    ln = math.hypot(dx, dy) or 1
    nx, ny = -dy / ln, dx / ln  # нормаль
    for t_i in range(int(ln) + 1):
        t = t_i / ln
        px, py = x0 + dx * t, y0 + dy * t
        taper = 1.0 - 0.55 * (t ** 1.6)  # сужение к острию
        w = width * taper
        for k in range(int(-w), int(w) + 1):
            f = (k / w + 1) / 2.0
            idx = int(max(0, min(len(rampc) - 1, f * (len(rampc) - 1))))
            c = rampc[idx]
            xx, yy = int(round(px + nx * k)), int(round(py + ny * k))
            cv.set(xx, yy, c)
        # кромка
        xx, yy = int(round(px + nx * w)), int(round(py + ny * w))
        cv.set(xx, yy, edge)
        xx, yy = int(round(px - nx * w)), int(round(py - ny * w))
        cv.set(xx, yy, darken(rampc[0], 0.3))
