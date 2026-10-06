# Procedural 3D "exhibits" for the Cantillon deck (Blender / bpy → .glb for PowerPoint 3D).
# Reuses the modelling helpers + material palette of the Schumpeter deck.
#
#   python3 models/make_models.py              -> models/glb/*.glb (all)
#   python3 models/make_models.py candle ship  -> only selected
#
# Convention (same as the helpers): Blender Z up, the "front" faces -Y (= viewer in PowerPoint).
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "schumpeter", "models"))
import bpy  # noqa: E402
from mathutils import Vector, Matrix  # noqa: E402
import make_models as B  # noqa: E402
from make_models import (lathe, box, cyl, sphere, torus, tube, profile2d, mesh_obj, rot_all, to_mesh, link,  # noqa: E402
                         book, coin, finish, TAU)

B.OUT = os.path.join(HERE, "glb")
os.makedirs(B.OUT, exist_ok=True)

B.PALETTE.update({
    "wax":      ((0.86, 0.78, 0.60), 0.00, 0.45, {"coat": 0.2}),
    "flame":    ((1.00, 0.70, 0.30), 0.00, 0.50, {"emit": (1.0, 0.62, 0.22), "es": 9.0}),
    "flamecore": ((1.00, 0.92, 0.70), 0.00, 0.50, {"emit": (1.0, 0.90, 0.65), "es": 14.0}),
    "wick":     ((0.02, 0.015, 0.01), 0.00, 0.80, {}),
    "gilt":     ((0.95, 0.68, 0.30), 1.00, 0.28, {}),
    "canvas":   ((0.035, 0.022, 0.018), 0.00, 0.85, {}),
    "oak":      ((0.300, 0.150, 0.060), 0.00, 0.50, {"coat": 0.3}),
    "leather":  ((0.260, 0.130, 0.055), 0.00, 0.72, {}),
    "rope":     ((0.420, 0.300, 0.150), 0.00, 0.85, {}),
    "ink":      ((0.004, 0.004, 0.008), 0.00, 0.08, {"coat": 1.0}),
    "inkglass": ((0.050, 0.070, 0.090), 0.10, 0.05, {"coat": 1.0}),
    "feather":  ((0.820, 0.790, 0.720), 0.00, 0.65, {}),
    "bubble":   ((0.900, 0.880, 1.000), 0.00, 0.02, {"alpha": 0.07}),
    "gold_m":   ((1.00, 0.74, 0.32), 1.00, 0.36, {}),
    "wheat":    ((0.600, 0.380, 0.110), 0.00, 0.55, {}),
    "wheat_d":  ((0.420, 0.250, 0.070), 0.00, 0.60, {}),
    "fur":      ((0.330, 0.300, 0.285), 0.00, 0.85, {}),
    "pink":     ((0.800, 0.430, 0.420), 0.00, 0.55, {}),
    "eye":      ((0.010, 0.010, 0.012), 0.00, 0.05, {"coat": 1.0}),
    "sail":     ((0.800, 0.740, 0.620), 0.00, 0.90, {}),
    "silver":   ((0.85, 0.86, 0.88), 1.00, 0.18, {}),
    "linen":    ((0.840, 0.800, 0.720), 0.00, 0.85, {}),
})


def text_mesh(name, body, size, depth, mat, loc=(0, 0, 0), rot=(0, 0, 0)):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.extrude = depth
    cu.bevel_depth = depth * 0.25
    cu.bevel_resolution = 1
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    o = link(bpy.data.objects.new(name, cu))
    o.location = loc
    o.rotation_euler = rot
    return to_mesh(o, mat, 30)


def xform(objs, T):
    for o in objs:
        o.matrix_world = T @ o.matrix_world


def scene_objs():
    return list(bpy.context.scene.objects)


def recenter_z():
    zs = [(o.matrix_world @ Vector(c)).z for o in scene_objs() for c in o.bound_box]
    mid = (min(zs) + max(zs)) / 2
    for o in scene_objs():
        o.location.z -= mid


