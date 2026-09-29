"""Писатель бинарного формата .aseprite (ASE) — без зависимостей.

Документ собирается так, как это делает художник в Aseprite:
  * один кадр = один компонент атласа (поэтому `--sheet` даёт лист);
  * слой = группа компонентов (panels / buttons / icons / fx …);
  * теги кадров = анимации (flame, ember, rune_pulse, wave_blood …);
  * срезы (slices) = имена + 9-patch центры для тянущихся рамок.

Раскладка байтов — по официальной спецификации ase-file-specs.
"""
import struct
import zlib

MAGIC_FILE = 0xA5E0
MAGIC_FRAME = 0xF1FA
CHUNK_OLD_PALETTE = 0x0011
CHUNK_LAYER = 0x2004
CHUNK_CEL = 0x2005
CHUNK_TAGS = 0x2018
CHUNK_PALETTE = 0x2019
CHUNK_USERDATA = 0x2020
CHUNK_SLICE = 0x2022

DIR_FORWARD, DIR_REVERSE, DIR_PINGPONG = 0, 1, 2


def _s(text):
    b = (text or "").encode("utf-8")
    return struct.pack("<H", len(b)) + b


def _chunk(ctype, body):
    return struct.pack("<IH", len(body) + 6, ctype) + body


def _layer_chunk(name, opacity=255, flags=1, kind=0, blend=0):
    body = struct.pack(
        "<HHHHHHB", flags, kind, 0, 0, 0, blend, opacity
    )
    body += b"\x00\x00\x00"
    body += _s(name)
    return _chunk(CHUNK_LAYER, body)


def _cel_chunk(layer_index, x, y, w, h, rgba, opacity=255, compress=True):
    body = struct.pack("<HhhBH", layer_index, x, y, opacity, 2 if compress else 0)
    body += b"\x00" * 7  # z-index + reserved: нули читаются одинаково в 1.1–1.3
    body += struct.pack("<HH", w, h)
    raw = bytes(rgba[: w * h * 4])
    raw += b"\x00" * (w * h * 4 - len(raw))
    body += zlib.compress(raw, 9) if compress else raw
    return _chunk(CHUNK_CEL, body)


def _userdata_chunk(text):
    return _chunk(CHUNK_USERDATA, struct.pack("<I", 1) + _s(text))


def _palette_chunk(colors):
    body = struct.pack("<III", len(colors), 0, max(0, len(colors) - 1))
    body += b"\x00" * 8
    for c in colors:
        body += struct.pack("<I", 1)  # flags: есть цвет
        body += struct.pack("<BBBB", c[0], c[1], c[2], c[3])
    return _chunk(CHUNK_PALETTE, body)


def _tags_chunk(tags):
    body = struct.pack("<H", len(tags)) + b"\x00" * 8
    for t in tags:
        body += struct.pack("<HHBB", t["from"], t["to"], t.get("dir", DIR_FORWARD), t.get("repeat", 0))
        body += b"\x00" * 6
        body += struct.pack("<BBBB", *t.get("color", (0, 0, 0, 0)))
        body += _s(t["name"])
    return _chunk(CHUNK_TAGS, body)


def _slice_chunk(name, keys, nine_patch=False):
    flags = 1 if nine_patch else 0
    body = struct.pack("<II", len(keys), flags) + b"\x00" * 4 + _s(name)
    for k in keys:
        body += struct.pack("<Iiiii", k["frame"], k["x"], k["y"], k["w"], k["h"])
        if nine_patch:
            body += struct.pack("<iiii", k["center"][0], k["center"][1], k["center"][2], k["center"][3])
    return _chunk(CHUNK_SLICE, body)


