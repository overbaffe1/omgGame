# Procedural 3D "exhibits" for the Cantillon deck, built in Blender (bpy) and exported
# as self-contained .glb files that PowerPoint embeds as native 3D models.
# Uses a small local helper module to keep the model pipeline self-contained.
#
#   python3 models/make_models.py              -> models/glb/*.glb  (all)
#   python3 models/make_models.py ship candle  -> selected models
#
# Convention (same as the Schumpeter deck): Blender Z up, the front of every model faces -Y
# (= the viewer in PowerPoint's default camera).
import math, os, random, sys
import bpy, bmesh
from mathutils import Vector, Matrix
import common_models as mm

HERE = os.path.dirname(os.path.abspath(__file__))
mm.OUT = os.path.join(HERE, "glb")
os.makedirs(mm.OUT, exist_ok=True)
TAU = math.tau

# ---- extra materials (18th-century palette: wax, wood, canvas, parchment, ember) ----
EXTRA = {
    "wax":       ((0.80, 0.70, 0.52), 0.00, 0.42, {"coat": 0.2}),
    "flame":     ((1.00, 0.55, 0.15), 0.00, 0.50, {"emit": (1.0, 0.50, 0.12), "es": 9.0}),
    "flame2":    ((1.00, 0.90, 0.60), 0.00, 0.50, {"emit": (1.0, 0.88, 0.55), "es": 14.0}),
    "canvas":    ((0.76, 0.68, 0.52), 0.00, 0.85, {}),
    "wood":      ((0.120, 0.055, 0.022), 0.00, 0.50, {"coat": 0.3}),
    "wood_m":    ((0.190, 0.090, 0.036), 0.00, 0.55, {"coat": 0.2}),
    "wood_l":    ((0.330, 0.180, 0.080), 0.00, 0.60, {}),
    "rope":      ((0.420, 0.300, 0.160), 0.00, 0.90, {}),
    "water":     ((0.010, 0.050, 0.070), 0.00, 0.05, {"coat": 1.0}),
    "seal":      ((0.330, 0.020, 0.018), 0.05, 0.35, {"coat": 0.6}),
    "iron":      ((0.090, 0.090, 0.095), 0.90, 0.45, {}),
    "feather":   ((0.860, 0.820, 0.740), 0.00, 0.70, {}),
    "parchment": ((0.760, 0.660, 0.470), 0.00, 0.80, {}),
    "inkglass":  ((0.010, 0.012, 0.016), 0.10, 0.08, {"coat": 1.0}),
    "wheat":     ((0.780, 0.540, 0.200), 0.00, 0.55, {}),
    "stalk":     ((0.660, 0.470, 0.190), 0.00, 0.60, {}),
    "dice":      ((0.820, 0.770, 0.660), 0.00, 0.30, {"coat": 0.6}),
    "pip":       ((0.020, 0.018, 0.016), 0.00, 0.30, {}),
    "ember":     ((1.000, 0.420, 0.160), 0.00, 0.40, {"emit": (1.0, 0.40, 0.12), "es": 3.5}),
    "bubble":    ((0.950, 0.900, 0.800), 0.00, 0.02, {"alpha": 0.10}),
    "rose":      ((0.800, 0.720, 0.560), 0.00, 0.70, {}),
}
_orig_M = mm.M


def M(name):
    if name not in EXTRA:
        return _orig_M(name)
    if name in mm._mats and mm._mats[name].name in bpy.data.materials:
        return mm._mats[name]
    col, met, rough, ex = EXTRA[name]
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Metallic"].default_value = met
    b.inputs["Roughness"].default_value = rough
    if "coat" in ex:
        b.inputs["Coat Weight"].default_value = ex["coat"]
    if "alpha" in ex:
        b.inputs["Alpha"].default_value = ex["alpha"]
        m.surface_render_method = "BLENDED"
        m.use_backface_culling = False
    if "emit" in ex:
        b.inputs["Emission Color"].default_value = (*ex["emit"], 1)
        b.inputs["Emission Strength"].default_value = ex["es"]
    mm._mats[name] = m
    return m


mm.M = M
lathe, box, cyl, sphere, torus, tube = mm.lathe, mm.box, mm.cyl, mm.sphere, mm.torus, mm.tube
profile2d, mesh_obj, finish, rot_all = mm.profile2d, mm.mesh_obj, mm.finish, mm.rot_all


# ------------------------------------------------------------------ small helpers
def objs():
    return list(bpy.context.scene.objects)


def transform(olist, Mx):
    for o in olist:
        o.matrix_world = Mx @ o.matrix_world


def shift_z(dz):
    for o in objs():
        o.location.z += dz


def coin_lp(name, loc, rot=(0, 0, 0), r=0.16, t=0.03, seg=28, mat="gold"):
    """Low-poly coin (rim + recessed field)."""
    h = t / 2
    prof = [(0, -h + 0.004), (r * 0.82, -h + 0.004), (r * 0.86, -h), (r, -h + 0.004), (r, h - 0.004),
            (r * 0.86, h), (r * 0.82, h - 0.004), (0, h - 0.003)]
    o = lathe(name, prof, mat, seg, 30)
    o.matrix_world = (Matrix.Translation(loc) @ Matrix.Rotation(rot[2], 4, "Z") @ Matrix.Rotation(rot[1], 4, "Y")
                      @ Matrix.Rotation(rot[0], 4, "X"))
    return o


def bezier(P, n):
    P = [Vector(p) for p in P]
    out = []
    for i in range(n + 1):
        t = i / n
        a = (1 - t) ** 3; b = 3 * (1 - t) ** 2 * t; c = 3 * (1 - t) * t ** 2; d = t ** 3
        out.append(a * P[0] + b * P[1] + c * P[2] + d * P[3])
    return out


