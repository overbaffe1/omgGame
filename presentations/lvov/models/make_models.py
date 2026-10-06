# Procedural 3D exhibits for the Dmitry Lvov deck (Blender / bpy -> .glb for PowerPoint 3D).
# Re-uses the modelling helpers and material palette of the Schumpeter deck and the extra
# helpers (text, parametric surfaces) of the Cantillon deck.
#
#   python3 models/make_models.py                 -> models/glb/*.glb   (all models)
#   python3 models/make_models.py pumpjack tower  -> only selected models
#
# Convention: Blender Z up, the viewer looks from -Y.
import os, sys, math, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
sys.path.insert(0, os.path.join(ROOT, "schumpeter", "models"))
import make_models as mm  # noqa: E402
from make_models import (bpy, bmesh, Vector, Matrix, TAU, M, finish, mesh_obj, lathe, box, cyl, sphere,  # noqa: E402
                         torus, tube, to_mesh, profile2d, rot_all, coin, book, build_gear)
_spec = importlib.util.spec_from_file_location("cant_models", os.path.join(ROOT, "cantillon", "models", "make_models.py"))
cm = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cm)
from_cm = cm
text_mesh, grid_surface, xform, shift_all = cm.text_mesh, cm.grid_surface, cm.xform, cm.shift_all

mm.OUT = os.path.join(HERE, "glb")
os.makedirs(mm.OUT, exist_ok=True)
R90 = math.radians(90)


def setmat(o, mat):
    o.data.materials.clear()
    o.data.materials.append(M(mat))
    return o


def face_front(objs):
    """Objects modelled in the XY plane (facing +Z) -> stand them up to face the viewer (-Y)."""
    xform(objs, Matrix.Rotation(R90, 4, "X"))


# ------------------------------------------------------------------ models
def m_rub():
    """Silver jubilee-style rouble — the token that rolls along the progress track (and the finale)."""
    r, h = 0.5, 0.035
    lathe("coin", [(0, -h), (r * 0.94, -h), (r, -h + 0.012), (r, h - 0.012), (r * 0.94, h), (r * 0.88, h),
                   (r * 0.86, h - 0.012), (0, h - 0.012)], "silver", 72, 30)
    torus("rim", r * 0.91, 0.013, (0, 0, h - 0.004), "chrome", seg=72, mseg=8)
    for k in range(36):
        a = TAU * k / 36
        s = sphere("bead", 0.010, (r * 0.81 * math.cos(a), r * 0.81 * math.sin(a), h - 0.012), "chrome", 10, 6)
        s.scale.z = 0.6
    text_mesh("one", "1", 0.34, 0.014, "chrome", loc=(0, 0.07, h - 0.012), res=4)
    text_mesh("rub", "РУБЛЬ", 0.10, 0.010, "chrome", loc=(0, -0.17, h - 0.012), res=3)
    text_mesh("year", "1930", 0.065, 0.008, "chrome", loc=(0, -0.29, h - 0.012), res=3)
    # five-pointed star above the denomination
    pts = []
    for k in range(10):
        a = math.pi / 2 + k * math.pi / 5
        rr = 0.055 if k % 2 == 0 else 0.022
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    st = profile2d("star", [pts], 0.006, 0.002, "chrome", 1)
    st.location = (0, 0.32, h - 0.012)
    lathe("back", [(0, -h + 0.01), (r * 0.86, -h + 0.01)], "silver", 48)
    rot_all(rx=90)


