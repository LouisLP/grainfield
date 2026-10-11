// Each pattern is a GLSL `field(p, t)` plus up to four tunable params, read in
// the shader as u_p.x/y/z/w in declaration order.

export interface PatternParam {
  label: string
  min: number
  max: number
  step: number
  default: number
}

export interface Pattern {
  id: PatternId
  name: string
  blurb: string
  params: PatternParam[]
  glsl: string
}

export type PatternId = 'liquid' | 'warp' | 'horizon' | 'glow' | 'cells' | 'contour' | 'halftone' | 'bayer'

const liquid: Pattern = {
  id: 'liquid',
  name: 'Liquid',
  blurb: 'Iterated sine turbulence folded into soft marbled bands.',
  params: [
    { label: 'Turbulence', min: 0, max: 1.5, step: 0.01, default: 0.7 },
    { label: 'Frequency', min: 0.2, max: 3, step: 0.01, default: 1.2 },
    { label: 'Detail', min: 2, max: 10, step: 1, default: 6 },
    { label: 'Bands', min: 0.2, max: 6, step: 0.1, default: 2 },
  ],
  glsl: /* glsl */ `
float field(vec2 p, float t) {
  vec2 q = p;
  t *= 0.35;
  int iters = int(u_p.z);
  for (int j = 1; j < 11; j++) {
    if (j > iters) break;
    float fj = float(j);
    q += u_p.x * sin(q.yx * u_p.y * fj + t + S.xy * TAU + fj * 1.7) / fj;
  }
  float v = 0.5 + 0.5 * sin(dot(q, vec2(1.0, 0.62)) * u_p.w + length(q) * 0.6 + S.z * TAU);
  return smoothstep(0.08, 0.92, v);
}`,
}

const warp: Pattern = {
  id: 'warp',
  name: 'Warp',
  blurb: 'Fractal noise fed back into itself — smoke, ink, nebula.',
  params: [
    { label: 'Warp', min: 0, max: 6, step: 0.05, default: 3 },
    { label: 'Octaves', min: 1, max: 8, step: 1, default: 5 },
    { label: 'Frequency', min: 0.2, max: 4, step: 0.05, default: 1.2 },
    { label: 'Contrast', min: 0.5, max: 3, step: 0.05, default: 1.4 },
  ],
  glsl: /* glsl */ `
float field(vec2 p, float t) {
  int oct = int(u_p.y);
  vec3 o = S * 40.0;
  p *= u_p.z;
  t *= 0.08;
  vec2 q = vec2(fbm(vec3(p, t) + o, oct), fbm(vec3(p + vec2(5.2, 1.3), t) + o, oct));
  vec2 r = vec2(fbm(vec3(p + u_p.x * q + vec2(1.7, 9.2), t * 1.3) + o, oct),
                fbm(vec3(p + u_p.x * q + vec2(8.3, 2.8), t * 1.3) + o, oct));
  float v = fbm(vec3(p + u_p.x * r, t) + o, oct);
  return clamp(0.5 + 0.5 * v * u_p.w, 0.0, 1.0);
}`,
}

const horizon: Pattern = {
  id: 'horizon',
  name: 'Horizon',
  blurb: 'A vertical gradient with a noisy, drifting skyline.',
  params: [
    { label: 'Waviness', min: 0, max: 1.5, step: 0.01, default: 0.5 },
    { label: 'Frequency', min: 0.1, max: 4, step: 0.05, default: 1 },
    { label: 'Spread', min: 0.2, max: 3, step: 0.05, default: 1.2 },
    { label: 'Tilt', min: -1, max: 1, step: 0.01, default: 0 },
  ],
  glsl: /* glsl */ `
float field(vec2 p, float t) {
  // undo the seed rotation: a horizon should stay level
  p = rot(-u_seed * 2.39996323) * p;
  t *= 0.12;
  float n = fbm(vec3(p.x * u_p.y, p.y * u_p.y * 0.35 - t, t) + S * 30.0, 4);
  float y = p.y + p.x * u_p.w + n * u_p.x;
  return clamp(0.5 + 0.5 * y / u_p.z, 0.0, 1.0);
}`,
}

const glow: Pattern = {
  id: 'glow',
  name: 'Glow',
  blurb: 'A soft, breathing orb of light with a ragged noise edge.',
  params: [
    { label: 'Size', min: 0.2, max: 2.5, step: 0.01, default: 0.9 },
    { label: 'Distortion', min: 0, max: 1.5, step: 0.01, default: 0.45 },
    { label: 'Softness', min: 0.1, max: 3, step: 0.05, default: 1.2 },
    { label: 'Drift', min: 0, max: 1, step: 0.01, default: 0.3 },
  ],
  glsl: /* glsl */ `
float field(vec2 p, float t) {
  t *= 0.15;
  vec2 c = u_p.w * vec2(sin(t * 1.3 + S.x * TAU), cos(t * 0.9 + S.y * TAU)) * 0.5;
  vec2 d = p - c;
  float n = fbm(vec3(d * 1.4, t) + S * 20.0, 4);
  float r = length(d) / u_p.x + n * u_p.y;
  return exp(-pow(max(r, 0.0), 2.0) / u_p.z);
}`,
}

