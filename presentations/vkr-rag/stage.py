# Light-theme "stage" assets for the VKR deck (no AI imagery):
#   assets/halo.png    soft indigo light pool behind the 3D models
#   assets/shadow.png  soft contact shadow under the models
#   assets/clear.png   1x1 transparent (fallback raster for off-slide Morph ghosts)
import os
import numpy as np
from PIL import Image, ImageFilter

A = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
os.makedirs(A, exist_ok=True)

S = 768
yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
r = np.sqrt((xx - S / 2) ** 2 + (yy - S / 2) ** 2) / (S / 2)
a = np.clip(1 - r, 0, 1) ** 2.0 * 0.34
g = np.zeros((S, S, 4), np.float32)
g[..., 0], g[..., 1], g[..., 2] = 120, 132, 255
g[..., 3] = a * 255
Image.fromarray(g.astype(np.uint8)).save(os.path.join(A, "halo.png"))

SW, SH = 1024, 256
sh = Image.new("L", (SW, SH), 0)
arr = np.zeros((SH, SW), np.float32)
y, x = np.mgrid[0:SH, 0:SW].astype(np.float32)
d = np.sqrt(((x - SW / 2) / (SW * 0.42)) ** 2 + ((y - SH / 2) / (SH * 0.30)) ** 2)
arr = np.clip(1 - d, 0, 1) ** 1.6 * 0.30
sh = Image.fromarray((arr * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))
out = np.zeros((SH, SW, 4), np.uint8)
out[..., 0], out[..., 1], out[..., 2] = 20, 26, 60
out[..., 3] = np.array(sh)
Image.fromarray(out).save(os.path.join(A, "shadow.png"))

Image.new("RGBA", (1, 1), (0, 0, 0, 0)).save(os.path.join(A, "clear.png"))
print("stage assets ->", A)
