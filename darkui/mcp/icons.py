"""Иконки предметов 32×32: силуэт + чернильный контур. Рисуются кодом,
поэтому их можно перекрашивать под любой сет редкости."""
import math

from canvas import Canvas, C, mix, darken, lighten
import palette as P
from brushes import skull, gem, flask, blade, stud


def _out(cv):
    cv.outline(P.INK)
    return cv


def icon_skull():
    cv = Canvas(32, 32)
    skull(cv, 16, 15, 1.85, P.BONE)
    for ex in (10, 20):
        cv.rect(ex, 13, 2, 2, (C(P.BLOOD[5])[0], C(P.BLOOD[5])[1], C(P.BLOOD[5])[2], 230))
    return _out(cv)


def icon_sword():
    cv = Canvas(32, 32)
    blade(cv, [(10, 24), (26, 6)], 2.6, [P.IRON[2], P.IRON[4], P.IRON[5], P.IRON[6], P.IRON[7]])
    # дол
    cv.line(12, 23, 24, 9, P.IRON[3])
    # гарда
    for k in range(-1, 2):
        cv.line(6 + k, 20 + k, 15 + k, 29 + k, P.GOLD[4] if k == 0 else P.GOLD[2])
    cv.line(6, 20, 15, 29, P.GOLD[6])
    cv.disc(6, 20, 1.6, P.GOLD[6], P.GOLD[1])
    cv.disc(15, 29, 1.6, P.GOLD[6], P.GOLD[1])
    # рукоять
    cv.line(9, 26, 5, 30, P.WOOD[3])
    cv.line(10, 27, 6, 31, P.WOOD[2])
    for t in range(4):
        cv.set(9 - t, 26 + t, P.WOOD[5])
    cv.disc(4, 30, 2.0, P.GOLD[5], P.GOLD[1])
    return _out(cv)


def icon_dagger():
    cv = Canvas(32, 32)
    blade(cv, [(16, 5), (16, 19)], 2.4, [P.IRON[3], P.IRON[5], P.IRON[6], P.IRON[7]])
    cv.line(16, 7, 16, 18, P.IRON[3])
    cv.rect(10, 19, 13, 3, P.GOLD[4], P.GOLD[1])
    cv.hline(10, 19, 13, P.GOLD[6])
    cv.rect(14, 22, 4, 7, P.WOOD[3], P.WOOD[1])
    for y in (23, 25, 27):
        cv.hline(14, y, 4, P.WOOD[5])
    cv.disc(16, 30, 2.0, P.GOLD[5], P.GOLD[1])
    return _out(cv)


