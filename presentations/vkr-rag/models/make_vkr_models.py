# Procedural, skinned-animated 3D objects for the VKR (RAG / PskovGU) deck — light "tech" palette.
# Re-uses the modelling helpers of ../../schumpeter/models and the bone rig of ../../cantillon/models.
#
#   LD_LIBRARY_PATH=/tmp/bstub python3 models/make_vkr_models.py            -> models/glb/*.glb (all)
#   LD_LIBRARY_PATH=/tmp/bstub python3 models/make_vkr_models.py gpu gauge  -> only selected
#
# Convention: Blender Z up, the viewer looks from -Y. Every model is built in its max-extent pose and
# anim(0) == rest pose, so the poster frame / PowerPoint bounds are never exceeded during the loop.
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "schumpeter", "models"))
sys.path.insert(1, os.path.join(HERE, "..", "..", "cantillon", "models"))
import make_models as mm  # noqa: E402
from make_models import (bpy, bmesh, Vector, Matrix, TAU, finish, mesh_obj, lathe, box, cyl, sphere,  # noqa: E402
                         torus, tube, to_mesh, profile2d, build_gear)
from rig import Rig, export_rigged, clamp01, smooth, ease, pulse, back_out, hop, wave  # noqa: E402

import rig as _rigmod  # noqa: E402
_orig_shift = _rigmod.mm_shift_all


def _shift_and_update(dx, dy, dz):
    # location edits do not refresh matrix_world until the view layer updates; rot_all() reads matrix_world
    _orig_shift(dx, dy, dz)
    bpy.context.view_layer.update()


_rigmod.mm_shift_all = _shift_and_update
mm.OUT = os.path.join(HERE, "glb")
os.makedirs(mm.OUT, exist_ok=True)

# ------------------------------------------------------------------ light tech palette
P2 = {
    "w_plastic": ((0.80, 0.82, 0.86), 0.00, 0.32, {"coat": 0.4}),
    "paperw":    ((0.88, 0.88, 0.86), 0.00, 0.70, {}),
    "indigo":    ((0.10, 0.13, 0.80), 0.00, 0.28, {"coat": 0.6}),
    "indigo_d":  ((0.035, 0.045, 0.28), 0.10, 0.35, {"coat": 0.4}),
    "sky":       ((0.30, 0.45, 1.00), 0.00, 0.18, {"coat": 0.8}),
    "mint":      ((0.03, 0.55, 0.28), 0.00, 0.30, {"coat": 0.5}),
    "amber":     ((0.90, 0.38, 0.02), 0.00, 0.30, {"coat": 0.5}),
    "coral":     ((0.85, 0.12, 0.12), 0.00, 0.32, {"coat": 0.5}),
    "graphite":  ((0.035, 0.040, 0.050), 0.20, 0.38, {"coat": 0.4}),
    "lightgrey": ((0.42, 0.44, 0.50), 0.00, 0.45, {}),
    "lineg":     ((0.30, 0.32, 0.38), 0.00, 0.60, {}),
    "glowmint":  ((0.20, 0.90, 0.60), 0.00, 0.40, {"emit": (0.2, 0.95, 0.6), "es": 3.0}),
    "glowind":   ((0.35, 0.42, 1.00), 0.00, 0.40, {"emit": (0.35, 0.45, 1.0), "es": 3.0}),
    "steel":     ((0.78, 0.79, 0.81), 1.00, 0.30, {}),  # override: polished steel renders black
}
_orig_M = mm.M


def M2(name):
    if name not in P2:
        return _orig_M(name)
    if name in mm._mats and mm._mats[name].name in bpy.data.materials:
        return mm._mats[name]
    col, met, rough, ex = P2[name]
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Metallic"].default_value = met
    b.inputs["Roughness"].default_value = rough
    if "coat" in ex:
        b.inputs["Coat Weight"].default_value = ex["coat"]
    if "emit" in ex:
        b.inputs["Emission Color"].default_value = (*ex["emit"], 1)
        b.inputs["Emission Strength"].default_value = ex["es"]
    mm._mats[name] = m
    return m


mm.M = M2


# ------------------------------------------------------------------ helpers
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


def xform(objs, T):
    for o in objs:
        o.matrix_world = T @ o.matrix_world


def new_since(mark):
    return [o for o in bpy.context.scene.objects if o not in mark]


def rrect(w, h, r, n=8, cx=0.0, cy=0.0):
    """Rounded rectangle outline, CCW, starting at the right edge."""
    pts = []
    for sx, sy, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        ccx, ccy = cx + sx * (w / 2 - r), cy + sy * (h / 2 - r)
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((ccx + r * math.cos(a), ccy + r * math.sin(a)))
    return pts


