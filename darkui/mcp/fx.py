"""Анимации атласа: пламя факела, угли, пульс руны, дым и мягкие свечения.
Кадры идут подряд, поэтому в JSON и .aseprite складываются в теги."""
import math
import random

from canvas import Canvas, C, mix, darken, lighten
import palette as P
from brushes import stud


def _flame_profile(y, H, phase, seed):
    """Полуширина языка пламени на строке y (0 — верх)."""
    t = y / float(H - 1)  # 0 верх, 1 низ
    hgt = 1 - t
    base = math.sin(math.pi * (0.08 + 0.92 * hgt)) ** 0.55
    wob = (
        0.16 * math.sin(hgt * 7.5 + phase * 2.1)
        + 0.10 * math.sin(hgt * 13.0 - phase * 3.3)
        + 0.05 * math.sin(hgt * 21.0 + phase * 5.0)
    )
    return max(0.0, base * (1 + wob)), 0.9 * math.sin(hgt * 4.0 + phase * 1.4) + 0.5 * math.sin(hgt * 9.0 - phase)


def fx_flame(i=0, n=8, W=30, H=38):
    def paint():
        cv = Canvas(W, H)
        phase = (i / float(n)) * 2 * math.pi
        cx = W / 2.0
        maxw = W / 2.0 - 3

        def prof(t):
            base = (t ** 0.55) * (1.0 - 0.13 * math.sin(t * 9.0 + phase * 2))
            lick = 1.0 - 0.30 * max(0.0, math.sin(t * 3.2 - phase * 1.6))
            return max(0.0, min(1.1, base * lick))

        for y in range(H):
            t = y / float(H - 1)
            p = prof(t)
            if p <= 0.02:
                continue
            shift = 1.6 * math.sin(t * 5.0 + phase) * (1 - t) + 0.8 * math.sin(t * 11 - phase * 2) * (1 - t)
            w = maxw * p
            xc = cx + shift
            x0, x1 = int(xc - w), int(xc + w)
            heat = t ** 1.25
            for x in range(x0, x1 + 1):
                u = abs(x - xc) / max(0.6, w)
                f = heat * (1 - u * 0.72)
                idx = int(max(1, min(7, 1.5 + f * 6.0)))
                c = C(P.EMBER[idx])
                if u > 0.86:
                    c = darken(c, 0.35)
                cv.put(x, y, c)
            cv.put(x0, y, darken(C(P.EMBER[2]), 0.35))
            cv.put(x1, y, darken(C(P.EMBER[2]), 0.35))
        # искры над кончиком
        rnd = random.Random(4200 + i * 17)
        hot = C(P.EMBER[6])
        warm = C(P.EMBER[4])
        for k in range(3):
            sx = int(cx + rnd.uniform(-5, 5))
            sy = int(1 + ((i * 3 + k * 4) % 7))
            a = 130 + rnd.randrange(100)
            cv.put(sx, sy, (hot[0], hot[1], hot[2], a))
            cv.put(sx, sy + 1, (warm[0], warm[1], warm[2], a // 2))
        return cv

    return paint


def fx_ember(i=0, n=6, S=14):
    def paint():
        cv = Canvas(S, S)
        t = i / float(n)
        x = S / 2.0 + 3.2 * math.sin(t * math.pi * 2 + 0.6)
        y = S - 3 - t * (S - 5)
        fade = 1 - t * 0.7
        r = 3.2 * (1 - t * 0.45)
        for j in range(S):
            for k in range(S):
                d = math.hypot(k + 0.5 - x, j + 0.5 - y)
                if d <= r + 3.2:
                    f = max(0.0, 1 - d / (r + 3.2))
                    a = int(235 * f * fade)
                    col = mix(P.EMBER[3], P.EMBER[7], f)
                    cv.set(k, j, (col[0], col[1], col[2], a))
        # хвост
        for k in range(1, 4):
            yy = int(y) + k
            if 0 <= yy < S:
                a = int(90 * fade / k)
                cv.set(int(x), yy, (C(P.EMBER[4])[0], C(P.EMBER[4])[1], C(P.EMBER[4])[2], a))
        return cv

    return paint


def fx_rune_pulse(i=0, n=6, S=32):
    def paint():
        cv = Canvas(S, S)
        t = i / float(n)
        pulse = 0.5 + 0.5 * math.sin(t * 2 * math.pi)
        cx = cy = S / 2.0
        for j in range(S):
            for k in range(S):
                d = math.hypot(k + 0.5 - cx, j + 0.5 - cy) / (S / 2.0)
                if d > 1:
                    continue
                f = (1 - d) ** 1.5
                a = int(235 * f * (0.35 + 0.65 * pulse))
                col = mix(P.BLOOD[3], P.EMBER[6], f * pulse)
                cv.set(k, j, (col[0], col[1], col[2], a))
        # глиф
        gl = P.EMBER[7] if pulse > 0.45 else P.EMBER[5]
        cv.line(11, 9, 11, 23, gl)
        cv.line(21, 9, 21, 23, gl)
        cv.line(11, 16, 21, 12, gl)
        cv.line(11, 20, 21, 17, (C(gl)[0], C(gl)[1], C(gl)[2], 190))
        for (x, y) in [(11, 9), (21, 9), (16, 24)]:
            cv.set(x, y, P.EMBER[7])
        return cv

    return paint


def fx_smoke(i=0, n=6, W=26, H=32):
    def paint():
        cv = Canvas(W, H)
        t = i / float(n)
        rnd = random.Random(77 + i)
        for b in range(4):
            bt = (t + b * 0.25) % 1.0
            cx = W / 2.0 + math.sin(bt * 6 + b) * 3.2
            cy = H - 4 - bt * (H - 8)
            r = 2.6 + bt * 6.2
            a = int(195 * (1 - bt) ** 1.15)
            for j in range(H):
                for k in range(W):
                    d = math.hypot(k + 0.5 - cx, j + 0.5 - cy)
                    if d <= r:
                        f = (1 - d / r) ** 1.5
                        col = mix("#1b1a19", "#5a564f", f * 0.8)
                        cv.set(k, j, (col[0], col[1], col[2], min(255, int(a * f))))
        return cv

    return paint


def glow(color="#e8c45f", S=56, power=2.2):
    def paint():
        cv = Canvas(S, S)
        cx = cy = S / 2.0
        c = C(color)
        for j in range(S):
            for k in range(S):
                d = math.hypot(k + 0.5 - cx, j + 0.5 - cy) / (S / 2.0)
                if d > 1:
                    continue
                a = int(255 * (1 - d) ** power)
                cv.put(k, j, (c[0], c[1], c[2], a))
        return cv

    return paint


def register(g):
    for i in range(8):
        g("fx_flame_%d" % i, "fx", fx_flame(i, 8), tag="flame", desc="Пламя, кадр %d" % i)
    for i in range(6):
        g("fx_ember_%d" % i, "fx", fx_ember(i, 6), tag="ember", desc="Уголёк, кадр %d" % i)
    for i in range(6):
        g("fx_rune_%d" % i, "fx", fx_rune_pulse(i, 6), tag="rune_pulse", desc="Пульс руны, кадр %d" % i)
    for i in range(6):
        g("fx_smoke_%d" % i, "fx", fx_smoke(i, 6), tag="smoke", desc="Дым, кадр %d" % i)
    g("glow_gold", "fx", glow("#e8c45f"), desc="Мягкое золотое свечение")
    g("glow_red", "fx", glow("#d14733"), desc="Кровавое свечение")
    g("glow_blue", "fx", glow("#3f9ce0"), desc="Свечение маны")
    g("glow_green", "fx", glow("#5aa54c"), desc="Ядовитое свечение")
