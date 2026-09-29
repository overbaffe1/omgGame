"""Пиксельный холст и кисти. Никакого антиалиасинга — только целые пиксели,
рампы, упорядоченный дизеринг и фаски. Так рисовали UI в Diablo II (640×480)."""
import random

BAYER4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
]
BAYER8 = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
]


def C(v, a=255):
    """'#rrggbb' / (r,g,b) / (r,g,b,a) → кортеж (r,g,b,a)."""
    if isinstance(v, str):
        s = v.lstrip("#")
        if len(s) == 3:
            s = "".join(ch * 2 for ch in s)
        if len(s) == 6:
            return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), a)
        if len(s) == 8:
            return (
                int(s[0:2], 16),
                int(s[2:4], 16),
                int(s[4:6], 16),
                int(s[6:8], 16),
            )
        raise ValueError("цвет: %r" % v)
    t = tuple(v)
    if len(t) == 3:
        return (t[0], t[1], t[2], a)
    return t


def mix(c0, c1, t):
    c0, c1 = C(c0), C(c1)
    return (
        round(c0[0] + (c1[0] - c0[0]) * t),
        round(c0[1] + (c1[1] - c0[1]) * t),
        round(c0[2] + (c1[2] - c0[2]) * t),
        round(c0[3] + (c1[3] - c0[3]) * t),
    )


def shade(c, k):
    """k>1 светлее, k<1 темнее; альфа не трогаем."""
    r, g, b, a = C(c)
    cl = lambda v: max(0, min(255, round(v * k)))
    return (cl(r), cl(g), cl(b), a)


def darken(c, k):
    return shade(c, 1 - k)


def lighten(c, k):
    c = C(c)
    return (
        round(c[0] + (255 - c[0]) * k),
        round(c[1] + (255 - c[1]) * k),
        round(c[2] + (255 - c[2]) * k),
        c[3],
    )


def ramp(c0, c1, n):
    return [mix(c0, c1, i / max(1, n - 1)) for i in range(n)]