def m_pumpjack():
    """Oil pumpjack — the face of Russian natural rent."""
    box("pad", (2.2, 0.62, 0.06), (0.05, 0, 0.03), "concrete", 0.01)
    box("skid", (1.95, 0.34, 0.07), (0.05, 0, 0.095), "iron", 0.008)
    apex = Vector((0.18, 0, 1.08))
    for y in (-0.16, 0.16):
        tube("leg", [(0.36, y, 0.13), tuple(apex)], 0.026, "red", 3, False)
        tube("brace", [(0.30, y, 0.45), (0.0, y, 0.13)], 0.014, "red", 3, False)
    tube("legb", [(-0.12, 0, 0.13), tuple(apex)], 0.024, "red", 3, False)
    box("saddle", (0.14, 0.12, 0.06), (0.18, 0, 1.10), "iron", 0.01)
    cyl("pivot", 0.035, 0.2, (0.18, 0, 1.13), "steel", rot=(R90, 0, 0), seg=24)
    # walking beam (slightly tilted: head down)
    tilt = math.radians(-6)
    beam = [box("beam", (1.55, 0.075, 0.10), (0.12, 0, 1.18), "red", 0.008)]
    beam.append(box("beamcap", (1.55, 0.11, 0.018), (0.12, 0, 1.24), "red", 0.004))
    # horse head (profile in XZ)
    c = (0.70, 1.18)
    pts = []
    for k in range(17):
        a = math.radians(-82 + k * (118 / 16))
        pts.append((c[0] + 0.40 * math.cos(a) * 0.62 + 0.08, c[1] + 0.40 * math.sin(a)))
    pts += [(0.80, 1.36), (0.74, 1.24), (0.74, 1.08), (0.80, 0.86)]
    hh = profile2d("head", [pts], 0.13, 0.012, "red", 2)
    hh.location.z = -0.065
    face_front([hh])
    beam.append(hh)
    beam.append(box("equal", (0.06, 0.46, 0.06), (-0.62, 0, 1.15), "iron", 0.008))
    xform(beam, Matrix.Translation((0.18, 0, 1.18)) @ Matrix.Rotation(tilt, 4, "Y") @ Matrix.Translation((-0.18, 0, -1.18)))
    # bridle + polished rod + wellhead
    hx = 1.08
    for y in (-0.025, 0.025):
        tube("bridle", [(hx, y, 1.02), (hx, y, 0.62)], 0.006, "steel", 3, False)
    box("carrier", (0.07, 0.10, 0.03), (hx, 0, 0.61), "iron", 0.004)
    cyl("rod", 0.012, 0.24, (hx, 0, 0.49), "chrome", seg=16)
    cyl("stuff", 0.04, 0.10, (hx, 0, 0.34), "steel", seg=24)
    cyl("tee", 0.055, 0.10, (hx, 0, 0.24), "red", seg=24)
    cyl("flow", 0.022, 0.30, (hx + 0.15, 0, 0.24), "steel", rot=(0, R90, 0), seg=16)
    torus("wheel", 0.045, 0.008, (hx + 0.24, 0, 0.30), "red", rot=(0, R90, 0), seg=24, mseg=6)
    cyl("casing", 0.07, 0.16, (hx, 0, 0.12), "iron", seg=24)
    # gearbox, crank, counterweights, pitman arms, motor
    box("gearbox", (0.30, 0.26, 0.26), (-0.50, 0, 0.29), "iron", 0.02)
    cyl("shaft", 0.03, 0.46, (-0.50, 0, 0.33), "steel", rot=(R90, 0, 0), seg=20)
    for y in (-0.20, 0.20):
        arm = profile2d("crank", [[(-0.05, -0.04), (0.05, -0.04), (0.04, 0.32), (-0.04, 0.32)]], 0.03, 0.006, "steel", 1)
        arm.location.z = -0.015
        cw = profile2d("cweight", [[(0.30 * math.cos(a), 0.30 * math.sin(a))
                                    for a in [math.radians(200 + i * 14) for i in range(11)]] + [(0.0, -0.05)]], 0.05, 0.01, "iron", 2)
        cw.location.z = -0.025
        parts = [arm, cw]
        face_front(parts)
        xform(parts, Matrix.Translation((-0.50, y, 0.33)) @ Matrix.Rotation(math.radians(35), 4, "Y"))
        pin = Vector((-0.50, y, 0.33)) + Matrix.Rotation(math.radians(35), 3, "Y") @ Vector((0, 0, 0.30))
        tube("pitman", [tuple(pin), (-0.50, y, 1.20)], 0.018, "red", 3, False)
    box("motor_base", (0.30, 0.22, 0.04), (-0.86, 0, 0.15), "iron", 0.005)
    cyl("motor", 0.09, 0.22, (-0.86, 0, 0.25), "steel", rot=(R90, 0, 0), seg=28)
    box("guard", (0.40, 0.04, 0.16), (-0.70, -0.16, 0.30), "red", 0.01)
    rot_all(rz=0)


