import { describe, expect, it } from 'vitest'
import { hexToOklab, hexToRgb, randomPalette } from './color'

describe('hexToOklab', () => {
  it('maps white to L=1 with no chroma', () => {
    const [l, a, b] = hexToOklab('#ffffff')
    expect(l).toBeCloseTo(1, 3)
    expect(a).toBeCloseTo(0, 3)
    expect(b).toBeCloseTo(0, 3)
  })

  it('matches the reference value for pure red', () => {
    const [l, a, b] = hexToOklab('#ff0000')
    expect(l).toBeCloseTo(0.628, 3)
    expect(a).toBeCloseTo(0.2249, 3)
    expect(b).toBeCloseTo(0.1258, 3)
  })
})

describe('hexToRgb', () => {
  it('expands shorthand hex', () => {
    expect(hexToRgb('#f00')).toEqual([1, 0, 0])
  })
})

describe('randomPalette', () => {
  it('returns 3–5 valid hex colours', () => {
    for (let i = 0; i < 50; i++) {
      const p = randomPalette()
      expect(p.length).toBeGreaterThanOrEqual(3)
      expect(p.length).toBeLessThanOrEqual(5)
      for (const c of p) expect(c).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
