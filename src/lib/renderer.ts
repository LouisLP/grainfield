import type { PatternId } from './patterns'
import type { Preset } from './preset'
import { hexToOklab } from './color'
import { epilogue, MAX_COLORS, prelude } from './glsl/common'
import { patterns } from './patterns'

// One WebGL2 context serves every tile: each draw renders into the corner of a
// shared canvas, then gets blitted to the tile's own 2D canvas. Browsers cap
// live GL contexts at ~16, so a context per tile won't scale to a gallery.

const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`

const UNIFORMS = ['u_res', 'u_time', 'u_seed', 'u_scale', 'u_px', 'u_lab', 'u_count', 'u_grain', 'u_grainMode', 'u_contrast', 'u_sat', 'u_p'] as const
type UniformName = typeof UNIFORMS[number]

interface Program {
  program: WebGLProgram
  loc: Record<UniformName, WebGLUniformLocation | null>
}

export function fragmentSource(id: PatternId): string {
  return prelude + patterns[id].glsl + epilogue
}

class Renderer {
  readonly canvas = document.createElement('canvas')
  private gl: WebGL2RenderingContext
  private programs = new Map<PatternId, Program>()

  constructor() {
    const gl = this.canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false })
    if (!gl)
      throw new Error('WebGL2 is not available')
    this.gl = gl
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  }

  private compile(type: number, src: string): WebGLShader {
    const gl = this.gl
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(sh) ?? 'shader compile failed')
    return sh
  }

  private program(id: PatternId): Program {
    const cached = this.programs.get(id)
    if (cached)
      return cached
    const gl = this.gl
    const program = gl.createProgram()
    gl.attachShader(program, this.compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, this.compile(gl.FRAGMENT_SHADER, fragmentSource(id)))
    gl.bindAttribLocation(program, 0, 'a_pos')
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program) ?? 'link failed')
    const loc = Object.fromEntries(UNIFORMS.map(u => [u, gl.getUniformLocation(program, u === 'u_lab' ? 'u_lab[0]' : u)])) as Program['loc']
    const p = { program, loc }
    this.programs.set(id, p)
    return p
  }

  /** Render `preset` at w×h device pixels into the shared canvas's bottom-left corner. */
  render(preset: Preset, w: number, h: number, time: number, dpr: number): void {
    const gl = this.gl
    if (this.canvas.width < w || this.canvas.height < h) {
      this.canvas.width = Math.max(this.canvas.width, w)
      this.canvas.height = Math.max(this.canvas.height, h)
    }
    const { program, loc } = this.program(preset.pattern)
    gl.useProgram(program)
    gl.viewport(0, 0, w, h)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const colors = preset.colors.slice(0, MAX_COLORS)
    const lab = new Float32Array(MAX_COLORS * 3)
    colors.forEach((c, i) => lab.set(hexToOklab(c), i * 3))
    const params = [0, 1, 2, 3].map(i => preset.params[i] ?? 0) as [number, number, number, number]

    gl.uniform2f(loc.u_res, w, h)
    gl.uniform1f(loc.u_time, time * preset.speed)
    gl.uniform1f(loc.u_seed, preset.seed)
    gl.uniform1f(loc.u_scale, preset.scale)
    gl.uniform1f(loc.u_px, dpr)
    gl.uniform3fv(loc.u_lab, lab)
    gl.uniform1i(loc.u_count, colors.length)
    gl.uniform1f(loc.u_grain, preset.grain)
    gl.uniform1i(loc.u_grainMode, preset.grainMode)
    gl.uniform1f(loc.u_contrast, preset.contrast)
    gl.uniform1f(loc.u_sat, preset.saturation)
    gl.uniform4f(loc.u_p, ...params)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  /** Render and copy into a 2D canvas sized w×h. */
  drawTo(ctx: CanvasRenderingContext2D, preset: Preset, time: number, dpr: number): void {
    const { width: w, height: h } = ctx.canvas
    if (w === 0 || h === 0)
      return
    this.render(preset, w, h, time, dpr)
    ctx.drawImage(this.canvas, 0, this.canvas.height - h, w, h, 0, 0, w, h)
  }

  async toBlob(preset: Preset, w: number, h: number, time: number, dpr: number): Promise<Blob> {
    const out = document.createElement('canvas')
    out.width = w
    out.height = h
    this.drawTo(out.getContext('2d')!, preset, time, dpr)
    return new Promise((resolve, reject) => out.toBlob(b => (b ? resolve(b) : reject(new Error('export failed'))), 'image/png'))
  }
}

let instance: Renderer | null = null

export function renderer(): Renderer {
  instance ??= new Renderer()
  return instance
}
