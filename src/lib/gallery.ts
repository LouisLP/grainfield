import type { Preset } from './preset'
import { makePreset } from './preset'

const deepBlue = ['#000933', '#030c6e', '#0125d3', '#19dbe6']
const mono = ['#000000', '#8f8f8f', '#ebebeb', '#ffffff']

export const gallery: Preset[] = [
  makePreset('liquid', { name: 'Deep end', colors: deepBlue, seed: 70, params: [1, 1.1, 4, 4], grain: 0.2 }),
  makePreset('glow', { name: 'Ember', colors: ['#0a0503', '#4a0d02', '#e0450f', '#ffb36b', '#fff4e2'], seed: 12, grain: 0.16 }),
  makePreset('warp', { name: 'Ink', colors: mono, seed: 355, params: [3.4, 6, 1, 1.6], grain: 0.12 }),
  makePreset('horizon', { name: 'Dusk', colors: ['#120a2e', '#6a2a8c', '#f25c54', '#f7b267', '#fff1d0'], seed: 8, params: [0.6, 0.8, 1.1, -0.15], grain: 0.18 }),
  makePreset('bayer', { name: 'Gameboy', colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'], seed: 21, params: [3, 1.5, 0.7, 1.4], grainMode: 0 }),
  makePreset('contour', { name: 'Survey', colors: ['#0b1d16', '#1d4b3a', '#d8f3b0'], seed: 5, params: [18, 1.1, 0.8, 0.5], grain: 0.05 }),
  makePreset('cells', { name: 'Membrane', colors: ['#14001f', '#5b1a8f', '#ff4fd8', '#ffe3fa'], seed: 33, params: [3.2, 1, 0.75, 1], grain: 0.1 }),
  makePreset('halftone', { name: 'Riso', colors: ['#f4efe1', '#ff5f6d', '#1f3fbf'], seed: 9, params: [8, 30, 0.8, 1.1], grainMode: 1, grain: 0.1 }),
  makePreset('liquid', { name: 'Chrome', colors: ['#000000', '#ffffff', '#8f8f8f', '#ebebeb', '#000000'], seed: 355, params: [0.25, 0.85, 3, 1.5], scale: 0.7, speed: 1.2, contrast: 1.2, grain: 0.06 }),
  makePreset('warp', { name: 'Nebula', colors: ['#02010a', '#1b0f4d', '#7b2ff7', '#f107a3', '#ffd6f5'], seed: 101, params: [4, 5, 0.9, 1.5], grain: 0.15 }),
  makePreset('glow', { name: 'Moonrise', colors: ['#03040b', '#1a2340', '#9fb4ff', '#f5f7ff'], seed: 4, params: [0.7, 0.3, 0.8, 0.15], grain: 0.2 }),
  makePreset('horizon', { name: 'Lagoon', colors: ['#f6fff8', '#7fe0c8', '#1a9aa0', '#06324a'], seed: 17, params: [0.35, 1.6, 0.9, 0.2], grain: 0.1 }),
  makePreset('cells', { name: 'Cracked', colors: ['#f1e6d2', '#a67c52', '#2b1a0e'], seed: 77, params: [6, 0.8, 1, 0], grain: 0.08, speed: 0.4 }),
  makePreset('bayer', { name: 'Thermal', colors: ['#000004', '#51127c', '#b73779', '#fc8961', '#fcfdbf'], seed: 46, params: [2, 2.2, 0.9, 1.4], grainMode: 0 }),
  makePreset('contour', { name: 'Isobar', colors: ['#f7f4ec', '#d9d3c4', '#1c1c1c'], seed: 64, params: [26, 0.9, 1.4, 0.25], grain: 0.04 }),
  makePreset('liquid', { name: 'Sorbet', colors: ['#ffecd2', '#fcb69f', '#ff6f91', '#845ec2'], seed: 19, params: [0.9, 1.4, 7, 2.5], grain: 0.1 }),
]
