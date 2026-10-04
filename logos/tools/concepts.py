"""
concepts.py — десять идей логотипа кино-клуба «СИНХРОН» (Псков), нарисованных кодом.

Каждый концепт — функция build(art), которая рисует картинку в дизайнерском
пространстве 1000×1000. Ниже, в CONCEPTS, к каждой картинке приложен текст:
что это, почему работает и как это же снять/сделать руками в реальной жизни.
"""

import math

from kit import Art, rnd_seed, FONT, FONT_SERIF
from wordmark import draw_word, word_width, sprockets, sprockets_along, dust, \
    scratches, arc_text, chair

INK = "#08080B"        # кинозальный чёрный
CHAR = "#14141A"       # уголь
IVORY = "#F2EAD9"      # тёплая бумага / свет
AMBER = "#F0B24A"      # лампа проектора
GOLD = "#FFD98A"       # горячий блик
BLUE = "#6FA8C7"       # холодный свет / ночь
STEEL = "#2A3038"
PAPER = "#EDE6D8"


def _center_word(a, layer, text, y, cell, gap=18, color=IVORY, opacity=1.0, sw=12.0):
    w = word_width(text, cell, gap)
    draw_word(layer, text, (1000 - w) / 2, y, cell=cell, gap=gap, sw=sw,
              color=color, opacity=opacity)
    return w


# ----------------------------------------------------------------------------- 01

def c01_splice(a):
    """X из двух склеенных кусков плёнки."""
    rnd = rnd_seed(1)
    g = a.layer(blur=80, opacity=0.7, mode="screen")
    g.circle(500, 470, 230, fill=AMBER, opacity=0.30)

    cols = ("#17171E", "#101015")
    for ang, col in ((-34, cols[0]), (34, cols[1])):
        a.tr(500, 470)
        a.rot(ang)
        L = a.layer()
        L.rect(-470, -104, 940, 208, r=10, fill=col, stroke=IVORY, sw=1.8,
               opacity=0.98)
        for x in range(-436, 437, 84):
            L.line(x, -100, x, 100, color=IVORY, w=1.2, opacity=0.10)
        sprockets_along(L, (-452, -74), (452, -74), 12, 20, 13, 6, INK)
        sprockets_along(L, (-452, 74), (452, 74), 12, 20, 13, 6, INK)
        t = a.layer()
        t.text(0, -80, "СИНХРОН · 35 ММ", size=16, fill=AMBER, anchor="middle", ls=4,
               opacity=0.75)
        a.pop()
        a.pop()

    # склейка: полоска липкой ленты поверх верхней плёнки
    a.tr(500, 470)
    a.rot(34)
    T = a.layer()
    T.rect(300, -112, 34, 224, r=6, fill=AMBER, opacity=0.92)
    T.rect(288, -112, 4, 224, fill=INK, opacity=0.45)
    T.rect(342, -112, 4, 224, fill=INK, opacity=0.45)
    T.text(317, 22, "СТЫК", size=13, fill=INK, anchor="middle", ls=2, rot=-90,
           opacity=0.75)
    a.pop()
    a.pop()

    s = a.layer()
    scratches(s, rnd, (-20, -20, 1020, 1020), 90, color=IVORY, opmax=0.10)

    _center_word(a, a.base, "СИНХРОН", 792, 70, gap=13, opacity=0.98)
    a.text(500, 902, "КИНО-КЛУБ · ПСКОВ", size=22, fill=IVORY, ls=7, opacity=0.6)
    return dict(grain=0.17, vignette=0.30, bloom=10)


# ----------------------------------------------------------------------------- 02

def _beam_poly(apex, top_x0, top_x1, y_top=-40):
    return [apex, (top_x0, y_top), (top_x1, y_top)]


def c02_beams(a):
    """X из двух лучей, скрестившихся в воздухе."""
    rnd = rnd_seed(2)
    apexA, apexB = (128, 986), (872, 986)
    A_top, B_top = (718, 842), (156, 282)

    for apex, (t0, t1) in ((apexA, A_top), (apexB, B_top)):
        L = a.layer(blur=22, opacity=0.85, mode="screen")
        L.path([apex, (t0, -60), (t1, -60)], fill=AMBER, opacity=0.34)

    top = a.layer(blur=26, opacity=0.6, mode="screen")
    top.rect(-40, -70, 1080, 80, fill=AMBER, opacity=0.26)

    core = a.layer(blur=7, opacity=0.9, mode="screen")
    for apex, (t0, t1) in ((apexA, A_top), (apexB, B_top)):
        cxm = (t0 + t1) / 2
        core.path([apex, (cxm - 12, -60), (cxm + 12, -60)], fill=GOLD, opacity=0.72)
        flare = a.layer(blur=16, opacity=0.85, mode="screen")
        flare.path([apex, (cxm - 40, -60), (cxm + 40, -60)], fill=GOLD, opacity=0.26)

    c = a.layer()
    for apex, (t0, t1) in ((apexA, A_top), (apexB, B_top)):
        cxm = (t0 + t1) / 2
        for _ in range(150):
            t = rnd.uniform(0.05, 1.0) ** 0.72
            s = rnd.uniform(-1, 1)
            hw = (t1 - t0) / 2 * t
            x = apex[0] + (cxm - apex[0]) * t + s * hw
            y = apex[1] + (-60 - apex[1]) * t
            c.circle(x, y, rnd.uniform(0.8, 3.0), fill=GOLD,
                     opacity=rnd.uniform(0.08, 0.7) * (1.0 - 0.55 * t))

    for cx0, flip in ((apexA[0], 1), (apexB[0], -1)):
        b = a.layer()
        cy0 = 936
        b.rect(cx0 - 88, cy0 - 54, 176, 108, r=12, fill="#131318",
               stroke=IVORY, sw=3.0, opacity=0.95)
        b.rect(cx0 - 62, cy0 - 36, 124, 72, r=8, fill="#050509", opacity=0.98)
        b.circle(cx0 + flip * 54, cy0, 33, fill="#0A0A0F", opacity=0.9)
        b.circle(cx0 + flip * 54, cy0, 25, fill=AMBER, opacity=1.0)
        b.circle(cx0 + flip * 54, cy0, 10, fill=GOLD, opacity=1.0)
        b.line(cx0 - 88, cy0 - 54, cx0 - 88, cy0 + 54, color=IVORY, w=2.6, opacity=0.5)
        b.line(cx0 - 44, cy0 + 54, cx0 + 44, cy0 + 54, color=IVORY, w=2, opacity=0.25)
        fl = a.layer(blur=20, opacity=0.75, mode="screen")
        fl.path([(cx0 + flip * 54, cy0), (cx0 + flip * 230, cy0 - 30),
                 (cx0 + flip * 230, cy0 + 30)], fill=GOLD, opacity=0.45)

    _center_word(a, a.base, "СИНХРОН", 646, 78, gap=15, opacity=0.99)
    a.text(500, 176, "24 КАДРА В СЕКУНДУ", size=19, fill=GOLD, ls=6, opacity=0.7)
    a.text(500, 840, "ДВА ЛУЧА · ОДНА ТОЧКА", size=22, fill=IVORY, ls=7, opacity=0.75)
    return dict(grain=0.30, vignette=0.26, bloom=8)