# ------------------------------------------------------------------ candle
def chamberstick(stub=False):
    lathe("dish", [(0, 0.0), (0.52, 0.0), (0.56, 0.015), (0.58, 0.05), (0.57, 0.07), (0.52, 0.045), (0.20, 0.035),
                   (0.12, 0.05), (0, 0.05)], "brass", 72, 35)
    lathe("stem", [(0, 0.04), (0.12, 0.04), (0.09, 0.08), (0.07, 0.15), (0.10, 0.20), (0.07, 0.25), (0.065, 0.36),
                   (0.11, 0.40), (0.15, 0.42), (0.16, 0.45), (0.135, 0.46), (0.135, 0.62), (0.155, 0.64), (0.15, 0.66),
                   (0.12, 0.66), (0, 0.65)], "brass", 64, 35)
    # finger loop
    loop = torus("loop", 0.13, 0.025, (0.62, 0, 0.09), "brass", rot=(math.radians(90), 0, 0), seg=40, mseg=10)
    loop.scale = (1, 1, 1)
    sphere("thumb", 0.05, (0.70, 0, 0.215), "brass", 24, 12).scale = (1.4, 0.7, 0.35)
    top = 0.95 if stub else 1.82
    r = 0.112
    prof = [(0, 0.62), (r, 0.62), (r, top - 0.06), (r * 0.98, top - 0.02), (r * 0.9, top), (r * 0.55, top - 0.03),
            (r * 0.25, top - 0.05), (0, top - 0.05)]
    lathe("candle", prof, "wax", 56, 40)
    random.seed(5 if stub else 2)
    for k in range(5 if stub else 4):
        a = random.uniform(0, TAU)
        L = random.uniform(0.10, 0.28)
        z0 = top - 0.03
        pts = [(r * 1.0 * math.cos(a), r * 1.0 * math.sin(a), z0), (r * 1.06 * math.cos(a), r * 1.06 * math.sin(a), z0 - L * 0.5),
               (r * 1.04 * math.cos(a), r * 1.04 * math.sin(a), z0 - L)]
        tube("drip", pts, 0.018, "wax", 3)
        sphere("drop", 0.024, pts[-1], "wax", 16, 8)
    # puddle of wax on the dish (more for the burnt stub)
    lathe("puddle", [(0, 0.05), (0.22 if stub else 0.15, 0.05), (0.2 if stub else 0.14, 0.065), (0, 0.07)], "wax", 40, 60)
    wt = top - 0.05
    tube("wick", [(0, 0, wt), (0, 0, wt + 0.06), (0.012 if stub else 0.006, 0, wt + 0.10)], 0.008, "wick", 2)
    if not stub:
        fz = wt + 0.06
        fl = []
        for i in range(13):
            t = i / 12
            rr = 0.055 * math.sin(math.pi * min(1, t * 1.25)) ** 0.8 * (1 - t) ** 0.35
            fl.append((rr, fz + t * 0.30))
        fl[0] = (0, fz)
        fl[-1] = (0, fz + 0.30)
        lathe("flame", fl, "flame", 32, 80)
        lathe("core", [(0, fz + 0.01), (0.022, fz + 0.04), (0.02, fz + 0.09), (0, fz + 0.12)], "flamecore", 24, 80)
    recenter_z()


def m_candle():
    chamberstick(False)


def m_candle_out():
    chamberstick(True)


# ------------------------------------------------------------------ empty portrait frame
def rect_loop(w, h):
    return [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]


def m_frame():
    W, H = 1.5, 1.9
    profile2d("outer", [rect_loop(W, H), rect_loop(W - 0.30, H - 0.30)], 0.06, 0.035, "gilt", 2)
    o = profile2d("inner", [rect_loop(W - 0.30, H - 0.30), rect_loop(W - 0.40, H - 0.40)], 0.035, 0.012, "gilt", 1)
    o.location.z = 0.05
    # ornaments: corner rosettes + top cartouche
    for sx in (-1, 1):
        for sy in (-1, 1):
            sphere("ros", 0.075, (sx * (W / 2 - 0.075), sy * (H / 2 - 0.075), 0.08), "gilt", 24, 12).scale.z = 0.45
            for k in range(6):
                a = TAU * k / 6
                sphere("pet", 0.035, (sx * (W / 2 - 0.075) + 0.07 * math.cos(a), sy * (H / 2 - 0.075) + 0.07 * math.sin(a), 0.07),
                       "gilt", 16, 8).scale.z = 0.5
    sh = sphere("cart", 0.16, (0, H / 2 - 0.02, 0.06), "gilt", 32, 16)
    sh.scale = (1.3, 0.55, 0.35)
    box("canvas", (W - 0.36, H - 0.36, 0.02), (0, 0, -0.03), "canvas", 0.0)
    text_mesh("q", "?", 0.95, 0.03, "gilt", (0, -0.02, 0.0))
    # bring everything upright: XY plane -> XZ, front (+Z) -> -Y
    rot_all(rx=90)
    for o in scene_objs():
        o.location.y = o.location.y
    recenter_z()