def grid_surface(name, fn, nu, nv, mat, smooth=60):
    """Parametric surface fn(u, v) -> (x, y, z), u, v in [0, 1]."""
    verts = [tuple(fn(i / nu, j / nv)) for j in range(nv + 1) for i in range(nu + 1)]
    faces = []
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            faces.append((a, a + 1, a + nu + 2, a + nu + 1))
    o = mesh_obj(name, verts, faces)
    return finish(o, mat, smooth)


def lathe_arc(name, loop, a0, a1, seg, mat, smooth=30):
    """Revolve a closed (r, z) loop between angles a0..a1 and cap both ends (barrel staves)."""
    n = len(loop)
    verts, faces = [], []
    for k in range(seg + 1):
        a = a0 + (a1 - a0) * k / seg
        for r, z in loop:
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for k in range(seg):
        for i in range(n):
            p, q = k * n + i, k * n + (i + 1) % n
            faces.append((p, q, q + n, p + n))
    half = n // 2  # loop = outer (up) + inner (down): cap with quads between the two halves
    for base, flip in ((0, False), (seg * n, True)):
        for i in range(half - 1):
            f = (base + i, base + i + 1, base + n - 2 - i, base + n - 1 - i)
            faces.append(f[::-1] if flip else f)
    o = mesh_obj(name, verts, faces)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data); bm.free()
    return finish(o, mat, smooth)