def bubble_outline(w, h, r, tail, n=8):
    """Speech bubble: rounded rect with a tail inserted into the bottom edge.
    tail = (x_left, x_right, tip_x, tip_y) in local coordinates."""
    pts = rrect(w, h, r, n)
    k = 3 * (n + 1)  # first point of the bottom-right corner
    xl, xr, tx, ty = tail
    return pts[:k] + [(xl, -h / 2), (tx, ty), (xr, -h / 2)] + pts[k:]


def star4(r_out, r_in):
    pts = []
    for i in range(8):
        a = TAU * i / 8 + math.pi / 2
        r = r_out if i % 2 == 0 else r_in
        pts.append((r * math.cos(a), r * math.sin(a)))
    return pts


# ================================================================== 1. chat — assistant is typing
def m_chat():
    rig = Rig()
    # question bubble (behind, mint) with a "?"
    m = rig.mark()
    qc = Vector((0.78, 0.66, -0.32))
    q = profile2d("qbubble", [bubble_outline(0.78, 0.54, 0.2, (0.0, 0.15, 0.24, -0.42))], 0.06, 0.03, "mint")
    q.location = qc
    text_mesh("qmark", "?", 0.38, 0.02, "w_plastic", loc=(qc.x - 0.01, qc.y + 0.01, qc.z + 0.1))
    rig.take(m, "q", head=tuple(qc))
    # main bubble (indigo) with three typing dots
    m = rig.mark()
    profile2d("bubble", [bubble_outline(1.7, 1.0, 0.32, (-0.46, -0.16, -0.64, -0.84))], 0.09, 0.04, "indigo")
    # thin highlight frame on the face
    rig.take(m, "main", head=(0, 0, 0))
    for i, x in enumerate((-0.4, 0.0, 0.4)):
        m = rig.mark()
        sphere(f"dot{i}", 0.11, (x, -0.02, 0.13), "w_plastic", 32, 16)
        rig.take(m, f"d{i}", head=(x, -0.02, 0.13), parent="main")
    # sparkle
    m = rig.mark()
    st = profile2d("spark", [star4(0.17, 0.05)], 0.02, 0.012, "amber")
    st.location = (-0.98, 0.74, 0.05)
    s2 = profile2d("spark2", [star4(0.08, 0.025)], 0.015, 0.008, "amber")
    s2.location = (-0.72, 0.95, 0.0)
    rig.take(m, "spark", head=(-0.98, 0.74, 0.05))
    rig.rotate(rx=90)

    def anim(t):
        p = {"main": {"rot": [((0, 0, 1), 2.5 * wave(t, 1, 0.0) * 1.0)], "loc": (0, -0.035 * (1 - math.cos(TAU * t)) / 2, 0)},
             "q": {"rot": [((0, 0, 1), -4 * wave(t, 1, 0.1))], "loc": (0, -0.05 * (1 - math.cos(TAU * (t + 0.0))) / 2, 0)},
             "spark": {"rot": [((0, 0, 1), -90 * t)], "scale": 0.62 + 0.38 * (0.5 + 0.5 * math.cos(TAU * 2 * t))}}
        for i in range(3):
            u = (2 * t - i * 0.13) % 1.0
            h = hop(u / 0.32) if u < 0.32 else 0.0
            p[f"d{i}"] = {"loc": (0, 0.16 * h, 0), "scale": (1 - 0.08 * h, 1 + 0.12 * h, 1)}
        return p
    return rig, anim, 3.0


