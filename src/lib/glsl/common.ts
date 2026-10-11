// Shared GLSL prelude and epilogue. A pattern supplies `float field(vec2 p, float t)`
// returning roughly 0..1, and may override `finish` by defining CUSTOM_FINISH.

export const MAX_COLORS = 8

export const prelude = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform float u_seed;
uniform float u_scale;
uniform float u_px;          // device pixel ratio, so grain size is in CSS pixels
uniform vec3 u_lab[${MAX_COLORS}]; // palette, pre-converted to OKLab on the CPU
uniform int u_count;
uniform float u_grain;
uniform int u_grainMode;     // 0 off, 1 smooth (IGN), 2 grain (white)
uniform float u_contrast;
uniform float u_sat;
uniform vec4 u_p;            // pattern-specific params

out vec4 outColor;

vec3 S;                      // per-seed random offsets, 0..1

const float TAU = 6.28318530718;

// pcg3d — Jarzynski & Olano, "Hash Functions for GPU Rendering" (JCGT 2020)
uvec3 pcg3d(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}

vec3 hash33(vec3 p) {
  uvec3 h = pcg3d(uvec3(ivec3(floor(p)) + 65536));
  return vec3(h) / float(0xffffffffu);
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// Quintic-interpolated 3D gradient noise, ~[-1, 1]
float gnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  #define G(o) dot(hash33(i + o) * 2.0 - 1.0, f - o)
  float n = mix(
    mix(mix(G(vec3(0,0,0)), G(vec3(1,0,0)), u.x), mix(G(vec3(0,1,0)), G(vec3(1,1,0)), u.x), u.y),
    mix(mix(G(vec3(0,0,1)), G(vec3(1,0,1)), u.x), mix(G(vec3(0,1,1)), G(vec3(1,1,1)), u.x), u.y),
    u.z);
  #undef G
  return n * 1.6;
}

float fbm(vec3 p, int octaves) {
  float sum = 0.0, amp = 0.5, norm = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * gnoise(p);
    norm += amp;
    p = vec3(rot(0.6) * p.xy * 2.03, p.z * 1.4 + 3.1);
    amp *= 0.5;
  }
  return sum / norm;
}

// Interleaved gradient noise — Jimenez 2014. Even, low-discrepancy.
float ign(vec2 c) { return fract(52.9829189 * fract(dot(c, vec2(0.06711056, 0.00583715)))); }

float whiteNoise(vec2 c) { return vec3(pcg3d(uvec3(ivec2(c) + 65536, 7u))).x / float(0xffffffffu); }

float grainAt(vec2 frag) {
  vec2 c = floor(frag / u_px);
  if (u_grainMode == 1) return ign(c);
  if (u_grainMode == 2) return whiteNoise(c);
  return 0.5;
}
`

export const epilogue = /* glsl */ `
#ifndef CUSTOM_FINISH
float finish(float v, vec2 frag) {
  return clamp(v + (grainAt(frag) - 0.5) * u_grain, 0.0, 1.0);
}
#endif

vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}

vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

vec3 paletteLab(float t) {
  if (u_count < 2) return u_lab[0];
  float x = clamp(t, 0.0, 1.0) * float(u_count - 1);
  int i = min(int(x), u_count - 2);
  return mix(u_lab[i], u_lab[i + 1], x - float(i));
}

void main() {
  S = hash33(vec3(u_seed, u_seed * 1.5 + 7.0, u_seed * 2.7 + 13.0));
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag * 2.0 - u_res) / min(u_res.x, u_res.y);
  p = rot(u_seed * 2.39996323) * p / u_scale;

  float v = finish(field(p, u_time), frag);

  vec3 lab = paletteLab(v);
  lab.x = clamp((lab.x - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  lab.yz *= u_sat;
  outColor = vec4(linearToSrgb(oklabToLinear(lab)), 1.0);
}
`
