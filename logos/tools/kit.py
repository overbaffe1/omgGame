"""
kit.py — крошечный процедурный дизайн-движок для логотипов кино-клуба «СИНХРОН».

Один и тот же набор примитивов умеет:
  * писать SVG (чистый вектор, всё в путях);
  * писать MVG (родной формат рисования ImageMagick), который растеризуется в PNG
    по слоям — с блюром, прозрачностью, режимами наложения и киношной текстурой
    (зерно, виньетка, мягкое свечение).

Система координат: дизайн идёт в условных единицах (du), по умолчанию 1000×1000,
начало в левом верхнем углу, y вниз. Масштаб до пикселей задаётся коэффициентом k.
"""

import math
import os
import random
import subprocess

FONT = "DejaVu-Sans-Bold"
FONT_SERIF = "DejaVu-Serif"
FONT_MONO = "DejaVu-Sans-Mono"

_HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(_HERE, "..", "build")
SVGD = os.path.join(_HERE, "..", "svg")
PNGD = os.path.join(_HERE, "..", "png")


def _f(v):
    if isinstance(v, int) or float(v).is_integer():
        return str(int(v))
    s = f"{v:.3f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def _rgb(c):
    c = c.strip()
    if c.startswith("#") and len(c) == 7:
        return f"rgb({int(c[1:3],16)},{int(c[3:5],16)},{int(c[5:7],16)})"
    return c


def mat_mul(m1, m2):
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (a1 * a2 + c1 * b2, b1 * a2 + d1 * b2,
            a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1)


def mat_apply(m, x, y):
    a, b, c, d, e, f = m
    return (a * x + c * y + e, b * x + d * y + f)


_TEXTW = {}


def text_width(s, size, font=FONT, ls=0.0):
    key = (s, font)
    if key not in _TEXTW:
        out = subprocess.run(
            ["convert", "-font", font, "-pointsize", "100", f"label:{s}",
             "-format", "%w", "info:"], capture_output=True, text=True)
        _TEXTW[key] = float(out.stdout.strip() or len(s) * 62)
    return _TEXTW[key] * size / 100.0 + ls * max(0, len(s) - 1)


