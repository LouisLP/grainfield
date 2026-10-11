<script lang='ts'>
  import type { Preset } from '../lib/preset'
  import { patterns } from '../lib/patterns'
  import { encodePreset } from '../lib/preset'
  import PatternCanvas from './PatternCanvas.svelte'

  interface Props {
    preset: Preset
    onremove?: () => void
  }

  const { preset, onremove }: Props = $props()
</script>

<li class='tile'>
  <a href={`#/edit/${encodePreset(preset)}`}>
    <div class='frame'>
      <PatternCanvas {preset} maxDpr={1.5} />
    </div>
    <span class='name'>{preset.name}</span>
    <span class='kind'>{patterns[preset.pattern].name}</span>
  </a>
  {#if onremove}
    <button class='remove' type='button' aria-label={`Remove ${preset.name}`} onclick={onremove}>×</button>
  {/if}
</li>

<style>
  .tile {
    position: relative;
    list-style: none;
  }

  a {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px 8px;
    color: inherit;
    text-decoration: none;
  }

  .frame {
    grid-column: 1 / -1;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-radius: var(--radius);
    background: var(--surface);
    transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), border-radius 0.4s;
  }

  a:hover .frame,
  a:focus-visible .frame {
    transform: scale(0.98);
    border-radius: calc(var(--radius) * 1.6);
  }

  a:focus-visible {
    outline: none;
  }

  a:focus-visible .frame {
    outline: 2px solid var(--fg);
    outline-offset: 3px;
  }

  .name {
    font-weight: 500;
  }

  .kind {
    font: var(--mono);
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    align-self: center;
  }

  .remove {
    position: absolute;
    inset-block-start: 10px;
    inset-inline-end: 10px;
    inline-size: 28px;
    block-size: 28px;
    border: 0;
    border-radius: 50%;
    background: rgb(0 0 0 / 0.5);
    color: white;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .tile:hover .remove,
  .remove:focus-visible {
    opacity: 1;
  }
</style>
