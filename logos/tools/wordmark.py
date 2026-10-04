"""
wordmark.py — геометрический моноширинный логотип «СИНХРОН», нарисованный кодом.

Идея шрифта: семь одинаковых клеток, как семь кадров на плёнке, и семь перфораций
в кадровом окне. Все линии одной толщины, все округлости — идеальные окружности.
Логика знака та же, что и у плёнки: ритм + свет.

Буквы: С И Н Х Р О (ровно те, что нужны слову «СИНХРОН»).
Клетка 100×100, кегль (высота прописной) 100, поле внутри клетки 6.5 по кругу —
это половина толщины штриха, поэтому круглые концы штрихов сами доходят до краёв.
"""

def glyph_paths(ch, sw_ratio=12.0):
    """Вернуть список примитивов буквы в клетке 100×100."""
    h = 100.0 - sw_ratio / 2.0          # отступ до осевой линии штриха
    r = 50.0 - sw_ratio / 2.0           # радиус осевой окружности
    if ch == "С":
        return [("arc", (50, 50, r, 32, 328))]
    if ch == "О":
        return [("circle", (50, 50, r))]
    if ch == "И":
        return [("l", (h, h, h, 100 - h)), ("l", (100 - h, h, 100 - h, 100 - h)),
                ("l", (h, 100 - h, 100 - h, h))]
    if ch == "Н":
        return [("l", (h, h, h, 100 - h)), ("l", (100 - h, h, 100 - h, 100 - h)),
                ("l", (h, 50, 100 - h, 50))]
    if ch == "Х":
        return [("l", (h, h, 100 - h, 100 - h)), ("l", (100 - h, h, h, 100 - h))]
    if ch == "Р":
        return [("l", (h, h, h, 100 - h)), ("arc", (50, 50, r, 180, 360))]
    raise KeyError(f"нет буквы {ch} в геометрическом наборе")


def word_width(text, cell=100.0, gap=18.0):
    return len(text) * cell + max(0, len(text) - 1) * gap


def draw_word(layer, text, x, y, cell=100.0, gap=18.0, sw=12.0, color="#F2EAD9",
              opacity=1.0):
    """Нарисовать слово. x, y — левый верхний угол первой клетки. Вернуть ширину."""
    u = cell / 100.0
    swa = sw * u
    for i, ch in enumerate(text):
        ox = x + i * (cell + gap)
        for kind, p in glyph_paths(ch, sw):
            if kind == "l":
                x1, y1, x2, y2 = p
                layer.line(ox + x1 * u, y + y1 * u, ox + x2 * u, y + y2 * u,
                           color=color, w=swa, opacity=opacity)
            elif kind == "arc":
                cx, cy, r, a0, a1 = p
                layer.arc(ox + cx * u, y + cy * u, r * u, a0, a1,
                          stroke=color, sw=swa, opacity=opacity)
            elif kind == "circle":
                cx, cy, r = p
                layer.circle(ox + cx * u, y + cy * u, r * u,
                             stroke=color, sw=swa, opacity=opacity)
    return word_width(text, cell, gap)


# --- мелкие графические помощники, общие для концептов ---------------------------

def sprockets(layer, x, y, count, pitch, hw=17.0, hh=13.0, r=6.0, color="#0A0A0C",
              opacity=1.0):
    """Ряд перфорационных отверстий."""
    for i in range(count):
        layer.roundrect(x + i * pitch - hw, y - hh, hw * 2, hh * 2, r,
                        fill=color, opacity=opacity)


def sprockets_along(layer, p0, p1, count, hw, hh, r, color, opacity=1.0):
    """Ряд перфораций вдоль отрезка p0-p1 (для наклонных плёнок)."""
    import math
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy)
    ang = math.degrees(math.atan2(dy, dx))
    for i in range(count):
        t = (i + 0.5) / count
        cx, cy = p0[0] + dx * t, p0[1] + dy * t
        layer.push(1, 0, 0, 1, cx, cy)
        a = math.radians(ang)
        c, s = math.cos(a), math.sin(a)
        layer.push(c, s, -s, c, 0, 0)
        layer.roundrect(-hw, -hh, hw * 2, hh * 2, r, fill=color, opacity=opacity)
        layer.pop()
        layer.pop()


def dust(layer, rnd, box, n, color="#FFE9C4", rmin=1.0, rmax=3.4, opmin=0.10, opmax=0.75):
    """Пылинки в луче света."""
    x0, y0, x1, y1 = box
    for _ in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        r = rnd.uniform(rmin, rmax)
        layer.circle(x, y, r, fill=color, opacity=rnd.uniform(opmin, opmax))


def scratches(layer, rnd, box, n, color="#FFFFFF", wmax=1.6, opmax=0.16):
    """Царапины и пыль на плёнке."""
    x0, y0, x1, y1 = box
    for _ in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        L = rnd.uniform(4, 90)
        import math
        a = math.radians(rnd.uniform(85, 95))
        layer.line(x, y, x + L * math.cos(a), y + L * math.sin(a),
                   color=color, w=rnd.uniform(0.5, wmax), opacity=rnd.uniform(0.03, opmax))


def arc_text(layer, s, cx, cy, r, size, a_center, spread, color, opacity=1.0, flip=False):
    """Текст по окружности (гравировка на объективе)."""
    import math
    n = len(s)
    if n == 0:
        return
    step = spread / (n - 1) if n > 1 else 0
    a0 = a_center - spread / 2.0
    for i, ch in enumerate(s):
        a = a0 + step * i
        ar = math.radians(a)
        x = cx + r * math.cos(ar)
        y = cy + r * math.sin(ar)
        layer.text(x, y, ch, size=size, fill=color, anchor="middle", opacity=opacity,
                   rot=(a + 90) if flip else (a - 90))


def chair(layer, x, y, s, fill="#07070A", rim=None, rimw=0.0, opacity=1.0):
    """Стул в профиль (силуэт). x, y — центр сиденья, s — масштаб (1.0 ≈ 300 du)."""
    def P(px, py):
        return (x + px * s, y + py * s)
    # спинка: две стойки и три поперечины
    layer.path([P(-62, -230), P(-58, 20)], stroke=fill, sw=13 * s, opacity=opacity)
    layer.path([P(46, -230), P(46, 20)], stroke=fill, sw=13 * s, opacity=opacity)
    for yy in (-205, -150, -95):
        layer.path([P(-62, yy), P(46, yy)], stroke=fill, sw=11 * s, opacity=opacity)
    # сиденье (в перспективе)
    layer.path([P(-78, 34), P(64, 20), P(78, 46), P(-86, 62)], close=True,
               fill=fill, opacity=opacity)
    # ножки
    layer.path([P(-72, 62), P(-58, 250)], stroke=fill, sw=12 * s, opacity=opacity)
    layer.path([P(70, 46), P(62, 246)], stroke=fill, sw=12 * s, opacity=opacity)
    layer.path([P(-24, 60), P(-14, 236)], stroke=fill, sw=9 * s, opacity=opacity,)
    layer.path([P(30, 54), P(34, 232)], stroke=fill, sw=9 * s, opacity=opacity,)
    if rim and rimw:
        layer.path([P(-62, -230), P(-58, 20), P(-78, 34), P(-86, 62), P(-72, 62),
                    P(-58, 250)], close=False, stroke=rim, sw=rimw, opacity=0.5)