# ------------------------------------------------------------------ compass
def m_compass():
    R = 0.62
    lathe("case", [(0, -0.09), (R - 0.05, -0.09), (R, -0.06), (R + 0.01, 0.0), (R, 0.06), (R - 0.03, 0.07), (R - 0.06, 0.05),
                   (R - 0.07, 0.02), (0, 0.02)], "brass", 80, 35)
    torus("bezel", R - 0.035, 0.022, (0, 0, 0.065), "brass", seg=80, mseg=10)
    cyl("dial", R - 0.07, 0.01, (0, 0, 0.025), "paper", seg=80)
    for k in range(72):
        a = TAU * k / 72
        L = 0.07 if k % 9 == 0 else 0.035
        rr = R - 0.11 - L / 2
        box("tick", (L, 0.006, 0.004), (rr * math.cos(a), rr * math.sin(a), 0.032), "ink", 0, rot=(0, 0, a))
    for k, ch in enumerate("NESW"):
        a = math.pi / 2 - k * math.pi / 2
        text_mesh("l" + ch, ch, 0.11, 0.004, "ink", (0.40 * math.cos(a), 0.40 * math.sin(a), 0.034), (0, 0, a - math.pi / 2))
    # compass rose
    for k in range(8):
        a = TAU * k / 8
        L = 0.30 if k % 2 == 0 else 0.18
        n = Vector((math.cos(a), math.sin(a)))
        p = Vector((-n.y, n.x)) * 0.035
        profile2d("rose", [[(0, 0), tuple(n * L + p * 0), tuple(p)]], 0.003, 0, "brass_d" if k % 2 else "gilt", 0).location.z = 0.035
    # needle
    profile2d("needleN", [[(-0.035, 0), (0.035, 0), (0, 0.42)]], 0.008, 0.004, "red", 1).location.z = 0.05
    profile2d("needleS", [[(-0.035, 0), (0, -0.42), (0.035, 0)]], 0.008, 0.004, "steel", 1).location.z = 0.05
    cyl("pivot", 0.03, 0.04, (0, 0, 0.06), "gilt", seg=24)
    cyl("glass", R - 0.05, 0.006, (0, 0, 0.075), "glass", seg=80)
    # hinge + ring
    torus("ring", 0.07, 0.016, (0, R + 0.08, 0), "brass", rot=(0, math.radians(90), 0), seg=32, mseg=8)
    cyl("knob", 0.04, 0.07, (0, R + 0.01, 0), "brass", rot=(math.radians(90), 0, 0), seg=24)
    rot_all(rx=58)
    recenter_z()


# ------------------------------------------------------------------ money bag with spilled coins
def m_moneybag():
    prof = []
    N = 34
    for i in range(N + 1):
        t = i / N
        z = t * 1.25
        if t < 0.62:
            r = 0.30 + 0.30 * math.sin(math.pi * (t / 0.62) * 0.85) if t > 0.02 else 0.30 * (t / 0.02) ** 0.5
        elif t < 0.80:
            u = (t - 0.62) / 0.18
            r = (0.30 + 0.30 * math.sin(math.pi * 0.85)) * (1 - u) + 0.11 * u
        else:
            u = (t - 0.80) / 0.20
            r = 0.11 + 0.16 * u ** 0.7
        prof.append((max(r, 0.0001) if i else 0, z))
    prof.append((0.0, 1.2))
    o = lathe("sack", prof, "leather", 56, 50)
    # wrinkles / irregular cloth
    random.seed(7)
    for v in o.data.vertices:
        x, y, z = v.co
        a = math.atan2(y, x)
        k = 1 + 0.035 * math.sin(7 * a + z * 5) + 0.02 * math.sin(13 * a - z * 9)
        if z > 1.0:
            k += 0.10 * math.sin(9 * a) * (z - 1.0) * 4
        v.co.x *= k
        v.co.y *= k
    torus("tie", 0.12, 0.028, (0, 0, 0.99), "rope", seg=48, mseg=8)
    tube("tail1", [(0.10, -0.06, 0.99), (0.18, -0.12, 0.92), (0.22, -0.16, 0.80)], 0.018, "rope", 3)
    tube("tail2", [(0.11, -0.03, 0.99), (0.22, -0.05, 0.94), (0.30, -0.10, 0.86)], 0.018, "rope", 3)
    # stamped sign on the sack
    text_mesh("sign", "L", 0.28, 0.01, "gilt", (0, -0.585, 0.42), (math.radians(90), 0, 0))
    random.seed(11)
    t = 0.045
    for i in range(6):
        coin("c", (0.62 + random.uniform(-0.02, 0.02), -0.05 + random.uniform(-0.02, 0.02), t / 2 + i * t),
             (0, 0, random.uniform(0, 6)), r=0.2, t=t)
    for (x, y, rz) in ((0.30, -0.62, 0.4), (-0.55, -0.45, 1.3), (0.78, -0.42, 2.0), (-0.20, -0.75, 2.6)):
        coin("f", (x, y, t / 2), (0, 0, rz), r=0.2, t=t)
    coin("lean", (0.42, -0.42, 0.18), (math.radians(80), 0, math.radians(-20)), r=0.2, t=t)
    recenter_z()