def _perforated(layer, color, glow=False):
    """Слово и перфорация «дырками» — одной и той же геометрией, для двух проходов."""
    op = 0.95 if glow else 1.0
    w = word_width("СИНХРОН", 106, 20)
    draw_word(layer, "СИНХРОН", (1000 - w) / 2, 447, cell=106, gap=20, sw=11,
              color=color, opacity=op)
    sprockets(layer, -46 + 22, 296, 13, 84, 22, 15, 7, color, opacity=op)
    sprockets(layer, -46 + 22, 704, 13, 84, 22, 15, 7, color, opacity=op)


def c03_negative(a):
    """Слово как свет, проходящий сквозь дырки плёнки."""
    a_lamp = a.layer(blur=60, opacity=0.9, mode="screen")
    a_lamp.rect(70, 330, 860, 340, r=0, fill=AMBER, opacity=0.42)
    a_lamp.rect(210, 392, 580, 216, r=0, fill=GOLD, opacity=0.32)

    st = a.layer()
    st.rect(-40, 250, 1080, 500, r=14, fill="#101015", stroke=IVORY, sw=1.5,
            opacity=0.95)
    for x in range(-40, 1041, 168):
        st.line(x, 258, x, 742, color=IVORY, w=1.1, opacity=0.07)
    st.text(60, 382, "СИНХРОН 400 · 35 ММ · ПСКОВ", size=16, fill=IVORY, ls=4,
            anchor="start", opacity=0.45)
    st.text(940, 648, "24A · ДУБЛЬ 1", size=16, fill=IVORY, ls=4, anchor="end",
            opacity=0.45)

    gl = a.layer(blur=9, opacity=0.9, mode="screen")
    _perforated(gl, AMBER, glow=True)
    cr = a.layer()
    _perforated(cr, "#FFF0C8")

    a.text(500, 200, "35 ММ", size=20, fill=IVORY, ls=6, opacity=0.4)
    a.text(500, 852, "КИНО-КЛУБ · ПСКОВ", size=24, fill=IVORY, ls=8, opacity=0.55)
    return dict(grain=0.13, vignette=0.34, bloom=10)


# ----------------------------------------------------------------------------- 04