def icon_axe():
    cv = Canvas(32, 32)
    cv.line(12, 29, 19, 5, P.WOOD[2])
    cv.line(13, 29, 20, 5, P.WOOD[4])
    cv.line(14, 29, 21, 5, P.WOOD[1])
    for t in range(0, 22, 5):
        cv.line(12 + t // 4, 28 - t, 14 + t // 4, 28 - t, P.PARCH[2])
    # лезвие
    head = [(18, 6), (26, 8), (29, 14), (26, 20), (17, 17)]
    cv.poly(head, P.IRON[4], P.INK)
    cv.poly([(20, 8), (26, 9), (28, 14), (25, 18), (19, 15)], P.IRON[5])
    cv.line(26, 8, 29, 14, P.IRON[7])
    cv.line(29, 14, 26, 20, P.IRON[6])
    cv.line(18, 6, 17, 17, P.IRON[3])
    # обушок и шип
    cv.poly([(17, 7), (12, 9), (11, 13), (16, 14)], P.IRON[3], P.INK)
    stud(cv, 19, 12, 1.6, P.GOLD[2:6])
    cv.hline(12, 29, 3, P.IRON[3])
    return _out(cv)


def icon_bow():
    cv = Canvas(32, 32)
    for a in range(-84, 85, 2):
        ang = math.radians(a)
        x = 11 + math.cos(ang) * 15
        y = 16 + math.sin(ang) * 16
        for k in (-1, 0, 1):
            c = P.WOOD[5] if k == -1 else (P.WOOD[3] if k == 0 else P.WOOD[1])
            cv.set(int(x) + k, int(y), c)
    cv.line(11, 1, 11, 31, P.PARCH[4])
    cv.line(12, 1, 12, 31, (C(P.PARCH[3])[0], C(P.PARCH[3])[1], C(P.PARCH[3])[2], 150))
    # стрела
    cv.hline(3, 16, 22, P.WOOD[4])
    cv.hline(3, 17, 22, P.WOOD[2])
    cv.poly([(25, 16), (30, 16), (25, 13)], P.IRON[6], P.INK)
    cv.poly([(25, 17), (30, 17), (25, 20)], P.IRON[4], P.INK)
    for k in (0, 1, 2):
        cv.line(4 + k, 16 - 2 - k, 6 + k, 16 - 4 - k, P.BLOOD[4])
        cv.line(4 + k, 17 + 2 + k, 6 + k, 17 + 4 + k, P.BLOOD[4])
    cv.set(11, 1, P.GOLD[5])
    cv.set(11, 31, P.GOLD[5])
    return _out(cv)


def icon_shield():
    cv = Canvas(32, 32)
    shape = [(5, 4), (27, 4), (27, 15), (16, 29), (5, 15)]
    cv.poly(shape, P.IRON[3], P.INK)
    cv.poly([(7, 6), (25, 6), (25, 14), (16, 26), (7, 14)], P.IRON[4])
    for j in range(4, 29):
        t = (j - 4) / 25.0
        cv.hline(6, j, 20, (0, 0, 0, 0)) if False else None
    # вертикальный градиент
    for j in range(6, 27):
        for i in range(7, 25):
            if cv.get(i, j)[3]:
                f = 1 - (j - 6) / 26.0
                cv.put(i, j, mix(P.IRON[2], P.IRON[5], f * 0.9))
    cv.poly([(7, 6), (25, 6), (25, 14), (16, 26), (7, 14)], None) if False else None
    # окантовка золотом
    for k, col in enumerate([P.GOLD[2], P.GOLD[5]]):
        pts = [(6 + k, 5 + k), (26 - k, 5 + k), (26 - k, 15 - k), (16, 28 - k * 2), (6 + k, 15 - k)]
        for i in range(len(pts) - 1):
            cv.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col)
        cv.line(pts[-1][0], pts[-1][1], pts[0][0], pts[0][1], col)
    # умбон
    cv.disc(16, 14, 5, P.IRON[5], P.INK)
    cv.disc(16, 13, 3, P.GOLD[4], P.GOLD[1])
    cv.set(15, 12, P.GOLD[7])
    for (sx, sy) in [(9, 8), (23, 8), (16, 22)]:
        stud(cv, sx, sy, 1.4, P.GOLD[2:6])
    cv.hline(7, 6, 18, (255, 255, 255, 40))
    return _out(cv)


def icon_helm():
    cv = Canvas(32, 32)
    cv.ellipse(16, 15, 11, 11, P.IRON[3], True, P.INK)
    cv.ellipse(16, 14, 9.5, 9.5, P.IRON[4], True, None)
    for j in range(6, 26):
        for i in range(6, 26):
            if cv.get(i, j)[3]:
                f = 1 - (j - 6) / 20.0
                cv.put(i, j, mix(P.IRON[2], P.IRON[6], f))
    cv.ellipse(16, 15, 11, 11, None, False, P.INK)
    # поля/бармица
    cv.poly([(5, 17), (27, 17), (25, 25), (16, 29), (7, 25)], P.IRON[3], P.INK)
    # прорезь для глаз
    cv.rect(8, 15, 16, 4, P.INK)
    cv.rect(9, 16, 14, 2, "#120d0c")
    cv.vline(16, 15, 12, P.IRON[5])
    cv.vline(15, 15, 12, P.IRON[2])
    # золотая лента
    cv.hline(6, 12, 20, P.GOLD[3])
    cv.hline(6, 13, 20, P.GOLD[5])
    cv.hline(6, 11, 20, P.GOLD[1])
    cv.ellipse(11, 9, 3.5, 2.2, (255, 255, 255, 46), True, None)
    # рога
    for sgn in (-1, 1):
        for t in range(9):
            x = 16 + sgn * (10 + t * 0.7)
            y = 12 - t * 1.3
            cv.set(int(x), int(y), P.BONE[3])
            cv.set(int(x), int(y) - 1, P.BONE[4])
            cv.set(int(x) + sgn, int(y), P.BONE[1])
    return _out(cv)


