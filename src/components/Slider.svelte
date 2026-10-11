<script lang='ts'>
  interface Props {
    label: string
    value: number
    min: number
    max: number
    step: number
  }

  let { label, value = $bindable(), min, max, step }: Props = $props()

  const decimals = $derived(step >= 1 ? 0 : String(step).split('.')[1]?.length ?? 2)
  const fill = $derived(`${((value - min) / (max - min)) * 100}%`)
</script>

<label class='slider' style:--fill={fill}>
  <span class='label'>{label}</span>
  <output>{value.toFixed(decimals)}</output>
  <input type='range' {min} {max} {step} bind:value />
</label>

<style>
  .slider {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px;
  }

  .label {
    color: var(--muted);
  }

  output {
    font: var(--mono);
    font-variant-numeric: tabular-nums;
  }

  input {
    grid-column: 1 / -1;
    appearance: none;
    inline-size: 100%;
    block-size: 4px;
    margin: 4px 0;
    border-radius: 2px;
    background: linear-gradient(to right, var(--fg) var(--fill), var(--line) var(--fill));
    cursor: pointer;
  }

  input::-webkit-slider-thumb {
    appearance: none;
    inline-size: 14px;
    block-size: 14px;
    border-radius: 50%;
    background: var(--fg);
    border: 3px solid var(--bg);
    box-sizing: content-box;
  }

  input::-moz-range-thumb {
    inline-size: 14px;
    block-size: 14px;
    border-radius: 50%;
    background: var(--fg);
    border: 3px solid var(--bg);
  }

  input:focus-visible {
    outline: 2px solid var(--fg);
    outline-offset: 4px;
  }
</style>
