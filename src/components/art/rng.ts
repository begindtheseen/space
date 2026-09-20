/**
 * Deterministic pseudo-random source for the procedural artwork.
 *
 * Every star, city light and rock in this product is generated rather than
 * drawn by hand — but it must be the *same* star field on every render, or the
 * background would shimmer on each React commit. A seeded 32-bit generator
 * (mulberry32) gives us that for free and costs nothing.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Convenience: a generator bound to a string seed. */
export function seeded(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return mulberry32(h)
}

export function range(rnd: () => number, lo: number, hi: number): number {
  return lo + rnd() * (hi - lo)
}

export function pick<T>(rnd: () => number, xs: readonly T[]): T {
  return xs[Math.floor(rnd() * xs.length) % xs.length]!
}
