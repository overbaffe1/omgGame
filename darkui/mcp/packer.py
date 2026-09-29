"""Упаковка атласа: skyline bottom-left, как в TexturePacker/Aseprite.
Без зависимостей, детерминированно — одинаковый вход даёт одинаковый лист."""


class Skyline:
    def __init__(self, w, h):
        self.w = w
        self.h = h
        self.nodes = [(0, 0, w)]  # (x, y, width)

    def _fits(self, idx, w, h):
        """Минимальная y, на которой прямоугольник w×h влезает начиная с узла idx."""
        if self.nodes[idx][0] + w > self.w:
            return None
        y = self.nodes[idx][1]
        left = w
        i = idx
        while left > 0:
            if y > self.h:
                return None
            y = max(y, self.nodes[i][1])
            if y + h > self.h:
                return None
            left -= self.nodes[i][2]
            i += 1
            if i >= len(self.nodes) and left > 0:
                return None
        return y

    def insert(self, w, h):
        best = (self.h + 1, self.w + 1, -1)
        for i in range(len(self.nodes)):
            y = self._fits(i, w, h)
            if y is None:
                continue
            waste_top = y + self.nodes[i][1] * 0
            if (y, self.nodes[i][1]) < (best[0], best[1]) or best[2] < 0:
                if y < best[0] or (y == best[0] and self.nodes[i][2] > 0 and best[2] < 0):
                    best = (y, self.nodes[i][1], i)
        if best[2] < 0:
            return None
        idx = best[2]
        y = best[0]
        node = (self.nodes[idx][0], y + h, w)
        left = w
        i = idx
        while i < len(self.nodes) and left > 0:
            if self.nodes[i][2] <= left:
                left -= self.nodes[i][2]
                self.nodes.pop(i)
            else:
                self.nodes[i] = (self.nodes[i][0] + left, self.nodes[i][1], self.nodes[i][2] - left)
                left = 0
        self.nodes.insert(idx, node)
        # склейка соседей одинаковой высоты
        i = 0
        while i < len(self.nodes) - 1:
            if self.nodes[i][1] == self.nodes[i + 1][1]:
                self.nodes[i] = (
                    self.nodes[i][0],
                    self.nodes[i][1],
                    self.nodes[i][2] + self.nodes[i + 1][2],
                )
                self.nodes.pop(i + 1)
            else:
                i += 1
        return (node[0], y)


def pack(items, max_w=1024, max_h=4096, pad=2, sort=True):
    """items: [{'name','w','h'}, ...] → (atlas_w, atlas_h, {name: (x,y,w,h)})."""
    order = list(items)
    if sort:
        order.sort(key=lambda r: (-(r["h"] + pad), -(r["w"] + pad), r["name"]))
    sky = Skyline(max_w, max_h)
    out = {}
    bottom = 0
    for it in order:
        w, h = it["w"] + pad, it["h"] + pad
        pos = sky.insert(w, h)
        if pos is None:
            raise RuntimeError("атлас %d×%d переполнен на %s" % (max_w, max_h, it["name"]))
        out[it["name"]] = (pos[0], pos[1], it["w"], it["h"])
        bottom = max(bottom, pos[1] + h)
    # уплотняем по высоте до степени-кратной 32
    ah = min(max_h, ((bottom + 31) // 32) * 32)
    aw = max_w
    used = sum(it["w"] * it["h"] for it in items)
    return aw, ah, out, used / float(aw * ah)