# ================================================================== 2. search — magnifier finds a fragment
def m_search():
    rig = Rig()
    sheets = [(-0.18, 0.06, -14, 0.00), (0.12, -0.02, 9, 0.016), (0.0, 0.0, -2, 0.032)]
    for k, (sx, sy, rz, z) in enumerate(sheets):
        m = rig.mark()
        box(f"sheet{k}", (0.86, 1.12, 0.012), (0, 0, 0), "paperw", 0.003)
        if k == 2:
            box("hdr", (0.5, 0.07, 0.006), (-0.1, 0.43, 0.008), "indigo", 0.002)
            for i in range(10):
                y = 0.3 - i * 0.075
                if i == 5:
                    continue
                w = 0.66 if i % 4 != 3 else 0.42
                box(f"ln{i}", (w, 0.022, 0.005), (-0.33 + w / 2, y, 0.008), "lineg", 0.002)
        else:
            for i in range(8):
                box(f"l{k}{i}", (0.6, 0.02, 0.004), (0.0, 0.32 - i * 0.09, 0.008), "lightgrey", 0.002)
        xform(new_since(m), Matrix.Translation((sx, sy, z)) @ Matrix.Rotation(math.radians(rz), 4, "Z"))
    # the found line (highlighted) on the top sheet
    T2 = Matrix.Translation((0.0, 0.0, 0.032)) @ Matrix.Rotation(math.radians(-2), 4, "Z")
    hl_c = T2 @ Vector((0.0, 0.3 - 5 * 0.075, 0.009))
    m = rig.mark()
    box("hl", (0.68, 0.045, 0.008), (0, 0, 0), "amber", 0.003)
    xform(new_since(m), Matrix.Translation(hl_c) @ Matrix.Rotation(math.radians(-2), 4, "Z"))
    rig.take(m, "hl", head=tuple(hl_c))
    # the extracted chunk card floats above the line (rest = highest point)
    ch_c = hl_c + Vector((0.05, -0.05, 0.62))
    m = rig.mark()
    profile2d("chunk", [rrect(0.46, 0.2, 0.05)], 0.012, 0.01, "indigo")
    for i, w in enumerate((0.3, 0.22)):
        box(f"cl{i}", (w, 0.025, 0.006), (-0.17 + w / 2, 0.035 - i * 0.065, 0.025), "w_plastic", 0.002)
    xform(new_since(m), Matrix.Translation(ch_c) @ Matrix.Rotation(math.radians(62), 4, "X"))
    rig.take(m, "chunk", head=tuple(ch_c))
    # magnifier, hovering and circling over the page
    mc = Vector((0.12, 0.12, 0.30))
    m = rig.mark()
    torus("rim", 0.19, 0.026, (0, 0, 0), "indigo", seg=64, mseg=12)
    cyl("lens", 0.18, 0.012, (0, 0, 0), "glass", seg=48)
    tube("neck", [(0.205, -0.0, 0), (0.27, -0.0, 0)], 0.022, "graphite", 3, False)
    lathe("grip", [(0, 0), (0.032, 0), (0.036, 0.04), (0.034, 0.24), (0.03, 0.27), (0, 0.27)], "graphite", 24)
    g = [o for o in bpy.context.scene.objects if o.name.startswith("grip")][-1]
    g.matrix_world = Matrix.Translation((0.27, 0, 0)) @ Matrix.Rotation(math.radians(90), 4, "Y")
    xform(new_since(m), Matrix.Translation(mc) @ Matrix.Rotation(math.radians(-35), 4, "Z") @ Matrix.Rotation(math.radians(-20), 4, "X"))
    rig.take(m, "mag", head=tuple(mc))
    rig.shift(dz=-0.2)

    def path(t):
        return Vector((0.14 * math.cos(TAU * t), 0.2 * math.sin(TAU * t) - 0.0, 0))

    def anim(t):
        d = path(t) - path(0)
        # the lens passes over the highlighted line around t ~ 0.70; the line flashes
        near = pulse(t, 0.62, 0.70, 0.80, 0.88)
        u = (t + 0.15) % 1.0  # chunk cycle: dives into the line and pops back out
        dive = pulse(u, 0.55, 0.68, 0.78, 0.95)
        return {"mag": {"loc": tuple(d), "rot": [((1, 0, 0), 6 * wave(t, 1, 0.25)), ((0, 1, 0), 5 * wave(t, 1, 0.0))]},
                "hl": {"scale": (1 + 0.04 * near, 1 + 0.5 * near, 1 + 1.0 * near)},
                "chunk": {"loc": (0, 0, -0.55 * dive), "scale": 1 - 0.75 * dive,
                          "rot": [((0, 0, 1), 10 * wave(t, 1, 0.0))]}}
    return rig, anim, 4.5