class Layer:
    def __init__(self, art, blur=0.0, opacity=1.0, mode="over", bg="none"):
        self.art = art
        self.blur = blur
        self.opacity = opacity
        self.mode = mode
        self.bg = bg
        self.mvg = []
        self.svg = []

    # --- матрицы
    def push(self, *m):
        mm = m[0] if len(m) == 1 else tuple(m)
        self.art._stack.append(mat_mul(self.art._stack[-1], mm))

    def pop(self):
        self.art._stack.pop()

    @property
    def m(self):
        return self.art._stack[-1]

    def _emit(self, mvg):
        self.mvg.append(mvg)

    # --- геометрия
    def path(self, pts, fill=None, stroke=None, sw=0.0, opacity=1.0, close=True,
             cap="round", join="round", dash=None):
        """Ломаная/многоугольник в дизайнерских координатах."""
        k = self.art.k
        p = [mat_apply(self.m, x, y) for (x, y) in pts]
        d = "M " + " L ".join(f"{_f(x*k)},{_f(y*k)}" for x, y in p)
        if close and len(p) > 2:
            d += " Z"
        self._draw(d, p, fill=fill, stroke=stroke, sw=sw, opacity=opacity,
                   close=close, cap=cap, join=join, dash=dash)

    def _draw(self, d, p, fill=None, stroke=None, sw=0.0, opacity=1.0,
              close=True, cap="round", join="round", dash=None, already_scaled=True):
        k = self.art.k
        # ---------- SVG
        at = [f'fill="{fill}"' if fill else 'fill="none"']
        if stroke and sw:
            at += [f'stroke="{stroke}"', f'stroke-width="{_f(sw*k)}"',
                   f'stroke-linecap="{cap}"', f'stroke-linejoin="{join}"']
            if dash:
                at.append(f'stroke-dasharray="{dash}"')
        if opacity != 1:
            at.append(f'opacity="{_f(opacity)}"')
        self.svg.append(f'<path d="{d}" {" ".join(at)}/>')

        # ---------- MVG
        # Внимание: в MVG у ImageMagick `fill 'none'` не отключает заливку —
        # замкнутый `path` всё равно заливается чёрным. Поэтому контуры без
        # заливки рисуем примитивом `polyline`, который не заливается никогда.
        cmds = ["push graphic-context"]
        if fill:
            cmds.append(f"fill '{_rgb(fill)}'")
        else:
            cmds.append("fill 'none'")
        if stroke and sw:
            cmds += [f"stroke '{_rgb(stroke)}'", f"stroke-width {_f(sw*k)}",
                     f"stroke-linecap {cap}", f"stroke-linejoin {join}"]
            if dash:
                cmds.append(f"stroke-dasharray {dash}")
        else:
            cmds.append("stroke 'none'")
        if opacity != 1:
            if fill:
                cmds.append(f"fill-opacity {_f(opacity)}")
            if stroke and sw:
                cmds.append(f"stroke-opacity {_f(opacity)}")
        if fill:
            cmds.append(f"path '{d}'")
        else:
            pts_s = " ".join(f"{_f(x*k)},{_f(y*k)}" for x, y in p)
            if close and len(p) > 2:
                pts_s += f" {_f(p[0][0]*k)},{_f(p[0][1]*k)}"
            cmds.append(f"polyline {pts_s}")
        cmds.append("pop graphic-context")
        self._emit(" ".join(cmds))

    def rect(self, x, y, w, h, r=0.0, **kw):
        if r <= 0:
            self.path([(x, y), (x + w, y), (x + w, y + h), (x, y + h)], **kw)
        else:
            self.roundrect(x, y, w, h, r, **kw)

    def roundrect(self, x, y, w, h, r, seg=10, **kw):
        r = max(0.0, min(r, w / 2, h / 2))
        pts = []
        for cx, cy, a0, a1 in ((x + w - r, y + r, -90, 0), (x + w - r, y + h - r, 0, 90),
                               (x + r, y + h - r, 90, 180), (x + r, y + r, 180, 270)):
            for i in range(seg + 1):
                a = math.radians(a0 + (a1 - a0) * i / seg)
                pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        self.path(pts, **kw)

    def circle(self, cx, cy, r, **kw):
        self.ellipse(cx, cy, r, r, **kw)

    def ellipse(self, cx, cy, rx, ry, rot=0.0, seg=96, **kw):
        pts = []
        ar = math.radians(rot)
        for i in range(seg):
            a = 2 * math.pi * i / seg
            x, y = rx * math.cos(a), ry * math.sin(a)
            pts.append((cx + x * math.cos(ar) - y * math.sin(ar),
                        cy + x * math.sin(ar) + y * math.cos(ar)))
        self.path(pts, **kw)

    def arc(self, cx, cy, r, a0, a1, seg=None, **kw):
        span = a1 - a0
        if seg is None:
            seg = max(8, int(abs(span) / 2.5))
        pts = []
        for i in range(seg + 1):
            a = math.radians(a0 + span * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        self.path(pts, **{"close": False, **kw})

    def line(self, x1, y1, x2, y2, color="#fff", w=2, opacity=1.0, cap="round"):
        self.path([(x1, y1), (x2, y2)], stroke=color, sw=w, opacity=opacity,
                  close=False, cap=cap)

    def star(self, cx, cy, r_out, r_in, n=4, fill=None, start=0.0, **kw):
        pts = []
        for i in range(2 * n):
            r = r_out if i % 2 == 0 else r_in
            a = math.radians(start + i * 180.0 / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        self.path(pts, fill=fill, **kw)

    def text(self, x, y, s, size=24, fill="#F2EAD9", font=FONT, anchor="middle",
             ls=0.0, opacity=1.0, rot=0.0, serif=False):
        font = FONT_SERIF if serif else font
        w = text_width(s, size, font, ls)
        dx = -w / 2 if anchor == "middle" else (-w if anchor == "end" else 0)
        m = self.m
        mscale = math.hypot(m[0], m[1]) or 1.0
        mang = math.degrees(math.atan2(m[1], m[0]))
        bx, by = mat_apply(m, x + dx, y)
        k = self.art.k
        tf = f'translate({_f(bx*k)},{_f(by*k)})'
        if rot + mang:
            tf += f' rotate({_f(rot + mang)})'
        attrs = (f'font-family="{font}, Verdana, Arial, sans-serif" '
                 f'font-size="{_f(size*k*mscale)}" fill="{fill}"')
        if ls:
            attrs += f' letter-spacing="{_f(ls*k*mscale)}"'
        if opacity != 1:
            attrs += f' opacity="{_f(opacity)}"'
        self.svg.append(f'<text transform="{tf}" {attrs}>{s}</text>')

        cmds = ["push graphic-context", f"font '{font}'",
                f"font-size {_f(size*k*mscale)}"]
        if ls:
            cmds.append(f"kerning {_f(ls*k*mscale)}")
        cmds += [f"fill '{_rgb(fill)}'", "stroke 'none'"]
        if opacity != 1:
            cmds.append(f"fill-opacity {_f(opacity)}")
        cmds.append(f"translate {_f(bx*k)},{_f(by*k)}")
        if rot + mang:
            cmds.append(f"rotate {_f(rot + mang)}")
        cmds += [f"text 0,0 '{s}'", "pop graphic-context"]
        self._emit(" ".join(cmds))


def _scale_path(d, k):
    out, num = [], ""
    for ch in d:
        if ch.isdigit() or ch == ".":
            num += ch
        else:
            if num:
                out.append(_f(float(num) * k))
                num = ""
            out.append(ch)
    if num:
        out.append(_f(float(num) * k))
    return "".join(out)


class Art:
    def __init__(self, k=1.08, bg="#0A0A0C"):
        self.k = k
        self.bg = bg
        self.layers = []
        self._stack = [(1, 0, 0, 1, 0, 0)]
        self.base = self.layer()

    def layer(self, blur=0.0, opacity=1.0, mode="over", bg="none"):
        L = Layer(self, blur=blur, opacity=opacity, mode=mode, bg=bg)
        self.layers.append(L)
        return L

    def __getattr__(self, item):
        if item.startswith("_"):
            raise AttributeError(item)
        return getattr(self.base, item)

    def push(self, *m):
        mm = m[0] if len(m) == 1 else tuple(m)
        self._stack.append(mat_mul(self._stack[-1], mm))
        return self

    def pop(self):
        self._stack.pop()

    def tr(self, x, y):
        self.push(1, 0, 0, 1, x, y)

    def rot(self, deg, cx=None, cy=None):
        a = math.radians(deg)
        c, s = math.cos(a), math.sin(a)
        if cx is not None and cy is not None:
            self.push(1, 0, 0, 1, cx, cy)
            self.push(c, s, -s, c, 0, 0)
            self.push(1, 0, 0, 1, -cx, -cy)
        else:
            self.push(c, s, -s, c, 0, 0)

    def skew(self, sx=0.0, sy=0.0):
        self.push(1, math.tan(math.radians(sy)), math.tan(math.radians(sx)), 1, 0, 0)

    def scale(self, sx, sy=None):
        self.push(sx, 0, 0, sx if sy is None else sy, 0, 0)

    # --- вывод
    def to_svg(self, w_px, h_px):
        body = "\n".join("  " + s for s in self.base.svg if s.strip())
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w_px} {h_px}" '
                f'width="{w_px}" height="{h_px}">\n{body}\n</svg>\n')

    def _mvg_for(self, layer, w, h):
        return "\n".join(["push graphic-context", f"viewbox 0 0 {w} {h}"]
                         + layer.mvg + ["pop graphic-context"])

    def render(self, out_png, w_px=1080, h_px=None, ss=2, texture=None):
        h_px = h_px or w_px
        os.makedirs(BUILD, exist_ok=True)
        os.makedirs(os.path.dirname(os.path.abspath(out_png)) or ".", exist_ok=True)
        W, H = int(w_px * ss), int(h_px * ss)

        bg = self.bg
        if isinstance(bg, str):
            bc = ["-size", f"{W}x{H}", f"xc:{bg}"]
        else:
            c1, c2, kind = bg
            if kind == "v":
                bc = ["-size", f"{W}x{H}", f"gradient:{c1}-{c2}"]
            elif kind == "h":
                bc = ["-size", f"{W}x{H}", f"gradient:{c1}-{c2}", "-rotate", "90"]
            else:
                bc = ["-size", f"{W}x{H}", f"radial-gradient:{c1}-{c2}"]
        cur = os.path.join(BUILD, "_bg.png")
        subprocess.run(["convert"] + bc + [cur], check=True)

        for i, L in enumerate(self.layers):
            if not L.mvg:
                continue
            mf = os.path.join(BUILD, f"_l{i+1}.mvg")
            open(mf, "w").write(self._mvg_for(L, W, H))
            lf = os.path.join(BUILD, f"_l{i+1}.png")
            cmd = ["convert", "-size", f"{W}x{H}", "xc:none",
                   "-draw", "@" + mf]
            if L.blur:
                cmd += ["-blur", f"0x{L.blur*ss:.1f}"]
            cmd += [lf]
            subprocess.run(cmd, check=True)
            nxt = os.path.join(BUILD, f"_m{i+1}.png")
            mcmd = ["convert", cur, lf]
            if L.opacity < 1:
                mcmd += ["-compose", "blend",
                         "-define", f"compose:args={int(round(L.opacity*100))}",
                         "-composite", nxt]
            else:
                mcmd += ["-compose", L.mode, "-composite", nxt]
            subprocess.run(mcmd, check=True)
            cur = nxt

        tex = texture or {}
        grain = tex.get("grain", 0.0)
        vig = tex.get("vignette", 0.0)
        bloom = tex.get("bloom", 0.0)
        stage = cur
        if bloom:
            bl = os.path.join(BUILD, "_bloom.png")
            subprocess.run(["convert", stage, "-colorspace", "gray", "-level", "80%,100%",
                            "-blur", f"0x{bloom*ss:.1f}", bl], check=True)
            nxt = os.path.join(BUILD, "_mb.png")
            subprocess.run(["convert", stage, bl, "-compose", "screen",
                            "-composite", nxt], check=True)
            stage = nxt
        if grain:
            nz = os.path.join(BUILD, "_noise.png")
            subprocess.run(["convert", "-size", f"{W}x{H}", "xc:gray50", "-attenuate",
                            f"{grain:.2f}", "+noise", "Gaussian", "-colorspace", "Gray",
                            "-colorspace", "sRGB", nz], check=True)
            nxt = os.path.join(BUILD, "_mg.png")
            subprocess.run(["convert", stage, nz, "-compose", "overlay",
                            "-define", f"compose:args={max(5, int(grain*70))}",
                            "-composite", nxt], check=True)
            stage = nxt
        if vig:
            # мягкая виньетка: центр 100%, края (1 - vig). Значение vig — глубина.
            vm = os.path.join(BUILD, "_vig.png")
            subprocess.run(["convert", "-size", f"{W}x{H}", "radial-gradient:white-black",
                            "-gamma", "1.6", "-evaluate", "multiply", f"{1-vig:.3f}",
                            "-evaluate", "add", f"{vig*100:.1f}%", vm], check=True)
            nxt = os.path.join(BUILD, "_mv.png")
            subprocess.run(["convert", stage, vm, "-compose", "multiply",
                            "-composite", nxt], check=True)
            stage = nxt
        subprocess.run(["convert", stage, "-resize", f"{w_px}x{h_px}",
                        "-filter", "Lanczos", "-unsharp", "0x0.75+0.65+0.012",
                        "-depth", "8", "-strip", out_png], check=True)
        return out_png


def rnd_seed(seed):
    return random.Random(seed)
