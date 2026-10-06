# Procedural 3D models for the Schumpeter deck, built in Blender (bpy) and
# exported as self-contained .glb files that PowerPoint can embed as native 3D models.
#
#   python3 models/make_models.py            -> models/glb/*.glb   (all models)
#   python3 models/make_models.py gear globe -> only selected models
#
# Every model is modelled "front towards the viewer": in glTF terms +Y is up and
# the camera looks from +Z (Blender: Z up, front faces -Y).
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "glb")
os.makedirs(OUT, exist_ok=True)
TAU = math.tau


# ------------------------------------------------------------------ helpers
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


_mats = {}


def M(name):
    """Shared material palette — one coherent 'brass / ivory / navy' language."""
    if name in _mats and _mats[name].name in bpy.data.materials:
        return _mats[name]
    P = {
        # name: (base rgb, metallic, roughness, extra)
        "brass":    ((0.80, 0.56, 0.26), 0.85, 0.30, {}),
        "brass_d":  ((0.50, 0.32, 0.14), 0.85, 0.38, {}),
        "gold":     ((1.00, 0.74, 0.32), 1.00, 0.22, {}),
        "steel":    ((0.62, 0.64, 0.68), 1.00, 0.16, {}),
        "chrome":   ((0.85, 0.86, 0.88), 1.00, 0.06, {}),
        "black":    ((0.018, 0.020, 0.026), 0.20, 0.22, {"coat": 0.8}),
        "satin":    ((0.006, 0.006, 0.008), 0.05, 0.30, {"coat": 0.3}),
        "ivory":    ((0.72, 0.64, 0.50), 0.00, 0.38, {"coat": 0.4}),
        "paper":    ((0.70, 0.64, 0.52), 0.00, 0.80, {}),
        "navy":     ((0.012, 0.025, 0.075), 0.05, 0.45, {}),
        "oxblood":  ((0.180, 0.016, 0.016), 0.05, 0.42, {}),
        "green":    ((0.012, 0.070, 0.045), 0.05, 0.45, {}),
        "brown":    ((0.090, 0.036, 0.016), 0.05, 0.45, {}),
        "walnut":   ((0.110, 0.050, 0.022), 0.00, 0.40, {"coat": 0.5}),
        "teal":     ((0.015, 0.160, 0.200), 0.30, 0.30, {}),
        "red":      ((0.300, 0.025, 0.020), 0.20, 0.32, {"coat": 0.6}),
        "thread":   ((0.190, 0.010, 0.010), 0.00, 0.55, {}),
        "sand":     ((0.700, 0.460, 0.200), 0.00, 0.90, {}),
        "glass":    ((0.880, 0.930, 1.000), 0.00, 0.02, {"alpha": 0.12}),
        "glow":     ((1.000, 0.620, 0.260), 0.00, 0.50, {"emit": (1.0, 0.55, 0.18), "es": 6.0}),
        "cyan":     ((0.380, 0.830, 0.940), 0.00, 0.30, {"emit": (0.38, 0.83, 0.94), "es": 3.0}),
        "window":   ((1.000, 0.700, 0.350), 0.00, 0.30, {"emit": (1.0, 0.62, 0.28), "es": 2.5}),
        "rubber":   ((0.030, 0.030, 0.030), 0.00, 0.80, {}),
    }
    col, met, rough, ex = P[name]
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Metallic"].default_value = met
    b.inputs["Roughness"].default_value = rough
    if "coat" in ex:
        b.inputs["Coat Weight"].default_value = ex["coat"]
    if "sheen" in ex:
        b.inputs["Sheen Weight"].default_value = ex["sheen"]
    if "alpha" in ex:
        b.inputs["Alpha"].default_value = ex["alpha"]
        m.surface_render_method = "BLENDED"
        m.use_backface_culling = False
    if "emit" in ex:
        b.inputs["Emission Color"].default_value = (*ex["emit"], 1)
        b.inputs["Emission Strength"].default_value = ex["es"]
    _mats[name] = m
    return m


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def finish(obj, mat=None, smooth=30, bevel=0.0, seg=2):
    if mat is not None:
        obj.data.materials.clear()
        obj.data.materials.append(M(mat) if isinstance(mat, str) else mat)
    if bevel:
        md = obj.modifiers.new("bevel", "BEVEL")
        md.width = bevel
        md.segments = seg
        md.limit_method = "ANGLE"
        md.angle_limit = math.radians(40)
        md.harden_normals = False
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
        if bevel:
            md = obj.modifiers.new("smooth", "NODES") if False else None
        obj.data.set_sharp_from_angle(angle=math.radians(smooth))
    return obj