# ------------------------------------------------------------------ ship (title / finale / inside the bubble)
def build_ship():
    """Three-masted merchant ship, bow towards +X, ~2.4 units long. Returns created objects."""
    before = set(objs())
    NS, NP = 30, 12

    def width(t):
        return max(0.004, 0.27 * (1 - t ** 3) ** 0.55 * (0.72 + 0.28 * min(1.0, t * 3.5)))

    def ztop(t):
        return 0.10 + 0.13 * (1 - t) ** 4 + 0.09 * t ** 4

    zbot = lambda t: -0.20 + 0.12 * t ** 3
    xs = lambda t: -1.0 + 2.0 * t
    verts, faces, rings = [], [], []
    for k in range(NS + 1):
        t = k / NS
        w, zt, zb = width(t), ztop(t), zbot(t)
        ring = []
        for side in (-1, 1):
            rng = range(NP + 1) if side < 0 else range(NP - 1, -1, -1)
            for i in rng:
                th = (math.pi / 2) * i / NP
                y = side * w * math.cos(th) ** 0.65
                z = zt - (zt - zb) * math.sin(th) ** 1.4
                ring.append(len(verts)); verts.append((xs(t), y, z))
        rings.append(ring)
    m = len(rings[0])
    for A, B in zip(rings, rings[1:]):
        for i in range(m - 1):
            faces.append((A[i], A[i + 1], B[i + 1], B[i]))
    faces.append(tuple(rings[0][::-1]))  # transom
    faces.append(tuple(rings[-1]))
    hull = finish(mesh_obj("hull", verts, faces), "wood", 50)
    bm = bmesh.new(); bm.from_mesh(hull.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(hull.data); bm.free()
    # deck
    dv, df = [], []
    for k in range(NS + 1):
        t = k / NS
        for side in (-1, 1):
            dv.append((xs(t), side * width(t) * 0.97, ztop(t) - 0.012))
    for k in range(NS):
        a = 2 * k
        df.append((a, a + 2, a + 3, a + 1))
    finish(mesh_obj("deck", dv, df), "wood_l", 30)
    # gold wale stripes + gun ports
    for side in (-1, 1):
        for dz, r in ((0.035, 0.008), (0.11, 0.006)):
            pts = [(xs(t), side * width(t) * 1.002 * (1 - 0.15 * (dz > 0.05)), ztop(t) - dz) for t in [i / 16 for i in range(17)]]
            tube("wale", pts, r, "gold", 2)
        for k in range(7):
            t = 0.2 + 0.09 * k
            box("port", (0.05, 0.02, 0.04), (xs(t), side * width(t) * 0.99, ztop(t) - 0.075), "satin", 0.004)
    # stern castle with lit windows + lantern
    sc_t = 0.11
    box("castle", (0.32, 2 * width(sc_t) * 0.92, 0.12), (xs(sc_t) - 0.05, 0, ztop(sc_t) + 0.04), "wood_m", 0.01)
    box("castle_top", (0.36, 2 * width(sc_t) * 0.98, 0.02), (xs(sc_t) - 0.05, 0, ztop(sc_t) + 0.105), "wood_l", 0.004)
    for j in range(4):
        box("win", (0.005, 0.045, 0.05), (xs(0) - 0.003, -0.12 + 0.08 * j, ztop(0) - 0.06), "window", 0.002)
    lathe("lantern", [(0, 0), (0.025, 0), (0.035, 0.04), (0.02, 0.08), (0.008, 0.10), (0, 0.11)], "gold", 16,
          loc=(xs(0) - 0.02, 0, ztop(0) + 0.115))
    # masts, yards, sails
    masts = [(-0.48, 1.00, 2), (0.05, 1.30, 3), (0.52, 1.15, 3)]
    tops = []
    for mx, mh, nyard in masts:
        t = (mx + 1) / 2
        z0 = ztop(t) - 0.05
        lathe("mast", [(0, z0), (0.020, z0), (0.016, z0 + mh * 0.6), (0.011, z0 + mh), (0, z0 + mh)], "wood_m", 12)
        tops.append((mx, z0 + mh))
        yz = [z0 + mh * f for f in (0.30, 0.62, 0.90)][:nyard] if nyard == 3 else [z0 + mh * f for f in (0.40, 0.82)]
        yl = [0.62, 0.48, 0.34] if nyard == 3 else [0.46, 0.34]
        for zz, L in zip(yz, yl):
            cyl("yard", 0.008, L, (mx, 0, zz), "wood_m", rot=(math.pi / 2, 0, 0), seg=8)
        for (zt_, Lt), (zb_, Lb) in zip(list(zip(yz, yl))[1:], list(zip(yz, yl))[:-1]):
            pass
        bands = list(zip(yz, yl))
        for k in range(len(bands)):
            ztop_s, Lt = bands[k]
            zbot_s = bands[k - 1][0] + 0.02 if k > 0 else z0 + 0.10
            Lb = bands[k - 1][1] if k > 0 else yl[0] * 1.05
            if k == 0:
                ztop_s, Lt = bands[0]
                zbot_s, Lb = z0 + 0.12, yl[0] * 1.05

            def sail(u, v, zt=ztop_s - 0.01, zb=zbot_s, lt=Lt * 0.92, lb=Lb * 0.95, mx=mx):
                w = lt + (lb - lt) * v
                y = (u - 0.5) * w
                z = zt + (zb - zt) * v
                x = mx + 0.075 * math.sin(math.pi * u) * math.sin(math.pi * (0.15 + 0.85 * v)) + 0.01
                return (x, y, z)
            grid_surface("sail", sail, 8, 6, "canvas", 80)
        # pennant
        zt_ = z0 + mh
        grid_surface("flag", lambda u, v, mx=mx, zt_=zt_: (mx - 0.22 * u, 0.012 * math.sin(u * 7), zt_ - 0.01 - 0.05 * v * (1 - u * 0.85)), 6, 1, "seal", 80)
    # bowsprit + jib
    bt = ztop(1.0)
    tube("bowsprit", [(0.97, 0, bt - 0.01), (1.40, 0, bt + 0.22)], 0.012, "wood_m", 3, False)
    fx, fz = tops[2]
    A, B, C = Vector((1.38, 0, bt + 0.21)), Vector((fx + 0.02, 0, fz - 0.06)), Vector((fx + 0.03, 0, bt + 0.25))
    grid_surface("jib", lambda u, v: tuple(A.lerp(B, v) * (1 - u) + C.lerp(B, v) * u + Vector((0, 0.04 * math.sin(math.pi * u) * (1 - v), 0))), 6, 6, "canvas", 80)
    # rigging
    for mx, top in tops:
        t = (mx + 1) / 2
        for side in (-1, 1):
            for dx in (-0.06, 0.06):
                tube("shroud", [(mx, 0, top - 0.02), (mx + dx, side * width(t) * 0.98, ztop(t))], 0.0025, "rope", 0, False)
    for (x1, z1), (x2, z2) in zip(tops, tops[1:]):
        tube("stay", [(x1, 0, z1 - 0.02), (x2, 0, z2 * 0.55)], 0.0025, "rope", 0, False)
    tube("forestay", [(fx, 0, fz - 0.02), (1.40, 0, bt + 0.22)], 0.0025, "rope", 0, False)
    return [o for o in objs() if o not in before]


def m_ship():
    build_ship()
    shift_z(-0.45)


# ------------------------------------------------------------------ bubble: a ship inside a glass bubble (Mississippi bubble)
def m_bubble():
    R = 0.62
    sh = build_ship()
    transform(sh, Matrix.Translation((0, 0, 0.05)) @ Matrix.Scale(0.38, 4))
    for o in sh:
        o.location.z += 0.62
    sphere("bubble", R, (0, 0, 0.66), "bubble", 64, 32)
    # gold paper-money "share" curls in the bubble base + brass stand
    lathe("stand", [(0, 0.0), (0.42, 0.0), (0.44, 0.03), (0.40, 0.07), (0.30, 0.10), (0.22, 0.12), (0.20, 0.16),
                    (0.26, 0.18), (0.27, 0.20), (0, 0.20)], "walnut", 64)
    torus("standring", 0.43, 0.012, (0, 0, 0.03), "gold", seg=64, mseg=8)
    torus("cup", 0.265, 0.018, (0, 0, 0.19), "brass", seg=64, mseg=10)
    random.seed(7)
    for k in range(4):
        coin_lp("c", (0.28 * math.cos(k * 1.7 + 0.4), -0.28 * abs(math.sin(k * 1.7 + 0.4)) - 0.05, 0.015 + 0.03 * (k % 2)),
                (0, 0, k), r=0.075, t=0.022)
    shift_z(-0.62)


# ------------------------------------------------------------------ Irish harp
def m_harp():
    B, T = Vector((0.02, 0, 0.04)), Vector((-0.17, 0, 0.98))
    # tapered sound box along B->T
    ax = (T - B)
    L = ax.length
    d = ax.normalized()
    nrm = Vector((d.z, 0, -d.x))  # in-plane normal pointing towards the strings (+X side)
    vs = []
    for s, wx, wy in ((0, 0.13, 0.11), (1, 0.06, 0.06)):
        c = B + ax * s
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            p = c + nrm * (sx * wx) + Vector((0, sy * wy, 0))
            vs.append(tuple(p))
    sb = mesh_obj("soundbox", vs, [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)])
    finish(sb, "walnut", 30, 0.02, 2)
    # sound holes
    for s in (0.3, 0.55):
        c = B + ax * s + nrm * (0.13 - 0.07 * s + 0.002)
        o = cyl("hole", 0.022 - 0.008 * s, 0.01, tuple(c), "satin", seg=16)
        o.rotation_euler = (0, math.atan2(nrm.x, nrm.z), 0)
    neck = bezier([T + Vector((0, 0, 0.03)), (0.12, 0, 1.20), (0.45, 0, 0.82), (0.74, 0, 1.03)], 24)
    pillar = bezier([neck[-1], (0.84, 0, 0.62), (0.60, 0, 0.12), B + Vector((0.06, 0, -0.03))], 24)
    tube("neck", [tuple(p) for p in neck], 0.045, "walnut", 4)
    tube("pillar", [tuple(p) for p in pillar], 0.05, "walnut", 4)
    for p in (neck[0], neck[-1], pillar[-1]):
        sphere("knob", 0.06, tuple(p), "gold", 24, 12)
    tube("inlay", [tuple(p + Vector((0, -0.05, 0))) for p in pillar[2:-2]], 0.008, "gold", 2)
    N = 18
    for i in range(N):
        f = i / (N - 1)
        bot = B + ax * (0.10 + 0.80 * f) + nrm * (0.13 - 0.07 * (0.10 + 0.8 * f) + 0.005)
        top = neck[int(round(22 - 20 * f))] + Vector((0, 0, -0.03))
        tube("string", [tuple(bot), tuple(top)], 0.0035, "brass" if i % 3 else "red", 0, False)
        sphere("pin", 0.012, tuple(top + Vector((0, -0.045, 0.02))), "gold", 8, 4)
    shift_z(-0.55)


