#!/usr/bin/env python3
"""
Diablo II Dark Fantasy UI Atlas Generator
Simulates Aseprite + MCP workflow via Pillow

Aseprite MCP workflow this script emulates:
  1. aseprite --cli create 1024x1024 --palette diablo.gpl
  2. mcp.aseprite_create_layer("Background", ...)
  3. mcp.aseprite_draw for each sprite with Dark Fantasy palette
  4. aseprite --cli --sheet atlas.png --data atlas.json --sheet-type packed

Palette: Diablo II inspired — desaturated stone, oxblood, antique gold, parchment, mana cobalt
"""
import json, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1024, 1024
ATLAS = Image.new("RGBA", (W, H), (10, 8, 6, 255))
DRAW = ImageDraw.Draw(ATLAS, "RGBA")
random.seed(0xD2)

# Try fonts
try:
    FONT_BIG = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 20)
    FONT_MED = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 13)
    FONT_SMALL = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 11)
    FONT_TINY = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 9)
except:
    FONT_BIG = ImageFont.load_default()
    FONT_MED = FONT_BIG
    FONT_SMALL = FONT_BIG
    FONT_TINY = FONT_BIG

def lerp(a,b,t): return int(a + (b-a)*t)
def mix(c1,c2,t): return tuple(lerp(c1[i], c2[i], t) for i in range(3))

GOLD_DARK = (58, 42, 12)
GOLD_MID = (122, 96, 32)
GOLD = (201, 168, 76)
GOLD_HI = (232, 212, 138)
GOLD_SHADOW = (40, 28, 8)
STONE_DARK = (16, 14, 12)
STONE_MID = (32, 26, 20)
STONE = (50, 40, 32)
STONE_LIGHT = (68, 56, 44)
STONE_HIGH = (86, 72, 56)
PARCH = (228, 214, 176)
PARCH_DARK = (184, 160, 110)
PARCH_EDGE = (90, 58, 22)
CRIMSON_DARK = (48, 10, 10)
CRIMSON = (132, 26, 26)
CRIMSON_BRIGHT = (196, 42, 24)
CRIMSON_HI = (255, 110, 70)
MANA_DARK = (10, 22, 48)
MANA = (34, 66, 122)
MANA_BRIGHT = (58, 106, 196)
MANA_HI = (106, 154, 255)