def c04_titlecard(a):
    """Конструктивистский титр: бумага, линейки, семь клеток и X-лучи."""
    a.bg = PAPER
    rnd = rnd_seed(4)

    tone = a.layer(blur=90, opacity=0.5, mode="multiply")
    tone.circle(280, 180, 360, fill="#E2D8C4", opacity=0.9)
    tone.circle(760, 880, 330, fill="#E6DCC8", opacity=0.8)

    fib = a.layer()
    for _ in range(300):
        x, y = rnd.uniform(0, 1000), rnd.uniform(0, 1000)
        fib.line(x, y, x + rnd.uniform(-26, 26), y + rnd.uniform(-14, 14),
                 color="#8C7F63", w=rnd.uniform(0.5, 1.5),
                 opacity=rnd.uniform(0.02, 0.09))

    ink = a.layer()
    ink.line(58, 300, 942, 300, color=INK, w=2.6, opacity=0.9)
    ink.text(58, 268, "КИНО-КЛУБ", size=26, fill=INK, ls=9, anchor="start", opacity=0.85)
    ink.text(942, 268, "ПСКОВ", size=26, fill=INK, ls=9, anchor="end", opacity=0.85)
    ink.rect(920, 322, 22, 22, r=0, fill=AMBER, opacity=1.0)

    # крест-визир в правом верхнем углу — как на плашке киностудии
    vig = a.layer()
    vig.circle(846, 168, 46, fill=None, stroke=INK, sw=1.6, opacity=0.35)
    vig.line(846 - 62, 168, 846 + 62, 168, color=INK, w=1.6, opacity=0.35)
    vig.line(846, 168 - 62, 846, 168 + 62, color=INK, w=1.6, opacity=0.35)
    vig.circle(846, 168, 13, fill=None, stroke=INK, sw=1.2, opacity=0.3)

    # X-лучи из-за буквы
    rays = a.layer()
    for sgn in (1, -1):
        rays.line(500 - 300 * sgn, 470 - 300, 500 + 300 * sgn, 470 + 300,
                  color=AMBER, w=2.4, opacity=0.55)

    halo = a.layer()
    halo.circle(500, 470, 86, fill=AMBER, opacity=0.95)
    word = a.layer()
    _center_word(a, word, "СИНХРОН", 412, 116, gap=18, color=INK, opacity=1.0, sw=11.5)

    ink.line(58, 620, 942, 620, color=INK, w=2, opacity=0.5)
    ink.text(58, 664, "24 КАДРА В СЕКУНДУ", size=20, fill=INK, ls=6, anchor="start",
             opacity=0.8)
    ink.text(942, 664, "СМОТРЕТЬ ВМЕСТЕ", size=20, fill=INK, ls=6, anchor="end",
             opacity=0.8)
    ink.text(500, 716, "СЕАНС · РАЗГОВОР · СВЕТ", size=18, fill=INK, ls=8, opacity=0.55)

    # полоса «бумага 35 мм» с просечками
    bar = a.layer()
    bar.rect(58, 780, 884, 54, r=4, fill="#E8C87E", opacity=1.0)
    bar.rect(58, 780, 884, 54, r=4, fill=None, stroke=INK, sw=1.4, opacity=0.45)
    for i in range(13):
        x = 58 + 26 + i * 66
        bar.rect(x, 792, 30, 30, r=3, fill=INK, opacity=0.30)

    ink.text(58, 892, "ЛОФТ · СПОРТИВНАЯ 1Б", size=18, fill=INK, ls=5,
             anchor="start", opacity=0.6)
    ink.text(942, 892, "ДУБЛЬ 1", size=18, fill=INK, ls=5, anchor="end", opacity=0.6)
    return dict(grain=0.3, vignette=0.0, bloom=0)

def c05_phase(a):
    """Две оптические дорожки, которые сходятся в фазе — и в X."""
    rnd = rnd_seed(5)
    layA = a.layer(blur=9, opacity=0.92, mode="screen")
    layB = a.layer(blur=9, opacity=0.92, mode="screen")
    crisp = a.layer()

    def wave(x, seed):
        return (46 + 62 * abs(math.sin(x * 0.0128 + seed)) +
                22 * abs(math.sin(x * 0.052 + seed * 2.1)))

    specs = ((layA, AMBER, 0.7, 1, "ДОРОЖКА A"), (layB, BLUE, 2.4, -1, "ДОРОЖКА B"))
    for lay, col, seed, sgn, label in specs:
        y0 = 500 - sgn * 150
        y1 = 500 + sgn * 150
        for i in range(0, 96):
            x = -20 + i * 11
            t = (x + 20) / 1040.0
            yc = y0 + (y1 - y0) * t
            base = wave(x, seed)
            sync = 66 + 40 * abs(math.sin(x * 0.0205 + 1.6))
            m = max(0.0, 1 - abs(x - 500) / 210.0) ** 1.5
            h = base * (1 - m) + sync * m
            lay.rect(x, yc - h / 2, 9.5, h, fill=col, opacity=0.95)
            crisp.rect(x, yc - h / 2, 9.5, h, fill=col, opacity=0.38)
        # осевая линия дорожки — сам X
        ax = a.layer(blur=16, opacity=0.85, mode="screen")
        ax.path([(-20, y0), (1020, y1)], stroke=col, sw=7, opacity=0.55, close=False)
        ax2 = a.layer(blur=3, opacity=0.9, mode="screen")
        ax2.path([(-20, y0), (1020, y1)], stroke=GOLD, sw=2.4, opacity=0.75, close=False)
        crisp.path([(-20, y0), (1020, y1)], stroke=IVORY, sw=1.1, opacity=0.22,
                   close=False)
        lab = a.layer(blur=6, opacity=0.7, mode="screen")
        lab.text(96, y0 + 74 * sgn * -1 + (74 if sgn > 0 else -74), label, size=18,
                 fill=col, ls=6, rot=sgn * 16.6, opacity=0.9, anchor="start")
        crisp.text(96, y0 + 74 * sgn * -1 + (74 if sgn > 0 else -74), label, size=18,
                   fill=col, ls=6, rot=sgn * 16.6, opacity=1.0, anchor="start")

    lock = a.layer()
    lock.path([(500, 448), (552, 500), (500, 552), (448, 500)], close=True,
              fill=IVORY, opacity=0.97)
    lock.circle(500, 500, 14, fill=INK, opacity=0.85)
    lock.path([(500, 448), (552, 500), (500, 552), (448, 500)], close=True,
              fill=None, stroke=INK, sw=3, opacity=0.5)
    glow = a.layer(blur=44, opacity=0.85, mode="screen")
    glow.circle(500, 500, 86, fill=GOLD, opacity=0.60)
    ring = a.layer()
    ring.circle(500, 500, 52, fill=None, stroke=IVORY, sw=1.6, opacity=0.30)

    _center_word(a, a.base, "СИНХРОН", 762, 86, gap=15, opacity=0.99)
    a.text(500, 908, "ДВЕ ДОРОЖКИ · ОДНА ФАЗА", size=22, fill=IVORY, ls=7, opacity=0.72)
    return dict(grain=0.30, vignette=0.26, bloom=10)