def mesh_obj(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.update()
    return link(bpy.data.objects.new(name, me))


def lathe(name, prof, mat, seg=72, smooth=35, loc=(0, 0, 0)):
    """Revolve a (r, z) profile around the Z axis."""
    verts, faces, rings = [], [], []
    for r, z in prof:
        if r < 1e-6:
            rings.append([len(verts)])
            verts.append((0, 0, z))
        else:
            ring = []
            for i in range(seg):
                a = TAU * i / seg
                ring.append(len(verts))
                verts.append((r * math.cos(a), r * math.sin(a), z))
            rings.append(ring)
    for A, B in zip(rings, rings[1:]):
        if len(A) == 1 and len(B) == 1:
            continue
        if len(A) == 1:
            for i in range(seg):
                faces.append((A[0], B[i], B[(i + 1) % seg]))
        elif len(B) == 1:
            for i in range(seg):
                faces.append((A[i], B[0], A[(i + 1) % seg]))
        else:
            for i in range(seg):
                faces.append((A[i], B[i], B[(i + 1) % seg], A[(i + 1) % seg]))
    o = mesh_obj(name, verts, faces)
    # make normals point outwards
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data); bm.free()
    o.location = loc
    return finish(o, mat, smooth)


def box(name, size, loc, mat, bevel=0.01, rot=(0, 0, 0), seg=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(o, mat, 30, bevel, seg)


def cyl(name, r, h, loc, mat, rot=(0, 0, 0), seg=48, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=h, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return finish(o, mat, 35, bevel)


def sphere(name, r, loc, mat, seg=48, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    return finish(o, mat, 80)


def torus(name, R, r, loc, mat, rot=(0, 0, 0), seg=72, mseg=16):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg, minor_segments=mseg,
                                     location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return finish(o, mat, 80)


def tube(name, pts, r, mat, res=6, smooth_curve=True):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = res
    cu.use_fill_caps = True
    if smooth_curve:
        sp = cu.splines.new("NURBS")
        sp.points.add(len(pts) - 1)
        for p, c in zip(sp.points, pts):
            p.co = (*c, 1)
        sp.use_endpoint_u = True
        sp.order_u = min(4, len(pts))
        sp.resolution_u = max(2, min(12, 48 // len(pts)))
    else:
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        for p, c in zip(sp.points, pts):
            p.co = (*c, 1)
    o = link(bpy.data.objects.new(name, cu))
    return to_mesh(o, mat)


def to_mesh(o, mat=None, smooth=40):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.active_object
    return finish(o, mat, smooth)


def profile2d(name, loops, depth, bevel, mat, bevel_res=3):
    """Extrude closed 2D polygons (XY plane, holes allowed) along Z with rounded edges."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    cu.extrude = depth
    cu.bevel_depth = bevel
    cu.bevel_resolution = bevel_res
    for loop in loops:
        sp = cu.splines.new("POLY")
        sp.points.add(len(loop) - 1)
        for p, (x, y) in zip(sp.points, loop):
            p.co = (x, y, 0, 1)
        sp.use_cyclic_u = True
    o = link(bpy.data.objects.new(name, cu))
    return to_mesh(o, mat, 35)


def apply_all():
    for o in bpy.context.scene.objects:
        o.select_set(o.type == "MESH")
    bpy.context.view_layer.objects.active = next(o for o in bpy.context.scene.objects if o.type == "MESH")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def export(key):
    # bake modifiers, drop non-mesh helpers, then write a compact GLB (no Draco: PowerPoint can't read it)
    for o in list(bpy.context.scene.objects):
        if o.type != "MESH":
            bpy.data.objects.remove(o)
    for o in bpy.context.scene.objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = bpy.context.scene.objects[0]
    for o in bpy.context.scene.objects:
        bpy.context.view_layer.objects.active = o
        for md in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=md.name)
    apply_all()
    path = os.path.join(OUT, f"{key}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", export_apply=True, export_yup=True,
        export_draco_mesh_compression_enable=False, export_image_format="JPEG", export_image_quality=88,
        export_cameras=False, export_lights=False, export_extras=False, use_selection=False,
    )
    tris = sum(len(p.vertices) - 2 for o in bpy.context.scene.objects for p in o.data.polygons)
    print(f"[model] {key}: {os.path.getsize(path)/1024:.0f} KB, ~{tris} tris")


def rot_all(rx=0, ry=0, rz=0):
    """Rotate the whole assembled model around the origin (Blender axes, degrees)."""
    R = (Matrix.Rotation(math.radians(rz), 4, "Z") @ Matrix.Rotation(math.radians(ry), 4, "Y")
         @ Matrix.Rotation(math.radians(rx), 4, "X"))
    for o in bpy.context.scene.objects:
        o.matrix_world = R @ o.matrix_world


# ------------------------------------------------------------------ models