def icon_boots():
    cv = Canvas(32, 32)
    cv.poly([(8, 4), (18, 4), (19, 18), (27, 22), (28, 27), (7, 27), (6, 18)], P.WOOD[3], P.INK)
    for j in range(5, 27):
        for i in range(7, 27):
            if cv.get(i, j)[3]:
                cv.put(i, j, mix(P.WOOD[2], P.WOOD[4], 1 - (j - 5) / 26.0))
    cv.poly([(8, 4), (18, 4), (19, 18), (27, 22), (28, 27), (7, 27), (6, 18)], None) if False else None
    # подошва
    cv.poly([(6, 24), (28, 24), (28, 28), (6, 28)], "#241a10", P.INK)
    cv.hline(6, 24, 22, P.WOOD[1])
    # отворот и пряжка
    cv.poly([(7, 4), (19, 4), (19, 9), (7, 9)], P.WOOD[5], P.INK)
    cv.hline(7, 5, 12, P.WOOD[6])
    cv.rect(11, 12, 7, 5, P.GOLD[4], P.GOLD[1])
    cv.rect(13, 13, 3, 3, P.WOOD[2])
    cv.hline(11, 12, 7, P.GOLD[6])
    for y in (18, 21):
        cv.hline(8, y, 10, (0, 0, 0, 90))
    return _out(cv)


def icon_belt():
    cv = Canvas(32, 32)
    cv.rect(2, 11, 28, 10, P.WOOD[3], P.INK)
    for j in range(12, 21):
        cv.hline(3, j, 26, mix(P.WOOD[2], P.WOOD[4], (j - 12) / 9.0))
    for x in range(4, 28, 3):
        cv.set(x, 12, P.PARCH[3])
        cv.set(x, 20, P.PARCH[3])
    cv.rect(12, 9, 9, 14, P.GOLD[3], P.GOLD[0])
    cv.frame(12, 9, 9, 14, P.GOLD[5])
    cv.rect(14, 11, 5, 10, P.WOOD[2], P.GOLD[1])
    cv.vline(16, 11, 10, P.GOLD[6])
    cv.hline(12, 9, 9, P.GOLD[7])
    return _out(cv)


def icon_ring():
    cv = Canvas(32, 32)
    for j in range(32):
        for i in range(32):
            d = math.hypot(i + 0.5 - 16, j + 0.5 - 19)
            if 6.5 <= d <= 9.5:
                ang = math.atan2(j + 0.5 - 19, i + 0.5 - 16)
                li = 0.5 - 0.5 * math.cos(ang - math.radians(-130))
                t = (d - 6.5) / 3.0
                f = li * 0.7 + (1 - abs(t - 0.4)) * 0.4
                cv.put(i, j, P.GOLD[max(1, min(7, int(f * 7)))])
            elif 9.5 < d <= 10.3 or 5.7 <= d < 6.5:
                cv.put(i, j, P.GOLD[1])
    gem(cv, 16, 8, 10, 10, ["#1c0505", "#5e1010", "#871a17", "#b02a20", "#d14733", "#e8735a", "#f7a48c", "#ffffff"])
    return _out(cv)


def icon_amulet():
    cv = Canvas(32, 32)
    for a in range(200, 341, 2):
        ang = math.radians(a)
        x = 16 + math.cos(ang) * 11
        y = 17 + math.sin(ang) * 12
        cv.set(int(x), int(y), P.GOLD[4])
        cv.set(int(x), int(y) - 1, P.GOLD[2])
    for t in range(0, 140, 12):
        ang = math.radians(200 + t)
        x = int(16 + math.cos(ang) * 11)
        y = int(17 + math.sin(ang) * 12)
        cv.set(x, y, P.GOLD[7])
    for sgn in (-1, 1):
        cv.line(16 + sgn * 10, 15, 16 + sgn * 4, 18, P.GOLD[3])
        cv.line(16 + sgn * 10, 16, 16 + sgn * 4, 19, P.GOLD[5])
    cv.disc(16, 21, 5, P.GOLD[3], P.GOLD[0])
    cv.disc(16, 21, 3.6, P.GOLD[5], P.GOLD[2])
    gem(cv, 16, 21, 6, 6, P.MANA)
    return _out(cv)


def icon_potion_health():
    cv = Canvas(32, 32)
    flask(cv, 16, 18, 19, 22, P.BLOOD, P.IRON, P.WOOD)
    return _out(cv)


def icon_potion_mana():
    cv = Canvas(32, 32)
    flask(cv, 16, 18, 19, 22, P.MANA, P.IRON, P.WOOD)
    return _out(cv)


def icon_gem():
    cv = Canvas(32, 32)
    gem(cv, 16, 17, 20, 22, P.BLOOD)
    cv.set(16, 6, P.BLOOD[7])
    return _out(cv)