def c06_lens(a):
    """Обод объектива: С = О = свет."""
    a.bg = ("#110E0B", "#05050A", "radial")
    cx, cy, r = 500, 486, 292

    glass = a.layer()
    glass.circle(cx, cy, r - 30, fill="#0D1118", opacity=1.0)
    glass.circle(cx, cy, r - 78, fill="#0A0D13", opacity=1.0)
    glass.arc(cx, cy, r - 42, 152, 208, stroke=IVORY, sw=2.6, opacity=0.26)
    glass.arc(cx, cy, r - 74, 168, 192, stroke=IVORY, sw=1.6, opacity=0.14)

    glow = a.layer(blur=70, opacity=0.8, mode="screen")
    glow.circle(cx, cy, 180, fill=AMBER, opacity=0.22)

    wedge = a.layer(blur=40, opacity=0.9, mode="screen")
    p1 = (cx + r * math.cos(math.radians(-26)), cy + r * math.sin(math.radians(-26)))
    p2 = (cx + r * math.cos(math.radians(26)), cy + r * math.sin(math.radians(26)))
    wedge.path([p1, (1040, 168), (1040, 804), p2], fill=AMBER, opacity=0.26)
    cone = a.layer(blur=10, opacity=0.85, mode="screen")
    cone.path([(cx + 282 * math.cos(math.radians(-24)), cy + 282 * math.sin(math.radians(-24))),
               (1000, 258), (1000, 714),
               (cx + 282 * math.cos(math.radians(24)), cy + 282 * math.sin(math.radians(24)))],
              fill=GOLD, opacity=0.16)
    flare = a.layer(blur=22, opacity=0.9, mode="screen")
    flare.circle(cx + 300, cy, 24, fill=GOLD, opacity=0.95)

    ring = a.layer()
    ring.arc(cx, cy, r, 27, 333, stroke=IVORY, sw=36, opacity=0.98)
    ring.arc(cx, cy, r, 27, 333, stroke="#6E6A62", sw=11, opacity=0.45)
    ring.line(cx - r - 30, cy, cx - r + 20, cy, color=IVORY, w=4.5, opacity=0.28)
    for s in (-27, 27):
        a1 = math.radians(s)
        ring.path([(cx + (r - 38) * math.cos(a1), cy + (r - 38) * math.sin(a1)),
                   (cx + (r + 22) * math.cos(a1), cy + (r + 22) * math.sin(a1))],
                  stroke=IVORY, sw=4.5, opacity=0.28, close=False)
    ring.line(cx + 68, cy, 1000, cy, color=IVORY, w=1.5, opacity=0.10)
    # задняя половина обода — тоньше, чтобы читалась катушка
    ring.arc(cx, cy, r, 30, 330, stroke=GOLD, sw=1.4, opacity=0.30)

    # табличка на стекле с названием
    plate = a.layer()
    plate.roundrect(cx, cy - 34, 0, 0, 0, fill=None)  # noop для совместимости
    plate.rect(cx - 196, cy - 33, 392, 66, r=6, fill="#08080B", opacity=0.86)
    plate.rect(cx - 196, cy - 33, 392, 66, r=6, fill=None, stroke=IVORY, sw=1.4,
               opacity=0.28)
    wg = a.layer(blur=11, opacity=0.6, mode="screen")
    _center_word(a, wg, "СИНХРОН", cy - 30, 62, gap=12, color=GOLD, opacity=0.55)
    wc = a.layer()
    _center_word(a, wc, "СИНХРОН", cy - 30, 62, gap=12, color="#FFF6E2", opacity=1.0)

    eng = a.layer()
    arc_text(eng, "СИНХРОН · КИНО-КЛУБ · ПСКОВ", cx, cy, r + 48, 19, 268, 196,
             IVORY, opacity=0.55, flip=True)
    arc_text(eng, "24 КАДРА/СЕК", cx, cy, r + 48, 17, 92, 74, IVORY, opacity=0.42,
             flip=False)

    a.text(500, 892, "КИНО-КЛУБ · ПСКОВ", size=23, fill=IVORY, ls=8, opacity=0.8)
    a.circle(500, 936, 4, fill=AMBER, opacity=0.9)
    a.text(500, 60, "35 ММ · f/2 · 24 КАДРА/СЕК", size=17, fill=IVORY, ls=6, opacity=0.34)
    return dict(grain=0.27, vignette=0.20, bloom=8)

def _blade(cx, cy, phi_deg, hb, R):
    phi = math.radians(phi_deg)
    d1 = (math.cos(phi - math.pi / 4), math.sin(phi - math.pi / 4))
    n1 = (math.cos(phi + math.pi / 4), math.sin(phi + math.pi / 4))
    d2 = (math.cos(phi + math.pi / 4), math.sin(phi + math.pi / 4))
    n2 = (math.cos(phi - math.pi / 4), math.sin(phi - math.pi / 4))
    t = math.sqrt(max(0.0, R * R - hb * hb))
    out1 = (cx + hb * n1[0] + t * d1[0], cy + hb * n1[1] + t * d1[1])
    out2 = (cx + hb * n2[0] + t * d2[0], cy + hb * n2[1] + t * d2[1])
    a1 = math.atan2(out1[1] - cy, out1[0] - cx)
    a2 = math.atan2(out2[1] - cy, out2[0] - cx)
    a2 = a1 + ((a2 - a1) % (2 * math.pi))
    if a2 - a1 > math.pi:
        a1, a2 = a2, a1 + 2 * math.pi
    pts = [(cx + hb * math.sqrt(2) * math.cos(phi), cy + hb * math.sqrt(2) * math.sin(phi))]
    pts.append(out1)
    span = a2 - a1
    n = max(4, int(math.degrees(abs(span)) / 4))
    for i in range(n + 1):
        aa = a1 + span * i / n
        pts.append((cx + R * math.cos(aa), cy + R * math.sin(aa)))
    pts.append(out2)
    return pts, out1, out2, phi


