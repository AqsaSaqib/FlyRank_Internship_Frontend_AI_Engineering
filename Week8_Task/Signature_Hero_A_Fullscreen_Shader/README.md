# Ink Silk – Signature Shader Hero (Week 8)

A fullscreen hero for my portfolio. The background is a fragment shader I wrote in GLSL. It shows slow, silky folds in my own colours, and they lean toward your cursor.

**Live link:** _add after deploying_

## Shader

- [`src/shaders/hero.frag.glsl`](src/shaders/hero.frag.glsl): the shader. Each section has a comment.
- [`src/hero.ts`](src/hero.ts): WebGL setup, uniforms and pausing.

It uses `u_time`, `u_resolution` and `u_mouse`, plus `u_textBox`. That one tells the shader where the headline is, so it can darken the area behind it. All text passes WCAG AA contrast (at least 6.9:1).

## Reduced motion and performance

Pixel ratio is capped at 1.5 and drops if frames get slow. Drawing stops when the tab is hidden or the hero is scrolled off-screen. With reduced motion turned on, you see one still frame of the shader. Without WebGL, you see a CSS gradient in the same colours. A button lets anyone pause the motion.

## Run it

```bash
npm install
npm run dev
```
