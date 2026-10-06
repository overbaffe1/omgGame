# Procedural 3D exhibits for the Cantillon deck (Blender / bpy -> .glb for PowerPoint 3D).
# Re-uses the modelling helpers and the shared material palette of the Schumpeter deck.
#
#   python3 models/make_models.py              -> models/glb/*.glb   (all models)
#   python3 models/make_models.py ship candle  -> only selected models
#
# Convention (same as the Schumpeter models): Blender Z up, the viewer looks from -Y.
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "schumpeter", "models"))
import make_models as mm  # noqa: E402
from make_models import (bpy, bmesh, Vector, Matrix, TAU, M, finish, mesh_obj, lathe, box, cyl, sphere,  # noqa: E402
                         torus, tube, to_mesh, profile2d, rot_all, coin, book)

mm.OUT = os.path.join(HERE, "glb")
os.makedirs(mm.OUT, exist_ok=True)


# ------------------------------------------------------------------ extra helpers
def text_mesh(name, body, size, depth, mat, loc=(0, 0, 0), rot=(0, 0, 0), res=3, bevel=0.0):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.extrude = depth
    cu.bevel_depth = bevel
    cu.bevel_resolution = 1
    cu.resolution_u = res
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    o = mm.link(bpy.data.objects.new(name, cu))
    o.location = loc
    o.rotation_euler = rot
    return to_mesh(o, mat, 30)


def grid_surface(name, nu, nv, fn, mat, smooth=60):
    """Parametric surface: fn(u, v) -> (x, y, z), u, v in [0, 1]."""
    verts = [fn(i / nu, j / nv) for j in range(nv + 1) for i in range(nu + 1)]
    faces = []
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            faces.append((a, a + 1, a + nu + 2, a + nu + 1))
    o = mesh_obj(name, verts, faces)
    return finish(o, mat, smooth)


def extrude_profile(name, prof, x0, x1, mat, smooth=40):
    """Closed (y, z) profile extruded along X with caps."""
    n = len(prof)
    verts = [(x0, y, z) for y, z in prof] + [(x1, y, z) for y, z in prof]
    faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    faces.append(tuple(reversed(range(n))))
    faces.append(tuple(range(n, 2 * n)))
    o = mesh_obj(name, verts, faces)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data); bm.free()
    return finish(o, mat, smooth)


def xform(objs, T):
    for o in objs:
        o.matrix_world = T @ o.matrix_world


def shift_all(dx=0, dy=0, dz=0):
    for o in bpy.context.scene.objects:
        o.location.x += dx
        o.location.y += dy
        o.location.z += dz


def sail(name, corners, billow, mat="canvas", nu=10, nv=8, normal=(0, -1, 0)):
    """Bilinear quad sail between 4 corners (tl, tr, br, bl) that bellies out along `normal`."""
    tl, tr, br, bl = [Vector(c) for c in corners]
    n = Vector(normal).normalized()

    def f(u, v):
        top = tl.lerp(tr, u)
        bot = bl.lerp(br, u)
        p = top.lerp(bot, v)
        p = p + n * billow * math.sin(math.pi * u) * (0.35 + 0.65 * math.sin(math.pi * min(1, v * 0.9 + 0.1)))
        return tuple(p)
    return grid_surface(name, nu, nv, f, mat, 70)


# ------------------------------------------------------------------ models
def m_louis():
    """Gold louis d'or with '1720' — the token that rolls along the progress track."""
    r, h = 0.5, 0.035
    lathe("coin", [(0, -h), (r * 0.94, -h), (r, -h + 0.012), (r, h - 0.012), (r * 0.94, h), (r * 0.88, h),
                   (r * 0.86, h - 0.012), (0, h - 0.012)], "gold_satin", 72, 30)
    torus("rim", r * 0.91, 0.013, (0, 0, h - 0.004), "gold", seg=72, mseg=8)
    for k in range(28):
        a = TAU * k / 28
        s = sphere("bead", 0.012, (r * 0.80 * math.cos(a), r * 0.80 * math.sin(a), h - 0.012), "gold", 10, 6)
        s.scale.z = 0.6
    text_mesh("year", "1720", 0.30, 0.012, "gold", loc=(0, -0.04, h - 0.012), res=4)
    text_mesh("rc", "R · C", 0.12, 0.010, "gold", loc=(0, 0.20, h - 0.012), res=3)
    lathe("back", [(0, -h + 0.01), (r * 0.86, -h + 0.01)], "gold", 48)
    rot_all(rx=90)