def c07_aperture(a):
    """Диафрагма: лепестки раскрываются в X, сквозь который идёт свет."""
    a.bg = ("#0C0C11", "#04040A", "radial")
    cx, cy = 500, 466
    hb, R = 51.0, 358.0

    glow = a.layer(blur=55, opacity=0.95, mode="screen")
    glow.circle(cx, cy, 190, fill=AMBER, opacity=0.55)
    star = a.layer(blur=30, opacity=0.95, mode="screen")
    for ang in (45, -45):
        star.push(*_rot(ang, cx, cy))
        star.rect(cx - 240, cy - 58, 480, 116, r=58, fill=GOLD, opacity=0.62)
        star.pop()
    star2 = a.layer(blur=7, opacity=0.95, mode="screen")
    for ang in (45, -45):
        star2.push(*_rot(ang, cx, cy))
        star2.rect(cx - 210, cy - 21, 420, 42, r=21, fill="#FFF6E2", opacity=0.62)
        star2.pop()

    bl = a.layer()
    bl.circle(cx, cy, R + 34, fill=None, stroke=IVORY, sw=3, opacity=0.24)
    for ang in (45, 135, 225, 315):
        a1 = math.radians(ang)
        bl.line(cx + (R - 16) * math.cos(a1), cy + (R - 16) * math.sin(a1),
                cx + (R + 34) * math.cos(a1), cy + (R + 34) * math.sin(a1),
                color=GOLD, w=2.2, opacity=0.45)
    for k in range(4):
        pts, out1, out2, phi = _blade(cx, cy, 45 * k, hb, R)
        bl.path(pts, close=True, fill="#212129", stroke="#55556A", sw=2.0, opacity=1.0)
        bl.path([pts[0], out1, out2], close=True, fill="#2C2C38", opacity=0.55)
        # подрезка: светлая кромка внутрь
        bl.path([pts[0], out1], stroke=AMBER, sw=3.2, opacity=0.45, close=False)
        bl.path([pts[-1], out2], stroke=AMBER, sw=3.2, opacity=0.45, close=False)
        # винт
        sx = cx + 0.60 * R * math.cos(phi)
        sy = cy + 0.60 * R * math.sin(phi)
        bl.circle(sx, sy, 9, fill="#0C0C11", stroke=IVORY, sw=1.2, opacity=0.5)
        # блик по внешней дуге
        bl.arc(cx, cy, R - 22, math.degrees(phi) - 34, math.degrees(phi) + 34,
               stroke=IVORY, sw=2, opacity=0.10)

    eng = a.layer()
    arc_text(eng, "СИНХРОН · КИНО-КЛУБ · ПСКОВ · 24 КАДРА/СЕК", cx, cy, R + 68, 18,
             268, 196, IVORY, opacity=0.42, flip=True)
    arc_text(eng, "2.8    4    5.6    8", cx, cy, R + 68, 20, 92, 92, IVORY,
             opacity=0.45, flip=False)
    a.text(500, 46, "КИНО-КЛУБ · ПСКОВ", size=19, fill=IVORY, ls=7, opacity=0.45)
    w7 = a.layer(blur=10, opacity=0.55, mode="screen")
    _center_word(a, w7, "СИНХРОН", 906, 58, gap=11, color=GOLD, opacity=0.6)
    _center_word(a, a.base, "СИНХРОН", 906, 58, gap=11, opacity=1.0)
    return dict(grain=0.27, vignette=0.30, bloom=8)


def _rot(deg, cx, cy):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return (c, s, -s, c, cx - (c * cx - s * cy), cy - (s * cx + c * cy))


# ----------------------------------------------------------------------------- 08

