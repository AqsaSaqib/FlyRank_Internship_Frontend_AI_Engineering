# Aura One: First 3D Experience (Week 7)

An interactive 3D product configurator for a fictional smart speaker, built with **React Three Fiber**. Rotate it, restyle it, pull it apart, or drop in your own `.glb` and stage it in the same studio.

**Live URL:** _add after deploying (see [Deploy](#deploy))_

## What it does

| Interaction | How |
| --- | --- |
| Orbit / zoom | Drag (mouse or one finger), scroll or pinch. Pan is off and the polar angle is clamped so you can't lose the product under the floor. |
| Change material | 5 fabric colours (a `meshPhysicalMaterial` with sheen, for a knitted-cloth falloff) and 3 trim finishes (matte, satin, brushed metal). |
| Swap a part | Puck base ↔ tripod legs. |
| Trigger an animation | **Exploded view** springs the cap, light ring and base apart (frame-rate-independent `MathUtils.damp`). |
| React to cursor | The speaker tilts slightly toward the pointer or touch point, and the light ring pulses. |
| Load your own model | Drag a `.glb` onto the viewer or use **Load your own .glb**. DRACO and meshopt files work. The model is auto-centred, scaled to fit and placed on the floor. Wireframe still applies to it. |
| Perf stats | A live overlay showing fps, draw calls, triangles and the current DPR, written straight to the DOM so it doesn't cause React re-renders. |

## How it loads responsibly

- **Canvas is lazy-loaded.** `three`, `@react-three/fiber` and `drei` only live in a `React.lazy` chunk (`Scene-*.js`). The page shell (copy, configurator, SVG poster) paints first. The 3D chunk is requested only when the viewer is on screen **and** the browser is idle (`requestIdleCallback`, 1.5 s timeout).
- **Static fallback.** `Poster.tsx` is an inline SVG illustration that follows the configurator choices. It is shown:
  - while the 3D chunk downloads,
  - when `prefers-reduced-motion: reduce` is set,
  - when Data Saver is on, the connection is 2G, or the device reports ≤ 2 GB memory or ≤ 2 cores,
  - when WebGL is unavailable (no opt-in button in that case).

  In every opt-in case the user sees why and gets a **Load interactive 3D (~300 KB)** button. Hovering or focusing it prefetches the chunk.
- **No model download for the default scene.** The speaker is procedural geometry (cylinders and tori), so it costs 0 KB of assets. Lighting comes from drei `<Lightformer>`s baked once into an environment map (`frames={1}`), so there's no HDRI download either.
- **User models are bounded.** Only `.glb` is accepted, and anything over 25 MB is rejected with a message. Object URLs are revoked and `useGLTF.clear()` evicts the cache when you switch back.

## Keeping the phone cool

- DPR is capped at 1.5, and drei's `PerformanceMonitor` drops it to 1 if the frame rate sags.
- The render loop **stops completely** (`frameloop="never"`) when the viewer scrolls off-screen or the tab is hidden.
- With reduced motion (if the user opts in anyway), auto-rotate, the pulse and the cursor tilt turn off and the canvas switches to `frameloop="demand"`, so it only renders on interaction.
- There are no real-time shadow maps. A single 256 px `ContactShadows` pass grounds the object.
- Touch: `touch-action: none` on the canvas, one-finger orbit, pinch zoom, and 40 px+ tap targets in the panel.

## Perf note (FE-10 lens)

Measured from `npm run build` and a `vite preview` run in Chromium (desktop, DPR 1.25):

| | Raw | Gzip | When it loads |
| --- | --- | --- | --- |
| `index.js` (React + UI shell) | 231 KB | **73 KB** | Initial |
| `index.css` | 5.8 KB | 2 KB | Initial |
| `Scene.js` (three + R3F + drei) | 1,065 KB | **290 KB** | Lazy, after first paint |
| Model / textures / HDRI | 0 | 0 | None (procedural) |

- **Load:** first paint and LCP (the heading) landed at about 300 ms locally. The `Scene` chunk request started *after* first contentful paint, so the 3D view adds nothing to the critical path. On the reduced-motion and low-power paths it is never downloaded.
- **Frame rate:** the scene is about **22 draw calls and 9.4k triangles** per frame (contact-shadow pass included). Nothing in it grows over time. My only fps reading so far came from a throttled embedded preview, so it doesn't count; check on a real phone with the **Perf stats** chip and record the number here. If a device can't keep up, `PerformanceMonitor` lowers DPR first.
- **Biggest lever left:** the 290 KB gzip chunk is mostly `three` core plus the drei helpers. Importing fewer drei modules (or using raw `three/examples` loaders) and pre-compressing with Brotli on the host would cut it further.

## Run it

```bash
npm install
npm run dev
```

`npm run build` type-checks and produces `dist/`. `npm run preview` serves it.

## Deploy

This is a static Vite app, so any static host works. To deploy from this folder:

```bash
npx vercel --prod
```

On Netlify, set the build command to `npm run build` and the publish directory to `dist`.

## Project structure

```
src/
  App.tsx                 page shell, lazy-load gate, drag & drop
  config.ts               fabrics, finishes, default config
  useCapabilities.ts      reduced-motion / data-saver / low-power / WebGL detection, in-view hook
  components/
    Scene.tsx             <Canvas>, lighting, controls, perf monitor, stats (lazy chunk)
    Speaker.tsx           procedural speaker + exploded / tilt / glow animation
    DroppedModel.tsx      user .glb (DRACO + meshopt), auto-centre + fit
    Configurator.tsx      custom configurator UI
    Poster.tsx            static SVG fallback that mirrors the config
```

## What I'd add with more time

- A real product model, modelled in Blender, exported with `gltf-transform` (meshopt + KTX2 textures), with a target of under 300 KB.
- Hotspots that explain each part in the exploded view (drei `<Html>` anchored to parts).
- Saving the configuration in the URL so a build can be shared.
- A Lighthouse CI budget that fails the build if the initial JS goes over 80 KB gzip.
- Scroll-driven camera moves for a landing-page version in the capstone.

## Reference

The layout idea was inspired by [Nimra-Shehzadi's Week 7 project](https://github.com/Nimra-Shehzadi/flyrank-frontend-internship/tree/main/Week_07/Your-First-3D-Experience). This version adds the lazy-loading, fallback, part-swap, exploded view, GLB drop-in and perf work required by the brief.
