import vertexSource from './shaders/fullscreen.vert.glsl?raw';
import fragmentSource from './shaders/hero.frag.glsl?raw';

/** Never render at more than 1.5x pixels, even on 3x phones. */
const MAX_DPR = 1.5;
/** Where the "mouse" rests when there is no pointer (and in the still frame). */
const REST_MOUSE = { x: 0.72, y: 0.62 };
/** The moment of the animation we show to reduced-motion users. */
const STILL_TIME = 18;

export type HeroController = {
  setPaused(paused: boolean): void;
  isPaused(): boolean;
  /** Draw one frame right now, optionally at a given time (dev contrast check). */
  renderNow(atTime?: number): WebGLRenderingContext;
};

type Options = {
  canvas: HTMLCanvasElement;
  /** The headline block; the shader darkens behind it so it stays readable. */
  textBlock: HTMLElement;
  /** Called when WebGL is missing or the context is lost: show the CSS gradient. */
  onFail(): void;
  /** Called whenever the paused state changes, so the button can update. */
  onPausedChange(paused: boolean): void;
};

export function startHero({ canvas, textBlock, onFail, onPausedChange }: Options): HeroController | null {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false, // a fullscreen triangle has no edges to smooth
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) {
    onFail();
    return null;
  }

  const program = createProgram(gl, vertexSource, fragmentSource);
  if (!program) {
    onFail();
    return null;
  }

  // One triangle, big enough to cover the -1..1 screen square.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPosition = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uTextBox = gl.getUniformLocation(program, 'u_textBox');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // --- state ---------------------------------------------------------------
  let time = STILL_TIME;
  let lastFrame = 0;
  let rafId = 0;
  let quality = 1; // drops if frames get slow (see adaptQuality)
  let slowFrames = 0;
  const mouse = { ...REST_MOUSE };
  const target = { ...REST_MOUSE };
  const textBox = [0, 0, 0, 0]; // left, bottom, right, top in canvas pixels

  // Pausing has several independent reasons; we only animate when none apply.
  let userPaused = reducedMotion.matches; // reduced motion = paused by default
  let tabHidden = document.hidden;
  let offscreen = false;

  // --- sizing --------------------------------------------------------------
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR) * quality;
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl!.viewport(0, 0, width, height);
    }
    measureText();
    draw(); // resizing clears the canvas, so repaint even when paused
  }

  // Where the headline block sits, in canvas pixels with y pointing up (GL style).
  function measureText() {
    const c = canvas.getBoundingClientRect();
    const t = textBlock.getBoundingClientRect();
    const scale = canvas.width / c.width;
    textBox[0] = (t.left - c.left) * scale;
    textBox[1] = (c.bottom - t.bottom) * scale;
    textBox[2] = (t.right - c.left) * scale;
    textBox[3] = (c.bottom - t.top) * scale;
  }

  // --- drawing -------------------------------------------------------------
  function draw() {
    gl!.uniform2f(uResolution, canvas.width, canvas.height);
    gl!.uniform1f(uTime, time);
    gl!.uniform2f(uMouse, mouse.x, mouse.y);
    gl!.uniform4f(uTextBox, textBox[0], textBox[1], textBox[2], textBox[3]);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  function frame(now: number) {
    rafId = requestAnimationFrame(frame);
    // Clamp dt so coming back from a pause never causes a jump.
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 1 / 60;
    lastFrame = now;
    time += dt;

    // Ease the shader's mouse toward the real pointer (frame-rate independent).
    const ease = 1 - Math.exp(-dt * 3);
    mouse.x += (target.x - mouse.x) * ease;
    mouse.y += (target.y - mouse.y) * ease;

    adaptQuality(dt);
    draw();
  }

  // If the GPU can't keep up (~40fps or worse for a while), render fewer pixels.
  function adaptQuality(dt: number) {
    slowFrames = dt > 0.025 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 45 && quality > 0.5) {
      quality -= 0.25;
      slowFrames = 0;
      resize();
    }
  }

  function update() {
    const shouldRun = !userPaused && !tabHidden && !offscreen;
    if (shouldRun && !rafId) {
      lastFrame = 0;
      rafId = requestAnimationFrame(frame);
    } else if (!shouldRun && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function setPaused(paused: boolean) {
    userPaused = paused;
    onPausedChange(paused);
    update();
  }

  // --- listeners -----------------------------------------------------------
  // Watch the text too: web fonts loading can change its size.
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas);
  sizeObserver.observe(textBlock);

  document.addEventListener('visibilitychange', () => {
    tabHidden = document.hidden;
    update();
  });

  new IntersectionObserver(([entry]) => {
    offscreen = !entry.isIntersecting;
    update();
  }).observe(canvas);

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      // Snap back to the exact still frame everyone with reduced motion sees.
      time = STILL_TIME;
      Object.assign(mouse, REST_MOUSE);
      Object.assign(target, REST_MOUSE);
      draw();
    }
    setPaused(reducedMotion.matches);
  });

  window.addEventListener(
    'pointermove',
    (e) => {
      const rect = canvas.getBoundingClientRect();
      target.x = (e.clientX - rect.left) / rect.width;
      target.y = 1 - (e.clientY - rect.top) / rect.height; // GL's y points up
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => Object.assign(target, REST_MOUSE));

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(rafId);
    rafId = 0;
    onFail();
  });

  // --- go ------------------------------------------------------------------
  resize(); // also draws the first frame, so there's never an empty hero
  onPausedChange(userPaused);
  update();

  return {
    setPaused,
    isPaused: () => userPaused,
    renderNow(atTime) {
      if (atTime !== undefined) time = atTime;
      draw();
      return gl!;
    },
  };
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}