def m_tower():
    """Kremlin tower with a ruby star — born in Moscow, 1930."""
    B = 0.74
    box("base", (B, B, 1.05), (0, 0, 0.525), "brick", 0.004)
    box("gate", (0.26, 0.02, 0.42), (0, -B / 2 - 0.004, 0.24), "black", 0.003)
    gate_top = cyl("gatearch", 0.13, 0.02, (0, -B / 2 - 0.004, 0.45), "black", rot=(R90, 0, 0), seg=24)
    for z in (0.62, 1.05):
        box("band", (B + 0.03, B + 0.03, 0.035), (0, 0, z), "whitestone", 0.004)
    # machicolation teeth
    for i in range(7):
        x = -B / 2 + 0.06 + i * (B - 0.12) / 6
        for (px, py, sx, sy) in [(x, -B / 2 - 0.01, 0.06, 0.03), (x, B / 2 + 0.01, 0.06, 0.03),
                                 (-B / 2 - 0.01, x, 0.03, 0.06), (B / 2 + 0.01, x, 0.03, 0.06)]:
            box("merlon", (sx, sy, 0.10), (px, py, 1.12), "brick", 0.004)
    T2 = 0.56
    box("t2", (T2, T2, 0.42), (0, 0, 1.33), "brick", 0.004)
    for sx in (-1, 1):
        for sy in (-1, 1):
            p = (sx * (B / 2 - 0.04), sy * (B / 2 - 0.04))
            cyl("pin", 0.045, 0.22, (p[0], p[1], 1.27), "whitestone", seg=16)
            lathe("pincone", [(0.05, 0), (0.0, 0.20)], "malachite", 16, loc=(p[0], p[1], 1.38))
            sphere("pinball", 0.018, (p[0], p[1], 1.60), "gold", 12, 6)
    box("band2", (T2 + 0.03, T2 + 0.03, 0.03), (0, 0, 1.55), "whitestone", 0.003)
    T3 = 0.46
    box("t3", (T3, T3, 0.44), (0, 0, 1.79), "brick", 0.004)
    # clock faces on four sides
    for ang in (0, 90, 180, 270):
        objs = [cyl("clock", 0.17, 0.02, (0, 0, 0), "navy", seg=48),
                torus("clockring", 0.17, 0.012, (0, 0, 0.012), "gold", seg=48, mseg=6)]
        for k in range(12):
            a = TAU * k / 12
            objs.append(box("tick", (0.012, 0.035, 0.01), (0.14 * math.cos(a), 0.14 * math.sin(a), 0.012), "gold", 0.001,
                            rot=(0, 0, a + R90)))
        objs.append(box("hour", (0.014, 0.09, 0.01), (0.0, 0.04, 0.02), "gold", 0.002))
        objs.append(box("min", (0.010, 0.13, 0.01), (0.045, -0.03, 0.025), "gold", 0.002, rot=(0, 0, math.radians(-120))))
        face_front(objs)
        xform(objs, Matrix.Rotation(math.radians(ang), 4, "Z") @ Matrix.Translation((0, -T3 / 2 - 0.012, 1.80)))
    box("band3", (T3 + 0.03, T3 + 0.03, 0.03), (0, 0, 2.02), "whitestone", 0.003)
    oct_ = cyl("oct", 0.22, 0.34, (0, 0, 2.20), "whitestone", seg=8)
    oct_.rotation_euler.z = math.radians(22.5)
    for k in range(8):
        a = TAU * k / 8 + math.radians(22.5) + TAU / 16
        box("arch", (0.06, 0.012, 0.18), (0.205 * math.cos(a), 0.205 * math.sin(a), 2.21), "brick", 0.002, rot=(0, 0, a + R90))
    tent = lathe("tent", [(0.24, 0), (0.0, 0.62)], "malachite", 8, 20, loc=(0, 0, 2.37))
    tent.rotation_euler.z = math.radians(22.5)
    for k in range(8):
        a = TAU * k / 8
        tube("rib", [(0.235 * math.cos(a), 0.235 * math.sin(a), 2.37), (0, 0, 2.99)], 0.008, "gold", 2, False)
    sphere("knob", 0.035, (0, 0, 3.0), "gold", 16, 8)
    cyl("mast", 0.012, 0.12, (0, 0, 3.08), "gold", seg=12)
    pts = []
    for k in range(10):
        a = math.pi / 2 + k * math.pi / 5
        rr = 0.16 if k % 2 == 0 else 0.066
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    st = profile2d("star", [pts], 0.035, 0.008, "star", 2)
    st.location.z = -0.0175
    rim_pts = []
    for k in range(10):
        a = math.pi / 2 + k * math.pi / 5
        rr = 0.178 if k % 2 == 0 else 0.076
        rim_pts.append((rr * math.cos(a), rr * math.sin(a)))
    rim = profile2d("starrim", [rim_pts, list(reversed(pts))], 0.03, 0.006, "gold", 1)
    rim.location.z = -0.015
    face_front([st, rim])
    xform([st, rim], Matrix.Translation((0, 0, 3.28)))


