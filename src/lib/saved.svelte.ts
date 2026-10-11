import type { Preset } from './preset'
import { decodePreset, encodePreset } from './preset'

const KEY = 'grainfield-saved'

function load(): Preset[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
    return raw.map(decodePreset).filter((p): p is Preset => p !== null)
  }
  catch {
    return []
  }
}

export const saved = $state<{ list: Preset[] }>({ list: load() })

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved.list.map(encodePreset)))
  }
  catch {}
}

export function save(p: Preset) {
  saved.list.unshift($state.snapshot(p))
  persist()
}

export function remove(i: number) {
  saved.list.splice(i, 1)
  persist()
}
