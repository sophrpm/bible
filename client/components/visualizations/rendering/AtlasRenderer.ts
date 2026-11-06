import type { AtlasData } from '../../../../shared/bible';

import { vertex, fragment, quadVertex, quadFragment } from './atlasShaders';

/** Cache the dense background in a texture; hover redraws only the focused instances. */
export class AtlasRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly compositor: WebGLProgram;
  private readonly buffer: WebGLBuffer;
  private readonly focusBuffer: WebGLBuffer;
  private readonly texture: WebGLTexture;
  private readonly framebuffer: WebGLFramebuffer;
  private readonly edges: Float32Array;
  private backgroundKey = '';
  private focusKey = '';
  private focusedCount = 0;
  constructor(canvas: HTMLCanvasElement, data: AtlasData) {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) throw new Error('Este navegador no dispone de WebGL2.');
    this.gl = gl;
    this.edges = new Float32Array(data.edges);
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(shader) || 'Error de shader');
      return shader;
    };
    const link = (vs: string, fs: string) => {
      const program = gl.createProgram()!,
        v = compile(gl.VERTEX_SHADER, vs),
        f = compile(gl.FRAGMENT_SHADER, fs);
      gl.attachShader(program, v);
      gl.attachShader(program, f);
      gl.linkProgram(program);
      gl.deleteShader(v);
      gl.deleteShader(f);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error('No se pudo preparar el atlas.');
      return program;
    };
    this.program = link(vertex, fragment);
    this.compositor = link(quadVertex, quadFragment);
    this.buffer = gl.createBuffer()!;
    this.focusBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.edges, gl.STATIC_DRAW);
    this.texture = gl.createTexture()!;
    this.framebuffer = gl.createFramebuffer()!;
  }
  private drawLines(
    buffer: WebGLBuffer,
    width: number,
    height: number,
    start: number,
    end: number,
    focus: [number, number],
    dark: boolean,
    count: number,
  ) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.vertexAttribDivisor(0, 1);
    gl.uniform2f(gl.getUniformLocation(this.program, 'viewport'), width, height);
    gl.uniform2f(gl.getUniformLocation(this.program, 'viewRange'), start, end);
    gl.uniform2f(gl.getUniformLocation(this.program, 'focusRange'), ...focus);
    gl.uniform1f(gl.getUniformLocation(this.program, 'dark'), dark ? 1 : 0);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArraysInstanced(gl.LINE_STRIP, 0, 49, count);
  }
  draw(
    width: number,
    height: number,
    start: number,
    end: number,
    focus: [number, number],
    dark: boolean,
    count: number,
  ): void {
    const gl = this.gl,
      canvas = gl.canvas as HTMLCanvasElement,
      ratio = Math.min(devicePixelRatio || 1, 2);
    const pixelWidth = Math.max(1, Math.floor(width * ratio)),
      pixelHeight = Math.max(1, Math.floor(height * ratio));
    const key = [pixelWidth, pixelHeight, start, end, dark].join('|');
    gl.enable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    if (key !== this.backgroundKey) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        pixelWidth,
        pixelHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.drawLines(this.buffer, width, height, start, end, [-1, -1], dark, count);
      this.backgroundKey = key;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.compositor);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(this.compositor, 'image'), 0);
    gl.uniform1f(gl.getUniformLocation(this.compositor, 'opacity'), focus[1] > focus[0] ? 0.22 : 1);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (focus[1] > focus[0]) {
      const nextFocus = focus.join('|');
      if (nextFocus !== this.focusKey) {
        const selected: number[] = [];
        for (let i = 0; i < this.edges.length; i += 4) {
          if (
            (this.edges[i] >= focus[0] && this.edges[i] < focus[1]) ||
            (this.edges[i + 1] >= focus[0] && this.edges[i + 1] < focus[1])
          )
            selected.push(this.edges[i], this.edges[i + 1], this.edges[i + 2], this.edges[i + 3]);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.focusBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(selected), gl.DYNAMIC_DRAW);
        this.focusedCount = selected.length / 4;
        this.focusKey = nextFocus;
      }
      this.drawLines(this.focusBuffer, width, height, start, end, focus, dark, this.focusedCount);
    }
  }
  dispose(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.buffer);
    gl.deleteBuffer(this.focusBuffer);
    gl.deleteTexture(this.texture);
    gl.deleteFramebuffer(this.framebuffer);
    gl.deleteProgram(this.program);
    gl.deleteProgram(this.compositor);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