const cells: Pattern = {
  id: 'cells',
  name: 'Cells',
  blurb: 'Worley noise: drifting points carve the plane into cells.',
  params: [
    { label: 'Density', min: 1, max: 12, step: 0.1, default: 4 },
    { label: 'Jitter', min: 0, max: 1, step: 0.01, default: 0.9 },
    { label: 'Edges', min: 0, max: 1, step: 0.01, default: 0.6 },
    { label: 'Invert', min: 0, max: 1, step: 1, default: 0 },
  ],
  glsl: /* glsl */ `
float field(vec2 p, float t) {
  p = p * u_p.x + S.xy * 50.0;
  t *= 0.4;
  vec2 i = floor(p), f = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(x, y);
    vec3 h = hash33(vec3(i + o, 3.0));
    vec2 pt = o + 0.5 + u_p.y * 0.5 * sin(t + h.xy * TAU);
    float d = length(pt - f);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  float v = mix(f1, f2 - f1, u_p.z);
  v = clamp(v * 1.4, 0.0, 1.0);
  return u_p.w > 0.5 ? 1.0 - v : v;
}`,
}

const contour: Pattern = {
  id: 'contour',
  name: 'Contour',
  blurb: 'Topographic isolines traced through a slow noise landscape.',
  params: [
    { label: 'Lines', min: 2, max: 40, step: 1, default: 14 },
    { label: 'Thickness', min: 0.5, max: 4, step: 0.1, default: 1.2 },
    { label: 'Frequency', min: 0.2, max: 3, step: 0.05, default: 0.9 },
    { label: 'Fill', min: 0, max: 1, step: 0.01, default: 0.35 },
  ],
  glsl: /* glsl */ `
#define CUSTOM_FINISH
float field(vec2 p, float t) {
  return 0.5 + 0.5 * fbm(vec3(p * u_p.z, t * 0.05) + S * 30.0, 4);
}
float finish(float v, vec2 frag) {
  float x = v * u_p.x;
  float w = fwidth(x) * u_p.y * u_px;
  float d = abs(fract(x - 0.5) - 0.5);
  float line = 1.0 - smoothstep(w * 0.5, w * 1.5, d);
  float fill = floor(x) / u_p.x * u_p.w;
  float g = (grainAt(frag) - 0.5) * u_grain;
  return clamp(mix(fill, 1.0, line) + g, 0.0, 1.0);
}`,
}

const halftone: Pattern = {
  id: 'halftone',
  name: 'Halftone',
  blurb: 'Print-style dot screen over a warped noise field.',
  params: [
    { label: 'Cell (px)', min: 3, max: 40, step: 1, default: 9 },
    { label: 'Angle', min: 0, max: 90, step: 1, default: 45 },
    { label: 'Frequency', min: 0.2, max: 3, step: 0.05, default: 0.8 },
    { label: 'Dot gain', min: 0.5, max: 2, step: 0.05, default: 1 },
  ],
  glsl: /* glsl */ `
#define CUSTOM_FINISH
float field(vec2 p, float t) {
  vec3 q = vec3(p * u_p.z, t * 0.06) + S * 30.0;
  float w = fbm(q, 3);
  return clamp(0.5 + 0.7 * fbm(q + vec3(w * 1.5), 4), 0.0, 1.0);
}
float finish(float v, vec2 frag) {
  float cell = u_p.x * u_px;
  vec2 g = rot(radians(u_p.y)) * frag / cell;
  float d = length(fract(g) - 0.5);
  float r = sqrt(clamp(v + (grainAt(frag) - 0.5) * u_grain, 0.0, 1.0)) * 0.72 * u_p.w;
  float aa = 1.0 / cell;
  float ink = 1.0 - smoothstep(r - aa, r + aa, d);
  return ink * (0.35 + 0.65 * v);
}`,
}

const bayer: Pattern = {
  id: 'bayer',
  name: 'Dither',
  blurb: 'Ordered 8×8 Bayer dithering, one step per palette colour.',
  params: [
    { label: 'Pixel (px)', min: 1, max: 12, step: 1, default: 3 },
    { label: 'Warp', min: 0, max: 4, step: 0.05, default: 1.5 },
    { label: 'Frequency', min: 0.2, max: 3, step: 0.05, default: 0.7 },
    { label: 'Spread', min: 0.5, max: 3, step: 0.05, default: 1.3 },
  ],
  glsl: /* glsl */ `
#define CUSTOM_FINISH
float field(vec2 p, float t) {
  vec3 q = vec3(p * u_p.z, t * 0.07) + S * 30.0;
  vec2 w = vec2(fbm(q, 3), fbm(q + 7.3, 3));
  return clamp(0.5 + 0.5 * u_p.w * fbm(q + vec3(w * u_p.y, 0.0), 4), 0.0, 1.0);
}
float bayer8(vec2 c) {
  // recursive Bayer construction, 3 levels = 8x8; the finest level is most significant
  float b = 0.0, w = 0.25, s = 1.0;
  for (int i = 0; i < 3; i++) {
    vec2 m = mod(floor(c / s), 2.0);
    b += w * (m.x * 2.0 + m.y * 3.0 - 4.0 * m.x * m.y);
    w *= 0.25;
    s *= 2.0;
  }
  return b + 0.5 / 64.0;
}
float finish(float v, vec2 frag) {
  // the field is sampled per screen pixel; snap the threshold to the dither grid
  vec2 c = floor(frag / (u_p.x * u_px));
  float levels = float(max(u_count - 1, 1));
  float th = bayer8(c);
  return floor(v * levels + th) / levels;
}`,
}

export const patterns: Record<PatternId, Pattern> = { liquid, warp, horizon, glow, cells, contour, halftone, bayer }

export const patternList = Object.values(patterns)