# ================================================================== 3. target — the arrow hits the goal
def m_target():
    rig = Rig()
    m = rig.mark()
    cyl("board", 0.74, 0.12, (0, 0, -0.02), "w_plastic", seg=96)
    torus("edge", 0.74, 0.035, (0, 0, -0.02), "graphite", seg=96, mseg=12)
    for i, (r, mat) in enumerate(((0.66, "indigo"), (0.53, "w_plastic"), (0.40, "indigo"), (0.27, "w_plastic"), (0.14, "coral"))):
        cyl(f"ring{i}", r, 0.01, (0, 0, 0.045 + 0.003 * i), mat, seg=96)
    # easel legs (board plane = XY, front = +Z, up = +Y before the final rotation)
    tube("legL", [(-0.25, -0.3, -0.09), (-0.55, -1.25, 0.12)], 0.026, "graphite", 3, False)
    tube("legR", [(0.25, -0.3, -0.09), (0.55, -1.25, 0.12)], 0.026, "graphite", 3, False)
    tube("legB", [(0, 0.1, -0.09), (0, -1.25, -0.6)], 0.026, "graphite", 3, False)
    rig.take(m, "board", head=(0, -0.3, -0.09))
    # arrow: built where it starts its flight (max extent); tip hits at `hit`
    hit = Vector((0.07, 0.09, 0.06))
    d = Vector((0.9, 0.32, 0.55)).normalized()
    FLY = 0.95
    tip0 = hit + d * FLY
    m = rig.mark()
    Ls = 0.95
    tube("shaft", [tuple(tip0 + d * 0.06), tuple(tip0 + d * Ls)], 0.024, "graphite", 3, False)
    tip = lathe("tip", [(0, 0), (0.045, 0.11), (0.03, 0.12), (0, 0.12)], "graphite", 24)
    q = d.to_track_quat("Z", "Y")
    tip.matrix_world = Matrix.Translation(tip0) @ q.to_matrix().to_4x4()
    for k in range(3):
        a = TAU * k / 3
        fin = profile2d(f"fin{k}", [[(0, 0), (0.1, 0.06), (0.1, 0.27), (0, 0.23)]], 0.005, 0.003, "coral" if k else "amber")
        fin.matrix_world = (Matrix.Translation(tip0) @ q.to_matrix().to_4x4() @ Matrix.Rotation(a, 4, "Z")
                            @ Matrix.Translation((0.016, 0, Ls - 0.3)) @ Matrix.Rotation(math.radians(90), 4, "X"))
    rig.take(m, "arrow", head=tuple(tip0))
    rig.rotate(rx=90)
    t_hit = 0.24

    def anim(t):
        fly = clamp01((t - 0.06) / (t_hit - 0.06)) ** 2 if t < 0.88 else 0.0
        if t >= t_hit and t < 0.88:
            fly = 1.0
        sc = 1.0 - ease(t, 0.76, 0.84) + ease(t, 0.89, 1.0)
        sc = max(0.0, min(1.0, sc))
        w = 0.0
        if t_hit <= t < 0.76:
            x = t - t_hit
            w = 9.0 * math.exp(-x / 0.09) * math.sin(TAU * 13 * x)
        kick = 0.0
        if t_hit <= t < 0.6:
            x = t - t_hit
            kick = 3.0 * math.exp(-x / 0.06) * math.sin(TAU * 7 * x)
        return {"arrow": {"loc": tuple(-d * FLY * fly), "rot": [((1, 0, 0), w), ((0, 1, 0), -0.6 * w)], "scale": max(0.001, sc)},
                "board": {"rot": [((1, 0, 0), kick)]}}
    return rig, anim, 4.0


# ================================================================== 4. stakeholders around the system
def figure(rig, name, at, face_deg, col, acc, S=1.0):
    m = rig.mark()
    lathe(name + "_body", [(0, 0), (0.16, 0), (0.165, 0.03), (0.15, 0.12), (0.125, 0.30), (0.10, 0.36), (0.055, 0.40), (0, 0.405)], col, 48)
    sphere(name + "_head", 0.105, (0, 0, 0.52), "w_plastic", 32, 16)
    if acc == "cap":
        lathe(name + "_cap", [(0, 0.57), (0.085, 0.57), (0.09, 0.62), (0, 0.625)], "graphite", 32)
        box(name + "_board", (0.26, 0.26, 0.018), (0, 0, 0.63), "graphite", 0.004, rot=(0, 0, math.radians(45)))
        tube(name + "_tas", [(0, 0, 0.64), (0.12, -0.06, 0.64), (0.14, -0.07, 0.56)], 0.007, "amber", 3)
    elif acc == "glasses":
        for sx in (-1, 1):
            torus(name + "_gl", 0.03, 0.006, (sx * 0.04, -0.1, 0.53), "graphite", rot=(math.radians(90), 0, 0), seg=24, mseg=6)
        box(name + "_bk", (0.16, 0.05, 0.2), (0.0, -0.17, 0.24), "indigo", 0.01, rot=(math.radians(-10), 0, 0))
    elif acc == "doc":
        box(name + "_doc", (0.15, 0.012, 0.2), (0.05, -0.18, 0.26), "paperw", 0.003, rot=(math.radians(-12), 0, math.radians(-10)))
        box(name + "_docl", (0.09, 0.004, 0.012), (0.05, -0.19, 0.3), "indigo", 0.001, rot=(math.radians(-12), 0, math.radians(-10)))
    elif acc == "laptop":
        box(name + "_lb", (0.24, 0.16, 0.014), (0, -0.21, 0.2), "steel", 0.004)
        box(name + "_ls", (0.24, 0.012, 0.15), (0, -0.14, 0.28), "steel", 0.004, rot=(math.radians(-12), 0, 0))
        box(name + "_lsc", (0.2, 0.004, 0.11), (0, -0.15, 0.28), "glowind", 0.002, rot=(math.radians(-12), 0, 0))
    xform(new_since(m), Matrix.Translation(at) @ Matrix.Rotation(math.radians(face_deg), 4, "Z") @ Matrix.Scale(S, 4))
    rig.take(m, name, head=tuple(at))


