"""Compose 1920x1080 slide backgrounds from raw 3D renders.

Each render is scaled/shifted so the subject sits away from the text area,
the empty canvas is filled with the render's own edge colour, and a soft
gradient is baked in so text stays readable.

    python3 compose.py            # raw/*.png -> assets/bg-*.jpg
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

HERE = Path(__file__).parent
RAW = HERE / "raw"
OUT = HERE / "assets"
W, H = 1920, 1080

# name: scale (relative to cover-fit), dx, dy (px, after right/centre anchoring),
#       left = strength of left darkening, top = strength of top darkening,
#       mirror = flip horizontally
CFG = {
    "hero":         dict(scale=1.00, dx=0,   dy=0,   left=0.92, top=0.0),
    "birth":        dict(scale=0.86, dx=90,  dy=10,  left=0.90, top=0.0),
    "vienna":       dict(scale=0.92, dx=50,  dy=20,   left=0.90, top=0.0),
    "journey":      dict(scale=0.88, dx=0,   dy=165, left=0.30, top=0.85),
    "books":        dict(scale=1.00, dx=0,   dy=0,   left=0.90, top=0.0),
    "idea":         dict(scale=0.95, dx=90,  dy=20,  left=0.92, top=0.0),
    "combos":       dict(scale=0.80, dx=70,  dy=30,  left=0.92, top=0.0),
    "entrepreneur": dict(scale=0.97, dx=110, dy=10,  left=0.92, top=0.0),
    "destruction":  dict(scale=1.00, dx=0,   dy=70,  left=0.25, top=0.92),
    "legacy":       dict(scale=0.92, dx=120, dy=20,  left=0.92, top=0.0),
    "finale":       dict(src="hero", scale=1.08, dx=40, dy=30, left=0.95, top=0.0),
}


def edge_colour(im: Image.Image):
    strip = im.crop((0, 0, max(8, im.width // 40), im.height)).resize((1, 1), Image.LANCZOS)
    return strip.getpixel((0, 0))


def feather_mask(w, h, f):
    m = Image.new("L", (w, h), 255)
    d = ImageDraw.Draw(m)
    for i in range(f):
        a = int(255 * (i / f) ** 1.6)
        d.rectangle([i, i, w - 1 - i, h - 1 - i], outline=a)
    return m


def gradient_overlay(left, top):
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = ov.load()
    base = (7, 12, 24)
    for x in range(W):
        t = x / W
        la = left * max(0.0, 1 - t / 0.62) ** 1.35
        for y in range(H):
            u = y / H
            ta = top * max(0.0, 1 - u / 0.52) ** 1.4
            ba = 0.55 * max(0.0, (u - 0.80) / 0.20) ** 1.5  # bottom bar zone
            a = 1 - (1 - la) * (1 - ta) * (1 - ba)
            px[x, y] = (*base, int(255 * min(1, a)))
    return ov


def compose(name, cfg):
    src = RAW / f"{cfg.get('src', name)}.jpg"
    im = Image.open(src).convert("RGB")
    if cfg.get("mirror"):
        im = ImageOps.mirror(im)
    cover = max(W / im.width, H / im.height)
    s = cover * cfg["scale"]
    iw, ih = round(im.width * s), round(im.height * s)
    im = im.resize((iw, ih), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), edge_colour(im))
    x = W - iw + cfg["dx"] if cfg["scale"] <= 1 else (W - iw) // 2 + cfg["dx"]
    y = (H - ih) // 2 + cfg["dy"]
    if cfg["scale"] < 1 or cfg["dx"] or cfg["dy"]:
        canvas.paste(im, (x, y), feather_mask(iw, ih, 140))
    else:
        canvas.paste(im, (x, y))
    out = Image.alpha_composite(canvas.convert("RGBA"), gradient_overlay(cfg["left"], cfg["top"]))
    out = out.convert("RGB")
    OUT.mkdir(exist_ok=True)
    out.save(OUT / f"bg-{name}.jpg", quality=86, optimize=True, progressive=True)
    print("ok", name)


def plain():
    """Dark navy backdrop with a soft gold/cyan glow for diagram slides."""
    im = Image.new("RGB", (W, H), (8, 13, 26))
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(glow)
    d.ellipse([1250, -350, 2350, 600], fill=(46, 34, 14))
    d.ellipse([-400, 650, 700, 1500], fill=(6, 32, 48))
    glow = glow.filter(ImageFilter.GaussianBlur(220))
    im = ImageChops.add(im, glow)
    # fine dot grid
    d = ImageDraw.Draw(im)
    for gx in range(40, W, 48):
        for gy in range(40, H, 48):
            d.point((gx, gy), fill=(30, 40, 60))
    im.save(OUT / "bg-plain.jpg", quality=88, optimize=True, progressive=True)
    print("ok plain")


def portrait():
    p = HERE / "src" / "schumpeter-c1910.png"
    im = Image.open(p).convert("L")
    im = ImageOps.autocontrast(im, cutoff=1)
    # warm sepia-gold tint
    im = ImageOps.colorize(im, black=(10, 12, 20), white=(246, 232, 205), mid=(128, 112, 90))
    im.save(OUT / "portrait-1910.jpg", quality=90)
    print("ok portrait")


if __name__ == "__main__":
    for k, v in CFG.items():
        compose(k, v)
    plain()
    portrait()