# ------------------------------------------------------------------ strongbox with gold
def m_chest():
    W, D, H = 1.0, 0.58, 0.46
    box("body", (W, D, H), (0, 0, H / 2), "wood", 0.015)
    for x in (-0.38, 0, 0.38):
        box("band", (0.06, D + 0.02, H + 0.01), (x, 0, H / 2), "iron", 0.005)
    box("plate", (0.16, 0.02, 0.18), (0, -D / 2 - 0.012, H - 0.12), "gold", 0.005)
    box("keyhole", (0.025, 0.01, 0.06), (0, -D / 2 - 0.022, H - 0.13), "satin", 0.003)
    # gold heap + coins inside
    lathe("heap", [(0, H + 0.10), (0.20, H + 0.08), (0.40, H + 0.02), (0.44, H - 0.02), (0, H - 0.02)], "gold", 40)
    for o in objs()[-1:]:
        o.scale.y = 0.55
    random.seed(11)
    for k in range(16):
        a = random.uniform(0, TAU); rr = random.uniform(0, 0.38)
        x, y = rr * math.cos(a), rr * math.sin(a) * 0.5
        z = H + 0.09 * (1 - (rr / 0.44) ** 2) + 0.01
        coin_lp("c", (x, y, z), (random.uniform(-0.4, 0.4), random.uniform(-0.4, 0.4), random.uniform(0, 6)), r=0.07, t=0.018)
    # arched lid, open backwards about the hinge (back top edge)
    R, n = D / 2, 16
    lv, lf = [], []
    for side in (-1, 1):
        for i in range(n + 1):
            th = math.pi * i / n
            lv.append((side * W / 2, R * math.cos(th), R * math.sin(th)))
    for i in range(n):
        lf.append((i, i + 1, n + 2 + i, n + 1 + i))
    lf.append(tuple(range(n + 1))[::-1])
    lf.append(tuple(range(n + 1, 2 * n + 2)))
    lid = finish(mesh_obj("lid", lv, lf), "wood", 40)
    bm = bmesh.new(); bm.from_mesh(lid.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(lid.data); bm.free()
    parts = [lid]
    for x in (-0.38, 0, 0.38):
        parts.append(tube("lidband", [(x, R * 1.02 * math.cos(math.pi * i / 12), R * 1.02 * math.sin(math.pi * i / 12)) for i in range(13)],
                          0.02, "iron", 2))
    hinge = Vector((0, R, 0))
    Mx = Matrix.Translation((0, 0, H)) @ Matrix.Translation(hinge) @ Matrix.Rotation(math.radians(-62), 4, "X") @ Matrix.Translation(-hinge)
    transform(parts, Mx)
    # coins spilled in front
    coin_lp("f1", (-0.25, -0.48, 0.009), (0, 0, 0.3), r=0.07, t=0.018)
    coin_lp("f2", (-0.10, -0.55, 0.009), (0, 0, 1.3), r=0.07, t=0.018)
    coin_lp("f3", (-0.17, -0.40, 0.027), (0, 0, 2.3), r=0.07, t=0.018)
    coin_lp("lean", (0.26, -0.40, 0.066), (math.radians(78), 0, math.radians(-20)), r=0.07, t=0.018)
    shift_z(-0.35)


# ------------------------------------------------------------------ scales of justice
def m_scales():
    lathe("base", [(0, 0), (0.36, 0), (0.37, 0.025), (0.33, 0.06), (0.22, 0.09), (0.12, 0.11), (0, 0.11)], "walnut", 64)
    torus("basering", 0.36, 0.01, (0, 0, 0.02), "gold", seg=64, mseg=8)
    lathe("column", [(0, 0.10), (0.06, 0.10), (0.05, 0.16), (0.03, 0.22), (0.026, 1.00), (0.04, 1.03), (0.03, 1.06), (0, 1.06)], "brass", 32)
    sphere("finial", 0.05, (0, 0, 1.13), "gold", 24, 12)
    tilt = math.radians(11)
    piv = Vector((0, 0, 1.03))
    half = 0.56
    beam = box("beam", (2 * half, 0.035, 0.03), tuple(piv), "brass", 0.008)
    beam.rotation_euler = (0, tilt, 0)
    for s in (-1, 1):
        end = piv + Vector((s * half * math.cos(tilt), 0, -s * half * math.sin(tilt)))
        sphere("tip", 0.025, tuple(end), "gold", 16, 8)
        pan_z = end.z - 0.42
        lathe("pan", [(0, pan_z - 0.04), (0.10, pan_z - 0.035), (0.18, pan_z - 0.01), (0.20, pan_z + 0.01), (0.195, pan_z + 0.012),
                      (0.17, pan_z - 0.005), (0.09, pan_z - 0.025), (0, pan_z - 0.03)], "gold", 48, loc=(end.x, 0, 0))
        for k in range(3):
            a = TAU * k / 3 + 0.5
            tube("chain", [tuple(end), (end.x + 0.19 * math.cos(a), 0.19 * math.sin(a), pan_z + 0.01)], 0.003, "brass", 0, False)
        if s == 1:  # lower pan: money
            for k in range(4):
                coin_lp("c", (end.x + 0.02 * k - 0.03, 0.01 * k, pan_z - 0.015 + 0.02 * k), (0, 0, k), r=0.07, t=0.02)
        else:  # higher pan: a sealed contract
            o = cyl("scroll", 0.035, 0.24, (end.x, 0, pan_z + 0.02), "parchment", rot=(0, math.pi / 2, 0.3), seg=16)
            cyl("sealw", 0.03, 0.012, (end.x + 0.02, -0.035, pan_z + 0.02), "seal", rot=(math.pi / 2, 0, 0), seg=16)
    shift_z(-0.55)


# ------------------------------------------------------------------ quill + inkwell + letter
def m_quill():
    lathe("inkwell", [(0, 0), (0.20, 0), (0.22, 0.015), (0.22, 0.13), (0.19, 0.17), (0.11, 0.20), (0.075, 0.22), (0.075, 0.26),
                      (0.065, 0.26), (0.065, 0.21), (0, 0.21)], "inkglass", 56)
    torus("neckring", 0.078, 0.012, (0, 0, 0.245), "brass", seg=40, mseg=8)
    torus("basering", 0.215, 0.01, (0, 0, 0.012), "brass", seg=56, mseg=8)
    # quill: curved shaft + asymmetric vane in the XZ plane (faces the viewer)
    P = bezier([(0.01, 0, 0.17), (0.12, -0.01, 0.55), (0.30, -0.02, 0.95), (0.52, -0.03, 1.22)], 40)
    tube("shaft", [tuple(p) for p in P], 0.008, "ivory", 3)
    n = len(P)
    vs, fs = [], []
    cols = 7
    for i in range(n):
        t = i / (n - 1)
        tang = (P[min(n - 1, i + 1)] - P[max(0, i - 1)]).normalized()
        side = tang.cross(Vector((0, 1, 0))).normalized()
        u = max(0.0, (t - 0.22) / 0.78)
        s = math.sin(math.pi * min(1.0, u * 1.08)) ** 0.6 if u > 0 else 0
        wl, wr = 0.055 * s, 0.10 * s
        for j in range(cols):
            f = -1 + 2 * j / (cols - 1)
            w = wl if f < 0 else wr
            p = P[i] + side * (f * w) + Vector((0, 0.025 * f * f * s, 0)) - tang * (0.03 * abs(f) * s)
            vs.append(tuple(p))
    for i in range(n - 1):
        for j in range(cols - 1):
            a = i * cols + j
            fs.append((a, a + 1, a + cols + 1, a + cols))
    finish(mesh_obj("vane", vs, fs), "feather", 70)
    # letter with a curled edge and a red wax seal
    def sheet(u, v):
        x = -0.85 + 0.62 * u
        y = -0.38 + 0.45 * v
        z = 0.004
        if u > 0.82:
            a = (u - 0.82) / 0.18 * math.pi * 0.9
            r = 0.05
            x = -0.85 + 0.62 * 0.82 + r * math.sin(a)
            z = 0.004 + r * (1 - math.cos(a))
        return (x, y, z)
    grid_surface("letter", sheet, 24, 4, "parchment", 70)
    cyl("seal", 0.045, 0.012, (-0.65, -0.24, 0.012), "seal", seg=24, bevel=0.003)
    shift_z(-0.55)


# ------------------------------------------------------------------ wheat sheaf (land = source of wealth)
def m_wheat():
    random.seed(5)
    waist = 0.42
    for k in range(20):
        a = TAU * k / 20 + random.uniform(-0.1, 0.1)
        rb = 0.11 + random.uniform(-0.02, 0.02)
        fan = (k / 19 - 0.5) * 2  # -1..1 across the sheaf
        top = Vector((fan * 0.36 + random.uniform(-0.04, 0.04), random.uniform(-0.12, 0.12), 0.98 + 0.12 * (1 - fan * fan) + random.uniform(-0.04, 0.04)))
        bot = Vector((rb * math.cos(a), rb * math.sin(a), 0.0))
        mid = Vector((0.045 * math.cos(a), 0.045 * math.sin(a), waist))
        tube("stalk", [tuple(bot), tuple(mid), tuple(mid + (top - mid) * 0.5 + Vector((0, 0, 0.03))), tuple(top)], 0.007, "stalk", 1)
        # ear
        d = (top - mid).normalized()
        side = d.cross(Vector((0, 1, 0))).normalized()
        for g in range(14):
            f = g / 13
            c = top + d * (0.02 + 0.17 * f)
            sgn = 1 if g % 2 else -1
            p = c + side * (sgn * 0.016 * (1 - 0.5 * f))
            o = sphere("grain", 1.0, tuple(p), "wheat", 8, 5)
            o.scale = (0.014, 0.012, 0.028 * (1 - 0.3 * f))
            q = d.to_track_quat("Z", "Y")
            o.rotation_mode = "QUATERNION"
            o.rotation_quaternion = q @ Matrix.Rotation(sgn * 0.35, 4, "Y").to_quaternion()
            if g % 2 == 0:
                tube("awn", [tuple(p + d * 0.02), tuple(p + d * 0.13 + side * sgn * 0.03)], 0.0012, "wheat", 0, False)
    torus("band", 0.058, 0.016, (0, 0, waist), "rope", seg=40, mseg=8)
    torus("band2", 0.060, 0.008, (0, 0, waist + 0.03), "gold", seg=40, mseg=6)
    shift_z(-0.6)


# ------------------------------------------------------------------ dice (uncertainty)
PIPS = {1: [(0, 0)], 2: [(-1, -1), (1, 1)], 3: [(-1, -1), (0, 0), (1, 1)], 4: [(-1, -1), (1, -1), (-1, 1), (1, 1)],
        5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)], 6: [(-1, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (1, 1)]}