def m_people():
    rig = Rig()
    lathe("platform", [(0, 0), (1.22, 0), (1.25, 0.02), (1.25, 0.05), (1.22, 0.065), (0, 0.065)], "w_plastic", 96)
    torus("pring", 1.235, 0.012, (0, 0, 0.045), "indigo", seg=96, mseg=8)
    torus("pring2", 0.55, 0.008, (0, 0.2, 0.068), "lightgrey", seg=72, mseg=6)
    # the system: a floating rounded cube with "RAG"
    cc = Vector((0, 0.25, 1.2))
    m = rig.mark()
    box("cube", (0.6, 0.6, 0.6), tuple(cc), "indigo", 0.09, seg=4)
    text_mesh("rag", "RAG", 0.17, 0.012, "w_plastic", loc=(cc.x, cc.y - 0.305, cc.z), rot=(math.radians(90), 0, 0))
    for sx in (-1, 1):
        box("seam", (0.012, 0.006, 0.4), (cc.x + sx * 0.22, cc.y - 0.302, cc.z), "glowmint", 0.002)
    rig.take(m, "cube", head=tuple(cc))
    sphere("pedestal_glow", 0.07, (0, 0.2, 0.07), "glowmint", 32, 16).scale.z = 0.25
    figs = [("stud", -150, "mint", "cap"), ("teach", -112, "amber", "glasses"), ("abit", -68, "coral", "doc"), ("admin", -30, "graphite", "laptop")]
    heads = []
    S = 1.3
    for name, ang, col, acc in figs:
        a = math.radians(ang)
        at = Vector((0.86 * math.cos(a), 0.86 * math.sin(a) + 0.1, 0.065))
        face = math.degrees(math.atan2(cc.y - at.y, cc.x - at.x)) + 90  # front (-Y) towards the cube...
        face = (face + 180) % 360 - 180
        face = 0.35 * face  # ...but mostly towards the viewer
        figure(rig, name, at, face, col, acc, S)
        heads.append(at + Vector((0, 0, 0.52 * S)))
        # a "question" packet that travels from the figure to the system (rest: at the head)
        m = rig.mark()
        sphere(name + "_pk", 0.055, tuple(at + Vector((0, 0, 0.72 * S))), "glowind", 24, 12)
        rig.take(m, name + "_pk", head=tuple(at + Vector((0, 0, 0.72 * S))))
    rig.shift(dz=-0.55)
    starts = [h + Vector((0, 0, 0.2 * S)) for h in heads]

    def anim(t):
        p = {"cube": {"rot": [((0, 0, 1), 18 * wave(t, 1, 0.0))], "loc": (0, 0, -0.05 * (1 - math.cos(TAU * t)) / 2)}}
        for i, (name, *_r) in enumerate(figs):
            t0 = 0.04 + 0.24 * i
            u = (t - t0) % 1.0
            h = hop(u / 0.14) if u < 0.14 else 0.0
            sq = pulse(u, 0.13, 0.15, 0.15, 0.2) if u < 0.2 else 0.0
            p[name] = {"loc": (0, 0, 0.17 * h), "scale": (1 + 0.06 * sq, 1 + 0.06 * sq, 1 - 0.1 * sq)}
            # packet: appears at the top of the hop, flies in an arc into the cube, vanishes
            v = (u - 0.07) / 0.3
            if 0 <= v <= 1:
                target = cc - starts[i]
                arc = Vector((0, 0, 0.25 * math.sin(math.pi * v)))
                loc = target * smooth(v) + arc + Vector((0, 0, 0.17 * h))
                s = min(1.0, v / 0.12) * (1 - ease(v, 0.85, 1.0))
            else:
                loc, s = Vector((0, 0, 0)), 0.0
            p[name + "_pk"] = {"loc": tuple(loc), "scale": max(0.001, s)}
        return p
    return rig, anim, 5.0


