"""Палитра Dark Fantasy в духе Diablo II: холодный камень, латунь, кровь,
пергамент, кость, мана и угли. Все рампы идут от тени к блику."""
from canvas import C

STONE = ["#100e0c", "#1a1714", "#241f1a", "#302922", "#3d342b", "#4c4136", "#5d5043", "#706152"]
STONE_HI = "#8a7863"
GOLD = ["#241804", "#3d2a07", "#5c4010", "#7d5a17", "#a37a22", "#c99f36", "#e8c45f", "#fbe89c", "#fff6cf"]
GOLD_DARK = "#241804"
GOLD_MID = "#a37a22"
GOLD_HI = "#fbe89c"
IRON = ["#0e1013", "#181c21", "#242a31", "#333b44", "#454f5a", "#5b6773", "#7a8794", "#a3aeb9", "#cdd5dc"]
BLOOD = ["#1c0505", "#3a0a0a", "#5e1010", "#871a17", "#b02a20", "#d14733", "#e8735a", "#f7a48c"]
PARCH = ["#3a3020", "#5b4a2e", "#7d6741", "#a08a5a", "#c3ad7c", "#e0cfa3", "#f4e9cd"]
BONE = ["#4a4438", "#6b6353", "#8d836d", "#b0a68c", "#d2c9ae", "#eee7d3"]
MANA = ["#050f22", "#0a2145", "#103a6e", "#17579c", "#2377c7", "#3f9ce0", "#7cc6f5", "#c3e6ff"]
EMBER = ["#2b0a04", "#5c1a06", "#8f3208", "#c25a10", "#e88a1c", "#fbb44a", "#ffdd8a", "#fff3c8"]
POISON = ["#0a1a0c", "#153318", "#245427", "#3a7c37", "#5aa54c", "#8fcd72", "#c9eba4"]
WOOD = ["#1b120a", "#2a1d10", "#3b2a17", "#4e381f", "#65492a", "#7d5c36", "#96724a"]
SHADOW = "#05040300"
BLACK = "#08070600"
INK = "#0b0908"

RARITY = {
    "normal": ("#c8c0b0", "#8d8577"),
    "magic": ("#6f8bff", "#2b3f9e"),
    "rare": ("#ffe14d", "#a3841a"),
    "unique": ("#c9a24a", "#6d4c14"),
    "set": ("#3fdc6a", "#14732f"),
    "crafted": ("#ff9a3c", "#8f4a10"),
    "runeword": ("#ff5a4a", "#8c1f18"),
}

ALL = [C(x) for x in STONE + GOLD + IRON + BLOOD + PARCH + BONE + MANA + EMBER + POISON + WOOD]


def nearest(color):
    """Квантование к палитре — держит атлас в одной цветовой гамме."""
    r, g, b, a = C(color)
    best, bd = ALL[0], 1e9
    for c in ALL:
        d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2
        if d < bd:
            bd, best = d, c
    return (best[0], best[1], best[2], a)