def m_caliper():
    """Vernier caliper measuring a gear — an engineer who started with the economics of machine quality."""
    objs = []
    L0, L1 = -0.85, 0.85
    objs.append(box("beam", (L1 - L0, 0.12, 0.022), (0, 0.42, 0), "satin_steel", 0.004))
    for i in range(0, 61):
        x = -0.55 + i * 0.022
        h = 0.05 if i % 10 == 0 else (0.035 if i % 5 == 0 else 0.022)
        objs.append(box("tick", (0.004, h, 0.004), (x, 0.42 + 0.06 - h / 2, 0.012), "black", 0))
    for i in range(7):
        objs.append(text_mesh("num", str(i), 0.035, 0.002, "black", loc=(-0.55 + i * 0.22, 0.395, 0.012)))
    # fixed jaw (left)
    objs.append(profile2d("fjaw", [[(-0.85, 0.36), (-0.70, 0.36), (-0.70, 0.02), (-0.79, -0.24), (-0.85, 0.0)]], 0.022, 0.004, "satin_steel", 1))
    objs.append(profile2d("fjaw_up", [[(-0.85, 0.48), (-0.77, 0.48), (-0.80, 0.62), (-0.85, 0.60)]], 0.018, 0.003, "satin_steel", 1))
    # slider with moving jaw
    sx = -0.06
    objs.append(box("slider", (0.30, 0.17, 0.05), (sx + 0.10, 0.42, 0.012), "steel", 0.008))
    objs.append(profile2d("mjaw", [[(sx - 0.05, 0.36), (sx + 0.10, 0.36), (sx + 0.06, 0.0), (sx + 0.00, -0.24), (sx - 0.05, 0.02)]], 0.022, 0.004, "satin_steel", 1))
    objs.append(profile2d("mjaw_up", [[(sx - 0.05, 0.48), (sx + 0.03, 0.48), (sx - 0.02, 0.60), (sx - 0.05, 0.62)]], 0.018, 0.003, "satin_steel", 1))
    for i in range(11):
        objs.append(box("vtick", (0.003, 0.025, 0.004), (sx + 0.02 + i * 0.0196, 0.37, 0.04), "black", 0))
    c = cyl("thumb", 0.03, 0.035, (sx + 0.12, 0.33, 0.012), "brass", seg=24)
    objs.append(c)
    objs.append(box("screw", (0.03, 0.03, 0.03), (sx + 0.22, 0.51, 0.03), "brass", 0.006))
    for o in objs:
        pass
    face_front(objs)
    # the gear held between the jaws (already modelled facing +Z -> stand it up)
    g = build_gear(teeth=18, r_tip=0.33, depth=0.05, nsp=5, mat="brass", hub_mat="brass_d")
    face_front(g)
    xform(g, Matrix.Translation((-0.405, 0.05, 0.12)))
    # small machinist's stand
    rot_all(ry=-8)


def m_mobius():
    """The CEMI 'house with an ear': a mosaic Möbius band breaking out of a concrete square."""
    S = 1.25
    box("square", (S, 0.14, S), (0, 0.10, 0), "concrete", 0.01)
    box("inset", (S - 0.16, 0.02, S - 0.16), (0, 0.025, 0), "stone", 0.004)
    box("plinth", (S + 0.3, 0.5, 0.10), (0, 0.10, -S / 2 - 0.05), "concrete", 0.01)
    mats = ["teal", "ivory", "red", "gold", "navy", "ivory", "verdigris", "red", "gold", "teal", "ivory", "navy"]
    R0, W = 0.40, 0.17
    nseg = len(mats)

    def P(u, v):
        a = TAU * u
        radial = Vector((math.cos(a), 0, math.sin(a)))
        axis = Vector((0, -1, 0))
        d = radial * math.cos(a / 2) + axis * math.sin(a / 2)
        p = radial * R0 + d * v
        return p

    band = []
    for k in range(nseg):
        u0, u1 = k / nseg, (k + 1) / nseg

        def f(i, j, u0=u0, u1=u1):
            u = u0 + (u1 - u0) * i
            v = -W + 2 * W * j
            return tuple(P(u, v))
        o = grid_surface("band", 6, 6, f, mats[k], 70)
        md = o.modifiers.new("solid", "SOLIDIFY")
        md.thickness = 0.03
        md.offset = 0
        band.append(o)
    xform(band, Matrix.Translation((0.12, -0.20, 0.02)) @ Matrix.Rotation(math.radians(-28), 4, "Z") @ Matrix.Rotation(math.radians(12), 4, "X"))


