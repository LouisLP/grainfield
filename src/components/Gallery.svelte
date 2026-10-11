<script lang='ts'>
  import { randomPalette } from '../lib/color'
  import { gallery } from '../lib/gallery'
  import { patternList } from '../lib/patterns'
  import { encodePreset, makePreset } from '../lib/preset'
  import { remove, saved } from '../lib/saved.svelte'
  import Tile from './Tile.svelte'

  function surprise() {
    const pattern = patternList[Math.floor(Math.random() * patternList.length)]
    const p = makePreset(pattern.id, {
      name: 'Untitled',
      colors: randomPalette(),
      seed: Math.floor(Math.random() * 1000),
    })
    location.hash = `#/edit/${encodePreset(p)}`
  }
</script>

<header class='intro'>
  <h1>grainfield</h1>
  <p>
    A gallery of generative noise. Every tile is a live fragment shader — fields of turbulence,
    fractal warps and cellular noise, mapped through an OKLab palette and finished with grain.
    Open one to tune it, then export a PNG or share the link.
  </p>
  <button type='button' class='button' onclick={surprise}>New random pattern</button>
</header>

{#if saved.list.length}
  <section aria-labelledby='saved-heading'>
    <h2 id='saved-heading'>Saved</h2>
    <ul class='grid'>
      {#each saved.list as preset, i (encodePreset(preset) + i)}
        <Tile {preset} onremove={() => remove(i)} />
      {/each}
    </ul>
  </section>
{/if}

<section aria-labelledby='gallery-heading'>
  <h2 id='gallery-heading'>Gallery</h2>
  <ul class='grid'>
    {#each gallery as preset (preset.name)}
      <Tile {preset} />
    {/each}
  </ul>
</section>

<style>
  .intro {
    display: grid;
    justify-items: start;
    gap: 20px;
    max-inline-size: 60ch;
    padding-block: clamp(48px, 10vw, 120px) 56px;
  }

  h1 {
    margin: 0;
    font-size: clamp(44px, 8vw, 96px);
    font-weight: 600;
    letter-spacing: -0.045em;
    line-height: 0.9;
  }

  .intro p {
    margin: 0;
    color: var(--muted);
    font-size: 17px;
    line-height: 1.5;
  }

  section + section {
    margin-block-start: 64px;
  }

  h2 {
    margin: 0 0 20px;
    font: var(--mono);
    font-weight: 400;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
    gap: 40px 20px;
    margin: 0;
    padding: 0;
  }
</style>