# ------------------------------------------------------------------ the Mississippi bubble
def m_bubble():
    sphere("bubble", 1.0, (0, 0, 0), "bubble", 64, 32)
    sphere("hl", 0.13, (-0.45, -0.70, 0.42), "glass", 16, 8).scale = (1, 0.3, 0.7)
    random.seed(4)
    t = 0.05
    for i in range(7):
        coin("c", (random.uniform(-0.02, 0.02), random.uniform(-0.02, 0.02), -0.62 + t / 2 + i * t), (0, 0, random.uniform(0, 6)), r=0.22, t=t)
    for i in range(4):
        coin("c2", (0.34 + random.uniform(-0.02, 0.02), 0.1, -0.62 + t / 2 + i * t), (0, 0, random.uniform(0, 6)), r=0.22, t=t)
    # floating coins, rising
    for (x, y, z, a, b) in ((-0.35, -0.1, 0.05, 70, 20), (0.25, -0.25, 0.30, 50, -40), (-0.1, 0.2, 0.52, 80, 60), (0.45, 0.05, -0.12, 30, 10)):
        coin("fl", (x, y, z), (math.radians(a), math.radians(b), 0), r=0.17, t=0.04)
    # rolled share certificate
    cyl("share", 0.07, 0.62, (-0.32, -0.18, -0.45), "paper", rot=(0, math.radians(90), math.radians(25)), seg=24)
    torus("seal", 0.072, 0.012, (-0.32, -0.18, -0.45), "oxblood", rot=(0, math.radians(90), math.radians(25)), seg=24, mseg=6)
    lathe("ring", [(0.30, -1.04), (0.36, -1.02), (0.36, -0.96), (0.30, -0.95)], "gilt", 48, 30)


# ------------------------------------------------------------------ judge's gavel
def m_gavel():
    lathe("block", [(0, 0), (0.55, 0), (0.58, 0.02), (0.58, 0.10), (0.55, 0.12), (0.47, 0.13), (0, 0.13)], "walnut", 72, 35)
    torus("blockring", 0.565, 0.012, (0, 0, 0.06), "gilt", seg=72, mseg=6)
    objs = []
    objs.append(lathe("head", [(0, -0.36), (0.14, -0.36), (0.16, -0.33), (0.16, -0.25), (0.15, -0.22), (0.15, 0.22), (0.16, 0.25),
                               (0.16, 0.33), (0.14, 0.36), (0, 0.36)], "walnut", 48, 35))
    for z in (-0.25, 0.25):
        objs.append(torus("band", 0.158, 0.016, (0, 0, z), "gilt", seg=48, mseg=6))
    xform(objs, Matrix.Rotation(math.radians(90), 4, "Y"))
    h = lathe("handle", [(0, 0.12), (0.05, 0.12), (0.045, 0.6), (0.06, 0.9), (0.065, 0.98), (0.04, 1.02), (0, 1.03)], "walnut", 32, 35)
    objs.append(h)
    T = Matrix.Translation((0.0, -0.05, 0.13 + 0.16)) @ Matrix.Rotation(math.radians(-62), 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "X") @ Matrix.Rotation(math.radians(8), 4, "X")
    xform(objs, T)
    recenter_z()


# ------------------------------------------------------------------ book + inkwell + quill
def m_quill():
    book("essai", 1.15, 0.82, 0.16, "oxblood", Vector((0, 0, 0.08)), 0, 3)
    text_mesh("title", "ESSAI", 0.13, 0.006, "gilt", (0, 0.02, 0.163))
    box("rule1", (0.55, 0.01, 0.006), (0, -0.09, 0.162), "gilt", 0)
    box("rule2", (0.55, 0.01, 0.006), (0, 0.13, 0.162), "gilt", 0)
    text_mesh("year", "1755", 0.07, 0.005, "gilt", (0, -0.20, 0.163))
    # inkwell standing on the book
    ix, iy, iz = 0.30, 0.16, 0.16
    lathe("inkwell", [(0, iz), (0.16, iz), (0.18, iz + 0.02), (0.18, iz + 0.14), (0.16, iz + 0.17), (0.08, iz + 0.20), (0.07, iz + 0.24),
                      (0.085, iz + 0.26), (0.06, iz + 0.265), (0.05, iz + 0.21), (0, iz + 0.21)], "inkglass", 48, 40, loc=(ix, iy, 0))
    cyl("inksurf", 0.05, 0.004, (ix, iy, iz + 0.22), "ink", seg=24)
    torus("collar", 0.075, 0.012, (ix, iy, iz + 0.245), "brass", seg=32, mseg=6)
    # quill: curved shaft + two-sided vane, dipped into the inkwell
    base = Vector((ix, iy, iz + 0.12))
    d = Vector((-0.55, -0.22, 0.75)).normalized()
    side = d.cross(Vector((0, -1, 0))).normalized()
    L = 1.15
    pts = [base + d * (L * t) + side * (0.06 * math.sin(math.pi * t)) for t in [i / 8 for i in range(9)]]
    tube("shaft", [tuple(p) for p in pts], 0.010, "ivory", 3)
    verts, faces = [], []
    n = 28
    for i in range(n + 1):
        t = i / n
        p = base + d * (L * t) + side * (0.06 * math.sin(math.pi * t))
        if t < 0.25:
            wl, wr = 0.0, 0.0
        else:
            u = (t - 0.25) / 0.75
            wl = 0.11 * math.sin(math.pi * min(1, u * 1.05)) ** 0.7
            wr = 0.07 * math.sin(math.pi * min(1, u * 1.05)) ** 0.7
        up = Vector((0, 0, 0)) + d.cross(side).normalized()
        for w, s in ((wl, 1), (0, 0), (wr, -1)):
            q = p + side * (w * s) + up * (0.03 * w * w * 10 * abs(s)) - d * (0.08 * w)
            verts.append(tuple(q))
    for i in range(n):
        a = i * 3
        faces += [(a, a + 3, a + 4, a + 1), (a + 1, a + 4, a + 5, a + 2)]
    v = mesh_obj("vane", verts, faces)
    md = v.modifiers.new("sol", "SOLIDIFY")
    md.thickness = 0.006
    finish(v, "feather", 60)
    rot_all(rz=-10)
    recenter_z()