def m_books():
    """Lvov's books: 'Nravstvennaya ekonomika', 'Vernut' narodu rentu', with reading glasses."""
    book("b1", 1.05, 0.74, 0.13, "oxblood", (0, 0, 0.065), rz=4)
    book("b2", 0.95, 0.68, 0.11, "green", (0.02, 0.01, 0.185), rz=-6)
    book("b3", 0.88, 0.62, 0.09, "navy", (-0.02, -0.01, 0.285), rz=9)
    t = text_mesh("title", "НРАВСТВЕННАЯ\nЭКОНОМИКА", 0.07, 0.004, "gold", loc=(0, 0, 0.333), res=3)
    t.rotation_euler.z = math.radians(9)
    # reading glasses on top
    gl = []
    for x in (-0.13, 0.13):
        gl.append(torus("lensrim", 0.095, 0.009, (x, 0, 0), "gold", seg=40, mseg=8))
        lens = cyl("lens", 0.09, 0.004, (x, 0, 0), "glass", seg=40)
        gl.append(lens)
    gl.append(tube("bridge", [(-0.04, 0, 0.0), (0, 0, 0.03), (0.04, 0, 0.0)], 0.007, "gold", 3))
    for x in (-0.225, 0.225):
        gl.append(tube("temple", [(x, 0, 0), (x * 1.05, 0.28, -0.01), (x * 1.0, 0.36, -0.05)], 0.007, "gold", 3))
    xform(gl, Matrix.Translation((0.12, -0.12, 0.36)) @ Matrix.Rotation(math.radians(-20), 4, "Z") @ Matrix.Rotation(math.radians(8), 4, "X"))


def m_uklad():
    """Six technological 'uklady' stacked as a ziggurat (Lvov & Glazyev, 1986)."""
    mats = ["walnut", "iron", "copper", "satin", "silicon", "teal"]
    z = 0.0
    for i, m in enumerate(mats):
        r = 0.80 - i * 0.115
        h = 0.14
        lathe(f"tier{i}", [(0, z), (r - 0.012, z), (r, z + 0.012), (r, z + h - 0.012), (r - 0.012, z + h), (0, z + h)], m, 64, 30)
        torus("lip", r - 0.004, 0.006, (0, 0, z + h - 0.004), "gold", seg=64, mseg=6)
        num = text_mesh("n", str(i + 1), 0.085, 0.006, "gold", loc=(0, 0, 0), res=3)
        num.rotation_euler = (R90, 0, 0)
        num.location = (0, -r - 0.003, z + h / 2)
        z += h
    # nano "atom" on top
    sphere("core", 0.06, (0, 0, z + 0.14), "cyan", 24, 12)
    for k, (rx, ry) in enumerate([(70, 0), (70, 60), (70, -60)]):
        torus("orbit", 0.16, 0.005, (0, 0, z + 0.14), "gold", rot=(math.radians(rx), 0, math.radians(ry)), seg=56, mseg=6)
    cyl("stem", 0.012, 0.08, (0, 0, z + 0.04), "gold", seg=12)


def m_barrel():
    """Oil drum with a black drip — 'what is earned neither by labour nor by capital'."""
    H, R = 1.05, 0.38
    prof = [(0, 0), (R - 0.02, 0), (R, 0.02), (R, 0.33), (R + 0.022, 0.345), (R, 0.36), (R, 0.69), (R + 0.022, 0.705),
            (R, 0.72), (R, H - 0.02), (R - 0.02, H), (R - 0.03, H - 0.012), (0, H - 0.012)]
    lathe("drum", prof, "drum", 64, 30)
    torus("chime_t", R - 0.01, 0.016, (0, 0, H - 0.004), "steel", seg=64, mseg=8)
    torus("chime_b", R - 0.01, 0.016, (0, 0, 0.004), "steel", seg=64, mseg=8)
    for z in (0.18, 0.87):
        lathe("band", [(R + 0.001, z - 0.035), (R + 0.004, z - 0.03), (R + 0.004, z + 0.03), (R + 0.001, z + 0.035)], "gold", 64)
    cyl("bung", 0.045, 0.03, (0.18, 0.05, H), "steel", seg=24)
    cyl("bung2", 0.025, 0.025, (-0.17, -0.1, H), "steel", seg=20)
    # oil puddle on the lid + drip down the front
    lathe("puddle", [(0, H - 0.008), (0.14, H - 0.008), (0.15, H - 0.004), (0.12, H + 0.006), (0, H + 0.008)], "ink", 40, loc=(0.06, -0.12, 0))
    tube("drip", [(0.02, -R - 0.004, H - 0.01), (0.03, -R - 0.012, H - 0.12), (0.02, -R - 0.008, H - 0.30),
                  (0.025, -R - 0.006, H - 0.44)], 0.022, "ink", 5)
    sphere("drop", 0.034, (0.025, -R - 0.012, H - 0.47), "ink", 24, 12)


