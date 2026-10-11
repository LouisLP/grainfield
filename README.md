# grainfield

A gallery of live, tunable noise shaders, inspired by the grainy gradients on Framer's
[State of Sites 2026](https://www.framer.com/state-of-sites-2026/).

```sh
pnpm install
pnpm dev
```

## How it works

- **One WebGL2 context for everything** (`src/lib/renderer.ts`). Each tile renders into a corner of a
  shared offscreen canvas, then gets copied into its own 2D canvas. Browsers cap live GL contexts at
  about 16, so a context per tile won't scale. Only tiles that are on screen animate.
- **Patterns** (`src/lib/patterns.ts`) are a GLSL `field(p, t)` that returns 0–1, plus up to four
  params. A pattern can override `finish()` for screen-space effects (halftone, Bayer dither, contours).
- **The shared pipeline** (`src/lib/glsl/common.ts`) handles seed rotation, the field, grain
  (Off / Smooth IGN / Grain white noise), an N-stop palette interpolated in OKLab, contrast,
  saturation, and sRGB encoding.
- **Presets** live in the URL hash as base64url JSON, so the address bar is always a shareable link.
  Saved presets go in localStorage.

Framer's page uses a single "Liquid Gradient" shader (iterated-sine turbulence + grain dither). The
Liquid pattern here is my own take on that technique; the rest are standard noise families.