def icon_rune():
    cv = Canvas(32, 32)
    shape = [(6, 3), (26, 3), (28, 26), (16, 29), (4, 26)]
    cv.poly(shape, P.STONE[4], P.INK)
    for j in range(3, 29):
        for i in range(4, 29):
            if cv.get(i, j)[3]:
                cv.put(i, j, mix(P.STONE[3], P.STONE[6], 1 - (j - 3) / 26.0))
    cv.poly(shape, None) if False else None
    for i in range(len(shape)):
        cv.line(shape[i][0], shape[i][1], shape[(i + 1) % len(shape)][0], shape[(i + 1) % len(shape)][1], P.STONE[2])
    # резьба
    glyph = [(11, 8), (11, 22), (21, 8), (21, 22), (11, 15), (21, 15)]
    cv.line(11, 8, 11, 22, P.INK)
    cv.line(21, 8, 21, 22, P.INK)
    cv.line(11, 15, 21, 12, P.INK)
    cv.line(12, 9, 12, 22, (C(P.BLOOD[4])[0], C(P.BLOOD[4])[1], C(P.BLOOD[4])[2], 200))
    cv.line(22, 9, 22, 22, (C(P.BLOOD[4])[0], C(P.BLOOD[4])[1], C(P.BLOOD[4])[2], 160))
    cv.line(11, 16, 21, 13, (C(P.BLOOD[5])[0], C(P.BLOOD[5])[1], C(P.BLOOD[5])[2], 190))
    cv.set(16, 6, P.STONE[6])
    cv.noise(5, 4, 22, 24, [C(P.STONE[2])], 0.06, seed=9, alpha=90)
    return _out(cv)


def icon_coin():
    cv = Canvas(32, 32)
    for k, cy in enumerate((24, 20, 15)):
        cv.ellipse(16, cy, 10 - k, 5 - k * 0.4, P.GOLD[3], True, P.GOLD[1])
        cv.ellipse(16, cy - 1, 10 - k, 5 - k * 0.4, P.GOLD[4], True, P.GOLD[2])
        cv.ellipse(16, cy - 2, 8 - k, 3.4 - k * 0.3, P.GOLD[5], True, None)
        cv.hline(16 - (8 - k), cy - 2, (8 - k) * 2, P.GOLD[6])
    cv.ellipse(16, 12, 8, 4, P.GOLD[6], True, P.GOLD[2])
    cv.ellipse(16, 11, 6, 2.6, P.GOLD[7], True, None)
    skull(cv, 16, 11, 0.42, [P.GOLD[2], P.GOLD[3], P.GOLD[3], P.GOLD[4], P.GOLD[5], P.GOLD[6]])
    cv.set(11, 8, "#fffbe8")
    return _out(cv)


def icon_scroll():
    cv = Canvas(32, 32)
    cv.rect(5, 8, 22, 16, P.PARCH[4], P.PARCH[1])
    for j in range(9, 23):
        cv.hline(6, j, 20, mix(P.PARCH[3], P.PARCH[5], (j - 9) / 14.0))
    for y in range(11, 22, 2):
        cv.hline(8, y, 16, (C(P.PARCH[2])[0], C(P.PARCH[2])[1], C(P.PARCH[2])[2], 200))
    for cx in (5, 27):
        cv.ellipse(cx, 16, 3.4, 8.6, P.PARCH[5], True, P.PARCH[1])
        cv.ellipse(cx, 16, 1.8, 6.6, P.PARCH[3], True, P.PARCH[2])
        cv.ellipse(cx, 16, 0.8, 4.2, P.PARCH[1], True, None)
    cv.rect(13, 7, 6, 18, P.BLOOD[3], P.BLOOD[1])
    cv.hline(13, 8, 6, P.BLOOD[5])
    cv.disc(16, 16, 3.2, P.BLOOD[4], P.BLOOD[1])
    cv.disc(16, 15, 2, P.BLOOD[6], None)
    return _out(cv)


def icon_book():
    cv = Canvas(32, 32)
    cv.rect(5, 4, 22, 24, "#3a1414", P.INK)
    for j in range(5, 27):
        cv.hline(6, j, 20, mix("#2a0d0d", "#5c2020", 1 - (j - 5) / 24.0))
    cv.rect(5, 4, 4, 24, "#4a1a1a", P.INK)
    for y in (7, 15, 23):
        cv.rect(5, y, 4, 2, P.GOLD[3])
    cv.frame(9, 6, 17, 20, P.GOLD[2])
    cv.frame(10, 7, 15, 18, P.GOLD[4])
    # страницы
    cv.rect(25, 6, 3, 20, P.BONE[4], P.BONE[2])
    for y in range(7, 25, 2):
        cv.hline(25, y, 3, P.BONE[2])
    # эмблема
    skull(cv, 17, 15, 0.85, [P.GOLD[1], P.GOLD[2], P.GOLD[3], P.GOLD[4], P.GOLD[5], P.GOLD[6]])
    cv.rect(24, 13, 4, 6, P.GOLD[4], P.GOLD[1])
    cv.set(25, 14, P.GOLD[7])
    return _out(cv)