def m_pie():
    """3-D pie chart: rent 75 %, capital ~20 %, labour ~5 % of Russia's income growth (Lvov, 1999)."""
    parts = [(0.75, 0.26, "gold_satin"), (0.20, 0.18, "copper"), (0.05, 0.12, "ivory")]
    a0 = math.radians(-30)
    R = 0.62
    for frac, h, mat in parts:
        a1 = a0 + TAU * frac
        mid = (a0 + a1) / 2
        off = Vector((math.cos(mid), math.sin(mid), 0)) * (0.035 if frac > 0.5 else 0.09)
        n = max(6, int(72 * frac))
        pts = [(0, 0)] + [(R * math.cos(a0 + (a1 - a0) * i / n), R * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
        o = profile2d("slice", [pts], h / 2, 0.012, mat, 2)
        o.location = (off.x, off.y, h / 2)
        if frac > 0.5:
            t = text_mesh("pct", "75%", 0.20, 0.012, "ivory", loc=(off.x + 0.33 * math.cos(mid), off.y + 0.33 * math.sin(mid), h + 0.004))
            t.rotation_euler.z = math.radians(0)
        a0 = a1
    lathe("base", [(0, -0.03), (0.74, -0.03), (0.76, -0.015), (0.74, 0), (0, 0)], "walnut", 72)


def m_safe():
    """Open safe with gold bars — the national property fund and the 'national dividend'."""
    W, D, H, t = 0.90, 0.80, 1.00, 0.07
    box("back", (W, t, H), (0, D / 2 - t / 2, H / 2), "green", 0.012)
    box("left", (t, D, H), (-W / 2 + t / 2, 0, H / 2), "green", 0.012)
    box("right", (t, D, H), (W / 2 - t / 2, 0, H / 2), "green", 0.012)
    box("top", (W, D, t), (0, 0, H - t / 2), "green", 0.012)
    box("bottom", (W, D, t), (0, 0, t / 2), "green", 0.012)
    box("inner", (W - 2 * t, 0.01, H - 2 * t), (0, D / 2 - t - 0.005, H / 2), "satin", 0)
    box("shelf", (W - 2 * t, D - t, 0.025), (0, 0, 0.52), "steel", 0.003)
    for x0 in (-0.22, 0.02):
        box("feetbar", (0.1, 0.1, 0.06), (x0 * 1.6, -0.25, -0.03), "iron", 0.01)
    # gold bars on the lower floor, coins on the shelf
    def bar(loc, rz=0):
        pts = [(-0.11, -0.05), (0.11, -0.05), (0.09, 0.05), (-0.09, 0.05)]
        o = profile2d("bar", [pts], 0.02, 0.006, "gold", 1)
        face_front([o])
        o.matrix_world = Matrix.Translation(loc) @ Matrix.Rotation(math.radians(rz), 4, "Z") @ o.matrix_world
    for i, (x, z) in enumerate([(-0.18, 0.12), (0.06, 0.12), (-0.06, 0.22), (0.18, 0.22)]):
        bar((x if i < 2 else x - 0.06, -0.05, z - 0.01 + (0.0 if i < 2 else 0.0)), 0)
    for k, (x, n) in enumerate([(-0.2, 7), (-0.06, 10), (0.08, 5), (0.2, 8)]):
        for j in range(n):
            o = coin("c", (x, -0.02 + 0.01 * (k % 2), 0.55 + j * 0.022), r=0.055, t=0.02)
            setmat(o, "silver" if k % 2 else "gold")
    # open door (hinged on the left, swung ~115 degrees)
    door = [box("door", (W - 0.02, 0.10, H - 0.02), (W / 2 - 0.01, 0, 0), "green", 0.015)]
    door.append(box("doorpanel", (W - 0.16, 0.02, H - 0.16), (W / 2 - 0.01, -0.055, 0), "green", 0.01))
    door.append(torus("wheel", 0.11, 0.012, (W / 2 - 0.01, -0.09, 0.06), "chrome", rot=(R90, 0, 0), seg=40, mseg=8))
    for k in range(4):
        a = k * math.pi / 4
        door.append(cyl("spoke", 0.008, 0.22, (W / 2 - 0.01, -0.09, 0.06), "chrome", rot=(0, a, 0), seg=10))
    door.append(cyl("hubw", 0.025, 0.05, (W / 2 - 0.01, -0.08, 0.06), "chrome", rot=(R90, 0, 0), seg=20))
    door.append(cyl("dial", 0.06, 0.03, (W / 2 - 0.01, -0.08, 0.27), "satin", rot=(R90, 0, 0), seg=32))
    door.append(torus("dialring", 0.06, 0.008, (W / 2 - 0.01, -0.095, 0.27), "chrome", rot=(R90, 0, 0), seg=32, mseg=6))
    door.append(box("plate", (0.24, 0.01, 0.07), (W / 2 - 0.01, -0.07, -0.30), "gold", 0.004))
    for z in (-0.30, 0.30):
        door.append(cyl("hinge", 0.025, 0.12, (0, 0, z), "chrome", seg=16))
    xform(door, Matrix.Translation((-W / 2, -D / 2 - 0.02, H / 2)) @ Matrix.Rotation(math.radians(-115), 4, "Z"))


def m_abacus():
    """Russian schoty with the number 75 set on the beads (rent = 75 %)."""
    W, H = 1.30, 1.05
    box("top", (W, 0.07, 0.07), (0, 0, H / 2), "walnut", 0.01)
    box("bot", (W, 0.07, 0.07), (0, 0, -H / 2), "walnut", 0.01)
    box("left", (0.07, 0.07, H + 0.07), (-W / 2, 0, 0), "walnut", 0.01)
    box("right", (0.07, 0.07, H + 0.07), (W / 2, 0, 0), "walnut", 0.01)
    rows = 9
    bead_prof = [(0.0, -0.032), (0.03, -0.03), (0.046, -0.016), (0.05, 0), (0.046, 0.016), (0.03, 0.03), (0.0, 0.032)]
    counts = {0: 0, 1: 0, 2: 5, 3: 7, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0}   # row 2 = units (5), row 3 = tens (7)
    for r in range(rows):
        z = -H / 2 + 0.11 + r * (H - 0.22) / (rows - 1)
        cyl("wire", 0.006, W - 0.04, (0, 0, z), "brass", rot=(0, R90, 0), seg=10)
        n = 4 if r == 1 else 10
        left = counts.get(r, 0)
        for i in range(n):
            if i < left:
                x = -W / 2 + 0.085 + i * 0.066
            else:
                x = W / 2 - 0.085 - (n - 1 - i) * 0.066
            mat = "satin" if (n == 10 and i in (4, 5)) else ("ivory" if n == 4 else "red" if False else "walnut")
            if n == 10 and i not in (4, 5):
                mat = "ivory"
            b = lathe("bead", bead_prof, mat, 24, 60)
            b.rotation_euler = (0, R90, 0)
            b.location = (x, 0, z)
    rot_all(rx=-12)


def m_sprout():
    """A sprout growing out of a pot of coins — entrepreneurship freed from taxes on labour and capital."""
    lathe("pot", [(0, 0), (0.24, 0), (0.25, 0.01), (0.33, 0.42), (0.36, 0.43), (0.37, 0.50), (0.355, 0.51),
                  (0.33, 0.50), (0.32, 0.44), (0.30, 0.43), (0, 0.43)], "clay", 64, 30)
    lathe("soil", [(0, 0.44), (0.315, 0.44), (0.31, 0.46), (0, 0.47)], "satin", 48)
    import random
    rnd = random.Random(7)
    for k in range(14):
        a = rnd.uniform(0, TAU)
        rr = rnd.uniform(0.0, 0.24)
        o = coin("c", (rr * math.cos(a), rr * math.sin(a), 0.48 + rnd.uniform(0, 0.03)),
                 rot=(rnd.uniform(-0.5, 0.5), rnd.uniform(-0.5, 0.5), rnd.uniform(0, 3)), r=0.07, t=0.018)
        setmat(o, "silver" if k % 3 else "gold")
    stem = [(0, 0, 0.47), (0.01, 0, 0.62), (-0.02, 0, 0.78), (0.0, 0, 0.92), (0.02, 0, 1.02)]
    tube("stem", stem, 0.016, "leaf", 6)

    def leaf(name, L, Wd, base, ang, tilt, curl=0.06):
        def f(u, v):
            w = Wd * math.sin(math.pi * u) ** 0.9 * (1 - 0.25 * u)
            y = (v * 2 - 1) * w
            x = u * L
            z = curl * (v * 2 - 1) ** 2 + 0.10 * u * u
            return (x, y, z)
        o = grid_surface(name, 14, 6, f, "leaf", 80)
        md = o.modifiers.new("solid", "SOLIDIFY")
        md.thickness = 0.008
        o.matrix_world = (Matrix.Translation(base) @ Matrix.Rotation(math.radians(ang), 4, "Z")
                          @ Matrix.Rotation(math.radians(-tilt), 4, "Y"))
        return o
    leaf("leafL", 0.36, 0.11, (0.0, 0, 0.80), 180 + 15, 25)
    leaf("leafR", 0.42, 0.13, (0.01, 0, 0.90), -10, 20)
    leaf("bud", 0.16, 0.05, (0.02, 0, 1.02), 70, 55, 0.02)


def m_chip():
    """Microchip on a circuit board — innovation, the 5th and 6th technological 'uklady'."""
    box("pcb", (1.30, 1.30, 0.05), (0, 0, 0), "pcb", 0.01)
    box("chip", (0.52, 0.52, 0.09), (0, 0, 0.07), "satin", 0.012)
    box("die", (0.20, 0.20, 0.006), (0, 0, 0.118), "cyan", 0.002)
    torus("diering", 0.15, 0.006, (0, 0, 0.118), "gold", seg=4, mseg=4).rotation_euler.z = math.radians(45)
    for side in range(4):
        R = Matrix.Rotation(side * R90, 4, "Z")
        objs = []
        for i in range(10):
            p = -0.21 + i * 0.0467
            objs.append(box("pin", (0.022, 0.09, 0.012), (p, -0.30, 0.035), "chrome", 0.002))
            # gold traces running to the board edge, with a bend
            bend = -0.42 - 0.02 * abs(i - 4.5)
            objs.append(tube("trace", [(p, -0.34, 0.03), (p, bend, 0.03), (p * 1.45, -0.60, 0.03)], 0.006, "gold", 2, False))
            objs.append(cyl("via", 0.014, 0.012, (p * 1.45, -0.60, 0.03), "gold", seg=12))
        xform(objs, R)
    for (x, y) in [(0.45, 0.45), (-0.47, 0.42), (0.44, -0.47)]:
        cyl("cap", 0.05, 0.12, (x, y, 0.085), "navy", seg=24)
        cyl("capt", 0.05, 0.004, (x, y, 0.147), "steel", seg=24)
    box("res", (0.12, 0.04, 0.03), (-0.45, -0.46, 0.04), "satin", 0.005)
    rot_all(rz=8)


def m_mic():
    """Broadcast microphone — the academician who argued on TV and in newspapers."""
    lathe("base", [(0, 0), (0.30, 0), (0.31, 0.012), (0.29, 0.05), (0.16, 0.07), (0.06, 0.08), (0, 0.08)], "satin", 64, 30)
    torus("baser", 0.295, 0.01, (0, 0, 0.03), "chrome", seg=64, mseg=8)
    cyl("stem", 0.025, 0.55, (0, 0, 0.35), "chrome", seg=24)
    cyl("collar", 0.04, 0.06, (0, 0, 0.62), "chrome", seg=24)
    tube("yoke", [(-0.20, 0, 0.92), (-0.20, 0, 0.70), (-0.12, 0, 0.64), (0.12, 0, 0.64), (0.20, 0, 0.70), (0.20, 0, 0.92)],
         0.016, "chrome", 4)
    for x in (-0.20, 0.20):
        cyl("knob", 0.03, 0.04, (x, 0, 0.92), "satin", rot=(0, R90, 0), seg=20)
    # capsule: pill-shaped body with grille rings
    cap = lathe("caps", [(0, -0.22), (0.07, -0.21), (0.13, -0.17), (0.16, -0.10), (0.165, 0), (0.16, 0.10), (0.13, 0.17),
                         (0.07, 0.21), (0, 0.22)], "chrome", 48, 50, loc=(0, 0, 0.92))
    cap.rotation_euler = (0, 0, 0)
    for z in [-0.14 + i * 0.028 for i in range(11)]:
        rr = math.sqrt(max(0.0, 0.165 ** 2 * (1 - (z / 0.225) ** 2))) + 0.002
        torus("grill", rr, 0.004, (0, 0, 0.92 + z), "satin", seg=48, mseg=4)
    box("badge", (0.12, 0.012, 0.05), (0, -0.165, 0.92), "gold", 0.004)
    tube("cable", [(0, 0.03, 0.08), (0.1, 0.32, 0.02), (0.35, 0.42, 0.01), (0.6, 0.30, 0.01)], 0.012, "rubber", 5)


MODELS = {
    "rub": m_rub, "pumpjack": m_pumpjack, "tower": m_tower, "caliper": m_caliper, "mobius": m_mobius,
    "books": m_books, "uklad": m_uklad, "barrel": m_barrel, "pie": m_pie, "safe": m_safe, "abacus": m_abacus,
    "sprout": m_sprout, "chip": m_chip, "mic": m_mic,
}

if __name__ == "__main__":
    want = [a for a in sys.argv[1:] if a in MODELS] or list(MODELS)
    for key in want:
        mm.reset()
        mm._mats.clear()
        MODELS[key]()
        mm.export(key)
