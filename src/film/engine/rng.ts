// Seeded RNG - mulberry32 + hash
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function seededRng(seed: number | string) {
  const s = typeof seed === 'string' ? hashString(seed) : seed;
  return mulberry32(s);
}

// Perlin-ish simple noise for wobble
export function noise2D(x: number, y: number, seed = 0) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const hash = (xx: number, yy: number) => {
    let h = xx * 374761393 + yy * 668265263 + seed * 1274126177;
    h = (h ^ h >>> 13) * 1274126177;
    return (h ^ h >>> 16) & 0xff;
  };
  const a = hash(X, Y);
  const b = hash(X + 1, Y);
  const c = hash(X, Y + 1);
  const d = hash(X + 1, Y + 1);
  const lerp = (p: number, q: number, t: number) => p + (q - p) * t;
  const ab = lerp(a, b, u);
  const cd = lerp(c, d, u);
  return lerp(ab, cd, v) / 255;
}

export function randRange(rng: () => number, a: number, b: number) {
  return a + rng() * (b - a);
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
