// "Ink Silk" — fullscreen hero shader for Aqsa Saqib's portfolio.
// Idea: slow silk / ink-in-water folds in my own palette (deep ink, plum,
// teal, warm sand). The folds lean toward the cursor, a dark veil keeps the
// headline readable, and a little film grain stops it looking like plastic.

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  u_resolution; // canvas size in real (device) pixels
uniform float u_time;       // seconds of animation; frozen for reduced motion
uniform vec2  u_mouse;      // pointer in 0..1 (y up), already smoothed in JS
uniform vec4  u_textBox;    // headline block in pixels: (left, bottom, right, top)

// ---------------------------------------------------------------------------
// 1. Noise building blocks
// ---------------------------------------------------------------------------

// hash: turns a 2D point into a "random" number in 0..1. Same input, same
// output, so the pattern is stable. No sin(), so it behaves the same on
// every GPU.
float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// noise: smooth value noise. Take the random value at the 4 corners of the
// grid cell we're in and blend between them with a smooth S-curve, so there
// are no hard edges.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep curve
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// fbm ("fractal brownian motion"): stack 5 layers of noise. Each layer is
// twice as detailed and half as strong, giving big soft shapes with finer
// detail on top. Rotating each layer hides the square noise grid.
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p = rot * p * 2.02;
    amp *= 0.5;
  }
  return value;
}

// ---------------------------------------------------------------------------
// 2. My palette (linear-ish RGB, 0..1)
// ---------------------------------------------------------------------------
const vec3 INK  = vec3(0.020, 0.024, 0.060); // near-black navy, the base
const vec3 PLUM = vec3(0.235, 0.075, 0.330); // main body colour
const vec3 TEAL = vec3(0.000, 0.430, 0.450); // cool accent
const vec3 SAND = vec3(0.960, 0.640, 0.420); // warm highlight on the folds

void main() {
  // -------------------------------------------------------------------------
  // 3. Coordinates
  // uv = 0..1 across the screen (good for placing things like the veil).
  // p  = centred, aspect-correct space, so shapes don't stretch on wide or
  //      tall screens. m = the mouse in that same space.
  // -------------------------------------------------------------------------
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 m = (u_mouse - 0.5) * vec2(aspect, 1.0);

  // -------------------------------------------------------------------------
  // 4. Mouse lean
  // Pixels near the cursor get pulled toward it (strong close by, fading
  // out with a gaussian), and the whole field drifts a touch toward the
  // cursor's side. Because this bends the *input* to the noise, the silk
  // looks like it is being gently tugged, not painted on.
  // -------------------------------------------------------------------------
  vec2 toMouse = m - p;
  float near = exp(-dot(toMouse, toMouse) * 4.0); // 1 at cursor, ~0 far away
  p += toMouse * near * 0.22;
  p += m * 0.06;

  float t = u_time * 0.04; // slow it right down: calm, not busy

  // -------------------------------------------------------------------------
  // 5. Domain warping (the "silk" look)
  // Instead of reading fbm(p) directly, we use fbm to push p around, then
  // read fbm again at the pushed position - twice. q and r are those pushes.
  // Moving q and r in opposite directions over time makes the folds roll.
  // -------------------------------------------------------------------------
  vec2 base = p * 1.6;
  vec2 q = vec2(fbm(base + vec2(0.0, t)),
                fbm(base + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(base + 3.5 * q + vec2(1.7, 9.2) + 1.6 * t),
                fbm(base + 3.5 * q + vec2(8.3, 2.8) - 1.2 * t));
  float f = fbm(base + 3.5 * r);

  // -------------------------------------------------------------------------
  // 6. Colour
  // f decides ink vs plum, q.y brings in teal in the cool regions, and where
  // f and r.x are both high (the crest of a fold) we add warm sand. The last
  // line deepens valleys and lifts ridges for a sense of depth.
  // -------------------------------------------------------------------------
  vec3 col = mix(INK, PLUM, smoothstep(0.2, 0.7, f));
  col = mix(col, TEAL, smoothstep(0.4, 0.8, q.y) * 0.85);
  col = mix(col, SAND, smoothstep(0.45, 0.8, f * r.x * 1.6) * 0.85);
  col *= 0.7 + 0.9 * f;

  // 7. Soft warm glow right under the cursor, so the interaction is visible.
  col += SAND * near * 0.10;

  // -------------------------------------------------------------------------
  // 8. Readability veil + vignette
  // JS tells us where the headline block is (u_textBox), so we fade toward
  // INK around exactly that box, on any screen size. Two soft bands darken the top (nav) and bottom (pause button
  // row) too. Contrast is part of the shader, not a CSS afterthought.
  // The vignette darkens the corners to frame everything.
  // -------------------------------------------------------------------------
  // Distance (in screen-heights) from this pixel to the text box: 0 inside,
  // growing outside. The veil is full strength on the text and fades out
  // over ~40% of the screen height, so it never looks like a hard box.
  vec2 boxMin = u_textBox.xy / u_resolution.y;
  vec2 boxMax = u_textBox.zw / u_resolution.y;
  vec2 here = gl_FragCoord.xy / u_resolution.y;
  vec2 outside = max(max(boxMin - here, here - boxMax), 0.0);
  float veil = smoothstep(0.4, 0.0, length(outside));
  float bands = smoothstep(0.8, 0.97, uv.y) + smoothstep(0.2, 0.03, uv.y);
  col = mix(col, INK, clamp(veil * 0.85 + bands * 0.85, 0.0, 0.9));

  vec2 v = uv - 0.5;
  col *= 1.0 - dot(v, v) * 0.6;

  // -------------------------------------------------------------------------
  // 9. Grain
  // A new random value per pixel each frame (fract(u_time) changes the
  // seed). Tiny strength: just enough to break up banding in the gradients.
  // -------------------------------------------------------------------------
  float grain = hash(gl_FragCoord.xy + fract(u_time) * 97.0) - 0.5;
  col += grain * 0.045;

  gl_FragColor = vec4(col, 1.0);
}
