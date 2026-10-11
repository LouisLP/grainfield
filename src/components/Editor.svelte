<script lang='ts'>
  import type { PatternId } from '../lib/patterns'
  import type { Preset } from '../lib/preset'
  import { randomPalette } from '../lib/color'
  import { MAX_COLORS } from '../lib/glsl/common'
  import { STILL_TIME } from '../lib/loop'
  import { patternList, patterns } from '../lib/patterns'
  import { defaultsFor, encodePreset } from '../lib/preset'
  import { fragmentSource, renderer } from '../lib/renderer'
  import { save } from '../lib/saved.svelte'
  import PatternCanvas from './PatternCanvas.svelte'
  import Slider from './Slider.svelte'

  interface Props {
    initial: Preset
  }

  const { initial }: Props = $props()

  // The editor owns its copy from here on
  // svelte-ignore state_referenced_locally
  const preset = $state<Preset>(structuredClone(initial))
  let playing = $state(true)
  let error = $state<string | null>(null)
  let toast = $state<string | null>(null)
  let exportSize = $state('3840x2160')

  const pattern = $derived(patterns[preset.pattern])

  const EXPORT_SIZES = [
    ['1920x1080', '1920 × 1080'],
    ['3840x2160', '3840 × 2160 (4K)'],
    ['2048x2048', '2048 × 2048'],
    ['1080x1350', '1080 × 1350 (portrait)'],
    ['2560x1600', '2560 × 1600 (wallpaper)'],
  ] as const

  // Keep the URL in sync so the address bar is always a shareable link
  $effect(() => {
    const encoded = encodePreset($state.snapshot(preset))
    const id = setTimeout(() => history.replaceState(null, '', `#/edit/${encoded}`), 200)
    return () => clearTimeout(id)
  })

  function flash(message: string) {
    toast = message
    setTimeout(() => (toast = null), 1800)
  }

  function setPattern(id: PatternId) {
    preset.pattern = id
    preset.params = defaultsFor(id)
    error = null
  }

  function rollSeed() {
    preset.seed = Math.floor(Math.random() * 1000)
  }

  function shuffle() {
    preset.colors = randomPalette()
    preset.seed = Math.floor(Math.random() * 1000)
    preset.params = pattern.params.map((p) => {
      const span = (p.max - p.min) * 0.6
      const v = p.default + (Math.random() - 0.5) * span
      return Math.min(p.max, Math.max(p.min, Math.round(v / p.step) * p.step))
    })
  }

  function addColor() {
    if (preset.colors.length < MAX_COLORS)
      preset.colors.push(preset.colors.at(-1) ?? '#ffffff')
  }

  async function exportPng() {
    const [w, h] = exportSize.split('x').map(Number)
    // grain is sized in CSS px; scale it with the export so it reads like the preview
    const dpr = Math.max(1, Math.round(Math.max(w, h) / 1600))
    const blob = await renderer().toBlob($state.snapshot(preset), w, h, playing ? performance.now() / 1000 : STILL_TIME, dpr)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${preset.name.toLowerCase().replace(/\W+/g, '-') || 'grainfield'}-${w}x${h}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  async function copy(text: string, message: string) {
    await navigator.clipboard.writeText(text)
    flash(message)
  }

  function saveToGallery() {
    save(preset)
    flash('Saved to gallery')
  }
</script>

<div class='editor'>
  <div class='stage'>
    <PatternCanvas {preset} {playing} onerror={m => (error = m)} />
    {#if error}
      <pre class='error'>{error}</pre>
    {/if}
    <div class='stage-actions'>
      <button type='button' class='chip' onclick={() => (playing = !playing)} aria-pressed={!playing}>
        {playing ? 'Pause' : 'Play'}
      </button>
    </div>
  </div>

  <aside class='panel' aria-label='Controls'>
    <nav class='top'>
      <a href='#/' class='back'>← Gallery</a>
    </nav>

    <input class='title' aria-label='Name' bind:value={preset.name} />
    <p class='blurb'>{pattern.blurb}</p>

    <fieldset class='patterns'>
      <legend>Pattern</legend>
      {#each patternList as p (p.id)}
        <button type='button' class='chip' aria-pressed={preset.pattern === p.id} onclick={() => setPattern(p.id)}>{p.name}</button>
      {/each}
    </fieldset>

    <fieldset>
      <legend>Colours</legend>
      <div class='swatches'>
        {#each preset.colors as _, i (i)}
          <div class='swatch'>
            <input type='color' aria-label={`Colour ${i + 1}`} bind:value={preset.colors[i]} />
            {#if preset.colors.length > 1}
              <button type='button' aria-label={`Remove colour ${i + 1}`} onclick={() => preset.colors.splice(i, 1)}>×</button>
            {/if}
          </div>
        {/each}
        {#if preset.colors.length < MAX_COLORS}
          <button type='button' class='add' aria-label='Add colour' onclick={addColor}>+</button>
        {/if}
      </div>
      <div class='row'>
        <button type='button' class='chip' onclick={() => (preset.colors = randomPalette())}>Random palette</button>
        <button type='button' class='chip' onclick={() => preset.colors.reverse()}>Reverse</button>
      </div>
    </fieldset>

    <fieldset>
      <legend>Shape</legend>
      <div class='seed'>
        <Slider label='Seed' bind:value={preset.seed} min={0} max={1000} step={1} />
        <button type='button' class='chip' onclick={rollSeed} aria-label='Random seed'>⚄</button>
      </div>
      <Slider label='Scale' bind:value={preset.scale} min={0.2} max={3} step={0.01} />
      <Slider label='Speed' bind:value={preset.speed} min={0} max={3} step={0.01} />
      {#each pattern.params as p, i (`${preset.pattern}-${i}`)}
        <Slider label={p.label} bind:value={preset.params[i]} min={p.min} max={p.max} step={p.step} />
      {/each}
    </fieldset>

    <fieldset>
      <legend>Finish</legend>
      <div class='row' role='radiogroup' aria-label='Noise'>
        {#each ['Off', 'Smooth', 'Grain'] as label, i (label)}
          <button type='button' class='chip' role='radio' aria-checked={preset.grainMode === i} onclick={() => (preset.grainMode = i as 0 | 1 | 2)}>{label}</button>
        {/each}
      </div>
      {#if preset.grainMode !== 0}
        <Slider label='Noise amount' bind:value={preset.grain} min={0} max={0.5} step={0.01} />
      {/if}
      <Slider label='Contrast' bind:value={preset.contrast} min={0.5} max={2} step={0.01} />
      <Slider label='Saturation' bind:value={preset.saturation} min={0} max={2} step={0.01} />
    </fieldset>

    <fieldset class='actions'>
      <legend>Export</legend>
      <div class='row'>
        <select bind:value={exportSize} aria-label='Export size'>
          {#each EXPORT_SIZES as [value, label] (value)}
            <option {value}>{label}</option>
          {/each}
        </select>
        <button type='button' class='button' onclick={exportPng}>Download PNG</button>
      </div>
      <div class='row'>
        <button type='button' class='chip' onclick={shuffle}>Shuffle all</button>
        <button type='button' class='chip' onclick={saveToGallery}>Save</button>
        <button type='button' class='chip' onclick={() => copy(location.href, 'Link copied')}>Copy link</button>
        <button type='button' class='chip' onclick={() => copy(fragmentSource(preset.pattern), 'GLSL copied')}>Copy GLSL</button>
      </div>
    </fieldset>
  </aside>

  {#if toast}
    <div class='toast' role='status'>{toast}</div>
  {/if}
</div>

<style>
  .editor {
    display: grid;
    grid-template-columns: 1fr minmax(300px, 340px);
    block-size: 100dvh;
  }

  .stage {
    position: relative;
    min-block-size: 0;
    background: var(--surface);
  }

  .stage-actions {
    position: absolute;
    inset-block-end: 16px;
    inset-inline-start: 16px;
  }

  .stage-actions .chip {
    background: rgb(0 0 0 / 0.45);
    color: white;
    backdrop-filter: blur(8px);
    border-color: rgb(255 255 255 / 0.15);
  }

  .error {
    position: absolute;
    inset: 16px;
    margin: 0;
    padding: 16px;
    overflow: auto;
    background: rgb(20 0 0 / 0.85);
    color: #ffb4b4;
    font: var(--mono);
    white-space: pre-wrap;
  }

  .panel {
    display: grid;
    align-content: start;
    gap: 28px;
    padding: 20px 20px 40px;
    overflow-y: auto;
    border-inline-start: 1px solid var(--line);
  }

  .back {
    color: var(--muted);
    text-decoration: none;
  }

  .back:hover {
    color: var(--fg);
  }

  .title {
    margin: -8px 0 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--fg);
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -0.03em;
    inline-size: 100%;
  }

  .title:focus-visible {
    outline: none;
    box-shadow: 0 2px 0 var(--fg);
  }

  .blurb {
    margin: -20px 0 0;
    color: var(--muted);
    line-height: 1.45;
  }

  fieldset {
    display: grid;
    gap: 14px;
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend {
    margin-block-end: 14px;
    padding: 0;
    font: var(--mono);
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .patterns {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .seed {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: 8px;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .swatch {
    position: relative;
  }

  .swatch input,
  .add {
    display: block;
    inline-size: 36px;
    block-size: 36px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: none;
    cursor: pointer;
  }

  .swatch input::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .swatch input::-webkit-color-swatch {
    border: 0;
    border-radius: 9px;
  }

  .swatch input::-moz-color-swatch {
    border: 0;
    border-radius: 9px;
  }

  .add {
    color: var(--muted);
    font-size: 18px;
  }

  .swatch button {
    position: absolute;
    inset-block-start: -6px;
    inset-inline-end: -6px;
    inline-size: 18px;
    block-size: 18px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--fg);
    color: var(--bg);
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
  }

  .swatch:hover button,
  .swatch button:focus-visible {
    opacity: 1;
  }

  select {
    flex: 1;
    min-inline-size: 0;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--fg);
    font: inherit;
  }

  .toast {
    position: fixed;
    inset-block-end: 24px;
    inset-inline-start: 50%;
    translate: -50% 0;
    padding: 10px 16px;
    border-radius: 999px;
    background: var(--fg);
    color: var(--bg);
    font-weight: 500;
  }

  @media (max-width: 760px) {
    .editor {
      grid-template-columns: 1fr;
      grid-template-rows: 55dvh auto;
      block-size: auto;
    }

    .stage {
      position: sticky;
      inset-block-start: 0;
      z-index: 1;
    }

    .panel {
      overflow: visible;
      border: 0;
    }
  }
</style>