def die(name, s, Mx, faces):
    parts = [box(name, (s, s, s), (0, 0, 0), "dice", 0.07 * s / 0.5, seg=3)]
    h = s / 2
    axes = {"+z": (Vector((0, 0, 1)), Vector((1, 0, 0)), Vector((0, 1, 0))), "-z": (Vector((0, 0, -1)), Vector((1, 0, 0)), Vector((0, -1, 0))),
            "-y": (Vector((0, -1, 0)), Vector((1, 0, 0)), Vector((0, 0, 1))), "+y": (Vector((0, 1, 0)), Vector((-1, 0, 0)), Vector((0, 0, 1))),
            "+x": (Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))), "-x": (Vector((-1, 0, 0)), Vector((0, -1, 0)), Vector((0, 0, 1)))}
    for f, val in faces.items():
        n, u, v = axes[f]
        for a, b in PIPS[val]:
            p = n * (h - 0.004) + u * (a * s * 0.27) + v * (b * s * 0.27)
            o = sphere("pip", s * 0.075, tuple(p), "pip", 14, 7)
            o.scale = Vector((1, 1, 1)) - Vector((abs(n.x), abs(n.y), abs(n.z))) * 0.6
            parts.append(o)
    transform(parts, Mx)


def m_dice():
    die("d1", 0.5, Matrix.Translation((-0.30, 0.05, 0.25)) @ Matrix.Rotation(math.radians(18), 4, "Z"),
        {"+z": 5, "-z": 2, "-y": 3, "+y": 4, "+x": 1, "-x": 6})
    die("d2", 0.5, Matrix.Translation((0.34, -0.12, 0.33)) @ Matrix.Rotation(math.radians(-28), 4, "Z") @ Matrix.Rotation(math.radians(24), 4, "Y")
        @ Matrix.Rotation(math.radians(12), 4, "X"), {"+z": 6, "-z": 1, "-y": 2, "+y": 5, "+x": 4, "-x": 3})
    shift_z(-0.3)