# ------------------------------------------------------------------ dice
PIPS = {1: [(0, 0)], 2: [(-1, -1), (1, 1)], 3: [(-1, -1), (0, 0), (1, 1)], 4: [(-1, -1), (1, -1), (-1, 1), (1, 1)],
        5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)], 6: [(-1, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (1, 1)]}


def die(name, s, T):
    objs = [box(name, (s, s, s), (0, 0, 0), "ivory", s * 0.14, seg=3)]
    # faces: +Z=1, -Z=6, -Y=2, +Y=5, +X=3, -X=4
    faces = {1: ((0, 0, 1), (1, 0, 0), (0, 1, 0)), 6: ((0, 0, -1), (1, 0, 0), (0, 1, 0)), 2: ((0, -1, 0), (1, 0, 0), (0, 0, 1)),
             5: ((0, 1, 0), (1, 0, 0), (0, 0, 1)), 3: ((1, 0, 0), (0, 1, 0), (0, 0, 1)), 4: ((-1, 0, 0), (0, 1, 0), (0, 0, 1))}
    for k, (nrm, u, v) in faces.items():
        nrm, u, v = Vector(nrm), Vector(u), Vector(v)
        for (a, b) in PIPS[k]:
            c = nrm * (s / 2 - 0.004) + u * (a * s * 0.25) + v * (b * s * 0.25)
            p = sphere(name + "_pip", s * 0.085, tuple(c), "ink", 16, 8)
            objs.append(p)
    xform(objs, T)


def m_dice():
    s = 0.62
    die("d1", s, Matrix.Translation((-0.38, 0.05, s / 2)) @ Matrix.Rotation(math.radians(24), 4, "Z"))
    # second die tumbling, resting on an edge against the first
    die("d2", s, Matrix.Translation((0.40, -0.12, s / 2 + 0.08)) @ Matrix.Rotation(math.radians(-35), 4, "Z") @ Matrix.Rotation(math.radians(28), 4, "Y")
        @ Matrix.Rotation(math.radians(10), 4, "X"))
    recenter_z()


# ------------------------------------------------------------------ wheat sheaf
def m_wheat():
    random.seed(9)
    tie_z = 0.55
    n = 34
    for i in range(n):
        a = random.uniform(0, TAU)
        rr = 0.10 * math.sqrt(random.random())
        bx, by = rr * math.cos(a), rr * math.sin(a)
        spread_top = random.uniform(0.15, 0.45)
        spread_bot = random.uniform(0.10, 0.25)
        top = Vector((bx + spread_top * math.cos(a), by + spread_top * math.sin(a), 1.55 + random.uniform(-0.12, 0.08)))
        bot = Vector((bx + spread_bot * math.cos(a), by + spread_bot * math.sin(a), 0.0))
        mid = Vector((bx, by, tie_z))
        pts = [tuple(bot), tuple(mid), tuple(mid.lerp(top, 0.55) + Vector((0, 0, 0.02))), tuple(top)]
        tube("stalk", pts, 0.008, "wheat_d" if i % 3 == 0 else "wheat", 1)
        dvec = (top - Vector(pts[2])).normalized()
        ear = sphere("ear", 0.04, tuple(top + dvec * 0.12), "wheat", 10, 6)
        ear.scale = (1, 1, 3.6)
        ear.rotation_euler = dvec.to_track_quat("Z", "Y").to_euler()
        # awns
        for k in range(2):
            q = top + dvec * (0.07 + 0.09 * k)
            tube("awn", [tuple(q), tuple(q + dvec * 0.22 + Vector((random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05), 0)))], 0.0022,
                 "wheat", 1, False)
    torus("tie", 0.13, 0.03, (0, 0, tie_z), "rope", seg=40, mseg=8)
    torus("tie2", 0.135, 0.022, (0, 0, tie_z + 0.07), "rope", seg=40, mseg=8)
    recenter_z()


