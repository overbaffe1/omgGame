"""Чистый PNG-кодек без зависимостей (только stdlib: struct + zlib).

Пишет и читает 8-битный RGBA. Нужен, чтобы конвейер атласа работал
везде, где есть python3, — ни Pillow, ни npm-пакетов.
"""
import struct
import zlib

_SIG = b"\x89PNG\r\n\x1a\n"


def _chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def write_png(path, w, h, rgba) -> int:
    """rgba — bytearray длиной w*h*4. Возвращает размер файла."""
    stride = w * 4
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter: None
        raw += rgba[y * stride : (y + 1) * stride]
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    out = bytearray(_SIG)
    out += _chunk(b"IHDR", ihdr)
    out += _chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    out += _chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(out)
    return len(out)


def read_png(path):
    """→ (w, h, bytearray RGBA). Поддержка 8 бит, color type 0/2/3/4/6."""
    with open(path, "rb") as f:
        data = f.read()
    if not data.startswith(_SIG):
        raise ValueError("не PNG: %s" % path)
    pos = 8
    w = h = depth = ctype = None
    palette = []
    trns = None
    idat = bytearray()
    while pos < len(data):
        (ln,) = struct.unpack(">I", data[pos : pos + 4])
        tag = data[pos + 4 : pos + 8]
        body = data[pos + 8 : pos + 8 + ln]
        pos += 12 + ln
        if tag == b"IHDR":
            w, h, depth, ctype, comp, filt, inter = struct.unpack(">IIBBBBB", body)
            if depth != 8 or inter != 0:
                raise ValueError("нужен 8-битный непрогрессивный PNG")
        elif tag == b"PLTE":
            palette = [tuple(body[i : i + 3]) for i in range(0, len(body), 3)]
        elif tag == b"tRNS":
            trns = body
        elif tag == b"IDAT":
            idat += body
        elif tag == b"IEND":
            break

    raw = zlib.decompress(bytes(idat))
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    stride = w * ch
    prev = bytearray(stride)
    out = bytearray(w * h * 4)
    p = 0
    for y in range(h):
        f = raw[p]
        p += 1
        line = bytearray(raw[p : p + stride])
        p += stride
        if f == 1:
            for i in range(ch, stride):
                line[i] = (line[i] + line[i - ch]) & 0xFF
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif f == 3:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif f == 4:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                b = prev[i]
                c = prev[i - ch] if i >= ch else 0
                pp = a + b - c
                pa, pb, pc = abs(pp - a), abs(pp - b), abs(pp - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        elif f != 0:
            raise ValueError("неизвестный фильтр %d" % f)
        prev = line
        for x in range(w):
            o = (y * w + x) * 4
            if ctype == 6:
                out[o : o + 4] = line[x * 4 : x * 4 + 4]
            elif ctype == 2:
                out[o : o + 3] = line[x * 3 : x * 3 + 3]
                out[o + 3] = 255
            elif ctype == 4:
                out[o] = out[o + 1] = out[o + 2] = line[x * 2]
                out[o + 3] = line[x * 2 + 1]
            elif ctype == 0:
                out[o] = out[o + 1] = out[o + 2] = line[x]
                out[o + 3] = 255
            else:  # palette
                r, g, b = palette[line[x]]
                a = trns[line[x]] if trns and line[x] < len(trns) else 255
                out[o], out[o + 1], out[o + 2], out[o + 3] = r, g, b, a
    return w, h, out


def upscale(path_src, path_dst, scale, checker=True):
    """Nearest-neighbour лупа + шахматный фон — для визуального QA пиксель-арта."""
    w, h, px = read_png(path_src)
    bg_a = (24, 22, 20, 255)
    bg_b = (34, 31, 28, 255)
    ow, oh = w * scale, h * scale
    out = bytearray(ow * oh * 4)
    for y in range(oh):
        sy = y // scale
        for x in range(ow):
            sx = x // scale
            o = (y * ow + x) * 4
            r, g, b, a = px[((sy * w) + sx) * 4 : ((sy * w) + sx) * 4 + 4]
            if a == 0:
                c = bg_a if checker and ((sx + sy) & 1) == 0 else bg_b
                out[o : o + 4] = bytes(c)
            else:
                out[o] = r
                out[o + 1] = g
                out[o + 2] = b
                out[o + 3] = 255
    return write_png(path_dst, ow, oh, out)