# ------------------------------------------------------------------ barrel (buy now, sell at an unknown price)
def m_barrel():
    H, N = 1.0, 20
    rz = lambda z: 0.34 + 0.07 * math.sin(math.pi * z / H)
    zs = [H * i / 12 for i in range(13)]
    loop = [(rz(z), z) for z in zs] + [(rz(z) - 0.03, z) for z in reversed(zs)]
    gap = 0.006
    for k in range(N):
        a0, a1 = TAU * k / N + gap, TAU * (k + 1) / N - gap
        lathe_arc("stave", loop, a0, a1, 3, "wood_m" if k % 3 else "wood", 25)
    for z in (0.07, 0.22, 0.78, 0.93):
        o = torus("hoop", rz(z) + 0.004, 0.012, (0, 0, z), "iron", seg=48, mseg=6)
        o.scale.z = 2.4
    for z in (0.03, 0.97):
        cyl("head", rz(z) - 0.02, 0.025, (0, 0, z), "wood_l", seg=40)
    # spigot
    cyl("tap", 0.03, 0.14, (0, -rz(0.2) - 0.05, 0.2), "brass", rot=(math.pi / 2, 0, 0), seg=16)
    lathe("tapend", [(0, 0), (0.04, 0), (0.035, 0.03), (0, 0.035)], "brass", 16, loc=(0, -rz(0.2) - 0.12, 0.2))
    objs()[-1].rotation_euler = (math.pi / 2, 0, 0)
    box("handle", (0.10, 0.02, 0.025), (0, -rz(0.2) - 0.09, 0.25), "brass", 0.006)
    shift_z(-0.5)


# ------------------------------------------------------------------ ripple bowl (Cantillon effect)
def m_ripple():
    lathe("bowl", [(0, 0), (0.40, 0), (0.48, 0.02), (0.60, 0.10), (0.66, 0.15), (0.68, 0.17), (0.66, 0.18), (0.62, 0.16),
                   (0.55, 0.11), (0.40, 0.05), (0, 0.04)], "brass", 72)
    torus("rim", 0.67, 0.012, (0, 0, 0.172), "gold", seg=72, mseg=8)
    NR, NA = 42, 72
    vs, fs = [(0, 0, 0.142)], []
    for i in range(1, NR + 1):
        r = 0.62 * i / NR
        z = 0.13 + 0.016 * math.cos(30 * r) * math.exp(-2.2 * r)
        for j in range(NA):
            a = TAU * j / NA
            vs.append((r * math.cos(a), r * math.sin(a), z))
    for j in range(NA):
        fs.append((0, 1 + j, 1 + (j + 1) % NA))
    for i in range(NR - 1):
        for j in range(NA):
            a, b = 1 + i * NA + j, 1 + i * NA + (j + 1) % NA
            fs.append((a, b, b + NA, a + NA))
    finish(mesh_obj("water", vs, fs), "water", 80)
    # splash crown + falling coin
    for k in range(9):
        a = TAU * k / 9
        sphere("drop", 0.016 - 0.004 * (k % 2), (0.07 * math.cos(a), 0.07 * math.sin(a), 0.17 + 0.03 * (k % 3)), "water", 12, 6)
    sphere("drop", 0.02, (0, 0, 0.24), "water", 12, 6)
    coin_lp("coin", (0, 0, 0.44), (math.radians(62), math.radians(18), 0), r=0.12, t=0.024, seg=40)
    shift_z(-0.2)


# ------------------------------------------------------------------ compass (he was first)
def star_loop(n, r_out, r_in, rot=0.0):
    pts = []
    for i in range(2 * n):
        a = rot + math.pi * i / n
        r = r_out if i % 2 == 0 else r_in
        pts.append((r * math.cos(a), r * math.sin(a)))
    return pts