def c08_window(a):
    """Окно в дождь: кино за стеклом, X в переплёте."""
    a.bg = ("#0E141C", "#05070B", "v")
    rnd = rnd_seed(8)

    glass = a.layer()
    glass.rect(150, 120, 700, 760, r=6, fill="#16202B", opacity=1.0)
    glass.rect(150, 120, 700, 760, r=6, fill=None, stroke="#2E3945", sw=3, opacity=0.6)

    scr = a.layer(blur=46, opacity=0.95, mode="screen")
    scr.rect(206, 452, 448, 320, r=8, fill=AMBER, opacity=0.52)
    core = a.layer(blur=22, opacity=0.95, mode="screen")
    core.rect(292, 522, 216, 176, r=6, fill=GOLD, opacity=0.38)
    core.rect(556, 236, 132, 96, r=6, fill=AMBER, opacity=0.30)

    braces = a.layer()
    braces.line(160, 130, 840, 870, color="#1E2833", w=26, opacity=1.0)
    braces.line(840, 130, 160, 870, color="#1E2833", w=26, opacity=1.0)
    braces.line(160, 130, 840, 870, color="#39485A", w=2.4, opacity=0.5)
    braces.line(840, 130, 160, 870, color="#39485A", w=2.4, opacity=0.5)
    braces.line(500, 120, 500, 880, color="#1A222C", w=14, opacity=1.0)
    braces.rect(150, 120, 700, 20, r=0, fill="#212B36", opacity=1.0)
    braces.rect(150, 860, 700, 20, r=0, fill="#1D2731", opacity=1.0)

    w1 = a.layer(blur=15, opacity=0.6, mode="screen")
    _center_word(a, w1, "СИНХРОН", 244, 78, gap=13, color=IVORY, opacity=0.55)
    w2 = a.layer()
    _center_word(a, w2, "СИНХРОН", 244, 78, gap=13, color=IVORY, opacity=0.92)

    rain = a.layer()
    for _ in range(320):
        x, y = rnd.uniform(120, 880), rnd.uniform(90, 910)
        L = rnd.uniform(26, 160)
        ang = math.radians(rnd.uniform(79, 87))
        rain.line(x, y, x + L * math.cos(ang), y + L * math.sin(ang),
                  color=IVORY, w=rnd.uniform(0.7, 2.2),
                  opacity=rnd.uniform(0.04, 0.20))
    for _ in range(130):
        x, y = rnd.uniform(150, 850), rnd.uniform(120, 880)
        r = rnd.uniform(1.4, 4.6)
        rain.circle(x, y, r, fill=IVORY, opacity=rnd.uniform(0.06, 0.22))
        rain.circle(x - r * 0.3, y - r * 0.4, r * 0.35, fill="#FFFFFF",
                    opacity=rnd.uniform(0.2, 0.5))

    fr = a.layer()
    fr.rect(150, 120, 700, 760, r=6, fill=None, stroke="#232A33", sw=34, opacity=1.0)
    fr.rect(150, 120, 700, 760, r=6, fill=None, stroke=IVORY, sw=2, opacity=0.14)

    a.text(500, 68, "СЕАНСЫ В ЛОФТЕ · СПОРТИВНАЯ 1Б", size=19, fill=IVORY, ls=7,
           opacity=0.5)
    a.text(500, 962, "КИНО-КЛУБ · ПСКОВ", size=21, fill=IVORY, ls=8, opacity=0.78)
    return dict(grain=0.33, vignette=0.26, bloom=8)

def c09_chair(a):
    """Пустой стул в свете экрана: сеанс кончился, разговор начинается."""
    rnd = rnd_seed(9)
    light = a.layer(blur=42, opacity=0.92, mode="screen")
    light.path([(196, 120), (804, 120), (838, 720), (162, 720)], fill=AMBER, opacity=0.26)
    light.path([(0, 0), (186, 0), (74, 900), (0, 900)], fill=AMBER, opacity=0.10)
    core = a.layer(blur=22, opacity=0.9, mode="screen")
    core.path([(246, 168), (754, 168), (784, 672), (216, 672)], fill=GOLD, opacity=0.10)

    wg = a.layer(blur=18, opacity=0.75, mode="screen")
    _center_word(a, wg, "СИНХРОН", 208, 78, gap=14, color="#FFF6E2", opacity=0.7)
    wc = a.layer()
    _center_word(a, wc, "СИНХРОН", 208, 78, gap=14, color="#FFF6E2", opacity=1.0)

    d = a.layer()
    for _ in range(150):
        x = rnd.uniform(180, 830)
        y = rnd.uniform(160, 744)
        d.circle(x, y, rnd.uniform(0.8, 2.6), fill=GOLD,
                 opacity=rnd.uniform(0.08, 0.55))

    fl = a.layer()
    fl.line(0, 892, 1000, 892, color=IVORY, w=1.4, opacity=0.06)
    fl.ellipse(500, 912, 236, 38, fill=INK, opacity=0.7)
    ch = a.layer()
    chair(ch, 500, 662, 1.40, fill=INK)
    chair(ch, 500, 662, 1.40, fill=None, rim=IVORY, rimw=2.6)

    a.text(500, 92, "ВХОД СВОБОДНЫЙ · 16+", size=18, fill=IVORY, ls=6, opacity=0.4)
    a.text(500, 956, "СЕАНС ЗАКОНЧИЛСЯ — РАЗГОВОР НАЧИНАЕТСЯ", size=21, fill=IVORY,
           ls=5, opacity=0.62)
    return dict(grain=0.31, vignette=0.26, bloom=10)

