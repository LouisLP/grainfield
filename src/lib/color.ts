export type Lab = [number, number, number]

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map(c => c + c).join('') : h.padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => c / 255) as [number, number, number]
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

// Björn Ottosson's OKLab, linear sRGB in
export function hexToOklab(hex: string): Lab {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear) as [number, number, number]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ]
}

export function randomPalette(rand: () => number = Math.random): string[] {
  const count = 3 + Math.floor(rand() * 3)
  const hue = rand() * 360
  const spread = 40 + rand() * 140
  const dark = rand() < 0.7
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    const light = dark ? 6 + t * 80 : 95 - t * 75
    const chroma = 0.35 + 0.65 * Math.sin(Math.PI * t)
    return hslToHex(hue + spread * t, 55 + 40 * chroma, light)
  })
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return `#${[f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`
}