# ================================================================== 5. gears — the system's parts work together
def m_gears():
    rig = Rig()
    specs = [  # teeth, r_tip, spokes, colour
        (20, 0.62, 5, "indigo"), (12, 0.372, 3, "amber"), (16, 0.496, 4, "mint")]
    pr = lambda r: 0.935 * r
    c1 = Vector((-0.35, -0.12, 0))
    a12 = math.radians(18)
    c2 = c1 + Vector((math.cos(a12), math.sin(a12), 0)) * (pr(0.62) + pr(0.372))
    a23 = math.radians(112)
    c3 = c2 + Vector((math.cos(a23), math.sin(a23), 0)) * (pr(0.372) + pr(0.496))
    cs = [c1, c2, c3]
    p = [TAU / s[0] for s in specs]
    # phases so that teeth interleave on the centre lines
    ph = [0.0, 0.0, 0.0]
    ph[0] = a12 - 0.335 * p[0]
    ph[1] = (a12 + math.pi) - 0.835 * p[1]
    # gear 2 tooth towards gear 3 given its phase: tooth angle = ph1 + (i+0.335)p1 ; pick nearest to a23
    f2 = ((a23 - ph[1]) / p[1]) % 1.0          # gear-2 feature facing gear 3 (0.335 = tooth centre)
    ph[2] = (a23 + math.pi) - p[2] * ((1.17 - f2) % 1.0)   # mirrored feature on gear 3
    for k, ((n, r, nsp, col), c) in enumerate(zip(specs, cs)):
        m = rig.mark()
        parts = build_gear(teeth=n, r_tip=r, depth=0.06, nsp=nsp, mat=col, hub_mat="steel", rivets=False)
        xform(parts, Matrix.Translation(c) @ Matrix.Rotation(ph[k], 4, "Z"))
        rig.take(m, f"g{k}", head=tuple(c))
    rig.shift(dx=-(c1.x + c2.x + c3.x) / 3 + 0.05, dy=-(c1.y + c3.y) / 2 + 0.08)
    rig.rotate(rx=90)
    k = 8  # teeth per loop: seamless for every gear's spoke symmetry
    angs = [-360 * k / specs[0][0], 360 * k / specs[1][0], -360 * k / specs[2][0]]

    def anim(t):
        return {f"g{j}": {"rot": [((0, 0, 1), angs[j] * t)]} for j in range(3)}
    return rig, anim, 6.0


# ================================================================== 6. gpu — RTX 3060, fans spinning
def fan(rig, name, c, r=0.25, nb=9):
    torus(name + "_ring", r + 0.006, 0.018, tuple(c + Vector((0, -0.088, 0))), "steel", rot=(math.radians(90), 0, 0), seg=72, mseg=8)
    cyl(name + "_well", r, 0.012, tuple(c + Vector((0, -0.074, 0))), "satin", rot=(math.radians(90), 0, 0), seg=64)
    m = rig.mark()
    cyl(name + "_hub", 0.075, 0.04, tuple(c + Vector((0, -0.095, 0))), "graphite", rot=(math.radians(90), 0, 0), seg=40)
    cyl(name + "_logo", 0.055, 0.006, tuple(c + Vector((0, -0.117, 0))), "indigo", rot=(math.radians(90), 0, 0), seg=40)
    for b in range(nb):
        a = TAU * b / nb
        bl = box(name + f"_bl{b}", (0.17, 0.008, 0.075), (0, 0, 0), "lightgrey", 0.003, rot=(math.radians(28), 0, 0))
        bl.matrix_world = (Matrix.Translation(c + Vector((0, -0.092, 0))) @ Matrix.Rotation(a, 4, "Y")
                           @ Matrix.Translation((0.075 + 0.085, 0, 0)) @ bl.matrix_world)
    rig.take(m, name, head=tuple(c + Vector((0, -0.092, 0))))


def m_gpu():
    rig = Rig()
    box("shroud", (1.72, 0.17, 0.7), (0, 0, 0), "graphite", 0.035, seg=3)
    box("acc_t", (1.5, 0.012, 0.03), (0.05, -0.088, 0.3), "indigo", 0.004)
    box("acc_b", (0.5, 0.012, 0.02), (0.55, -0.088, -0.31), "glowmint", 0.003)
    text_mesh("brand", "RTX 3060", 0.055, 0.004, "w_plastic", loc=(-0.45, -0.088, -0.305), rot=(math.radians(90), 0, 0))
    box("backplate", (1.68, 0.02, 0.66), (0.01, 0.1, 0), "steel", 0.006)
    box("pcb", (1.62, 0.02, 0.12), (0.0, 0.06, -0.36), "pcb", 0.003)
    box("fingers", (0.6, 0.024, 0.06), (-0.18, 0.06, -0.43), "gold", 0.002)
    box("bracket", (0.025, 0.3, 0.8), (-0.88, 0.02, -0.02), "steel", 0.004)
    for i in range(3):
        box(f"port{i}", (0.03, 0.12, 0.07), (-0.9, 0.02, 0.2 - i * 0.14), "satin", 0.004)
    box("power", (0.16, 0.07, 0.06), (0.55, 0.03, 0.38), "satin", 0.006)
    for x in (-0.42, 0.42):
        fan(rig, "fanL" if x < 0 else "fanR", Vector((x, 0, 0.0)))
    rig.rotate(rx=0)

    def anim(t):
        return {"fanL": {"rot": [((0, 1, 0), 360 * 3 * t)]}, "fanR": {"rot": [((0, 1, 0), 360 * 3 * t)]}}
    return rig, anim, 2.0