def add_stone_noise(img, x, y, w, h, intensity=18):
    """add subtle noise inside rect"""
    pixels = img.load()
    for _ in range((w*h)//10):
        px = random.randint(x, x+w-1)
        py = random.randint(y, y+h-1)
        v = random.randint(-intensity, intensity)
        r,g,b,a = pixels[px, py]
        pixels[px, py] = (max(0, min(255, r+v)), max(0, min(255, g+v//2)), max(0, min(255, b+v//3)), a)

def gradient_rect(x, y, w, h, c_top, c_bot, alpha=255):
    for i in range(h):
        t = i / max(1, h-1)
        c = mix(c_top, c_bot, t)
        DRAW.line([(x, y+i), (x+w-1, y+i)], fill=c+(alpha,))

def gold_bevel(x, y, w, h, inset=3, pressed=False):
    """draw Diablo-style beveled gold frame"""
    # outer dark
    DRAW.rectangle([x, y, x+w-1, y+h-1], outline=(18,14,10), width=1)
    # gold border layers
    if pressed:
        # inverted bevel (pressed = light on bottom/right)
        DRAW.rectangle([x+1, y+1, x+w-2, y+h-2], outline=GOLD_SHADOW, width=1)
        DRAW.rectangle([x+2, y+2, x+w-3, y+h-3], outline=GOLD_MID, width=1)
        # inner shadow
        DRAW.rectangle([x+3, y+3, x+w-4, y+h-4], outline=(0,0,0,120), width=1)
    else:
        DRAW.rectangle([x+1, y+1, x+w-2, y+h-2], outline=GOLD_HI, width=1)
        DRAW.rectangle([x+1, y+1, x+w-2, y+2], fill=GOLD_HI)  # top highlight
        DRAW.rectangle([x+1, y+1, x+2, y+h-2], fill=GOLD_HI)  # left highlight
        DRAW.rectangle([x+2, y+2, x+w-3, y+h-3], outline=GOLD_MID, width=1)
        DRAW.rectangle([x+3, y+3, x+w-4, y+h-4], outline=GOLD_DARK, width=1)
        # bottom/right shadow
        DRAW.line([(x+1, y+h-2),(x+w-2, y+h-2)], fill=GOLD_SHADOW)
        DRAW.line([(x+w-2, y+1),(x+w-2, y+h-2)], fill=GOLD_SHADOW)

def rivets(x, y, w, h, r=3):
    """small brass rivets at corners + mid edges"""
    pts = [(x+6, y+6), (x+w-7, y+6), (x+6, y+h-7), (x+w-7, y+h-7)]
    # mid points for wide elements
    if w>150:
        pts += [(x+w//2, y+6), (x+w//2, y+h-7)]
    if h>120:
        pts += [(x+6, y+h//2), (x+w-7, y+h//2)]
    for (cx,cy) in pts:
        # rivet base
        DRAW.ellipse([cx-r, cy-r, cx+r, cy+r], fill=GOLD_SHADOW, outline=None)
        DRAW.ellipse([cx-r+1, cy-r+1, cx+r-1, cy+r-1], fill=GOLD_MID, outline=GOLD_HI)
        DRAW.ellipse([cx-r+2, cy-r, cx-r+2, cy-r], fill=(255,255,255,90))

def draw_label(x, y, w, h, text, font=FONT_MED, color=GOLD_HI, shadow=True):
    tw = DRAW.textlength(text, font=font)
    tx = x + (w - tw)//2
    ty = y + (h - font.size)//2 -1
    if shadow:
        DRAW.text((tx+1, ty+1), text, font=font, fill=(0,0,0,200))
    DRAW.text((tx, ty), text, font=font, fill=color)

# --- Background texture ---
# subtle vignette and paper grain for whole atlas
for yy in range(H):
    t = abs(yy - H/2) / (H/2)
    v = int(10 * t)
    DRAW.line([(0, yy), (W-1, yy)], fill=(10+v//2, 8+v//3, 6, 255))
# light stone speckle across whole atlas
add_stone_noise(ATLAS, 0, 0, W, H, intensity=8)

sprites = {}

def record(name, x, y, w, h):
    sprites[name] = {"x": x, "y": y, "w": w, "h": h}
    # debug outline (very subtle for atlas inspection, 0.5 alpha)
    # DRAW.rectangle([x,y,x+w-1,y+h-1], outline=(255,255,255,12), width=1)
    return

# ==================== BUTTONS ====================
def draw_button(x, y, w, h, state="normal", text=""):
    if state == "normal":
        gradient_rect(x, y, w, h, (44,34,22), (22,16,10))
        add_stone_noise(ATLAS, x, y, w, h, intensity=12)
        gold_bevel(x, y, w, h, pressed=False)
        rivets(x, y, w, h, r=3)
        draw_label(x, y, w, h, text, font=FONT_MED, color=GOLD_HI)
        # inner gloss
        DRAW.rectangle([x+4, y+4, x+w-5, y+10], fill=(255,255,255,14))
    elif state == "hover":
        gradient_rect(x, y, w, h, (62,48,28), (34,24,14))
        add_stone_noise(ATLAS, x, y, w, h, intensity=14)
        gold_bevel(x, y, w, h, pressed=False)
        # hover glow
        DRAW.rectangle([x, y, x+w-1, y+h-1], outline=(232,212,138,70), width=2)
        DRAW.rectangle([x-1, y-1, x+w, y+h], outline=(201,168,76,30), width=1)
        rivets(x, y, w, h, r=3)
        draw_label(x, y, w, h, text, font=FONT_MED, color=(255,243,190))
        DRAW.rectangle([x+4, y+4, x+w-5, y+12], fill=(255,255,255,24))
    elif state == "pressed":
        gradient_rect(x, y, w, h, (18,12,8), (30,20,12))
        gold_bevel(x, y, w, h, pressed=True)
        rivets(x, y, w, h, r=3)
        draw_label(x, y+1, w, h, text, font=FONT_MED, color=(180,150,90))
    elif state == "disabled":
        gradient_rect(x, y, w, h, (30,28,26), (20,18,16))
        add_stone_noise(ATLAS, x, y, w, h, intensity=6)
        DRAW.rectangle([x, y, x+w-1, y+h-1], outline=(60,56,48), width=1)
        DRAW.rectangle([x+1, y+1, x+w-2, y+h-2], outline=(80,76,68), width=1)
        DRAW.rectangle([x+2, y+2, x+w-3, y+h-3], outline=(40,38,36), width=1)
        draw_label(x, y, w, h, text, font=FONT_MED, color=(110,106,96))

# Large buttons
draw_button(16, 16, 208, 52, "normal", "ИГРАТЬ")
record("button_large_normal", 16, 16, 208, 52)
draw_button(16, 76, 208, 52, "hover", "ИГРАТЬ")
record("button_large_hover", 16, 76, 208, 52)
draw_button(16, 136, 208, 52, "pressed", "ИГРАТЬ")
record("button_large_pressed", 16, 136, 208, 52)
draw_button(16, 196, 208, 52, "disabled", "ИГРАТЬ")
record("button_large_disabled", 16, 196, 208, 52)

draw_button(240, 16, 140, 44, "normal", "ОК")
record("button_small_normal", 240, 16, 140, 44)
draw_button(240, 68, 140, 44, "hover", "ОК")
record("button_small_hover", 240, 68, 140, 44)
draw_button(240, 120, 140, 44, "pressed", "ОК")
record("button_small_pressed", 240, 120, 140, 44)
draw_button(240, 172, 140, 44, "disabled", "ОК")
record("button_small_disabled", 240, 172, 140, 44)

# ==================== PANELS ====================
def draw_stone_panel(x, y, w, h, title=""):
    # background stone
    gradient_rect(x, y, w, h, (48,38,28), (18,14,10))
    add_stone_noise(ATLAS, x, y, w, h, intensity=16)
    # inner inset
    DRAW.rectangle([x+8, y+8, x+w-9, y+h-9], fill=(12,10,8,230), outline=(0,0,0,180), width=1)
    add_stone_noise(ATLAS, x+8, y+8, w-16, h-16, intensity=10)
    # gold frame
    gold_bevel(x, y, w, h, pressed=False)
    rivets(x, y, w, h, r=4)
    # title bar if needed
    if title:
        # title bar gradient
        gradient_rect(x+4, y+4, w-8, 28, (58,44,20), (38,28,12))
        DRAW.line([(x+4, y+32),(x+w-5, y+32)], fill=GOLD_DARK)
        DRAW.line([(x+4, y+33),(x+w-5, y+33)], fill=GOLD_HI)
        draw_label(x+4, y+4, w-8, 28, title, font=FONT_SMALL, color=GOLD_HI)
        # small skull ornament centered maybe
        DRAW.ellipse([x+w//2-1, y+34-2, x+w//2+1, y+34+2], fill=GOLD_MID, outline=GOLD_HI)
    # inner bevel of content area
    DRAW.rectangle([x+8, y+8, x+w-9, y+h-9], outline=(255,255,255,10), width=1)
    DRAW.rectangle([x+9, y+9, x+w-10, y+h-10], outline=(0,0,0,60), width=1)

draw_stone_panel(400, 16, 300, 200, "ИНВЕНТАРЬ")
record("panel_window", 400, 16, 300, 200)

def draw_parchment(x, y, w, h):
    # parchment base with ragged edge effect via shadow
    DRAW.rectangle([x+2, y+2, x+w-1, y+h-1], fill=(0,0,0,90))
    gradient_rect(x, y, w, h, (228,214,176), (184,160,110))
    add_stone_noise(ATLAS, x, y, w, h, intensity=10)
    # edge darkening
    for i in range(6):
        alpha = int(90 - i*14)
        DRAW.rectangle([x+i, y+i, x+w-1-i, y+h-1-i], outline=(90,58,22, alpha), width=1)
    # torn edge imitation: random notches at border (inner)
    for _ in range(30):
        rx = random.choice([x, x+w-1])
        ry = random.randint(y+10, y+h-10)
        DRAW.ellipse([rx-3, ry-2, rx+3, ry+2], fill=(184,160,110))
    for _ in range(30):
        rx = random.randint(x+10, x+w-10)
        ry = random.choice([y, y+h-1])
        DRAW.ellipse([rx-2, ry-3, rx+2, ry+3], fill=(228,214,176))
    # inner ink border
    DRAW.rectangle([x+10, y+10, x+w-11, y+h-11], outline=(58,36,16,140), width=1)
    DRAW.rectangle([x+11, y+11, x+w-12, y+h-12], outline=(90,58,22,60), width=1)
    # wax seal hint
    DRAW.ellipse([x+w-38, y+h-38, x+w-14, y+h-14], fill=(110,22,18), outline=(58,12,10), width=2)
    DRAW.ellipse([x+w-34, y+h-34, x+w-18, y+h-18], fill=(140,30,22), outline=None)
    # text lines fake
    for i in range(4):
        ly = y+36 + i*18
        DRAW.line([(x+22, ly), (x+w-60, ly)], fill=(58,36,16,30), width=1)
    draw_label(x+14, y+10, w-28, 20, "СВИТОК", font=FONT_SMALL, color=(58,36,16))
    # gold corners
    for cx, cy in [(x+4, y+4), (x+w-5, y+4), (x+4, y+h-5), (x+w-5, y+h-5)]:
        DRAW.rectangle([cx-2, cy-2, cx+2, cy+2], fill=PARCH_EDGE, outline=GOLD_MID)

draw_parchment(720, 16, 288, 200)
record("panel_parchment", 720, 16, 288, 200)

# tooltip
def draw_tooltip(x, y, w, h):
    gradient_rect(x, y, w, h, (24,18,12), (14,10,8))
    add_stone_noise(ATLAS, x,y,w,h, intensity=12)
    DRAW.rectangle([x, y, x+w-1, y+h-1], outline=(201,168,76,220), width=1)
    DRAW.rectangle([x+1, y+1, x+w-2, y+h-2], outline=(80,60,20,180), width=1)
    DRAW.rectangle([x+2, y+2, x+w-3, y+8], fill=(255,255,255,10))
    # text placeholder
    DRAW.text((x+10, y+10), "Меч Хаоса", font=FONT_SMALL, fill=GOLD_HI)
    DRAW.text((x+10, y+26), "Урон: 24–64", font=FONT_TINY, fill=(180,170,150))
    DRAW.text((x+10, y+38), "Требует: 58 силы", font=FONT_TINY, fill=(140,130,110))
    DRAW.text((x+10, y+52), "★ Легендарный", font=FONT_TINY, fill=(90,180,90))
    # rarity border left
    DRAW.rectangle([x, y, x+3, y+h-1], fill=(196,42,24))

draw_tooltip(400, 232, 220, 88)
record("tooltip", 400, 232, 220, 88)

# divider / title bar
def draw_dialog_bar(x, y, w, h, title="КВЕСТ"):
    gradient_rect(x, y, w, h, (52,38,24), (28,20,12))
    add_stone_noise(ATLAS, x,y,w,h, intensity=10)
    gold_bevel(x, y, w, h, pressed=False)
    draw_label(x, y, w, h, title, font=FONT_SMALL, color=GOLD_HI)
    # wings ornament
    DRAW.line([(x+16, y+h//2), (x+48, y+h//2)], fill=GOLD_MID, width=1)
    DRAW.line([(x+w-48, y+h//2), (x+w-16, y+h//2)], fill=GOLD_MID, width=1)
    DRAW.ellipse([x+12, y+h//2-3, x+18, y+h//2+3], fill=GOLD_MID, outline=GOLD_HI)
    DRAW.ellipse([x+w-18, y+h//2-3, x+w-12, y+h//2+3], fill=GOLD_MID, outline=GOLD_HI)

draw_dialog_bar(640, 232, 320, 38, "— ТЁМНЫЙ ПОРТАЛ —")
record("dialog_bar", 640, 232, 320, 38)

# ==================== SLOTS & ORBS ====================
def draw_slot(x, y, s=56, state="empty"):
    if state=="empty":
        gradient_rect(x, y, s, s, (18,14,10), (10,8,6))
        DRAW.rectangle([x, y, x+s-1, y+s-1], outline=(0,0,0), width=1)
        DRAW.rectangle([x+1, y+1, x+s-2, y+s-2], outline=(60,48,32), width=1)
        DRAW.rectangle([x+2, y+2, x+s-3, y+s-3], outline=(18,14,10), width=1)
        # inner shadow
        DRAW.rectangle([x+3, y+3, x+s-4, y+s-4], fill=(0,0,0,60))
        # inner highlight top-left
        DRAW.line([(x+3, y+3),(x+s-4, y+3)], fill=(255,255,255,12))
        DRAW.line([(x+3, y+3),(x+3, y+s-4)], fill=(255,255,255,10))
    elif state=="hover":
        gradient_rect(x, y, s, s, (28,22,14), (14,10,6))
        DRAW.rectangle([x, y, x+s-1, y+s-1], outline=GOLD_HI, width=1)
        DRAW.rectangle([x+1, y+1, x+s-2, y+s-2], outline=GOLD_MID, width=1)
        DRAW.rectangle([x+2, y+2, x+s-3, y+s-3], outline=GOLD_DARK, width=1)
        DRAW.rectangle([x, y, x+s-1, y+s-1], outline=(255,255,255,40), width=1)
        # glow
        DRAW.rectangle([x-1, y-1, x+s, y+s], outline=(201,168,76,30), width=1)
    elif state=="selected":
        gradient_rect(x, y, s, s, (36,28,18), (16,12,8))
        DRAW.rectangle([x, y, x+s-1, y+s-1], outline=(255,220,120), width=2)
        DRAW.rectangle([x+2, y+2, x+s-3, y+s-3], outline=GOLD_MID, width=1)
        # corner marks
        for cx,cy in [(x+2,y+2),(x+s-3,y+2),(x+2,y+s-3),(x+s-3,y+s-3)]:
            DRAW.rectangle([cx-2, cy-2, cx+2, cy+2], fill=GOLD_HI, outline=None)
    elif state=="locked":
        gradient_rect(x, y, s, s, (12,10,10), (8,6,6))
        DRAW.rectangle([x, y, x+s-1, y+s-1], outline=(60,50,50), width=1)
        DRAW.rectangle([x+1, y+1, x+s-2, y+s-2], outline=(40,36,36), width=1)
        # chain cross
        DRAW.line([(x+8, y+8),(x+s-9, y+s-9)], fill=(80,20,20,180), width=2)
        DRAW.line([(x+s-9, y+8),(x+8, y+s-9)], fill=(80,20,20,180), width=2)
        # lock dot
        DRAW.ellipse([x+s//2-8, y+s//2-8, x+s//2+8, y+s//2+8], fill=(40,30,20), outline=GOLD_MID)
        DRAW.ellipse([x+s//2-4, y+s//2-2, x+s//2+4, y+s//2+6], fill=(20,14,8))

draw_slot(16, 268, 56, "empty"); record("slot_empty", 16, 268, 56, 56)
draw_slot(80, 268, 56, "hover"); record("slot_hover", 80, 268, 56, 56)
draw_slot(144, 268, 56, "selected"); record("slot_selected", 144, 268, 56, 56)
draw_slot(208, 268, 56, "locked"); record("slot_locked", 208, 268, 56, 56)

def draw_orb(x, y, s, kind="health", fill=0.72):
    # stone rim
    # outer shadow
    DRAW.ellipse([x-2, y-2, x+s+2, y+s+2], fill=(0,0,0,140))
    # gold rim
    DRAW.ellipse([x, y, x+s, y+s], fill=GOLD_SHADOW)
    DRAW.ellipse([x+2, y+2, x+s-2, y+s-2], fill=GOLD_MID)
    DRAW.ellipse([x+4, y+4, x+s-4, y+s-4], fill=GOLD_DARK)
    DRAW.ellipse([x+6, y+6, x+s-6, y+s-6], fill=(0,0,0))
    # inner liquid with gradient inside ellipse
    # create temporary image for liquid
    tmp = Image.new("RGBA", (s, s), (0,0,0,0))
    tdraw = ImageDraw.Draw(tmp)
    # clipping ellipse
    # fill liquid up to level
    clip_y = int(s * (1-fill))
    if kind=="health":
        c_dark, c_mid, c_hi = CRIMSON_DARK, CRIMSON, CRIMSON_HI
        gloss = (255, 140, 140, 70)
    else:
        c_dark, c_mid, c_hi = MANA_DARK, MANA, MANA_HI
        gloss = (140, 180, 255, 70)
    # gradient liquid
    for yy in range(s):
        if yy < clip_y: continue
        t = (yy - clip_y) / max(1, s-clip_y)
        # wave shape at top
        wave = 4* math.sin((yy/8)) if yy==clip_y else 0
        c = mix(c_dark, c_mid, t*0.6) if t<0.6 else mix(c_mid, c_hi, (t-0.6)/0.4)
        # brightness pulse
        tdraw.line([(0, yy),(s, yy)], fill=c+(255,))
    # apply circular mask
    mask = Image.new("L", (s, s), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.ellipse([6,6,s-6,s-6], fill=255)
    tmp.putalpha(mask)
    ATLAS.alpha_composite(tmp, (x, y))
    # highlight on liquid
    DRAW.ellipse([x+18, y+22, x+36, y+42], fill=(255,255,255,22))
    DRAW.ellipse([x+22, y+26, x+30, y+34], fill=(255,255,255,34))
    # rim highlight
    DRAW.arc([x+4, y+4, x+s-4, y+s-4], 200, 340, fill=GOLD_HI, width=2)
    DRAW.arc([x+6, y+6, x+s-6, y+s-6], 200, 320, fill=(255,255,255,40), width=1)
    # small rivets around rim
    for ang in range(0, 360, 45):
        rad = s/2 - 2
        cx = x + s/2 + math.cos(math.radians(ang))*rad
        cy = y + s/2 + math.sin(math.radians(ang))*rad
        DRAW.ellipse([cx-2, cy-2, cx+2, cy+2], fill=GOLD_MID, outline=GOLD_HI)

draw_orb(16, 340, 96, "health", 0.68)
record("orb_health", 16, 340, 96, 96)
draw_orb(120, 340, 96, "mana", 0.84)
record("orb_mana", 120, 340, 96, 96)

def draw_bar(x, y, w, h, fill, c_dark, c, c_hi, show_fill=True):
    # bg
    DRAW.rectangle([x, y, x+w-1, y+h-1], fill=(12,10,8), outline=(0,0,0), width=1)
    DRAW.rectangle([x+1, y+1, x+w-2, y+h-2], outline=(58,48,32), width=1)
    DRAW.rectangle([x+2, y+2, x+w-3, y+h-3], outline=(28,22,14), width=1)
    # fill
    if show_fill:
        fw = int((w-6) * fill)
        if fw>0:
            for i in range(h-6):
                t = i/(h-6)
                col = mix(c_dark, c, 0.5+t*0.5) if t<0.6 else mix(c, c_hi, (t-0.6)/0.4)
                DRAW.line([(x+3, y+3+i), (x+3+fw-1, y+3+i)], fill=col)
            # gloss top
            DRAW.rectangle([x+3, y+3, x+3+fw-1, y+6], fill=(255,255,255,28))
            # edge line at fill end
            DRAW.line([(x+3+fw-1, y+3),(x+3+fw-1, y+h-4)], fill=(255,255,255,90), width=1)
    # notches
    for nx in [w//3, 2*w//3]:
        DRAW.line([(x+nx, y+1),(x+nx, y+h-2)], fill=(0,0,0,120))
        DRAW.line([(x+nx+1, y+1),(x+nx+1, y+h-2)], fill=(255,255,255,10))
    # end caps / rivets
    DRAW.rectangle([x-2, y-2, x+2, y+h+1], fill=GOLD_DARK, outline=GOLD_MID)
    DRAW.rectangle([x+w-3, y-2, x+w+2, y+h+1], fill=GOLD_DARK, outline=GOLD_MID)
    DRAW.ellipse([x-1, y+h//2-3, x+1, y+h//2+3], fill=GOLD_MID, outline=GOLD_HI)
    DRAW.ellipse([x+w-2, y+h//2-3, x+w, y+h//2+3], fill=GOLD_MID, outline=GOLD_HI)

draw_bar(232, 340, 180, 28, 0.68, CRIMSON_DARK, CRIMSON, CRIMSON_BRIGHT)
record("bar_health", 232, 340, 180, 28)
draw_bar(232, 376, 180, 28, 0.84, MANA_DARK, MANA, MANA_BRIGHT)
record("bar_mana", 232, 376, 180, 28)
# xp bar thinner gold
def draw_xp(x,y,w,h, fill):
    DRAW.rectangle([x,y,x+w-1,y+h-1], fill=(18,14,10), outline=(0,0,0), width=1)
    DRAW.rectangle([x+1,y+1,x+w-2,y+h-2], outline=(60,50,20), width=1)
    fw=int((w-2)*fill)
    if fw>0:
        gradient_rect(x+1, y+1, fw, h-2, (200,168,40), (122,96,20))
        DRAW.rectangle([x+1,y+1,x+1+fw-1,y+3], fill=(255,255,255,30))
draw_xp(232, 412, 180, 16, 0.42)
record("bar_xp", 232, 412, 180, 16)

# divider
def draw_divider(x,y,w,h):
    gradient_rect(x, y+h//2-1, w, 2, GOLD_SHADOW, GOLD_DARK)
    DRAW.rectangle([x+w//2-12, y, x+w//2+12, y+h], fill=GOLD_MID, outline=GOLD_HI)
    DRAW.rectangle([x+w//2-2, y+2, x+w//2+2, y+h-2], fill=GOLD_DARK)
    DRAW.ellipse([x+w//2-6, y+2, x+w//2+6, y+h-2], fill=GOLD_MID, outline=GOLD_HI)
    DRAW.ellipse([x+w//2-3, y+4, x+w//2+3, y+h-4], fill=GOLD_HI)

draw_divider(232, 438, 180, 14)
record("divider", 232, 438, 180, 14)

# ==================== CHECKBOXES / RADIOS / CLOSE ====================
def draw_checkbox(x,y,s, checked=False):
    gradient_rect(x,y,s,s,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+s-1,y+s-1], outline=(58,48,32), width=1)
    DRAW.rectangle([x+1,y+1,x+s-2,y+s-2], outline=(18,14,10), width=1)
    if checked:
        DRAW.rectangle([x+4,y+4,x+s-5,y+s-5], fill=CRIMSON, outline=GOLD_MID)
        # checkmark
        DRAW.line([(x+6, y+s//2),(x+10, y+s-7)], fill=GOLD_HI, width=2)
        DRAW.line([(x+10, y+s-7),(x+s-7, y+7)], fill=GOLD_HI, width=2)
        DRAW.line([(x+6, y+s//2+1),(x+10, y+s-6)], fill=(255,255,255,120), width=1)
draw_checkbox(480,340,28,False); record("checkbox_off",480,340,28,28)
draw_checkbox(516,340,28,True); record("checkbox_on",516,340,28,28)

def draw_radio(x,y,s, on=False):
    DRAW.ellipse([x,y,x+s-1,y+s-1], fill=(18,14,10), outline=(58,48,32), width=1)
    DRAW.ellipse([x+1,y+1,x+s-2,y+s-2], outline=(18,14,10), width=1)
    if on:
        DRAW.ellipse([x+5,y+5,x+s-6,y+s-6], fill=CRIMSON, outline=GOLD_MID)
        DRAW.ellipse([x+8,y+8,x+s-9,y+s-9], fill=GOLD_HI)
        DRAW.ellipse([x+9,y+9,x+10,y+10], fill=(255,255,255,160))

draw_radio(480,376,28,False); record("radio_off",480,376,28,28)
draw_radio(516,376,28,True); record("radio_on",516,376,28,28)

def draw_close(x,y,s):
    gradient_rect(x,y,s,s,(48,14,14),(28,10,10))
    DRAW.rectangle([x,y,x+s-1,y+s-1], outline=GOLD_MID, width=1)
    DRAW.rectangle([x+1,y+1,x+s-2,y+s-2], outline=GOLD_DARK, width=1)
    # X
    DRAW.line([(x+7,y+7),(x+s-8,y+s-8)], fill=GOLD_HI, width=2)
    DRAW.line([(x+s-8,y+7),(x+7,y+s-8)], fill=GOLD_HI, width=2)
    DRAW.line([(x+7,y+8),(x+s-8,y+s-7)], fill=(255,120,120,90), width=1)
draw_close(560,340,28); record("btn_close",560,340,28,28)

# corner ornaments
def draw_corner(x,y,s, rot=0):
    # gothic corner spike
    pts = [(x+s//2, y+2), (x+s-4, y+4), (x+s-2, y+s//2), (x+s//2, y+s-6), (x+4, y+s//2), (x+2, y+4)]
    DRAW.polygon(pts, fill=GOLD_DARK, outline=GOLD_MID)
    DRAW.polygon([(p[0]+1,p[1]+1) for p in pts], outline=(0,0,0,80), width=1)
    # inner gem
    DRAW.ellipse([x+s//2-5, y+s//2-5, x+s//2+5, y+s//2+5], fill=(60,10,10), outline=GOLD_MID)
    DRAW.ellipse([x+s//2-3, y+s//2-3, x+s//2+3, y+s//2+3], fill=CRIMSON_BRIGHT)
    DRAW.ellipse([x+s//2-1, y+s//2-4, x+s//2+1, y+s//2-2], fill=(255,180,180,90))

draw_corner(480,412,40); record("corner_ornament",480,412,40,40)
# duplicate with variations
DRAW.ellipse([528+20-5, 412+20-5, 528+20+5, 412+20+5], fill=(10,30,60), outline=GOLD_MID)
DRAW.ellipse([528+20-3, 412+20-3, 528+20+3, 412+20+3], fill=MANA_BRIGHT)
draw_corner(576,412,40); record("corner_ornament2",576,412,40,40)
draw_corner(624,412,40); record("corner_ornament3",624,412,40,40)
# overwrite second one proper
DRAW.rectangle([528,412,528+40,412+40], fill=(10,8,6,0)) # will redraw properly later - simple
# redraw second correctly
tmpc = Image.new("RGBA", (40,40), (0,0,0,0))
cd = ImageDraw.Draw(tmpc)
pts = [(20,2),(36,4),(38,20),(20,34),(4,20),(2,4)]
cd.polygon(pts, fill=GOLD_DARK, outline=GOLD_MID)
cd.ellipse([15,15,25,25], fill=(10,30,60), outline=GOLD_MID)
cd.ellipse([17,17,23,23], fill=MANA_BRIGHT)
ATLAS.alpha_composite(tmpc, (528,412))
record("corner_sapphire",528,412,40,40)

# slider
def draw_slider_track(x,y,w,h):
    DRAW.rectangle([x,y,x+w-1,y+h-1], fill=(12,10,8), outline=(0,0,0), width=1)
    DRAW.rectangle([x+1,y+1,x+w-2,y+h-2], outline=(58,48,32), width=1)
    # fill portion 60%
    fw=int((w-4)*0.62)
    gradient_rect(x+2,y+2, fw, h-4, (122,96,32), (58,42,12))
    # ticks
    for tx in [0, w//4, w//2, 3*w//4, w-1]:
        DRAW.line([(x+tx, y),(x+tx, y+h-1)], fill=(0,0,0,60))
    DRAW.rectangle([x,y,x+w-1,y+h-1], outline=(0,0,0,120), width=1)

def draw_thumb(x,y,w,h):
    gradient_rect(x,y,w,h,(62,48,28),(34,24,14))
    gold_bevel(x,y,w,h, pressed=False)
    # grip lines
    for i in range(3):
        lx = x+w//2-4 + i*4
        DRAW.line([(lx, y+6),(lx, y+h-7)], fill=GOLD_MID, width=1)
        DRAW.line([(lx+1, y+6),(lx+1, y+h-7)], fill=GOLD_HI, width=1)

draw_slider_track(480,468,160,14); record("slider_track",480,468,160,14)
draw_thumb(560,490,20,28); record("slider_thumb",560,490,20,28)

# tabs
def draw_tab(x,y,w,h, active=True, text="ТАБ"):
    if active:
        gradient_rect(x,y,w,h,(52,40,24),(34,26,16))
        DRAW.rectangle([x,y,x+w-1,y+h-1], outline=GOLD_HI, width=1)
        DRAW.rectangle([x+1,y+1,x+w-2,y+h-2], outline=GOLD_MID, width=1)
        # bottom highlight shows active (no bottom border)
        DRAW.rectangle([x+1,y+h-2,x+w-2,y+h-1], fill=(52,40,24))
        draw_label(x,y,w,h,text, font=FONT_SMALL, color=GOLD_HI)
        # top shine
        DRAW.rectangle([x+1,y+1,x+w-2,y+4], fill=(255,255,255,18))
    else:
        gradient_rect(x,y,w,h,(24,20,16),(16,14,10))
        DRAW.rectangle([x,y,x+w-1,y+h-1], outline=(60,52,32), width=1)
        DRAW.rectangle([x+1,y+1,x+w-2,y+h-2], outline=(36,32,22), width=1)
        draw_label(x,y,w,h,text, font=FONT_SMALL, color=(120,110,90))
        # inset shadow
        DRAW.rectangle([x+2,y+2,x+w-3,y+h-2], fill=(0,0,0,30))

draw_tab(680,340,120,36,True,"СНАРЯЖЕНИЕ"); record("tab_active",680,340,120,36)
draw_tab(680,384,120,36,False,"УМЕНИЯ"); record("tab_inactive",680,384,120,36)

# belt slot (wide)
def draw_belt(x,y,w,h):
    gradient_rect(x,y,w,h,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+w-1,y+h-1], outline=(60,48,32), width=1)
    DRAW.rectangle([x+1,y+1,x+w-2,y+h-2], outline=(18,14,10), width=1)
    # divisions
    for i in range(1,4):
        sx = x + i*(w//4)
        DRAW.line([(sx, y+1),(sx, y+h-2)], fill=GOLD_DARK, width=1)
        DRAW.line([(sx+1, y+1),(sx+1, y+h-2)], fill=GOLD_MID, width=1)
    # numbers
    for i,ch in enumerate(["1","2","3","4"]):
        DRAW.text((x+8+i*16, y+8), ch, font=FONT_TINY, fill=(90,80,60))

draw_belt(680,432,128,32); record("belt",680,432,128,32)

# ==================== ICONS 48x48 ====================
def draw_icon_sword(x,y):
    # stone slot bg
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    DRAW.rectangle([x+1,y+1,x+46,y+46], outline=(18,14,10), width=1)
    # sword blade
    # handle
    DRAW.rectangle([x+22, y+30, x+26, y+40], fill=(62,42,22), outline=(40,28,12))
    DRAW.rectangle([x+20, y+28, x+28, y+31], fill=GOLD_MID, outline=GOLD_HI) # guard
    DRAW.ellipse([x+22, y+40, x+26, y+44], fill=CRIMSON, outline=GOLD_MID)
    # blade
    pts = [(x+24, y+6), (x+20, y+30), (x+28, y+30)]
    DRAW.polygon(pts, fill=(200,200,210), outline=(255,255,255))
    DRAW.polygon(pts, outline=(120,120,130), width=1)
    # shine line
    DRAW.line([(x+24, y+8),(x+22, y+28)], fill=(255,255,255,180), width=1)
    # fuller
    DRAW.line([(x+24, y+10),(x+24, y+26)], fill=(140,140,150), width=1)

def draw_icon_axe(x,y):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    # handle
    DRAW.rectangle([x+14, y+12, x+18, y+38], fill=(58,38,20), outline=(40,28,12))
    # axe head
    DRAW.polygon([(x+18,y+10),(x+34,y+8),(x+36,y+20),(x+18,y+24)], fill=(170,170,180), outline=(255,255,255))
    DRAW.polygon([(x+18,y+10),(x+34,y+8),(x+36,y+20),(x+18,y+24)], outline=(90,90,100), width=1)
    DRAW.line([(x+22,y+12),(x+32,y+11)], fill=(255,255,255,120), width=1)
    # edge highlight
    DRAW.line([(x+34,y+8),(x+36,y+20)], fill=(255,255,255,140), width=1)

def draw_icon_shield(x,y):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    # shield shape
    DRAW.polygon([(x+14,y+10),(x+34,y+10),(x+34,y+28),(x+24,y+38),(x+14,y+28)], fill=(122,22,22), outline=GOLD_MID, width=2)
    DRAW.polygon([(x+14,y+10),(x+34,y+10),(x+34,y+28),(x+24,y+38),(x+14,y+28)], outline=GOLD_HI, width=1)
    DRAW.polygon([(x+16,y+12),(x+32,y+12),(x+32,y+27),(x+24,y+36),(x+16,y+27)], outline=(50,10,10), width=1)
    # crest
    DRAW.ellipse([x+20,y+16, x+28,y+26], fill=GOLD_MID, outline=GOLD_HI)
    DRAW.text((x+22,y+17), "✦", fill=GOLD_HI, font=FONT_TINY)

def draw_icon_helm(x,y):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    # helm dome
    DRAW.ellipse([x+10, y+10, x+38, y+30], fill=(120,120,130), outline=(80,80,90))
    DRAW.ellipse([x+12, y+12, x+36, y+28], fill=(160,160,170), outline=None)
    DRAW.ellipse([x+14, y+14, x+22, y+20], fill=(255,255,255,80))
    # visor
    DRAW.rectangle([x+14, y+26, x+34, y+34], fill=(40,30,20), outline=GOLD_MID)
    DRAW.rectangle([x+16, y+28, x+32, y+30], fill=(0,0,0))
    # plume
    DRAW.polygon([(x+24,y+8),(x+28,y+4),(x+30,y+14),(x+24,y+16)], fill=CRIMSON, outline=(90,20,20))

def draw_icon_potion(x,y, color, hi):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    # bottle
    DRAW.ellipse([x+14,y+30,x+34,y+42], fill=(40,40,50), outline=None)
    DRAW.rectangle([x+14,y+18,x+34,y+34], fill=(40,40,50))
    DRAW.ellipse([x+14,y+14,x+34,y+26], fill=(40,40,50))
    # liquid
    DRAW.ellipse([x+16,y+32,x+32,y+40], fill=color)
    DRAW.rectangle([x+16,y+20,x+32,y+34], fill=color)
    DRAW.ellipse([x+16,y+16,x+32,y+24], fill=hi)
    # highlight
    DRAW.ellipse([x+18,y+20,x+22,y+32], fill=(255,255,255,70))
    # cork
    DRAW.rectangle([x+20,y+10,x+28,y+16], fill=(110,80,40), outline=(70,50,20))
    DRAW.rectangle([x+18,y+16,x+30,y+18], fill=GOLD_MID)
    # glow around
    DRAW.ellipse([x+16,y+16,x+32,y+24], outline=(255,255,255,40), width=1)

def draw_icon_gem(x,y, c1,c2):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    # gem facets
    cx, cy = x+24, y+24
    pts = [(cx, y+8), (x+32, y+16), (x+32, y+30), (cx, y+38), (x+16, y+30), (x+16, y+16)]
    DRAW.polygon(pts, fill=c1, outline=c2)
    DRAW.polygon(pts, outline=(255,255,255,120), width=1)
    # inner highlight
    DRAW.polygon([(cx, y+8),(x+28,y+16),(cx,y+20),(x+20,y+16)], fill=(255,255,255,70))
    DRAW.polygon([(cx,y+20),(x+32,y+30),(cx,y+38),(x+16,y+30)], fill=(0,0,0,40))
    # top sparkle
    DRAW.ellipse([x+20,y+12,x+24,y+16], fill=(255,255,255,170))

def draw_icon_rune(x,y, symbol):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    # stone tablet
    DRAW.rectangle([x+8, y+8, x+40, y+40], fill=(38,30,22), outline=GOLD_MID)
    DRAW.rectangle([x+9, y+9, x+39, y+39], outline=GOLD_DARK, width=1)
    add_stone_noise(ATLAS, x+8,y+8,32,32,intensity=8)
    # symbol glowing
    DRAW.text((x+16, y+12), symbol, font=FONT_BIG, fill=GOLD_HI)
    # use small font for rune? big already
    # glow
    DRAW.rectangle([x+8,y+8,x+40,y+40], outline=(201,168,76,40), width=1)
    # cracks
    DRAW.line([(x+10,y+12),(x+14,y+18)], fill=(0,0,0,60), width=1)
    DRAW.line([(x+34,y+30),(x+30,y+36)], fill=(0,0,0,60), width=1)

def draw_icon_scroll(x,y):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    # scroll
    DRAW.rectangle([x+10, y+14, x+38, y+34], fill=PARCH, outline=PARCH_EDGE)
    DRAW.rectangle([x+8, y+12, x+12, y+36], fill=(80,60,20), outline=PARCH_EDGE) # left roll
    DRAW.rectangle([x+36, y+12, x+40, y+36], fill=(80,60,20), outline=PARCH_EDGE)
    DRAW.rectangle([x+10,y+14,x+38,y+18], fill=(255,255,255,40))
    DRAW.text((x+16,y+20), "≡", fill=(90,58,22), font=FONT_MED)
    # seal
    DRAW.ellipse([x+18,y+26,x+30,y+36], fill=CRIMSON, outline=(60,10,10))

def draw_icon_key(x,y):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    # key
    DRAW.ellipse([x+12,y+16,x+24,y+28], fill=GOLD_MID, outline=GOLD_HI, width=2)
    DRAW.ellipse([x+15,y+19,x+21,y+25], fill=(18,14,10))
    DRAW.rectangle([x+20,y+22,x+36,y+26], fill=GOLD_MID, outline=GOLD_HI)
    DRAW.rectangle([x+30,y+22,x+32,y+30], fill=GOLD_MID)
    DRAW.rectangle([x+33,y+24,x+36,y+28], fill=GOLD_MID)
    # shine
    DRAW.ellipse([x+14,y+18,x+16,y+20], fill=(255,255,255,120))

def draw_icon_skull(x,y):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    DRAW.ellipse([x+14,y+14,x+34,y+32], fill=(210,210,200), outline=(160,160,150))
    DRAW.rectangle([x+18,y+28,x+30,y+36], fill=(210,210,200), outline=(160,160,150))
    DRAW.ellipse([x+18,y+20,x+24,y+26], fill=(20,10,10))
    DRAW.ellipse([x+26,y+20,x+32,y+26], fill=(20,10,10))
    DRAW.ellipse([x+19,y+22,x+22,y+24], fill=CRIMSON_BRIGHT)
    DRAW.ellipse([x+27,y+22,x+30,y+24], fill=CRIMSON_BRIGHT)
    DRAW.polygon([(x+24,y+26),(x+22,y+30),(x+26,y+30)], fill=(20,10,10))
    # cracks
    DRAW.line([(x+20,y+14),(x+22,y+18)], fill=(140,140,130), width=1)
    # teeth
    for tx in [19,22,25,28]:
        DRAW.line([(x+tx, y+32),(x+tx, y+36)], fill=(160,160,150), width=1)

def draw_icon_ring(x,y):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    # ring
    DRAW.ellipse([x+10,y+14,x+38,y+38], fill=GOLD_MID, outline=GOLD_HI, width=2)
    DRAW.ellipse([x+16,y+20,x+32,y+32], fill=(18,14,10))
    DRAW.ellipse([x+18,y+22,x+30,y+30], outline=GOLD_DARK, width=1)
    # gem on ring
    DRAW.ellipse([x+20,y+8,x+28,y+18], fill=CRIMSON, outline=GOLD_HI)
    DRAW.ellipse([x+22,y+10,x+26,y+14], fill=CRIMSON_HI)
    DRAW.ellipse([x+23,y+11,x+25,y+13], fill=(255,255,255,170))

def draw_icon_amulet(x,y):
    gradient_rect(x,y,48,48,(18,14,10),(10,8,6))
    DRAW.rectangle([x,y,x+47,y+47], outline=(60,48,32), width=1)
    # chain
    DRAW.ellipse([x+16,y+10,x+20,y+14], fill=GOLD_MID, outline=GOLD_HI)
    DRAW.ellipse([x+28,y+10,x+32,y+14], fill=GOLD_MID, outline=GOLD_HI)
    DRAW.line([(x+18,y+14),(x+20,y+18)], fill=GOLD_MID, width=2)
    DRAW.line([(x+30,y+14),(x+28,y+18)], fill=GOLD_MID, width=2)
    # amulet
    DRAW.polygon([(x+24,y+16),(x+32,y+24),(x+28,y+38),(x+20,y+38),(x+16,y+24)], fill=GOLD_DARK, outline=GOLD_MID, width=2)
    DRAW.polygon([(x+24,y+18),(x+30,y+24),(x+27,y+36),(x+21,y+36),(x+18,y+24)], fill=MANA, outline=MANA_HI)
    DRAW.ellipse([x+21,y+22,x+27,y+30], fill=MANA_BRIGHT, outline=MANA_HI)
    DRAW.ellipse([x+22,y+23,x+24,y+25], fill=(255,255,255,120))

# Place icons
icons = [
    (draw_icon_sword, "icon_sword", 16,460),
    (draw_icon_axe, "icon_axe", 72,460),
    (draw_icon_shield, "icon_shield", 128,460),
    (draw_icon_helm, "icon_helm", 184,460),
    (lambda x,y: draw_icon_potion(x,y, CRIMSON, CRIMSON_HI), "icon_potion_red", 240,460),
    (lambda x,y: draw_icon_potion(x,y, MANA, MANA_HI), "icon_potion_blue", 296,460),
    (lambda x,y: draw_icon_potion(x,y, (42,120,42), (90,200,90)), "icon_potion_green", 352,460),
    (lambda x,y: draw_icon_gem(x,y, CRIMSON, GOLD), "icon_gem_ruby", 408,460),
    (lambda x,y: draw_icon_gem(x,y, MANA, GOLD), "icon_gem_sapphire", 16,516),
    (lambda x,y: draw_icon_rune(x,y, "ᛉ"), "icon_rune_el", 72,516),
    (lambda x,y: draw_icon_rune(x,y, "ᛏ"), "icon_rune_tir", 128,516),
    (draw_icon_scroll, "icon_scroll", 184,516),
    (draw_icon_key, "icon_key", 240,516),
    (draw_icon_skull, "icon_skull", 296,516),
    (draw_icon_ring, "icon_ring", 352,516),
    (draw_icon_amulet, "icon_amulet", 408,516),
]
for fn, name, ix, iy in icons:
    fn(ix, iy)
    record(name, ix, iy, 48, 48)

# ==================== Additional decorative bits ====================
# 9-slice demo frame: show grid lines as overlay
def draw_nine_slice_demo(x,y,w,h):
    # base panel
    gradient_rect(x,y,w,h,(32,26,20),(16,12,8))
    add_stone_noise(ATLAS, x,y,w,h, intensity=10)
    gold_bevel(x,y,w,h, pressed=False)
    # show 9-slice cuts with subtle dashed lines
    # margin = 24
    m=24
    # vertical lines
    for lx in [x+m, x+w-m]:
        for py in range(y, y+h, 6):
            DRAW.line([(lx, py),(lx, py+3)], fill=(201,168,76,80), width=1)
    for ly in [y+m, y+h-m]:
        for px in range(x, x+w, 6):
            DRAW.line([(px, ly),(px+3, ly)], fill=(201,168,76,80), width=1)
    # center label
    draw_label(x, y, w, h, "9-SLICE", font=FONT_TINY, color=(120,110,90))
    # corner size hint
    DRAW.ellipse([x+4,y+4,x+8,y+8], fill=GOLD_HI)
    DRAW.ellipse([x+w-8,y+4,x+w-4,y+8], fill=GOLD_HI)
    DRAW.ellipse([x+4,y+h-8,x+8,y+h-4], fill=GOLD_HI)
    DRAW.ellipse([x+w-8,y+h-8,x+w-4,y+h-4], fill=GOLD_HI)

draw_nine_slice_demo(500,520,180,120)
record("nine_slice_demo",500,520,180,120)

# small gold separator horizontal at bottom area
for i in range(3):
    ix = 700 + i*90
    iy = 520
    DRAW.ellipse([ix, iy, ix+64, iy+8], fill=GOLD_DARK, outline=GOLD_MID)
    DRAW.ellipse([ix+8, iy+2, ix+56, iy+6], fill=GOLD_MID)
    DRAW.ellipse([ix+28, iy-6, ix+36, iy+14], fill=GOLD_MID, outline=GOLD_HI)

# top header bar mini
def draw_header_bar(x,y,w,h):
    gradient_rect(x,y,w,h,(18,14,10),(28,20,12))
    DRAW.rectangle([x,y,x+w-1,y+h-1], outline=GOLD_MID, width=1)
    DRAW.rectangle([x+1,y+1,x+w-2,y+h-2], outline=GOLD_DARK, width=1)
    draw_label(x,y,w,h,"DIABLO II — DARK FANTASY", font=FONT_SMALL, color=GOLD_HI)
draw_header_bar(16, 600, 400, 28)
record("header_bar",16,600,400,28)

# Footer text inside atlas for credit
DRAW.text((16, 640), "ATLAS 1024×1024  •  38 SPRITES  •  Aseprite MCP  •  Dark Fantasy", font=FONT_TINY, fill=(90,80,60))
DRAW.text((16, 654), "palette: stone #1a1410  gold #c9a84c  crimson #8a1a1a  parchment #d9c8a8  mana #2a4a8a", font=FONT_TINY, fill=(70,64,52))

# Add faint diablo-style pentagram watermark bottom-right
cx, cy = 860, 600
DRAW.ellipse([cx-48, cy-48, cx+48, cy+48], outline=(201,168,76,18), width=1)
for ang in range(0,360,72):
    x1 = cx + math.cos(math.radians(ang))*42
    y1 = cy + math.sin(math.radians(ang))*42
    x2 = cx + math.cos(math.radians(ang+144))*42
    y2 = cy + math.sin(math.radians(ang+144))*42
    DRAW.line([(x1,y1),(x2,y2)], fill=(201,168,76,18), width=1)
DRAW.ellipse([cx-22, cy-22, cx+22, cy+22], outline=(201,168,76,12), width=1)
DRAW.ellipse([cx-3, cy-3, cx+3, cy+3], fill=(201,168,76,30))

# --- Save ---
ATLAS.save("atlas.png", "PNG")
# also save thumbnail 512
thumb = ATLAS.resize((512,512), Image.NEAREST)
thumb.save("atlas_thumb.png", "PNG")

# --- JSON ---
meta = {
    "app": "Aseprite MCP",
    "version": "1.3.9",
    "image": "atlas.png",
    "format": "RGBA8888",
    "size": {"w": W, "h": H},
    "scale": "1",
    "smartupdate": "$TexturePacker:SmartUpdate:c3c2fe523318f24e24597457a18093c1$"
}
frames = {}
for name, r in sprites.items():
    frames[name] = {
        "frame": {"x": r["x"], "y": r["y"], "w": r["w"], "h": r["h"]},
        "rotated": False,
        "trimmed": False,
        "spriteSourceSize": {"x":0,"y":0,"w":r["w"],"h":r["h"]},
        "sourceSize": {"w":r["w"],"h":r["h"]},
        "duration": 100
    }

output = {"frames": frames, "meta": meta}
with open("atlas.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

# aseprite file stub info
with open("atlas.aseprite.json", "w", encoding="utf-8") as f:
    json.dump({"width":W,"height":H,"frames":len(frames),"layers":["Background","Stone","Gold","Icons","FX"],"palette":"diablo.gpl"}, f, indent=2)

print(f"Atlas generated: {W}x{H}, {len(frames)} sprites")
for k,v in sprites.items():
    print(f"  {k}: {v}")
