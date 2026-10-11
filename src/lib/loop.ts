// A single rAF loop drives every visible canvas. Callbacks get seconds since start.

type Tick = (time: number) => void

const ticks = new Set<Tick>()
const start = performance.now()
let frame = 0

export const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Still frames use a fixed time so a paused pattern isn't stuck at t=0
export const STILL_TIME = 12

function run(now: number) {
  const t = (now - start) / 1000
  for (const tick of ticks) tick(t)
  frame = ticks.size ? requestAnimationFrame(run) : 0
}

export function subscribe(tick: Tick): () => void {
  ticks.add(tick)
  if (!frame)
    frame = requestAnimationFrame(run)
  return () => ticks.delete(tick)
}
