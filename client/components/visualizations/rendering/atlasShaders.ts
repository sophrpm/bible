/** One instance per reference, with 49 vertices along its semicircular arc. */
export const vertex = `#version 300 es
precision highp float;
layout(location = 0) in vec4 edge;
uniform vec2 viewport;
uniform vec2 viewRange;
uniform vec2 focusRange;
uniform float dark;
out vec4 color;

vec3 palette(float genre) {
  if (genre < 0.5) return vec3(0.89, 0.32, 0.58);
  if (genre < 1.5) return vec3(0.85, 0.29, 0.08);
  if (genre < 2.5) return vec3(0.75, 0.62, 0.09);
  if (genre < 3.5) return vec3(0.77, 0.28, 0.64);
  if (genre < 4.5) return vec3(0.57, 0.68, 0.12);
  if (genre < 5.5) return vec3(0.12, 0.68, 0.73);
  if (genre < 6.5) return vec3(0.13, 0.60, 0.31);
  if (genre < 7.5) return vec3(0.12, 0.57, 0.90);
  if (genre < 8.5) return vec3(0.13, 0.70, 0.57);
  return vec3(0.59, 0.36, 0.86);
}

void main() {
  float t = float(gl_VertexID) / 48.0;
  float scale = (viewport.x - 56.0) / (viewRange.y - viewRange.x);
  float a = 28.0 + (edge.x - viewRange.x) * scale;
  float b = 28.0 + (edge.y - viewRange.x) * scale;
  float baseline = viewport.y - 48.0;
  float rise = min(abs(b - a) * 0.5, baseline - 22.0);
  float x = (a + b) * 0.5 - (b - a) * 0.5 * cos(t * 3.14159265);
  float y = baseline - sin(t * 3.14159265) * max(2.0, rise);
  gl_Position = vec4(x / viewport.x * 2.0 - 1.0, 1.0 - y / viewport.y * 2.0, 0.0, 1.0);

  bool focused = focusRange.y > focusRange.x;
  bool connected = (edge.x >= focusRange.x && edge.x < focusRange.y)
    || (edge.y >= focusRange.x && edge.y < focusRange.y);
  float alpha = mix(0.008, 0.014, dark) * (0.4 + 0.6 * edge.w);
  if (focused) alpha *= connected ? 8.0 : 0.16;
  color = vec4(palette(edge.z), min(0.8, alpha));
}`;

export const fragment = `#version 300 es
precision highp float;
in vec4 color;
out vec4 outputColor;
void main() {
  outputColor = color;
}`;

/** A fullscreen triangle composites the premultiplied, cached reference background. */
export const quadVertex = `#version 300 es
out vec2 uv;
void main() {
  vec2 points[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vec2 point = points[gl_VertexID];
  uv = point * 0.5 + 0.5;
  gl_Position = vec4(point, 0.0, 1.0);
}`;

export const quadFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D image;
uniform float opacity;
out vec4 outputColor;
void main() {
  outputColor = texture(image, uv) * opacity;
}`;