def write_aseprite(
    path,
    canvas_w,
    canvas_h,
    frames,
    layers,
    tags=(),
    slices=(),
    palette=(),
    compress=True,
    app="omgGame darkui-mcp",
):
    """frames: [{'name','duration','cels':[{'layer','x','y','w','h','rgba','text'}]}]
    layers:  ['Bg', 'panels', ...] — порядок = индексы
    tags:    [{'name','from','to','dir','color'}]
    slices:  [{'name','nine':bool,'keys':[{'frame','x','y','w','h','center'}]}]
    """
    out = bytearray()
    # --- заголовок файла (размер проставим в конце), раскладка по ase-file-specs
    header = bytearray(128)
    struct.pack_into("<H", header, 4, MAGIC_FILE)
    struct.pack_into("<H", header, 6, len(frames))
    struct.pack_into("<H", header, 8, canvas_w)
    struct.pack_into("<H", header, 10, canvas_h)
    struct.pack_into("<H", header, 12, 32)  # RGBA
    struct.pack_into("<I", header, 14, 1)  # флаги: прозрачность слоёв валидна
    struct.pack_into("<H", header, 18, 100)  # скорость между кадрами (устаревшее)
    header[28] = 0  # индекс прозрачного цвета в палитре
    struct.pack_into("<H", header, 32, len(palette) if palette else 256)
    header[34] = 1  # ширина пикселя
    header[35] = 1  # высота пикселя
    struct.pack_into("<HHHH", header, 36, 0, 0, 0, 0)  # сетка
    out += header

    layer_names = list(layers)
    for fi, fr in enumerate(frames):
        chunks = bytearray()
        # палитра и слои живут в первом кадре — так делает сам Aseprite
        if fi == 0:
            if palette:
                chunks += _palette_chunk(palette)
            for li, lname in enumerate(layer_names):
                chunks += _layer_chunk(lname, opacity=255)
        for cel in fr["cels"]:
            li = cel.get("layer", 0)
            if isinstance(li, str):
                li = layer_names.index(li)
            chunks += _cel_chunk(li, cel["x"], cel["y"], cel["w"], cel["h"], cel["rgba"], compress=compress)
            if cel.get("text"):
                chunks += _userdata_chunk(cel["text"])
        # срезы и теги привязаны к кадру, в котором начинаются
        for sl in slices:
            if sl["keys"] and sl["keys"][0]["frame"] == fi:
                chunks += _slice_chunk(sl["name"], sl["keys"], nine_patch=bool(sl.get("nine")))
        for tg in tags:
            if tg["from"] == fi:
                chunks += _tags_chunk([tg])
        nchunks = sum(1 for _ in _iter_chunks(chunks))
        out += struct.pack(
            "<IHHH2sI",
            16 + len(chunks),
            MAGIC_FRAME,
            nchunks if nchunks < 0xFFFF else 0xFFFF,
            fr.get("duration", 100),
            b"\x00\x00",
            nchunks,
        )
        out += chunks

    struct.pack_into("<I", out, 0, len(out))
    with open(path, "wb") as f:
        f.write(out)
    return len(out)


def _iter_chunks(buf):
    i = 0
    while i + 6 <= len(buf):
        (size,) = struct.unpack_from("<I", buf, i)
        yield size
        i += size


def read_summary(path):
    """Диагностика: сколько кадров/чанков и какие типы — для проверки файла."""
    with open(path, "rb") as f:
        data = f.read()
    (fsize,) = struct.unpack_from("<I", data, 0)
    magic, frames, w, h, depth = struct.unpack_from("<HHHHH", data, 4)
    pos = 128
    types = {}
    seen = 0
    names = []
    while pos + 16 <= len(data) and seen < frames:
        (fsz,) = struct.unpack_from("<I", data, pos)
        (fmagic,) = struct.unpack_from("<H", data, pos + 4)
        if fmagic != MAGIC_FRAME:
            raise ValueError("кадр %d: плохая магия 0x%04X" % (seen, fmagic))
        (nch,) = struct.unpack_from("<I", data, pos + 12)
        cpos = pos + 16
        for _ in range(nch):
            (csz,) = struct.unpack_from("<I", data, cpos)
            (ctype,) = struct.unpack_from("<H", data, cpos + 4)
            types[ctype] = types.get(ctype, 0) + 1
            if ctype == CHUNK_SLICE:
                cnt, flags = struct.unpack_from("<II", data, cpos + 6)
                (slen,) = struct.unpack_from("<H", data, cpos + 18)
                names.append(data[cpos + 20 : cpos + 20 + slen].decode("utf-8"))
            cpos += csz
        pos += fsz
        seen += 1
    return {
        "file_size": fsize,
        "declared_size": len(data),
        "frames": frames,
        "canvas": (w, h),
        "depth": depth,
        "chunks": {"0x%04X" % k: v for k, v in sorted(types.items())},
        "slices": names,
    }