# ------------------------------------------------------------------ balance scales
def m_scales():
    lathe("base", [(0, 0), (0.42, 0), (0.44, 0.03), (0.40, 0.07), (0.25, 0.10), (0.10, 0.16), (0.07, 0.20), (0, 0.20)], "brass", 64, 35)
    lathe("column", [(0, 0.18), (0.05, 0.18), (0.04, 1.30), (0.065, 1.34), (0.06, 1.40), (0, 1.42)], "brass", 32, 35)
    sphere("finial", 0.06, (0, 0, 1.47), "gilt", 24, 12)
    beam_y = 1.36
    box("beam", (1.50, 0.04, 0.05), (0, 0, beam_y), "brass", 0.012)
    for sx in (-1, 1):
        sphere("end", 0.035, (sx * 0.76, 0, beam_y), "gilt", 16, 8)
    profile2d("pointer", [[(-0.025, 0), (0.025, 0), (0, 0.32)]], 0.006, 0.003, "gilt", 1)
    bpy.context.view_layer.update()
    pointer = [o for o in scene_objs() if o.name.startswith("pointer")][0]
    pointer.matrix_world = Matrix.Translation((0, -0.05, beam_y - 0.30)) @ Matrix.Rotation(math.radians(90), 4, "X")
    pan_z = 0.62
    for sx in (-1, 1):
        x = sx * 0.72
        lathe("pan", [(0, pan_z), (0.22, pan_z + 0.01), (0.30, pan_z + 0.06), (0.31, pan_z + 0.075), (0.295, pan_z + 0.07), (0.21, pan_z + 0.025),
                      (0, pan_z + 0.018)], "brass", 56, 35, loc=(x, 0, 0))
        for k in range(3):
            a = TAU * k / 3 + 0.3
            tube("chain", [(x + 0.29 * math.cos(a), 0.29 * math.sin(a), pan_z + 0.07), (x, 0, beam_y - 0.02)], 0.005, "gilt", 2, False)
    random.seed(2)
    t = 0.04
    for i in range(4):
        coin("c", (-0.72 + random.uniform(-0.01, 0.01), random.uniform(-0.01, 0.01), pan_z + 0.03 + t / 2 + i * t), (0, 0, random.uniform(0, 6)), r=0.13, t=t)
    lathe("weight", [(0, pan_z + 0.03), (0.10, pan_z + 0.03), (0.10, pan_z + 0.16), (0.06, pan_z + 0.18), (0.03, pan_z + 0.22),
                     (0.04, pan_z + 0.25), (0, pan_z + 0.25)], "brass_d", 40, 35, loc=(0.72, 0, 0))
    recenter_z()


# ------------------------------------------------------------------ mouse ("men multiply like mice in a barn")
def m_mouse():
    body = sphere("body", 0.5, (0, 0.05, 0.36), "fur", 48, 24)
    body.scale = (0.72, 1.0, 0.70)
    head = sphere("head", 0.30, (0, -0.48, 0.52), "fur", 40, 20)
    head.scale = (0.85, 1.15, 0.85)
    sphere("snout", 0.05, (0, -0.82, 0.50), "pink", 20, 10)
    for sx in (-1, 1):
        e = sphere("ear", 0.17, (sx * 0.20, -0.36, 0.78), "fur", 32, 16)
        e.scale = (1, 0.28, 1)
        e.rotation_euler = (math.radians(-10), 0, math.radians(sx * 20))
        ei = sphere("earin", 0.13, (sx * 0.20, -0.41, 0.78), "pink", 24, 12)
        ei.scale = (1, 0.18, 1)
        ei.rotation_euler = (math.radians(-10), 0, math.radians(sx * 20))
        sphere("eye", 0.045, (sx * 0.13, -0.70, 0.60), "eye", 20, 10)
        for k in range(3):
            tube("wh", [(sx * 0.05, -0.80, 0.49), (sx * 0.22, -0.84, 0.50 + 0.03 * (k - 1)), (sx * 0.36, -0.82, 0.47 + 0.06 * (k - 1))], 0.0035, "linen", 1)
        f = sphere("foot", 0.07, (sx * 0.20, -0.25, 0.04), "pink", 16, 8)
        f.scale = (0.8, 1.4, 0.5)
        f2 = sphere("foot", 0.08, (sx * 0.26, 0.35, 0.04), "pink", 16, 8)
        f2.scale = (0.8, 1.5, 0.5)
    tube("tail", [(0, 0.52, 0.25), (0.05, 0.85, 0.12), (0.30, 1.02, 0.05), (0.55, 0.90, 0.05), (0.62, 0.62, 0.10)], 0.025, "pink", 3)
    # a few grains and an ear of wheat in front of it
    random.seed(3)
    for k in range(7):
        g = sphere("grain", 0.035, (random.uniform(-0.45, 0.45), random.uniform(-1.05, -0.80), 0.025), "wheat", 12, 6)
        g.scale = (1, 1.7, 0.7)
        g.rotation_euler = (0, 0, random.uniform(0, 3))
    tube("stalk", [(-0.75, -0.30, 0.02), (-0.55, -0.62, 0.03), (-0.30, -0.85, 0.05)], 0.008, "wheat", 2)
    ear = sphere("ear", 0.05, (-0.22, -0.93, 0.06), "wheat", 10, 6)
    ear.scale = (1, 3.2, 1)
    ear.rotation_euler = (0, 0, math.radians(40))
    rot_all(rz=-25)
    recenter_z()


