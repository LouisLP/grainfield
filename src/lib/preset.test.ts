import { describe, expect, it } from 'vitest'
import { decodePreset, encodePreset, makePreset } from './preset'

describe('preset codec', () => {
  it('round-trips a preset, including unicode names', () => {
    const p = makePreset('warp', { name: 'Fumée — 煙', seed: 42, colors: ['#000000', '#ffffff'] })
    expect(decodePreset(encodePreset(p))).toEqual(p)
  })

  it('produces url-safe output', () => {
    const s = encodePreset(makePreset('liquid', { name: '???>>>' }))
    expect(s).toMatch(/^[\w-]+$/)
  })

  it('rejects garbage and unknown patterns', () => {
    expect(decodePreset('not-base64!!')).toBeNull()
    expect(decodePreset(encodePreset({ ...makePreset('liquid'), pattern: 'nope' as never }))).toBeNull()
  })

  it('fills missing params with pattern defaults', () => {
    const p = { ...makePreset('cells'), params: [9] }
    expect(decodePreset(encodePreset(p))!.params).toEqual([9, 0.9, 0.6, 0])
  })
})