def c10_leader(a):
    """Кадр-лидер: круг, перекрестье X и слово в нём."""
    a.bg = "#0A0A0D"
    glow = a.layer(blur=80, opacity=0.6, mode="screen")
    glow.circle(500, 500, 360, fill=AMBER, opacity=0.20)

    fr = a.layer()
    fr.rect(46, 46, 908, 908, r=0, fill=None, stroke=IVORY, sw=2, opacity=0.18)
    for x0, y0, dx, dy in ((46, 46, 64, 0), (46, 46, 0, 64),
                           (954, 46, -64, 0), (954, 46, 0, 64),
                           (46, 954, 64, 0), (46, 954, 0, -64),
                           (954, 954, -64, 0), (954, 954, 0, -64)):
        fr.line(x0, y0, x0 + dx, y0 + dy, color=IVORY, w=3, opacity=0.4)

    wedge = a.layer(blur=46, opacity=0.55, mode="screen")
    wedge.path([(500, 500), (500 + 320 * math.cos(math.radians(-100)),
                             500 + 320 * math.sin(math.radians(-100))),
                (500 + 320 * math.cos(math.radians(-58)),
                 500 + 320 * math.sin(math.radians(-58)))], fill=AMBER, opacity=0.30)

    c = a.layer()
    c.circle(500, 500, 330, fill=None, stroke=IVORY, sw=9, opacity=0.95)
    c.circle(500, 500, 310, fill=None, stroke=IVORY, sw=2, opacity=0.3)
    c.circle(500, 500, 236, fill=None, stroke=IVORY, sw=1.4, opacity=0.16)
    for ang in (45, 135, 225, 315):
        a1 = math.radians(ang)
        c.line(500 + 200 * math.cos(a1), 500 + 200 * math.sin(a1),
               500 + 330 * math.cos(a1), 500 + 330 * math.sin(a1),
               color=IVORY, w=15, opacity=0.92)
    # сам X — короткие лучи наружу, чтобы не резать слово
    for ang in (45, 135, 225, 315):
        a1 = math.radians(ang)
        c.line(500 + 254 * math.cos(a1), 500 + 254 * math.sin(a1),
               500 + 322 * math.cos(a1), 500 + 322 * math.sin(a1),
               color=AMBER, w=2.4, opacity=0.65)
    for ang in (0, 90, 180, 270):
        a1 = math.radians(ang)
        c.line(500 + 254 * math.cos(a1), 500 + 254 * math.sin(a1),
               500 + 330 * math.cos(a1), 500 + 330 * math.sin(a1),
               color=IVORY, w=1.4, opacity=0.30)

    hand = a.layer()
    a1 = math.radians(-56)
    hand.line(500, 500, 500 + 306 * math.cos(a1), 500 + 306 * math.sin(a1),
              color=AMBER, w=5.5, opacity=0.95)
    hand.arc(500, 500, 306, -56, -102, stroke=AMBER, sw=3, opacity=0.4)

    w10 = a.layer(blur=14, opacity=0.55, mode="screen")
    _center_word(a, w10, "СИНХРОН", 460, 78, gap=14, color=GOLD, opacity=0.5)
    _center_word(a, a.base, "СИНХРОН", 460, 78, gap=14, color="#FFF6E2", opacity=1.0)
    a.text(500, 108, "ПСКОВ · ЛОФТ · СПОРТИВНАЯ 1Б", size=19, fill=IVORY, ls=6,
           opacity=0.5)
    a.text(500, 918, "СЕАНС · РАЗГОВОР · СВЕТ", size=22, fill=AMBER, ls=8, opacity=0.9)
    a.text(64, 964, "24", size=32, fill=IVORY, ls=2, anchor="start", opacity=0.3)
    a.text(936, 964, "1", size=32, fill=IVORY, ls=2, anchor="end", opacity=0.3)
    return dict(grain=0.30, vignette=0.26, bloom=10)

# ----------------------------------------------------------------------------- описание