# ------------------------------------------------------------------ sailing ship (to Suriname?)
def hull_mesh(Lh=2.0, Bw=0.36, D=0.40):
    secs = 22
    ring = 9
    verts, faces = [], []
    for i in range(secs + 1):
        t = i / secs
        x = -Lh / 2 + Lh * t
        half = Bw * (math.sin(math.pi * min(1, t * 1.15)) ** 0.6) if t < 0.95 else Bw * 0.25 * (1 - t) / 0.05
        half = max(half, 0.005)
        sheer = 0.06 * (2 * t - 1) ** 2 + (0.10 if t < 0.18 else 0)
        deck = D * 0.5 + sheer
        keel = -D * 0.5 * (math.sin(math.pi * min(1, t * 1.05)) ** 0.3)
        for k in range(ring):
            a = math.pi * k / (ring - 1)  # 0..pi : starboard deck -> keel -> port deck
            yy = half * math.cos(a)
            zz = deck - (deck - keel) * math.sin(a) ** 1.4 if True else 0
            verts.append((x, yy, zz))
    for i in range(secs):
        for k in range(ring - 1):
            a = i * ring + k
            faces.append((a, a + ring, a + ring + 1, a + 1))
    # deck caps
    for i in range(secs):
        a = i * ring
        faces.append((a, a + ring - 1, a + 2 * ring - 1, a + ring))
    return verts, faces


def sail(name, w, h, loc, bulge=0.08, mat="sail"):
    verts, faces = [], []
    nu, nv = 8, 8
    for j in range(nv + 1):
        for i in range(nu + 1):
            u, v = i / nu, j / nv
            x = (u - 0.5) * w * (1 - 0.15 * v)
            z = (v - 0.5) * h
            y = -bulge * math.sin(math.pi * u) * math.sin(math.pi * (0.15 + 0.85 * v))
            verts.append((loc[0] + x, loc[1] + y, loc[2] + z))
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            faces.append((a, a + 1, a + nu + 2, a + nu + 1))
    o = mesh_obj(name, verts, faces)
    md = o.modifiers.new("sol", "SOLIDIFY")
    md.thickness = 0.008
    return finish(o, mat, 60)


def m_ship():
    v, f = hull_mesh()
    h = mesh_obj("hull", v, f)
    finish(h, "walnut", 35)
    # rotate hull so bow points +X; ships face the viewer side-on
    box("deck", (1.72, 0.58, 0.02), (0.0, 0, 0.215), "oak", 0.004)
    box("stern", (0.42, 0.62, 0.20), (-0.80, 0, 0.36), "walnut", 0.015)
    box("sternrail", (0.42, 0.64, 0.025), (-0.80, 0, 0.47), "gilt", 0.004)
    box("stripe_s", (1.85, 0.005, 0.03), (0.0, -0.315, 0.13), "gilt", 0)
    for k in range(6):
        box("gun", (0.06, 0.01, 0.05), (-0.45 + k * 0.2, -0.33, 0.04), "satin", 0.004)
    for k in range(3):
        box("win", (0.06, 0.01, 0.07), (-0.92 + k * 0.1, -0.316, 0.37), "window", 0.0)
    tube("bowsprit", [(0.85, 0, 0.26), (1.35, 0, 0.48)], 0.022, "oak", 2, False)
    masts = [(-0.35, 1.55), (0.35, 1.75)]
    for (mx, mh) in masts:
        cyl("mast", 0.03, mh, (mx, 0, 0.22 + mh / 2), "oak", seg=16)
        for (zf, w, hh) in ((0.45, 0.78, 0.48), (0.98, 0.62, 0.42)):
            z = 0.22 + mh * zf
            cyl("yard", 0.016, w + 0.12, (mx, 0, z + hh / 2 + 0.02), "oak", rot=(0, math.radians(90), 0), seg=12)
            sail("sail", w, hh, (mx, -0.04, z), 0.10)
        top = 0.22 + mh
        sail("flag", 0.26, 0.12, (mx + 0.14, 0, top - 0.04), 0.02, "red")
    # jib sail
    verts = [(0.42, -0.01, 1.50), (1.30, -0.01, 0.50), (0.45, -0.01, 0.40)]
    j = mesh_obj("jib", verts, [(0, 1, 2)])
    md = j.modifiers.new("sol", "SOLIDIFY")
    md.thickness = 0.008
    finish(j, "sail", 60)
    # rigging lines
    for (mx, mh) in masts:
        for sx in (-0.8, 0.8):
            tube("rig", [(mx, 0, 0.22 + mh - 0.05), (mx + sx * 0.5, -0.30, 0.22)], 0.004, "rope", 1, False)
    # sea swell under the ship (stylised)
    recenter_z()


