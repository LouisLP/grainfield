<script lang='ts'>
  import Editor from './components/Editor.svelte'
  import Gallery from './components/Gallery.svelte'
  import { decodePreset } from './lib/preset'

  let hash = $state(location.hash)

  $effect(() => {
    const onhash = () => (hash = location.hash)
    addEventListener('hashchange', onhash)
    return () => removeEventListener('hashchange', onhash)
  })

  const editing = $derived(hash.startsWith('#/edit/') ? decodePreset(hash.slice(7)) : null)

  // Scroll back to the top when switching views
  $effect(() => {
    void editing
    scrollTo(0, 0)
  })
</script>

{#if editing}
  {#key hash}
    <Editor initial={editing} />
  {/key}
{:else}
  <main class='page'>
    <Gallery />
    <footer>
      Built with WebGL2 · inspired by the shader work on Framer's <a href='https://www.framer.com/state-of-sites-2026/'>State of Sites 2026</a>
    </footer>
  </main>
{/if}

<style>
  .page {
    max-inline-size: 1400px;
    margin-inline: auto;
    padding-inline: clamp(16px, 4vw, 48px);
  }

  footer {
    padding-block: 96px 40px;
    color: var(--muted);
    font: var(--mono);
  }

  footer a {
    color: inherit;
  }
</style>