# ================================================================== 7. gauge — the score 8,47 / 10
def ang(v):
    return math.radians(210 - 24 * v)


def arc_poly(r0, r1, v0, v1, n=24):
    out = [(r1 * math.cos(ang(v0 + (v1 - v0) * i / n)), r1 * math.sin(ang(v0 + (v1 - v0) * i / n))) for i in range(n + 1)]
    inn = [(r0 * math.cos(ang(v1 - (v1 - v0) * i / n)), r0 * math.sin(ang(v1 - (v1 - v0) * i / n))) for i in range(n + 1)]
    return list(reversed(out + inn))


def m_gauge():
    rig = Rig()
    SCORE = 8.47
    m = rig.mark()
    cyl("housing", 0.8, 0.14, (0, 0, -0.01), "w_plastic", seg=96, bevel=0.02)
    torus("bezel", 0.79, 0.04, (0, 0, 0.06), "indigo", seg=96, mseg=12)
    cyl("face", 0.75, 0.01, (0, 0, 0.062), "paperw", seg=96)
    for v0, v1, col in ((0, 4.9, "coral"), (5.05, 7.45, "amber"), (7.6, 10, "mint")):
        o = profile2d("arc", [arc_poly(0.58, 0.68, v0, v1)], 0.006, 0.003, col)
        o.location.z = 0.072
    for i in range(21):
        v = i / 2
        major = i % 2 == 0
        L = 0.075 if major else 0.04
        r = 0.53 - L / 2
        a = ang(v)
        box("tick", (L, 0.014 if major else 0.008, 0.006), (r * math.cos(a), r * math.sin(a), 0.07), "graphite", 0.001, rot=(0, 0, a))
    for v in range(0, 11, 2):
        a = ang(v)
        text_mesh(f"n{v}", str(v), 0.085, 0.003, "graphite", loc=(0.40 * math.cos(a), 0.40 * math.sin(a), 0.07))
    text_mesh("score", "8,47", 0.17, 0.01, "indigo", loc=(0, -0.36, 0.075))
    # stand (before rotation: -Y is down, +Z towards the viewer)
    box("neck", (0.14, 0.32, 0.08), (0, -0.88, -0.07), "w_plastic", 0.02)
    cyl("base", 0.42, 0.07, (0, -1.06, -0.12), "w_plastic", rot=(math.radians(90), 0, 0), seg=72, bevel=0.015)
    torus("basering", 0.42, 0.012, (0, -1.03, -0.12), "indigo", rot=(math.radians(90), 0, 0), seg=72, mseg=6)
    rig.take(m, "body", head=(0, 0, 0))
    m = rig.mark()
    a = ang(SCORE)
    dn = Vector((math.cos(a), math.sin(a), 0))
    pn = Vector((-dn.y, dn.x, 0))
    verts = [tuple(-dn * 0.12 + pn * 0.025 + Vector((0, 0, 0.09))), tuple(dn * 0.6 + Vector((0, 0, 0.09))),
             tuple(-dn * 0.12 - pn * 0.025 + Vector((0, 0, 0.09))),
             tuple(-dn * 0.12 + pn * 0.025 + Vector((0, 0, 0.1))), tuple(dn * 0.6 + Vector((0, 0, 0.1))),
             tuple(-dn * 0.12 - pn * 0.025 + Vector((0, 0, 0.1)))]
    nd = mesh_obj("needle", verts, [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
    bm = bmesh.new(); bm.from_mesh(nd.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(nd.data); bm.free()
    finish(nd, "coral", 0)
    cyl("cap", 0.06, 0.04, (0, 0, 0.11), "graphite", seg=40)
    rig.take(m, "needle", head=(0, 0, 0.1), parent="body")
    rig.shift(dy=0.25)
    rig.rotate(rx=90)

    def val(t):
        if t < 0.25:
            return SCORE
        if t < 0.45:
            return SCORE * (1 - smooth((t - 0.25) / 0.2))
        if t < 0.5:
            return 0.0
        x = t - 0.5
        if x < 0.16:
            return SCORE * smooth(x / 0.16) * 1.08
        y = x - 0.16
        return SCORE * (1 + 0.08 * math.exp(-y / 0.06) * math.cos(TAU * y / 0.12))

    def anim(t):
        v = min(10.0, val(t))
        return {"needle": {"rot": [((0, 0, 1), -24 * (v - SCORE))]}}
    return rig, anim, 4.5


# ================================================================== 8. rocket — what comes next
def m_rocket():
    rig = Rig()
    m = rig.mark()
    lathe("body", [(0, 0.0), (0.17, 0.0), (0.2, 0.08), (0.212, 0.3), (0.205, 0.55), (0.185, 0.72), (0.16, 0.8), (0, 0.8)], "w_plastic", 64)
    lathe("nose", [(0, 0.795), (0.162, 0.795), (0.13, 0.9), (0.085, 0.99), (0.04, 1.05), (0, 1.07)], "indigo", 64)
    torus("stripe", 0.211, 0.012, (0, 0, 0.27), "mint", seg=64, mseg=8)
    torus("win", 0.075, 0.016, (0, -0.2, 0.55), "indigo", rot=(math.radians(90), 0, 0), seg=40, mseg=8)
    cyl("glass", 0.068, 0.02, (0, -0.196, 0.55), "sky", rot=(math.radians(90), 0, 0), seg=40)
    lathe("nozzle", [(0, -0.01), (0.1, -0.01), (0.11, -0.05), (0.145, -0.14), (0.13, -0.145), (0.09, -0.06), (0, -0.06)], "steel", 40)
    for k in range(4):
        fin = profile2d(f"fin{k}", [[(0.15, 0.36), (0.36, 0.06), (0.37, -0.1), (0.3, -0.06), (0.17, 0.02)]], 0.018, 0.01, "coral")
        fin.matrix_world = Matrix.Rotation(TAU * k / 4 + math.pi / 4, 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "X")
    rig.take(m, "rocket", head=(0, 0, 0.4))
    m = rig.mark()
    lathe("flame", [(0, -0.07), (0.1, -0.12), (0.11, -0.24), (0.075, -0.42), (0.03, -0.56), (0, -0.62)], "flame", 32)
    lathe("core", [(0, -0.1), (0.06, -0.14), (0.055, -0.26), (0, -0.38)], "glowmint", 24)
    rig.take(m, "flame", head=(0, 0, -0.1), parent="rocket")
    # exhaust puffs, built at the far end of their path (max extent)
    puffs = []
    for k in range(6):
        a = TAU * k / 6 + 0.3
        end = Vector((0.36 * math.cos(a), 0.36 * math.sin(a) * 0.6, -0.95 - 0.06 * (k % 2)))
        m = rig.mark()
        sphere(f"puff{k}", 0.15, tuple(end), "paperw", 24, 12)
        rig.take(m, f"p{k}", head=tuple(end))
        puffs.append(end)
    rig.shift(dz=-0.05)
    rig.rotate(ry=22)
    start = Vector((0, 0, -0.55))

    def anim(t):
        p = {"rocket": {"loc": (0, 0, -0.05 * (1 - math.cos(TAU * t)) / 2), "rot": [((0, 0, 1), 90 * t), ((1, 0, 0), 2.5 * wave(t, 1, 0.2))]},
             "flame": {"scale": (0.92 + 0.08 * wave(t, 6, 0.0) * 0.5 + 0.04, 0.92 + 0.04 * wave(t, 7, 0.3) + 0.04,
                                 0.8 + 0.1 * (1 + wave(t, 5, 0.1)) * 0.5 + 0.1 * (1 + wave(t, 11, 0.4)) * 0.5)}}
        for k, end in enumerate(puffs):
            u = (t + k / 6) % 1.0
            pos = start + (end - start) * smooth(u) ** 0.8
            s = math.sin(math.pi * min(1.0, u / 0.9)) * 0.85 + 0.0
            s = max(0.001, min(1.0, 0.15 + s)) * (1 - ease(u, 0.88, 1.0)) + 0.001
            p[f"p{k}"] = {"loc": tuple(pos - end), "scale": s}
        return p
    return rig, anim, 3.0


MODELS = {"chat": m_chat, "search": m_search, "target": m_target, "people": m_people, "gears": m_gears,
          "gpu": m_gpu, "gauge": m_gauge, "rocket": m_rocket}

if __name__ == "__main__":
    want = [a for a in sys.argv[1:] if a in MODELS] or list(MODELS)
    for key in want:
        mm.reset()
        mm._mats.clear()
        export_rigged(key, *MODELS[key]())
