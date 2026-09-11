/**
 * Small seeded PRNG (mulberry32). The state is a 32-bit integer that we
 * persist in the save file so a run can be reproduced from its seed.
 */
export class Rng {
  state: number

  constructor(state: number) {
    this.state = state >>> 0
  }

  /** float in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  chance(p: number): boolean {
    return this.next() < p
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }

  /** weighted pick; weights must be >= 0 */
  weighted<T>(items: readonly T[], weights: readonly number[]): T | null {
    const total = weights.reduce((a, b) => a + b, 0)
    if (total <= 0 || items.length === 0) return null
    let r = this.next() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }
}

export function randomSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
}
