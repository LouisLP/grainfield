import type { PatternId } from './patterns'
import { patterns } from './patterns'

export interface Preset {
  name: string
  pattern: PatternId
  colors: string[]
  seed: number
  speed: number
  scale: number
  params: number[]
  grainMode: 0 | 1 | 2
  grain: number
  contrast: number
  saturation: number
}

export function defaultsFor(pattern: PatternId): number[] {
  return patterns[pattern].params.map(p => p.default)
}

export function makePreset(pattern: PatternId, overrides: Partial<Preset> = {}): Preset {
  return {
    name: patterns[pattern].name,
    pattern,
    colors: ['#05061a', '#2b3cff', '#7fe3ff', '#f4f1ea'],
    seed: 1,
    speed: 1,
    scale: 1,
    params: defaultsFor(pattern),
    grainMode: 2,
    grain: 0.12,
    contrast: 1,
    saturation: 1,
    ...overrides,
  }
}

// Presets travel in the URL hash as base64url JSON
export function encodePreset(p: Preset): string {
  const bytes = new TextEncoder().encode(JSON.stringify(p))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodePreset(s: string): Preset | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    const raw = JSON.parse(new TextDecoder().decode(bytes)) as Partial<Preset>
    if (!raw.pattern || !(raw.pattern in patterns))
      return null
    const base = makePreset(raw.pattern)
    const merged = { ...base, ...raw }
    const defaults = defaultsFor(raw.pattern)
    merged.params = defaults.map((d, i) => (typeof raw.params?.[i] === 'number' ? raw.params[i] : d))
    if (!Array.isArray(merged.colors) || merged.colors.length === 0)
      merged.colors = base.colors
    return merged
  }
  catch {
    return null
  }
}