def m_compass():
    lathe("case", [(0, 0), (0.50, 0), (0.52, 0.02), (0.52, 0.15), (0.50, 0.17), (0.46, 0.17), (0.46, 0.06), (0, 0.06)], "brass", 72)
    torus("bezel", 0.485, 0.018, (0, 0, 0.17), "gold", seg=72, mseg=10)
    cyl("rose", 0.455, 0.01, (0, 0, 0.065), "rose", seg=72)
    o = profile2d("star8", [star_loop(8, 0.40, 0.10, math.pi / 8)], 0.006, 0.002, "brass_d", 1)
    o.location.z = 0.072
    o = profile2d("star4", [star_loop(4, 0.43, 0.08)], 0.009, 0.002, "gold", 1)
    o.location.z = 0.075
    for k in range(32):
        a = TAU * k / 32
        box("tick", (0.035 if k % 4 == 0 else 0.018, 0.006, 0.004), (0.43 * math.cos(a), 0.43 * math.sin(a), 0.072), "pip", 0, rot=(0, 0, a))
    # needle (north red)
    nN = profile2d("needleN", [[(0, 0.36), (0.04, 0), (-0.04, 0)]], 0.012, 0.002, "seal", 1)
    nS = profile2d("needleS", [[(0, -0.36), (-0.04, 0), (0.04, 0)]], 0.012, 0.002, "steel", 1)
    for o in (nN, nS):
        o.location.z = 0.09
        o.rotation_euler = (0, 0, math.radians(-25))
    sphere("pivot", 0.025, (0, 0, 0.105), "gold", 16, 8)
    lathe("glass", [(0.46, 0.165), (0.30, 0.19), (0, 0.20)], "glass", 64)
    # ring handle at the back
    torus("loop", 0.07, 0.014, (0, 0.56, 0.12), "gold", rot=(0, math.pi / 2, 0), seg=32, mseg=8)
    shift_z(-0.1)


# ------------------------------------------------------------------ candle (the night of 14 May 1734)
def m_candle():
    lathe("dish", [(0, 0), (0.36, 0), (0.40, 0.02), (0.42, 0.05), (0.41, 0.06), (0.37, 0.035), (0.10, 0.03), (0, 0.03)], "brass", 64)
    lathe("socket", [(0, 0.03), (0.09, 0.03), (0.08, 0.06), (0.10, 0.13), (0.115, 0.15), (0.11, 0.16), (0, 0.16)], "brass", 40)
    torus("handle", 0.075, 0.014, (0.46, 0, 0.06), "brass", rot=(math.pi / 2, 0, 0), seg=32, mseg=8)
    H = 0.80
    prof = [(0, 0.15), (0.085, 0.15), (0.085, H - 0.03), (0.08, H - 0.005), (0.065, H), (0.04, H - 0.015), (0, H - 0.02)]
    lathe("candle", prof, "wax", 40)
    random.seed(2)
    for k in range(5):
        a = TAU * k / 5 + 0.3
        L = random.uniform(0.08, 0.28)
        p0 = Vector((0.087 * math.cos(a), 0.087 * math.sin(a), H - 0.01))
        p1 = Vector((0.092 * math.cos(a), 0.092 * math.sin(a), H - 0.01 - L))
        tube("drip", [tuple(p0), tuple((p0 + p1) / 2 + Vector((0.004 * math.cos(a), 0.004 * math.sin(a), 0))), tuple(p1)], 0.012, "wax", 2)
        sphere("dripend", 0.016, tuple(p1), "wax", 12, 6)
    tube("wick", [(0, 0, H - 0.025), (0.004, 0, H + 0.03), (0.012, 0, H + 0.05)], 0.005, "satin", 2)
    flame = [(0, H + 0.02)]
    for i in range(1, 16):
        t = i / 16
        flame.append((0.045 * math.sin(math.pi * t ** 0.7) * (1 - t) ** 0.35 + 0.001, H + 0.02 + 0.22 * t))
    flame.append((0, H + 0.245))
    lathe("flame", flame, "flame", 24, 80)
    core = [(0, H + 0.03)] + [(0.018 * math.sin(math.pi * (i / 8) ** 0.8) + 0.001, H + 0.03 + 0.09 * i / 8) for i in range(1, 8)] + [(0, H + 0.125)]
    lathe("core", core, "flame2", 16, 80)
    shift_z(-0.5)


# ------------------------------------------------------------------ key (to the theory of entrepreneurship)
def circle(c, r, n=32):
    return [(c[0] + r * math.cos(TAU * i / n), c[1] + r * math.sin(TAU * i / n)) for i in range(n)][::-1]


def m_key():
    t = 0.06
    bx = -0.78
    outer = [(bx + (0.28 + 0.025 * math.cos(8 * TAU * i / 96)) * math.cos(TAU * i / 96),
              (0.28 + 0.025 * math.cos(8 * TAU * i / 96)) * math.sin(TAU * i / 96)) for i in range(96)]
    holes = [circle((bx + 0.13 * math.cos(a), 0.13 * math.sin(a)), 0.068, 24) for a in (0, math.pi / 2, math.pi, 3 * math.pi / 2)]
    holes.append(circle((bx, 0), 0.03, 16))
    profile2d("bow", [outer] + holes, t, 0.012, "gold", 2)
    cyl("shaft", 0.042, 1.06, (0.05, 0, t / 2), "gold", rot=(0, math.pi / 2, 0), seg=24)
    for x, r in ((-0.48, 0.065), (-0.36, 0.055), (0.56, 0.05)):
        torus("collar", r - 0.01, 0.018, (x, 0, t / 2), "gold", rot=(0, math.pi / 2, 0), seg=32, mseg=8)
    bit = [(0.28, -0.03), (0.52, -0.03), (0.52, -0.30), (0.46, -0.30), (0.46, -0.22), (0.41, -0.22), (0.41, -0.30),
           (0.35, -0.30), (0.35, -0.16), (0.31, -0.16), (0.31, -0.30), (0.28, -0.30)]
    profile2d("bit", [bit], t, 0.008, "gold", 2)
    # tassel ribbon through the bow
    tube("ribbon", [(bx - 0.25, 0.0, t / 2), (bx - 0.40, -0.03, -0.12), (bx - 0.38, -0.05, -0.40)], 0.022, "seal", 3)
    rot_all(rx=90)


