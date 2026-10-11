<script lang='ts'>
  import type { Preset } from '../lib/preset'
  import { reducedMotion, STILL_TIME, subscribe } from '../lib/loop'
  import { renderer } from '../lib/renderer'

  interface Props {
    preset: Preset
    playing?: boolean
    /** Caps the render resolution; tiles don't need full retina */
    maxDpr?: number
    onerror?: (message: string) => void
  }

  const { preset, playing = true, maxDpr = 2, onerror }: Props = $props()

  let canvas: HTMLCanvasElement
  let visible = $state(false)
  let size = $state({ w: 0, h: 0, dpr: 1 })
  let frozenAt = STILL_TIME

  function draw(time: number) {
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return
    try {
      renderer().drawTo(ctx, preset, time, size.dpr)
    }
    catch (e) {
      onerror?.(e instanceof Error ? e.message : String(e))
    }
  }

  $effect(() => {
    const ro = new ResizeObserver(([entry]) => {
      const dpr = Math.min(devicePixelRatio, maxDpr)
      const box = entry.contentRect
      size = { w: Math.round(box.width * dpr), h: Math.round(box.height * dpr), dpr }
    })
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: '100px' })
    ro.observe(canvas)
    io.observe(canvas)
    return () => {
      ro.disconnect()
      io.disconnect()
    }
  })

  $effect(() => {
    canvas.width = size.w
    canvas.height = size.h
  })

  // Animate while visible and playing; otherwise draw one still frame whenever inputs change
  $effect(() => {
    if (!visible || size.w === 0)
      return
    if (playing && !reducedMotion) {
      return subscribe((t) => {
        frozenAt = t
        draw(t)
      })
    }
    // read preset deeply so edits redraw the still frame
    JSON.stringify(preset)
    draw(frozenAt)
  })
</script>

<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
</style>