def m_ship():
    """Three-masted merchant ship on a museum stand (Atlantic trade; the escape to Surinam)."""
    NX, NS = 44, 18
    t0, t1 = -0.92, 1.0
    rows = []
    verts = []
    for i in range(NX + 1):
        t = t0 + (t1 - t0) * i / NX
        x = t * 1.0
        if t >= 0:
            w = 0.26 * max(0.0, 1 - (t / 1.0) ** 2) ** 0.55
        else:
            w = 0.26 * max(0.0, 1 - (abs(t) / 1.02) ** 5) ** 0.5
        w = max(w, 0.004)
        ztop = 0.30 + 0.07 * t * t + (0.10 if t < -0.55 else 0.10 * max(0, (-t - 0.40) / 0.15) if t < -0.40 else 0)
        zbot = 0.02 + 0.10 * max(0, t - 0.55) ** 1.5 * 4 + 0.04 * max(0, -t - 0.7)
        row = []
        for j in range(NS + 1):
            th = math.pi * j / NS  # 0 = port deck edge, pi = starboard deck edge
            c, s = math.cos(th), math.sin(th)
            y = w * (abs(c) ** 0.7) * (1 if c >= 0 else -1)
            z = ztop - (ztop - zbot) * (s ** 1.6)
            row.append(len(verts))
            verts.append((x, y, z))
        rows.append(row)
    faces = []
    for A, B in zip(rows, rows[1:]):
        for j in range(NS):
            faces.append((A[j], B[j], B[j + 1], A[j + 1]))
    hull = mesh_obj("hull", verts, faces)
    bm = bmesh.new(); bm.from_mesh(hull.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(hull.data); bm.free()
    for mname in ("brass_d", "black", "walnut"):
        hull.data.materials.append(M(mname))
    for p in hull.data.polygons:
        z = p.center.z
        p.material_index = 0 if z < 0.11 else (1 if z < 0.21 else 2)
        p.use_smooth = True
    hull.data.set_sharp_from_angle(angle=math.radians(50))
    # deck + transom
    dverts = []
    for row in rows:
        dverts.append(verts[row[0]])
        dverts.append(verts[row[-1]])
    dfaces = [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(len(rows) - 1)]
    deck = mesh_obj("deck", [(x, y, z - 0.012) for x, y, z in dverts], dfaces)
    finish(deck, "brown", 40)
    tr = [verts[k] for k in rows[0]]
    transom = mesh_obj("transom", tr, [tuple(range(len(tr)))])
    finish(transom, "walnut", 0)
    # gilded sheer stripes and gun ports
    for side in (1, -1):
        pts = []
        for i in range(0, NX + 1, 2):
            x, y, z = verts[rows[i][0 if side > 0 else -1]]
            t = x
            frac = 0.38
            idx = int(round(NS * 0.18)) if side > 0 else NS - int(round(NS * 0.18))
            px, py, pz = verts[rows[i][idx]]
            pts.append((px, py + 0.004 * side, pz))
        tube("stripe", pts, 0.006, "gold", 2)
        for k in range(7):
            x = -0.55 + k * 0.17
            i = int(round((x - t0) / (t1 - t0) * NX))
            idx = int(round(NS * 0.30)) if side > 0 else NS - int(round(NS * 0.30))
            px, py, pz = verts[rows[i][idx]]
            box("port", (0.05, 0.02, 0.04), (px, py + 0.006 * side, pz), "satin", 0.004)
    # stern windows (warm light)
    for k in range(3):
        box("sternwin", (0.012, 0.05, 0.04), (t0 - 0.004, -0.08 + k * 0.08, 0.36), "window", 0.003)
    # masts, yards and sails
    masts = [(0.45, 1.25), (0.0, 1.45), (-0.48, 1.05)]
    brace = math.radians(28)
    for mx, mh in masts:
        cyl("mast", 0.02, mh, (mx, 0, 0.30 + mh / 2), "walnut", seg=16)
        cyl("top", 0.05, 0.015, (mx, 0, 0.30 + mh * 0.62), "walnut", seg=16)
        levels = [(0.30 + mh * 0.58, 0.30 + mh * 0.16, 0.30 if mx != -0.48 else 0.22),
                  (0.30 + mh * 0.95, 0.30 + mh * 0.63, 0.22 if mx != -0.48 else 0.16)]
        d = Vector((math.sin(brace), -math.cos(brace) * 0, math.cos(brace) * 0))
        for ztop_, zbot_, half in levels:
            ax = Vector((-math.sin(brace), math.cos(brace), 0))  # yard direction (mostly along Y)
            c_top = Vector((mx, 0, ztop_))
            c_bot = Vector((mx, 0, zbot_))
            yard = tube("yard", [tuple(c_top - ax * (half + 0.04)), tuple(c_top + ax * (half + 0.04))], 0.009, "walnut", 2, False)
            hb = half * 1.18
            nrm = Vector((math.cos(brace), math.sin(brace), 0)) * -1  # sails belly towards the bow side/viewer
            sail("sail", [c_top - ax * half, c_top + ax * half, c_bot + ax * hb, c_bot - ax * hb], 0.09, normal=(nrm.x, nrm.y - 0.6, 0))
    # bowsprit + jib
    tube("bowsprit", [(0.95, 0, 0.38), (1.42, 0, 0.62)], 0.014, "walnut", 2, False)
    jib = mesh_obj("jib", [(1.38, 0, 0.60), (0.47, 0, 1.40), (0.62, 0, 0.42)], [(0, 1, 2)])
    finish(jib, "canvas", 0)
    # pennant
    pts = [(0.0, 0, 1.75), (0.0, 0, 1.80)]
    pen = grid_surface("pennant", 8, 1, lambda u, v: (-0.30 * u, 0.025 * math.sin(u * 5), 1.78 + 0.035 * (1 - u) * (v - 0.5) * 2), "oxblood", 60)
    # rigging lines (simple stays)
    for (ax_, ah), (bx_, bh) in zip(masts, masts[1:]):
        tube("stay", [(ax_, 0, 0.30 + ah * 0.98), (bx_, 0, 0.30 + bh * 0.62)], 0.0028, "satin", 2, False)
    tube("forestay", [(0.45, 0, 0.30 + 1.25 * 0.98), (1.40, 0, 0.61)], 0.0028, "satin", 2, False)
    tube("backstay", [(-0.48, 0, 0.30 + 1.05 * 0.98), (-0.90, 0, 0.42)], 0.0028, "satin", 2, False)
    # museum stand
    box("standbase", (1.30, 0.34, 0.06), (0, 0, -0.20), "walnut", 0.012)
    box("standplate", (1.20, 0.26, 0.008), (0, 0, -0.166), "brass_d", 0.003)
    for x in (-0.45, 0.45):
        cyl("standpost", 0.018, 0.17, (x, 0, -0.09), "brass", seg=16)
        torus("cradle", 0.07, 0.008, (x, 0, 0.03), "brass", rot=(math.radians(90), 0, 0), seg=32, mseg=6)
    shift_all(dz=-0.55)
    rot_all(rz=0)


def m_harp():
    """Irish harp — Cantillon came from County Kerry."""
    # soundbox: tapered box along a slanted axis
    S0, S1 = Vector((-0.02, 0, 0.06)), Vector((-0.42, 0, 1.06))
    axis = (S1 - S0).normalized()
    side = Vector((axis.z, 0, -axis.x))  # in-plane perpendicular, points right/down
    N = 12
    verts, faces = [], []
    for i in range(N + 1):
        t = i / N
        c = S0.lerp(S1, t)
        hw = 0.13 * (1 - t) + 0.05 * t
        hd = 0.12 * (1 - t) + 0.05 * t
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            p = c + side * (hw * sx)
            verts.append((p.x, hd * sy, p.z))
    for i in range(N):
        a = i * 4
        for k in range(4):
            faces.append((a + k, a + (k + 1) % 4, a + 4 + (k + 1) % 4, a + 4 + k))
    faces.append((3, 2, 1, 0))
    b = N * 4
    faces.append((b, b + 1, b + 2, b + 3))
    sb = mesh_obj("soundbox", verts, faces)
    bm = bmesh.new(); bm.from_mesh(sb.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(sb.data); bm.free()
    finish(sb, "walnut", 30, 0.025, 3)
    # gold inlay line down the front of the soundbox
    tube("inlay", [tuple(S0.lerp(S1, 0.05) + Vector((0, -0.125, 0))), tuple(S0.lerp(S1, 0.95) + Vector((0, -0.055, 0)))], 0.006, "gold", 2, False)
    # neck (harmonic curve) and fore-pillar
    neck = [(-0.44, 0, 1.08), (-0.34, 0, 1.20), (-0.18, 0, 1.20), (-0.02, 0, 1.10), (0.14, 0, 1.08), (0.30, 0, 1.22), (0.40, 0, 1.30)]
    tube("neck", neck, 0.045, "walnut", 5)
    pillar = [(0.40, 0, 1.30), (0.52, 0, 1.0), (0.56, 0, 0.6), (0.50, 0, 0.25), (0.40, 0, 0.04)]
    tube("pillar", pillar, 0.042, "walnut", 5)
    for z in (0.35, 0.75, 1.1):
        # brass rings on the pillar
        tt = (1.30 - z) / 1.26
        torus("pring", 0.047, 0.008, (0.53 if 0.3 < z < 1.0 else 0.47, 0, z), "brass", rot=(0, math.radians(90 - 12), 0), seg=24, mseg=6)
    box("foot", (0.56, 0.20, 0.05), (0.19, 0, 0.025), "walnut", 0.015)
    # strings: vertical, from the soundbox up to the neck
    import numpy as np
    nx = np.array([p[0] for p in neck]); nz = np.array([p[2] for p in neck])
    for k in range(13):
        t = 0.10 + 0.80 * k / 12
        c = S0.lerp(S1, t) + side * (0.13 * (1 - t) + 0.05 * t) * 0.9
        x = c.x
        if x > 0.42:
            continue
        ztop = float(np.interp(x, nx, nz)) - 0.03
        h = ztop - c.z
        if h < 0.08:
            continue
        cyl("string", 0.0045, h, (x, 0, c.z + h / 2), "gold", seg=8)
        sphere("peg", 0.012, (x, -0.05, ztop + 0.01), "brass", 10, 6)
    # small celtic knot medallion on the soundbox
    torus("medal", 0.05, 0.008, tuple(S0.lerp(S1, 0.55) + Vector((0, -0.095, 0))), "gold", rot=(math.radians(90), 0, 0), seg=32, mseg=6)
    shift_all(dz=-0.65, dx=-0.05)


def m_chest():
    """Iron-bound strongbox: he locked his papers in one before leaving Paris."""
    W, D, H = 1.0, 0.58, 0.46
    box("body", (W, D, H), (0, 0, H / 2), "walnut", 0.015)
    R = D / 2
    prof = [(R * math.cos(math.pi * i / 24), H + R * 0.62 * math.sin(math.pi * i / 24)) for i in range(25)]
    extrude_profile("lid", prof, -W / 2, W / 2, "walnut")
    for x in (-0.34, 0.34):
        # bands around body and lid
        box("bandF", (0.06, 0.012, H), (x, -D / 2 - 0.006, H / 2), "iron", 0.004)
        box("bandB", (0.06, 0.012, H), (x, D / 2 + 0.006, H / 2), "iron", 0.004)
        box("bandBot", (0.06, D + 0.024, 0.012), (x, 0, 0.006), "iron", 0.004)
        bp = [((R + 0.012) * math.cos(math.pi * i / 24), H + (R * 0.62 + 0.012) * math.sin(math.pi * i / 24)) for i in range(25)]
        bp = bp + [(p[0] * 0.92, H + (p[1] - H) * 0.92 - 0.004) for p in reversed(bp)]
        extrude_profile("bandLid", bp, x - 0.03, x + 0.03, "iron")
        for z in (0.08, 0.23, 0.38):
            s = sphere("stud", 0.013, (x, -D / 2 - 0.013, z), "brass", 12, 6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box("corner", (0.08, 0.08, 0.08), (sx * (W / 2 - 0.03), sy * (D / 2 - 0.03), 0.04), "iron", 0.008)
    # side handles
    for sx in (-1, 1):
        torus("handle", 0.07, 0.012, (sx * (W / 2 + 0.025), 0, H * 0.62), "iron", rot=(0, math.radians(90), 0), seg=32, mseg=8)
    # lock plate + keyhole + key
    box("lockplate", (0.18, 0.016, 0.20), (0, -D / 2 - 0.01, H - 0.06), "gold", 0.006)
    box("hasp", (0.07, 0.02, 0.16), (0, -D / 2 - 0.02, H + 0.02), "brass_d", 0.006)
    cyl("keyhole", 0.016, 0.03, (0, -D / 2 - 0.02, H - 0.09), "satin", rot=(math.radians(90), 0, 0), seg=16)
    # key sticking out of the lock
    tube("keyshaft", [(0, -D / 2 - 0.03, H - 0.09), (0, -D / 2 - 0.20, H - 0.09)], 0.011, "brass", 3, False)
    torus("keybow", 0.045, 0.011, (0, -D / 2 - 0.245, H - 0.09), "brass", rot=(0, 0, 0), seg=32, mseg=8)
    xform([o for o in bpy.context.scene.objects if o.name.startswith("keybow")], Matrix.Identity(4))
    shift_all(dz=-0.38)


def m_bubble():
    """Mississippi bubble: share certificates and gold under a fragile glass bubble."""
    random.seed(7)
    for i in range(9):
        o = box("share", (0.62, 0.42, 0.007), (random.uniform(-0.02, 0.02), random.uniform(-0.02, 0.02), 0.004 + i * 0.009),
                "paper", 0.002, rot=(0, 0, random.uniform(-0.12, 0.12)))
    # red wax seal + ribbon on the top certificate
    lathe("seal", [(0, 0.10), (0.05, 0.10), (0.055, 0.092), (0.055, 0.084), (0, 0.084)], "wine", 32)
    for o in bpy.context.scene.objects:
        if o.name.startswith("seal"):
            o.location = (0.16, -0.10, 0.0)
    box("ribbon", (0.05, 0.44, 0.004), (0.16, 0, 0.088), "wine", 0.001)
    t = 0.04
    for i in range(6):
        coin("c", (-0.42 + random.uniform(-0.01, 0.01), -0.12, 0.02 + i * t), (0, 0, random.uniform(0, 6)), r=0.10, t=t)
    for i in range(3):
        coin("c2", (-0.30, 0.10, 0.02 + i * t), (0, 0, random.uniform(0, 6)), r=0.10, t=t)
    # the bubble itself
    sphere("bubble", 0.40, (0.02, 0, 0.50), "bubble", 64, 32)
    # tiny paper scroll floating inside the bubble
    cyl("scroll", 0.035, 0.34, (0.02, 0, 0.50), "paper", rot=(0, math.radians(90), math.radians(-20)), seg=24)
    for sx in (-1, 1):
        cyl("scrollend", 0.042, 0.02, (0.02 + sx * 0.16 * math.cos(math.radians(-20)), sx * 0.16 * math.sin(math.radians(-20)), 0.50),
            "brass", rot=(0, math.radians(90), math.radians(-20)), seg=24)
    box("base", (0.95, 0.62, 0.04), (0, 0, -0.025), "walnut", 0.01)
    shift_all(dz=-0.5)


def m_rook():
    """Black rook = the Bastille that John Law threatened him with."""
    prof = [(0, 0), (0.34, 0), (0.35, 0.012), (0.35, 0.06), (0.32, 0.08), (0.33, 0.10), (0.29, 0.14), (0.24, 0.16),
            (0.22, 0.20), (0.23, 0.22), (0.19, 0.25), (0.165, 0.45), (0.16, 0.68), (0.17, 0.72), (0.23, 0.76),
            (0.25, 0.80), (0.25, 0.94), (0.20, 0.94), (0.20, 0.86), (0, 0.86)]
    lathe("rook", prof, "black", 96, 40)
    n = 6
    for k in range(n):
        a = TAU * (k + 0.5) / n
        o = box("merlon", (0.11, 0.075, 0.11), (0.225 * math.cos(a), 0.225 * math.sin(a), 0.99), "black", 0.012, rot=(0, 0, a))
    torus("band1", 0.252, 0.012, (0, 0, 0.80), "gold", seg=72, mseg=8)
    torus("band2", 0.226, 0.010, (0, 0, 0.21), "gold", seg=72, mseg=8)
    torus("band3", 0.343, 0.010, (0, 0, 0.065), "gold", seg=72, mseg=8)
    # arrow-slit windows and a gate facing the viewer
    for z in (0.40, 0.58):
        box("slit", (0.03, 0.03, 0.09), (0, -0.168, z), "window", 0.006)
    # a broken chain lying next to it
    for i in range(7):
        a = i * 0.9
        torus("link", 0.04, 0.009, (0.42 + i * 0.055, -0.16 + 0.02 * math.sin(i), 0.012), "steel",
              rot=(math.radians(90) if i % 2 else 0, 0, math.radians(20)), seg=20, mseg=6)
    shift_all(dz=-0.5)


def m_quill():
    """Old book 'ESSAI', ink pot and goose quill."""
    book("essai", 0.62, 0.86, 0.13, "leather", (0, 0, 0.065), rz=math.radians(8), bands=3)
    t = text_mesh("title", "ESSAI", 0.11, 0.004, "gold", loc=(0, 0, 0.131), rot=(0, 0, math.radians(8 + 90)), res=3)
    t2 = text_mesh("year", "1755", 0.06, 0.004, "gold", loc=(0, 0, 0.131), rot=(0, 0, math.radians(8 + 90)), res=3)
    t.location = (0.10 * math.cos(math.radians(8)), 0.10 * math.sin(math.radians(8)), 0.131)
    t2.location = (-0.12 * math.cos(math.radians(8)), -0.12 * math.sin(math.radians(8)), 0.131)
    # rotate the texts so they read along the book's long side
    for o in (t, t2):
        o.rotation_euler = (0, 0, math.radians(8))
    # ink pot
    ip = (0.52, -0.05, 0.0)
    lathe("inkpot", [(0, 0), (0.13, 0), (0.15, 0.02), (0.15, 0.10), (0.12, 0.15), (0.06, 0.17), (0.06, 0.20), (0.075, 0.21),
                     (0.075, 0.23), (0.05, 0.23), (0.05, 0.19), (0, 0.19)], "ink", 64, 40, loc=ip)
    torus("collar", 0.07, 0.01, (ip[0], ip[1], 0.215), "brass", seg=32, mseg=6)
    torus("potring", 0.15, 0.009, (ip[0], ip[1], 0.06), "brass", seg=48, mseg=6)
    # quill: shaft + two vanes, standing in the ink pot and leaning back
    base = Vector((ip[0], ip[1], 0.18))
    tip_dir = Vector((-0.42, 0.25, 1.0)).normalized()
    Lq = 0.95
    pts = []
    for i in range(9):
        u = i / 8
        p = base + tip_dir * (Lq * u) + Vector((-0.06, 0.0, 0)) * (u ** 2)
        pts.append(tuple(p))
    tube("shaft", pts, 0.007, "ivory", 3)
    side = tip_dir.cross(Vector((0, -1, 0))).normalized()
    for sgn, wmax in ((1, 0.075), (-1, 0.05)):
        def vane(u, v, sgn=sgn, wmax=wmax):
            uu = 0.22 + 0.78 * u
            p = base + tip_dir * (Lq * uu) + Vector((-0.06, 0.0, 0)) * (uu ** 2)
            prof = math.sin(math.pi * min(1, (u ** 0.8))) ** 0.6 * (1 - 0.25 * u)
            notch = 0.82 if 0.38 < u < 0.42 or 0.66 < u < 0.69 else 1.0
            w = wmax * prof * notch * v
            curl = 0.03 * v * v
            q = p + side * (w * sgn) + Vector((0, -1, 0)) * curl - tip_dir * (0.05 * v)
            return tuple(q)
        grid_surface("vane", 24, 3, vane, "feather", 70)
    shift_all(dx=-0.2, dz=-0.4)


def die(name, size, loc, rot):
    o = box(name, (size, size, size), (0, 0, 0), "ivory", size * 0.14, seg=4)
    parts = [o]
    h = size / 2
    q = size * 0.26
    r = size * 0.085
    faces = {  # face normal -> pip layout
        (0, 0, 1): [(0, 0)],
        (0, 0, -1): [(-q, -q), (-q, 0), (-q, q), (q, -q), (q, 0), (q, q)],
        (0, -1, 0): [(-q, -q), (q, q)],
        (0, 1, 0): [(-q, -q), (-q, q), (q, -q), (q, q), (0, 0)],
        (1, 0, 0): [(-q, -q), (0, 0), (q, q)],
        (-1, 0, 0): [(-q, -q), (-q, q), (q, -q), (q, q)],
    }
    for n, pips in faces.items():
        nv = Vector(n)
        a = Vector((1, 0, 0)) if abs(nv.x) < 0.5 else Vector((0, 1, 0))
        b = nv.cross(a)
        for (u, v) in pips:
            c = nv * (h - r * 0.35) + a * u + b * v
            s = sphere("pip", r, tuple(c), "satin", 16, 8)
            parts.append(s)
    T = Matrix.Translation(loc) @ Matrix.Rotation(rot[2], 4, "Z") @ Matrix.Rotation(rot[1], 4, "Y") @ Matrix.Rotation(rot[0], 4, "X")
    xform(parts, T)
    return parts


def m_dice():
    """Two dice — income 'at an uncertain price'."""
    die("d1", 0.42, (-0.22, 0.05, 0.21), (0, 0, math.radians(22)))
    die("d2", 0.42, (0.30, -0.12, 0.30), (math.radians(35), math.radians(20), math.radians(-30)))
    shift_all(dz=-0.3)


def m_scales():
    """Balance: a certain price on one side, an uncertain one on the other."""
    lathe("base", [(0, 0), (0.36, 0), (0.37, 0.02), (0.34, 0.06), (0.22, 0.09), (0.12, 0.11), (0, 0.11)], "walnut", 72)
    lathe("pillar", [(0, 0.10), (0.06, 0.10), (0.05, 0.16), (0.035, 0.22), (0.03, 0.95), (0.045, 0.98), (0.03, 1.02), (0, 1.02)],
          "brass", 40)
    sphere("finial", 0.045, (0, 0, 1.12), "brass", 24, 12)
    tilt = math.radians(9)
    L = 0.62
    piv = Vector((0, 0, 1.02))
    d = Vector((math.cos(tilt), 0, -math.sin(tilt)))  # left end goes down (heavier)
    endL = piv - d * L
    endR = piv + d * L
    tube("beam", [tuple(endL), tuple(piv + Vector((0, 0, 0.03))), tuple(endR)], 0.018, "gold", 4)
    sphere("pivot", 0.04, tuple(piv), "brass", 24, 12)
    for e in (endL, endR):
        sphere("end", 0.025, tuple(e), "brass", 16, 8)
    for e, drop, name in ((endL, 0.52, "L"), (endR, 0.52, "R")):
        pan_c = e - Vector((0, 0, drop))
        lathe("pan" + name, [(0, 0.0), (0.12, 0.0), (0.20, 0.035), (0.22, 0.06), (0.215, 0.065), (0.19, 0.04), (0.11, 0.008), (0, 0.008)],
              "brass", 64, 40, loc=tuple(pan_c))
        for k in range(3):
            a = TAU * k / 3 + 0.5
            tube("chain", [tuple(e), tuple(pan_c + Vector((0.21 * math.cos(a), 0.21 * math.sin(a), 0.06)))], 0.0035, "steel", 2, False)
        if name == "L":
            for i in range(5):
                coin("coin", tuple(pan_c + Vector((0.0, 0.0, 0.03 + i * 0.03))), (0, 0, i * 1.3), r=0.09, t=0.03)
        else:
            die("pd", 0.15, tuple(pan_c + Vector((0, 0, 0.09))), (math.radians(12), math.radians(-18), math.radians(30)))
    shift_all(dz=-0.55)


def m_bread():
    """A baker's loaf: Cantillon's textbook entrepreneur buys flour at a known price."""
    random.seed(11)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=72, ring_count=40, radius=0.42)
    o = bpy.context.active_object
    o.name = "loaf"
    me = o.data
    for v in me.vertices:
        x, y, z = v.co
        z = z * 0.70 if z > 0 else z * 0.22
        r = math.hypot(x, y)
        # two crossing score lines on the crown
        g = min(abs(x * 0.92 - y * 0.39), abs(x * 0.39 + y * 0.92))
        if z > 0.10 and g < 0.018:
            z -= 0.03 * (1 - g / 0.018)
        n = 1 + 0.02 * math.sin(7 * x + 3 * y) + 0.015 * math.sin(11 * y - 5 * z)
        v.co = (x * n, y * n, z * n)
    finish(o, "crust", 0)
    o.data.materials.append(M("flour"))
    for p in me.polygons:
        x, y, z = p.center
        g = min(abs(x * 0.92 - y * 0.39), abs(x * 0.39 + y * 0.92))
        if z > 0.08 and g < 0.014:
            p.material_index = 1
        p.use_smooth = True
    o.location.z = 0.10
    # cutting board + a small roll + a scattering of flour-coloured grains
    lathe("board", [(0, 0), (0.62, 0), (0.64, 0.015), (0.64, 0.045), (0.62, 0.06), (0, 0.06)], "walnut", 72, 40, loc=(0.05, 0, -0.06))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=0.15, location=(0.44, -0.25, 0.04))
    roll = bpy.context.active_object
    roll.scale = (1.35, 0.9, 0.62)
    finish(roll, "crust", 80)
    for i in range(14):
        a = random.uniform(0, TAU)
        rr = random.uniform(0.45, 0.58)
        s = sphere("grain", 0.012, (0.05 + rr * math.cos(a), rr * math.sin(a), 0.006), "flour", 8, 4)
        s.scale = (1.8, 1, 0.6)
    shift_all(dz=-0.2)


def m_ripple():
    """A coin dropping into water: new money spreads in rings — the Cantillon effect."""
    R = 0.62
    lathe("bowl", [(0, -0.10), (R * 0.85, -0.10), (R, -0.06), (R + 0.04, 0.03), (R + 0.06, 0.05), (R + 0.04, 0.065), (R, 0.04),
                   (R * 0.86, -0.06), (0, -0.07)], "brass", 96, 40)
    NR, NA = 48, 96
    verts, faces = [(0, 0, 0.012)], []
    for i in range(1, NR + 1):
        r = R * 0.985 * i / NR
        for j in range(NA):
            a = TAU * j / NA
            z = 0.022 * math.cos(r * 34) * math.exp(-r * 3.2) + 0.004
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for j in range(NA):
        faces.append((0, 1 + j, 1 + (j + 1) % NA))
    for i in range(NR - 1):
        for j in range(NA):
            a = 1 + i * NA + j
            b = 1 + i * NA + (j + 1) % NA
            faces.append((a, a + NA, b + NA, b))
    w = mesh_obj("water", verts, faces)
    finish(w, "water", 80)
    # splash crown + the coin
    for k in range(10):
        a = TAU * k / 10
        s = sphere("drop", 0.016, (0.07 * math.cos(a), 0.07 * math.sin(a), 0.07 + 0.03 * (k % 3)), "chrome", 12, 6)
    coin("coin", (0.0, 0.0, 0.34), (math.radians(62), math.radians(12), 0), r=0.13, t=0.025)
    shift_all(dz=-0.12)


def m_compass():
    """Pocket compass: steering by judgement under uncertainty."""
    Rr, h = 0.5, 0.10
    lathe("case", [(0, -h), (Rr - 0.02, -h), (Rr, -h + 0.02), (Rr + 0.01, 0), (Rr, h - 0.01), (Rr - 0.03, h), (Rr - 0.05, h - 0.005),
                   (Rr - 0.05, 0.02), (0, 0.02)], "brass", 96, 40)
    lathe("dial", [(0, 0.021), (Rr - 0.05, 0.021)], "ivory", 72)
    for k in range(32):
        a = TAU * k / 32
        long = k % 8 == 0
        Ln = 0.07 if long else (0.045 if k % 4 == 0 else 0.03)
        rr = Rr - 0.09 - Ln / 2
        box("tick", (Ln, 0.008 if not long else 0.014, 0.003), (rr * math.cos(a), rr * math.sin(a), 0.024), "satin", 0, rot=(0, 0, a))
    torus("dialring", Rr - 0.16, 0.004, (0, 0, 0.024), "brass_d", seg=72, mseg=4)
    for txt, a in (("N", 90), ("E", 0), ("S", -90), ("W", 180)):
        rr = Rr - 0.22
        text_mesh("lt" + txt, txt, 0.07, 0.003, "ember" if txt == "N" else "satin",
                  loc=(rr * math.cos(math.radians(a)), rr * math.sin(math.radians(a)), 0.025), rot=(0, 0, math.radians(a - 90)), res=3)
    # needle (north half red)
    an = math.radians(68)
    dn = Vector((math.cos(an), math.sin(an), 0)); pn = Vector((-dn.y, dn.x, 0))
    for sgn, mat in ((1, "oxblood"), (-1, "steel")):
        tip = dn * (0.30 * sgn)
        verts = [(0, 0, 0.04), tuple(pn * 0.03 + Vector((0, 0, 0.035))), tuple(tip + Vector((0, 0, 0.035))), tuple(-pn * 0.03 + Vector((0, 0, 0.035))),
                 (0, 0, 0.03)]
        o = mesh_obj("needle", verts, [(0, 1, 2), (0, 2, 3), (4, 2, 1), (4, 3, 2)])
        finish(o, mat, 0)
    cyl("pin", 0.018, 0.03, (0, 0, 0.045), "brass", seg=16)
    lathe("glass", [(0, 0.075), (Rr - 0.04, 0.07)], "glass", 72)
    # bow and crown
    cyl("crown", 0.04, 0.08, (0, Rr + 0.04, 0), "brass", rot=(math.radians(90), 0, 0), seg=24)
    torus("bow", 0.09, 0.016, (0, Rr + 0.15, 0), "brass", rot=(0, math.radians(90), 0), seg=32, mseg=8)
    rot_all(rx=62)


def m_candle():
    """Brass chamberstick with a burning candle — the night of 14 May 1734."""
    lathe("pan", [(0, 0), (0.30, 0), (0.33, 0.015), (0.34, 0.045), (0.32, 0.05), (0.29, 0.025), (0.06, 0.02), (0, 0.02)], "brass", 80)
    lathe("socket", [(0, 0.02), (0.07, 0.02), (0.09, 0.05), (0.075, 0.08), (0.085, 0.16), (0.11, 0.18), (0.10, 0.20), (0.075, 0.19), (0, 0.19)],
          "brass", 64)
    torus("handle", 0.075, 0.016, (0.40, 0, 0.11), "brass", rot=(math.radians(90), 0, 0), seg=40, mseg=8)
    box("handlebar", (0.10, 0.03, 0.012), (0.32, 0, 0.04), "brass", 0.004)
    hc = 0.62
    prof = [(0, 0.18), (0.068, 0.18)]
    for i in range(1, 12):
        z = 0.18 + hc * i / 11
        prof.append((0.068 - 0.002 * math.sin(i), z))
    prof += [(0.062, 0.18 + hc + 0.01), (0.04, 0.18 + hc - 0.01), (0, 0.18 + hc - 0.015)]
    lathe("candle", prof, "wax", 48, 50)
    random.seed(5)
    for k in range(5):
        a = random.uniform(0, TAU)
        ln = random.uniform(0.08, 0.22)
        z0 = 0.18 + hc - 0.01
        s = sphere("drip", 0.016, (0.067 * math.cos(a), 0.067 * math.sin(a), z0 - ln / 2), "wax", 16, 10)
        s.scale = (1, 1, ln / 0.032)
    tube("wick", [(0, 0, 0.18 + hc - 0.02), (0.004, 0, 0.18 + hc + 0.04), (0.012, 0, 0.18 + hc + 0.07)], 0.004, "satin", 2)
    fz = 0.18 + hc + 0.04
    lathe("flame", [(0, fz), (0.022, fz + 0.02), (0.03, fz + 0.06), (0.024, fz + 0.11), (0.012, fz + 0.15), (0, fz + 0.19)], "flame", 32, 80)
    shift_all(dz=-0.5)


def m_globe_c():
    """Cantillon's banking map: Kerry -> Paris hub -> London, Amsterdam, Brussels, Vienna, Cadiz, Louisiana."""
    cities = {"kerry": (52.2, -9.6), "paris": (48.86, 2.35), "london": (51.5, -0.13), "amsterdam": (52.37, 4.9),
              "brussels": (50.85, 4.35), "vienna": (48.2, 16.4), "cadiz": (36.5, -6.3), "louisiana": (30.0, -90.1)}
    edges = [("kerry", "paris"), ("paris", "london"), ("paris", "amsterdam"), ("paris", "brussels"), ("paris", "vienna"),
             ("paris", "cadiz"), ("paris", "louisiana")]
    mm.m_globe(cities, edges, arc_mat="ember", pin_mat="ivory", spin=-62, arc_r=0.013, pin_r=0.026)


MODELS = {
    "louis": m_louis, "ship": m_ship, "harp": m_harp, "chest": m_chest, "bubble": m_bubble, "rook": m_rook,
    "quill": m_quill, "dice": m_dice, "scales": m_scales, "bread": m_bread, "ripple": m_ripple, "compass": m_compass,
    "candle": m_candle, "globe_c": m_globe_c,
}

if __name__ == "__main__":
    want = [a for a in sys.argv[1:] if a in MODELS] or list(MODELS)
    for key in want:
        mm.reset()
        mm._mats.clear()
        MODELS[key]()
        mm.export(key)