CONCEPTS = [
    dict(
        num="01", slug="splice", build=c01_splice, title="СКЛЕЙКА",
        tag="знак • X из плёнки",
        idea="Два куска плёнки склеены крест-накрест — тот самый X, но не "
             "нарисованный, а сделанный из самого материала: тело плёнки, "
             "кадровые линии, перфорация по краям, полоска ленты на стыке. "
             "Слово «СИНХРОН» стоит под знаком и держит низ композиции.",
        why="X читается мгновенно и при 40 px, при этом он не «логотип "
            "дизайнера», а вещь из проекционной: понятная каждому, кто хоть раз "
            "клеил плёнку. Свет уходит только в центр, где лента — там и «синхрон».",
        real="Снять макро: два обрезка 35-мм плёнки, скрещённые на чёрном стекле, "
             "контровой свет снизу, стык заклеить полоской медового скотча. "
             "Кроп квадрат, фон — чёрный бархат."),
    dict(
        num="02", slug="beams", build=c02_beams, title="ЛУЧ",
        tag="знак • X из света",
        idea="Два проектора бьют из нижних углов вверх, их лучи пересекаются "
             "ровно в центре и образуют X — не линию, а объём: свет с пылью, "
             "тёплый воздух, горячие ядра лучей.",
        why="Самая «живая» версия знака: она про сам сеанс, а не про графику. "
            "X держится геометрией лучей, слово — внизу, в темноте, между "
            "проекторами, и не спорит со знаком.",
        real="Фотография: дым-машина или пыль в зале, две кинопроекционные лампы "
             "(или два фонаря) крест-накрест, объектив на длинной выдержке, "
             "чёрный фон, тёплый баланс 3200K."),
    dict(
        num="03", slug="negative", build=c03_negative, title="НЕГАТИВ",
        tag="логотип • свет сквозь плёнку",
        idea="Кадр 35-мм плёнки во всю ширину: чёрная лента, перфорация по краям "
             "и слово «СИНХРОН», выбитое дырками. За плёнкой — лампа, поэтому "
             "и буквы, и перфорация светятся тёплым: они и есть отверстия.",
        why="Одна и та же форма служит и шрифтом, и перфорацией — знак целиком "
            "из языка плёнки. Работает и как аватар, и как обложка: полоса "
            "растягивается в широкий баннер без переделки.",
        real="Плоттерная резка трафарета из чёрной плёнки, буквы вырезаются "
             "и подсвечиваются тёплой лампой снизу; либо кадр на просвет на "
             "подсвеченном столе — и макро со штатива."),
    dict(
        num="04", slug="titlecard", build=c04_titlecard, title="ТИТР",
        tag="титульная карточка • бумага",
        idea="Советско-конструктивистская плашка: тёплая бумага, тонкие линейки, "
             "два угла надписей и семь одинаковых клеток слова на всю ширину. "
             "За буквой X — медовый круг, единственное цветное пятно.",
        why="Все деловые аватары тёмные — а этот светлый, и именно поэтому "
            "запоминается в ленте. Это «открывающий титр» кино-клуба: он "
            "выдерживает любой размер и любую печать.",
        real="Это уже почти плакат: можно напечатать в двух цветах (чёрный + "
             "медовый) на крафте или бумаге 200 г и расклеить в лофте; "
             "фотография — плоская съёмка «сверху», ровный свет."),
    dict(
        num="05", slug="phase", build=c05_phase, title="ФАЗА",
        tag="знак • две дорожки",
        idea="Две оптические дорожки звука (медовая и синяя) идут навстречу друг "
             "другу, пересекаются в центре — и в точке пересечения их волны "
             "совпадают: это и есть синхрон. Ромб в центре — замок фазы.",
        why="Единственная идея, которая объясняет название не картинкой, а "
            "смыслом: «синхрон» — когда две дорожки совпали. Плюс это самая "
            "графичная, «звуковая» версия X.",
        real="Снять световой стол и оптическую дорожку 16-мм плёнки макро, "
             "две полосы положить крест-накрест; цифру синхронизации довести "
             "в графике."),
    dict(
        num="06", slug="lens", build=c06_lens, title="ОБОД",
        tag="монограмма • С = О = свет",
        idea="Обод объектива (он же буква С, он же О, он же катушка) с вырезом "
             "справа, из выреза бьёт свет. Внутри обода — стекло, блик и слово "
             "«СИНХРОН», по ободу — гравировка.",
        why="Самый честный аватар: один знак, одна буква-круг, один луч. "
            "Читается в круге ВК и в 32 px, легко режется из одной формы: "
            "обод + вырез. Слова внутри держат имя группы.",
        real="Макро-съёмка объектива на просвет: свет через диафрагму, чёрный "
             "фон, один тёплый импульс. Либо рисунок в векторе — печать в один "
             "цвет на чёрном."),
    dict(
        num="07", slug="aperture", build=c07_aperture, title="ДИАФРАГМА",
        tag="знак • лепестки в X",
        idea="Четыре лепестка диафрагмы сомкнуты не в круг, а в X, и сквозь эту "
             "щель идёт свет. По ободу объектива — гравировка: «СИНХРОН · "
             "КИНО-КЛУБ · ПСКОВ» и метки 2.8 / 4 / 5.6.",
        why="Здесь узнаваемое «колесо из четырёх лопастей» доведено до "
             "механизма: у знака появляется физика и оправдание — свет проходит "
             "сквозь крест. Много деталей для крупного размера, цельный силуэт "
             "для мелкого.",
        real="Макро-фото диафрагмы старого объектива: прикрыть кольцо до "
             "щели, снять против света, фон чёрный; гравировку нанести "
             "лазером на металлическую пластину и снять как «деталь»."),
    dict(
        num="08", slug="window", build=c08_window, title="ОКНО",
        tag="атмосфера • дождь и экран",
        idea="Псковское окно в дождь: холодное стекло, капли, переплёт с "
             "наклонными связями (это и есть X), а за стеклом — тёплое пятно "
             "экрана. Слово нанесено на стекло как трафарет.",
        why="Внутри знака живёт город и погода — то, зачем в кино-клуб вообще "
            "ходят: выйти из дождя в свет. X здесь архитектурный, а не "
            "графический, поэтому логотип не выглядит «нарисованным».",
        real="Съёмка ночью: окно лофта, дождь (или пульверизатор), внутри — "
             "тёплая лампа/проектор, снаружи холодит фонарь. Трафарет на "
             "стекле — из малярного скотча, снять с длинной выдержкой."),
    dict(
        num="09", slug="chair", build=c09_chair, title="ПУСТОЙ СТУЛ",
        tag="атмосфера • разговор",
        idea="Тёмный зал, на стене — светлое пятно экрана, и в этом пятне "
             "спроецировано слово. Перед светом стоит пустой стул: он "
             "перекрывает буквы снизу и превращает знак в приглашение.",
        why="Логотип про вторую половину кино-клуба — про обсуждение. "
            "Стул — самое сильное «пустое место» в композиции, оно работает "
            "как «тебя ждут», и это уже не знак, а афиша.",
        real="Постановка: стул на стене с проекцией слова (шрифт на слайде), "
             "снять с одной тёплой лампы, стул — в контражуре. Свет только "
             "на стену, пол в темноте."),
    dict(
        num="10", slug="leader", build=c10_leader, title="ЛИДЕР",
        tag="титр • счётчик кадра",
        idea="Классический кадр-лидер киноплёнки: круг, перекрестье-крест, "
             "стрелка счёта — и «СИНХРОН» ровно по центру круга, а по углам "
             "счётчик 24 и 1.",
        why="Каждый, кто смотрел плёнку, знает этот кадр изнутри — срабатывает "
            "узнавание жанра. Знак строится из перекрестья, значит X остаётся "
            "главным, но получает сюжет и время.",
        real="Распечатать лидер на прозрачной плёнке и снять на просвет "
             "проектором; либо белым маркером/резкой на чёрном акриле — и "
             "повесить на стену лофта."),
]


def build_all(outdir_png, outdir_svg, w=1080, ss=2):
    import os
    os.makedirs(outdir_png, exist_ok=True)
    os.makedirs(outdir_svg, exist_ok=True)
    made = []
    for c in CONCEPTS:
        k = w * ss / 1000.0
        art = Art(k=k, bg=INK)
        tex = c["build"](art) or {}
        name = f'{c["num"]}-{c["slug"]}'
        png = os.path.join(outdir_png, name + ".png")
        art.render(png, w_px=w, ss=ss, texture=tex)
        svg = os.path.join(outdir_svg, name + ".svg")
        open(svg, "w").write(art.to_svg(int(w * ss), int(w * ss)))
        made.append((c, png, svg))
        print("ok", name)
    return made