def icon_key():
    cv = Canvas(32, 32)
    for j in range(32):
        for i in range(32):
            d = math.hypot(i + 0.5 - 16, j + 0.5 - 8)
            if 4.0 <= d <= 6.6:
                cv.put(i, j, P.GOLD[4] if j < 8 else P.GOLD[3])
            elif 6.6 < d <= 7.3 or 3.3 <= d < 4.0:
                cv.put(i, j, P.GOLD[1])
    cv.rect(14, 12, 4, 16, P.GOLD[4], P.GOLD[1])
    cv.vline(15, 13, 14, P.GOLD[6])
    cv.rect(18, 20, 5, 3, P.GOLD[4], P.GOLD[1])
    cv.rect(18, 25, 4, 3, P.GOLD[4], P.GOLD[1])
    cv.hline(18, 20, 5, P.GOLD[6])
    cv.set(16, 4, P.GOLD[7])
    return _out(cv)


def icon_staff():
    cv = Canvas(32, 32)
    for t in range(26):
        x = 8 + t * 0.62
        y = 29 - t
        cv.line(int(x), int(y), int(x) + 1, int(y), P.WOOD[3])
        cv.set(int(x), int(y), P.WOOD[5])
        cv.set(int(x) + 2, int(y), P.WOOD[1])
    for t in (4, 10, 16):
        x = int(8 + t * 0.62)
        y = int(29 - t)
        cv.line(x - 1, y, x + 3, y, P.GOLD[3])
    cv.disc(24, 6, 5, P.IRON[3], P.INK)
    cv.poly([(20, 8), (24, 3), (28, 8), (24, 12)], P.GOLD[3], P.GOLD[1])
    gem(cv, 24, 6, 7, 8, ["#0a1a0c", "#153318", "#245427", "#3a7c37", "#5aa54c", "#8fcd72", "#c9eba4", "#ffffff"])
    return _out(cv)


def icon_torch():
    cv = Canvas(32, 32)
    cv.rect(14, 14, 4, 16, P.WOOD[3], P.WOOD[1])
    cv.vline(15, 15, 14, P.WOOD[5])
    for y in (18, 22, 26):
        cv.hline(14, y, 4, P.PARCH[2])
    cv.poly([(11, 10), (21, 10), (19, 16), (13, 16)], P.IRON[3], P.INK)
    cv.hline(11, 10, 11, P.IRON[6])
    for j in range(11):
        w = max(0, int(6 - j * 0.55))
        if w:
            col = P.EMBER[min(len(P.EMBER) - 1, 2 + j // 2)]
            cv.hline(16 - w, 9 - j, w * 2, col)
    cv.hline(15, 2, 3, P.EMBER[7])
    cv.hline(13, 5, 6, P.EMBER[6])
    return _out(cv)


ICONS = [
    ("skull", icon_skull, "Череп"),
    ("sword", icon_sword, "Меч"),
    ("dagger", icon_dagger, "Кинжал"),
    ("axe", icon_axe, "Топор"),
    ("bow", icon_bow, "Лук"),
    ("shield", icon_shield, "Щит"),
    ("helm", icon_helm, "Шлем"),
    ("boots", icon_boots, "Сапоги"),
    ("belt", icon_belt, "Пояс"),
    ("ring", icon_ring, "Кольцо"),
    ("amulet", icon_amulet, "Амулет"),
    ("staff", icon_staff, "Посох"),
    ("potion_health", icon_potion_health, "Зелье лечения"),
    ("potion_mana", icon_potion_mana, "Зелье маны"),
    ("gem", icon_gem, "Самоцвет"),
    ("rune", icon_rune, "Руна"),
    ("coin", icon_coin, "Золото"),
    ("scroll", icon_scroll, "Свиток"),
    ("book", icon_book, "Книга"),
    ("key", icon_key, "Ключ"),
    ("torch", icon_torch, "Факел"),
]


def register(g):
    for name, fn, desc in ICONS:
        g("icon_" + name, "icons", fn, desc=desc)
