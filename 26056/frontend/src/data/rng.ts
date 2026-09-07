/** Deterministic PRNG.
 *
 *  The whole fixture panel is generated from one seed so that a number on
 *  screen today is the same number in tomorrow's screenshot. A demo that
 *  reshuffles itself on every reload cannot be cited in a deck.
 */
export function makeRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    /** Uniform in [lo, hi). */
    range: (lo: number, hi: number) => lo + next() * (hi - lo),
    int: (lo: number, hi: number) => Math.floor(lo + next() * (hi - lo + 1)),
    /** Box-Muller normal draw. */
    gauss: (mean = 0, sd = 1) => {
      const u = Math.max(next(), 1e-9)
      const v = next()
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  }
}

export type Rng = ReturnType<typeof makeRng>

/** Hash a string into a seed, so a sector or cell can own a stable sub-stream. */
export function seedFrom(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