# ------------------------------------------------------------------ small coin that rolls along the progress track
def m_coin_s():
    r, t = 1.0, 0.16
    lathe("coin", [(0, -t / 2), (0.86 * r, -t / 2), (r, -t / 2 + 0.03), (r, t / 2 - 0.03), (0.86 * r, t / 2), (0.80 * r, t / 2 - 0.02),
                   (0, t / 2 - 0.02)], "gold", 48)
    for k in range(24):
        a = TAU * k / 24
        sphere("bead", 0.035, (0.72 * math.cos(a), 0.72 * math.sin(a), t / 2 - 0.01), "brass", 8, 4)
    # a big raised "C" — asymmetric, so the rolling is visible
    outer = [(0.50 * math.cos(a), 0.50 * math.sin(a)) for a in [math.radians(40 + 280 * i / 40) for i in range(41)]]
    inner = [(0.30 * math.cos(a), 0.30 * math.sin(a)) for a in [math.radians(40 + 280 * i / 40) for i in range(40, -1, -1)]]
    o = profile2d("C", [outer + inner], 0.05, 0.015, "brass", 1)
    o.location.z = t / 2 - 0.03
    rot_all(rx=90)


# ------------------------------------------------------------------ globe with Cantillon's route (Kerry -> ... -> Suriname)
def m_globe():
    import numpy as np
    from global_land_mask import globe as gl
    W, Hh = 1024, 512
    lats = np.linspace(89.9, -89.9, Hh)
    lons = np.linspace(-180, 179.9, W)
    LON, LAT = np.meshgrid(lons, lats)
    land = gl.is_land(LAT, LON)
    img = np.zeros((Hh, W, 4), dtype=np.float32)
    ocean = np.array([0.055, 0.030, 0.020, 1])
    landc = np.array([0.72, 0.52, 0.25, 1])
    img[:] = ocean
    img[land] = landc
    grid = (np.abs(((LAT + 90) % 15) - 7.5) > 7.32) | (np.abs(((LON + 180) % 15) - 7.5) > 7.38)
    img[grid & ~land] = ocean * 0.4 + landc * 0.35
    img[..., 3] = 1
    im = bpy.data.images.new("earth", W, Hh, alpha=False)
    im.pixels = img[::-1].ravel().tolist()
    im.filepath_raw = os.path.join(mm.OUT, "_earth.png")
    im.file_format = "PNG"
    im.save()
    m = bpy.data.materials.new("earth")
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = im
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Metallic"].default_value = 0.35
    b.inputs["Roughness"].default_value = 0.38
    R = 0.5
    bpy.ops.mesh.primitive_uv_sphere_add(segments=72, ring_count=36, radius=R)
    s = bpy.context.active_object
    s.name = "earth"
    finish(s, m, 80)

    def ll(lat, lon, rr=R):
        la, lo = math.radians(lat), math.radians(lon + 180)
        return Vector((rr * math.cos(la) * math.cos(lo), rr * math.cos(la) * math.sin(lo), rr * math.sin(la)))

    cities = {"kerry": (52.27, -9.70), "paris": (48.86, 2.35), "madrid": (40.42, -3.70), "amsterdam": (52.37, 4.90),
              "london": (51.51, -0.13), "suriname": (5.85, -55.20)}
    for k, (la, lo) in cities.items():
        sphere("pin_" + k, 0.02, tuple(ll(la, lo, R * 1.01)), "ivory" if k != "suriname" else "seal", 16, 8)
    route = [("kerry", "paris", "ember"), ("paris", "madrid", "ember"), ("paris", "amsterdam", "ember"),
             ("amsterdam", "london", "ember"), ("london", "suriname", "seal")]
    for a, b2, mat in route:
        A, B = ll(*cities[a]), ll(*cities[b2])
        ang = A.angle(B)
        pts = []
        for i in range(25):
            t = i / 24
            P = A.slerp(B, t) if hasattr(A, "slerp") else (A * (1 - t) + B * t)
            P = P.normalized() * (R * (1.012 + 0.10 * math.sin(math.pi * t) * min(1.0, ang * 1.4)))
            pts.append(tuple(P))
        tube("arc", pts, 0.008, mat, 3)
    for o in objs():
        o.matrix_world = Matrix.Rotation(math.radians(-62), 4, "Z") @ o.matrix_world
    for o in objs():
        o.matrix_world = Matrix.Rotation(math.radians(-14), 4, "X") @ o.matrix_world
        o.matrix_world = Matrix.Rotation(math.radians(23.4), 4, "Y") @ o.matrix_world
        o.matrix_world = Matrix.Translation((0, 0, 0.72)) @ o.matrix_world
    ax = Matrix.Translation((0, 0, 0.72)) @ Matrix.Rotation(math.radians(23.4), 4, "Y")
    pts = [tuple(ax @ Vector((-0.56 * math.cos(math.radians(-95 + 190 * i / 60)), 0, 0.56 * math.sin(math.radians(-95 + 190 * i / 60))))) for i in range(61)]
    tube("meridian", pts, 0.016, "brass", 6)
    for zz in (0.585, -0.585):
        cyl("pivot", 0.02, 0.06, tuple(ax @ Vector((0, 0, zz))), "brass", seg=16)
    lathe("stand", [(0, 0.0), (0.30, 0.0), (0.31, 0.02), (0.29, 0.05), (0.18, 0.08), (0.10, 0.10), (0.06, 0.14),
                    (0.045, 0.20), (0.04, 0.16), (0.0, 0.16)], "walnut", 72)
    tube("post", [(0, 0, 0.12), (0, 0, 0.17), tuple(ax @ Vector((0, 0, -0.56)))], 0.03, "brass", 6, False)
    torus("standring", 0.295, 0.01, (0, 0, 0.022), "brass", seg=64, mseg=8)
    shift_z(-0.62)


MODELS = {
    "ship": m_ship, "harp": m_harp, "globe": m_globe, "chest": m_chest, "bubble": m_bubble, "scales": m_scales,
    "quill": m_quill, "wheat": m_wheat, "dice": m_dice, "barrel": m_barrel, "ripple": m_ripple, "compass": m_compass,
    "candle": m_candle, "key": m_key, "coin_s": m_coin_s,
}

if __name__ == "__main__":
    want = [a for a in sys.argv[1:] if a in MODELS] or list(MODELS)
    for key in want:
        mm.reset()
        mm._mats.clear()
        MODELS[key]()
        mm.export(key)