class Canvas:
    __slots__ = ("w", "h", "px")

    def __init__(self, w, h, fill=None):
        self.w, self.h = int(w), int(h)
        self.px = bytearray(self.w * self.h * 4)
        if fill is not None:
            self.rect(0, 0, self.w, self.h, fill)

    # --- базовое -----------------------------------------------------------
    def clone(self):
        c = Canvas(self.w, self.h)
        c.px = bytearray(self.px)
        return c

    def sub(self, x, y, w, h):
        c = Canvas(w, h)
        c.blit(self, -x, -y)
        return c

    def ok(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h

    def get(self, x, y):
        if not self.ok(x, y):
            return (0, 0, 0, 0)
        o = (y * self.w + x) * 4
        return (self.px[o], self.px[o + 1], self.px[o + 2], self.px[o + 3])

    def set(self, x, y, c):
        """Замена пикселя с учётом альфы нового цвета (src-over)."""
        if not self.ok(x, y):
            return
        r, g, b, a = C(c)
        if a <= 0:
            return
        o = (y * self.w + x) * 4
        if a >= 255:
            self.px[o] = r
            self.px[o + 1] = g
            self.px[o + 2] = b
            self.px[o + 3] = 255
            return
        dr, dg, db, da = self.px[o], self.px[o + 1], self.px[o + 2], self.px[o + 3]
        if da == 0:
            self.px[o], self.px[o + 1], self.px[o + 2], self.px[o + 3] = r, g, b, a
            return
        na = a + da * (255 - a) / 255.0
        k = a / na
        self.px[o] = round(r * k + dr * (1 - k))
        self.px[o + 1] = round(g * k + dg * (1 - k))
        self.px[o + 2] = round(b * k + db * (1 - k))
        self.px[o + 3] = round(na)

    def put(self, x, y, c):
        """Жёсткая запись без смешивания (для масок/чистого пикселя)."""
        if not self.ok(x, y):
            return
        r, g, b, a = C(c)
        o = (y * self.w + x) * 4
        self.px[o], self.px[o + 1], self.px[o + 2], self.px[o + 3] = r, g, b, a

    def clear(self, x, y, w=1, h=1):
        for j in range(y, y + h):
            for i in range(x, x + w):
                if self.ok(i, j):
                    o = (j * self.w + i) * 4
                    self.px[o : o + 4] = b"\x00\x00\x00\x00"

    # --- геометрия ---------------------------------------------------------
    def rect(self, x, y, w, h, c, edge=None):
        for j in range(y, y + h):
            for i in range(x, x + w):
                self.set(i, j, c)
        if edge is not None:
            self.frame(x, y, w, h, edge)

    def frame(self, x, y, w, h, c, t=1):
        for k in range(t):
            self.hline(x + k, y + k, w - 2 * k, c)
            self.hline(x + k, y + h - 1 - k, w - 2 * k, c)
            self.vline(x + k, y + k, h - 2 * k, c)
            self.vline(x + w - 1 - k, y + k, h - 2 * k, c)

    def hline(self, x, y, w, c):
        if not (0 <= y < self.h):
            return
        for i in range(max(0, x), min(self.w, x + w)):
            self.set(i, y, c)

    def vline(self, x, y, h, c):
        if not (0 <= x < self.w):
            return
        for j in range(max(0, y), min(self.h, y + h)):
            self.set(x, j, c)

    def line(self, x0, y0, x1, y1, c):
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        while True:
            self.set(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def poly(self, pts, c, edge=None):
        pts = [(int(round(x)), int(round(y))) for x, y in pts]
        ys = [p[1] for p in pts]
        for y in range(min(ys), max(ys) + 1):
            xs = []
            n = len(pts)
            for i in range(n):
                x0, y0 = pts[i]
                x1, y1 = pts[(i + 1) % n]
                if y0 == y1:
                    continue
                if (y0 <= y < y1) or (y1 <= y < y0):
                    xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
            xs.sort()
            for k in range(0, len(xs) - 1, 2):
                a, b = int(round(xs[k])), int(round(xs[k + 1]))
                if b < a:
                    a, b = b, a
                self.hline(a, y, b - a + 1, c)
        if edge:
            n = len(pts)
            for i in range(n):
                x0, y0 = pts[i]
                x1, y1 = pts[(i + 1) % n]
                self.line(x0, y0, x1, y1, edge)

    def ellipse(self, cx, cy, rx, ry, c, fill=True, edge=None):
        rx, ry = float(rx), float(ry)
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                d = ((x + 0.5 - cx) / (rx + 0.5)) ** 2 + ((y + 0.5 - cy) / (ry + 0.5)) ** 2
                if fill and d <= 1.0:
                    if edge is None or d > 0.62:
                        self.set(x, y, c)
                if edge is not None and 0.62 < d <= 1.0:
                    self.set(x, y, edge)

    def disc(self, cx, cy, r, c, edge=None):
        self.ellipse(cx, cy, r, r, c, True, edge)

    # --- текстуры ----------------------------------------------------------
    def gradient(self, x, y, w, h, colors, axis="v", dither=True, bayer=BAYER4):
        """Градиент по рампе `colors` с упорядоченным дизерингом."""
        n = len(colors)
        bn = len(bayer)
        lvl = bn * bn
        for j in range(h):
            for i in range(w):
                t = (j / max(1, h - 1)) if axis == "v" else (i / max(1, w - 1))
                f = t * (n - 1)
                k = int(f)
                frac = f - k
                if dither:
                    th = bayer[(x + i) % bn][(y + j) % bn] / float(lvl)
                    if frac > th and k + 1 < n:
                        k += 1
                self.set(x + i, y + j, colors[min(k, n - 1)])

    def radial(self, cx, cy, rx, ry, colors, dither=True, bayer=BAYER4):
        n = len(colors)
        bn = len(bayer)
        lvl = bn * bn
        x0, x1 = int(cx - rx), int(cx + rx) + 1
        y0, y1 = int(cy - ry), int(cy + ry) + 1
        for y in range(y0, y1):
            for x in range(x0, x1):
                d = (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2) ** 0.5
                if d > 1.0:
                    continue
                f = d * (n - 1)
                k = int(f)
                frac = f - k
                if dither:
                    th = bayer[x % bn][y % bn] / float(lvl)
                    if frac > th and k + 1 < n:
                        k += 1
                self.set(x, y, colors[min(k, n - 1)])

    def noise(self, x, y, w, h, colors, amount=0.5, seed=1, alpha=None):
        rnd = random.Random(seed)
        for j in range(h):
            for i in range(w):
                if rnd.random() < amount:
                    c = rnd.choice(colors)
                    if alpha is not None:
                        c = (c[0], c[1], c[2], alpha)
                    self.set(x + i, y + j, c)

    def grain(self, x, y, w, h, k=0.10, seed=2, alpha=None):
        """Случайное осветление/затемнение уже нарисованного — фактура камня."""
        rnd = random.Random(seed)
        for j in range(y, y + h):
            for i in range(x, x + w):
                if not self.ok(i, j):
                    continue
                r, g, b, a = self.get(i, j)
                if a == 0:
                    continue
                f = 1 + rnd.uniform(-k, k)
                c = (
                    max(0, min(255, int(r * f))),
                    max(0, min(255, int(g * f))),
                    max(0, min(255, int(b * f))),
                    a,
                )
                if alpha is not None:
                    c = (c[0], c[1], c[2], alpha)
                self.put(i, j, c)

    def bevel(self, x, y, w, h, light, dark, t=1, soft=None):
        """Внутренняя фаска: свет сверху-слева, тень снизу-справа."""
        for k in range(t):
            lc = light if soft is None else mix(light, (0, 0, 0, 0), k / soft)
            dc = dark if soft is None else mix(dark, (0, 0, 0, 0), k / soft)
            self.hline(x + k, y + k, w - 2 * k, lc)
            self.vline(x + k, y + k, h - 2 * k, lc)
            self.hline(x + k, y + h - 1 - k, w - 2 * k, dc)
            self.vline(x + w - 1 - k, y + k, h - 2 * k, dc)

    def inner_shadow(self, x, y, w, h, color, t=3):
        for k in range(t):
            a = int(C(color)[3] * (1 - k / float(t)))
            c = (C(color)[0], C(color)[1], C(color)[2], a)
            self.hline(x, y + k, w, c)
            self.vline(x + k, y, h, c)

    def inner_glow(self, x, y, w, h, color, t=3):
        for k in range(t):
            a = int(C(color)[3] * (1 - k / float(t)))
            c = (C(color)[0], C(color)[1], C(color)[2], a)
            self.hline(x + k, y + h - 1 - k, w - 2 * k, c)
            self.vline(x + w - 1 - k, y + k, h - 2 * k, c)

    # --- композиция --------------------------------------------------------
    def blit(self, other, dx, dy, alpha=255, mask=None):
        for j in range(other.h):
            for i in range(other.w):
                c = other.get(i, j)
                if c[3] == 0:
                    continue
                if mask is not None and mask.get(i, j)[3] == 0:
                    continue
                if alpha < 255:
                    c = (c[0], c[1], c[2], int(c[3] * alpha / 255))
                self.set(dx + i, dy + j, c)

    def blit_center(self, other, cx, cy, alpha=255):
        self.blit(other, cx - other.w // 2, cy - other.h // 2, alpha)

    def mirror_x(self, src=None):
        src = src or self
        c = Canvas(src.w, src.h)
        for j in range(src.h):
            for i in range(src.w):
                c.put(src.w - 1 - i, j, src.get(i, j))
        return c

    def mirror_y(self, src=None):
        src = src or self
        c = Canvas(src.w, src.h)
        for j in range(src.h):
            for i in range(src.w):
                c.put(i, src.h - 1 - j, src.get(i, j))
        return c

    def rotate90(self, src=None, ccw=False):
        src = src or self
        c = Canvas(src.h, src.w)
        for j in range(src.h):
            for i in range(src.w):
                if ccw:
                    c.put(j, src.w - 1 - i, src.get(i, j))
                else:
                    c.put(src.h - 1 - j, i, src.get(i, j))
        return c

    def trim(self):
        x0, y0, x1, y1 = self.w, self.h, -1, -1
        for j in range(self.h):
            for i in range(self.w):
                if self.get(i, j)[3]:
                    x0 = min(x0, i)
                    y0 = min(y0, j)
                    x1 = max(x1, i)
                    y1 = max(y1, j)
        if x1 < 0:
            return Canvas(1, 1), 0, 0
        return self.sub(x0, y0, x1 - x0 + 1, y1 - y0 + 1), x0, y0

    def outline(self, color, inside=False, alpha_min=1):
        """Контур по силуэту непрозрачных пикселей (классика пиксель-арта)."""
        src = self.clone()
        for j in range(self.h):
            for i in range(self.w):
                a = self.get(i, j)[3]
                if inside:
                    if a >= alpha_min:
                        nb = [
                            src.get(i - 1, j)[3],
                            src.get(i + 1, j)[3],
                            src.get(i, j - 1)[3],
                            src.get(i, j + 1)[3],
                        ]
                        if any(v < alpha_min for v in nb):
                            self.put(i, j, color)
                else:
                    if a < alpha_min:
                        nb = [
                            src.get(i - 1, j)[3],
                            src.get(i + 1, j)[3],
                            src.get(i, j - 1)[3],
                            src.get(i, j + 1)[3],
                        ]
                        if any(v >= alpha_min for v in nb):
                            self.put(i, j, color)
        return self

    def drop_shadow(self, dx, dy, color, blur=0):
        """Тень под силуэтом (расширяет холст)."""
        w, h = self.w + abs(dx) + blur * 2, self.h + abs(dy) + blur * 2
        ox, oy = blur + max(0, -dx), blur + max(0, -dy)
        c = Canvas(w, h)
        sh = Canvas(self.w, self.h)
        for j in range(self.h):
            for i in range(self.w):
                if self.get(i, j)[3] >= 8:
                    sh.put(i, j, color)
        for k in range(blur, 0, -1):
            a = int(C(color)[3] * (k / (blur + 1.0)) * 0.5)
            cc = (C(color)[0], C(color)[1], C(color)[2], a)
            grow = Canvas(sh.w + k * 2, sh.h + k * 2)
            grow.blit(sh, k, k, 255)
            c.blit(grow, ox + dx - k, oy + dy - k, 255)
        c.blit(sh, ox + dx, oy + dy)
        c.blit(self, ox, oy)
        return c

    def stats(self):
        n = 0
        cols = set()
        for j in range(self.h):
            for i in range(self.w):
                p = self.get(i, j)
                if p[3]:
                    n += 1
                    cols.add(p)
        return {"pixels": n, "colors": len(cols)}