# ------------------------------------------------------------------ wooden cradle ("cradle of political economy")
def m_cradle_wood():
    Lc, Wc, Hc = 1.30, 0.68, 0.46
    z0 = 0.22
    # rockers
    for y in (-Wc / 2 + 0.04, Wc / 2 - 0.04):
        pts = []
        for i in range(25):
            t = i / 24
            x = -0.85 + 1.70 * t
            pts.append((x, 0.35 * (2 * t - 1) ** 2))
        outer = pts
        inner = [(x, z + 0.07) for (x, z) in reversed(pts)]
        o = profile2d("rocker", [outer + inner], 0.025, 0.01, "walnut", 1)
        o.matrix_world = Matrix.Translation((0, y, 0)) @ Matrix.Rotation(math.radians(90), 4, "X")
    # legs
    for sx in (-1, 1):
        for y in (-Wc / 2 + 0.04, Wc / 2 - 0.04):
            box("leg", (0.05, 0.05, z0 + 0.04), (sx * 0.50, y, (z0 + 0.04) / 2 + 0.04), "walnut", 0.008)
    box("floor", (Lc, Wc, 0.04), (0, 0, z0), "walnut", 0.01)
    # side rails + slats
    for y in (-Wc / 2, Wc / 2):
        box("rail", (Lc + 0.06, 0.05, 0.05), (0, y, z0 + Hc), "walnut", 0.012)
        for k in range(11):
            x = -Lc / 2 + 0.08 + k * (Lc - 0.16) / 10
            cyl("slat", 0.016, Hc, (x, y, z0 + Hc / 2), "walnut", seg=12)
    # head and foot boards
    profile2d("head", [[(-Wc / 2, 0), (Wc / 2, 0), (Wc / 2, Hc + 0.30), (0.12, Hc + 0.42), (-0.12, Hc + 0.42), (-Wc / 2, Hc + 0.30)]],
              0.025, 0.012, "walnut", 1).matrix_world = Matrix.Translation((-Lc / 2, 0, z0)) @ Matrix.Rotation(math.radians(90), 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "X")
    profile2d("foot", [[(-Wc / 2, 0), (Wc / 2, 0), (Wc / 2, Hc + 0.05), (0, Hc + 0.14), (-Wc / 2, Hc + 0.05)]],
              0.025, 0.012, "walnut", 1).matrix_world = Matrix.Translation((Lc / 2, 0, z0)) @ Matrix.Rotation(math.radians(90), 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "X")
    sphere("knobh", 0.05, (-Lc / 2, 0, z0 + Hc + 0.46), "gilt", 20, 10)
    sphere("knobf", 0.04, (Lc / 2, 0, z0 + Hc + 0.17), "gilt", 20, 10)
    # bedding: mattress, pillow, folded blanket
    box("mattress", (Lc - 0.08, Wc - 0.08, 0.12), (0, 0, z0 + 0.08), "linen", 0.04, seg=3)
    p = sphere("pillow", 0.2, (-0.43, 0, z0 + 0.18), "linen", 24, 12)
    p.scale = (0.8, 1.35, 0.4)
    box("blanket", (0.62, Wc - 0.06, 0.07), (0.25, 0, z0 + 0.17), "oxblood", 0.03, seg=3)
    box("blanketfold", (0.12, Wc - 0.05, 0.09), (-0.06, 0, z0 + 0.18), "oxblood", 0.04, seg=3)
    recenter_z()


# ------------------------------------------------------------------ rolling coin for the progress track
def m_coin_s():
    r, t = 1.0, 0.12
    h = t / 2
    prof = [(0, -h), (r * 0.97, -h), (r, -h + 0.02), (r, h - 0.02), (r * 0.97, h), (r * 0.86, h), (r * 0.84, h - 0.025), (0, h - 0.025)]
    lathe("coin", prof, "gold_m", 64, 30)
    torus("bead", r * 0.80, 0.012, (0, 0, h - 0.025), "gold_m", seg=64, mseg=6)
    text_mesh("y", "1720", 0.42, 0.018, "gold_m", (0, 0.0, h - 0.01))
    for k in range(3):
        a = math.radians(90 + (k - 1) * 28)
        sphere("dot", 0.05, (0.58 * math.cos(a), 0.58 * math.sin(a), h - 0.02), "gold_m", 12, 6)
    rot_all(rx=90)


def m_coins():
    B.m_coins()


MODELS = {
    "candle": m_candle, "candle_out": m_candle_out, "frame": m_frame, "compass": m_compass, "moneybag": m_moneybag,
    "bubble": m_bubble, "gavel": m_gavel, "quill": m_quill, "dice": m_dice, "wheat": m_wheat, "scales": m_scales,
    "mouse": m_mouse, "ship": m_ship, "cradle_wood": m_cradle_wood, "coin_s": m_coin_s, "coins": m_coins,
}

if __name__ == "__main__":
    want = [a for a in sys.argv[1:] if a in MODELS] or list(MODELS)
    for key in want:
        B.reset()
        B._mats.clear()
        MODELS[key]()
        B.export(key)
