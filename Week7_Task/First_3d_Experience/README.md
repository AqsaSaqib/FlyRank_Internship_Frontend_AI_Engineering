# Aura One – My First 3D Experience (Week 7)

A 3D smart speaker you can play with in the browser. Built with React Three Fiber.

**Live link:** _add after deploying_

## What you can do

- **Turn it around:** drag to rotate. Scroll or pinch to zoom.
- **Change the look:** pick a fabric colour, a trim finish (matte, satin, metal) and a base (puck or legs).
- **Exploded view:** watch the parts pull apart.
- **Light ring:** turn the glowing ring on or off.
- **Use your own model:** drop a `.glb` file onto the viewer and it shows up in the same scene.
- **Perf stats:** see the live frame rate.

## How I kept it fast

- **No model to download.** The speaker is built from simple shapes in code.
- **3D loads later.** The page shows first. The 3D code (about 290 KB) loads after that.
- **Backup picture.** If you prefer reduced motion, are on a slow phone or have data saver on, you see a still image instead. A button lets you load the 3D view anyway.
- **Saves battery.** The scene stops drawing when you scroll away or switch tabs.
- **Works on phones.** Touch works, and the layout fits small screens.

## Perf note

- Page code: **73 KB** (gzipped)
- 3D code: **290 KB** (gzipped), loads after the page shows
- Model and textures: **0 KB**
- The page shows in about **0.3 seconds** locally
- About **22 draw calls** and **9.4k triangles** per frame

## Run it

```bash
npm install
npm run dev
```

## What I'd add with more time

- A real speaker model made in Blender
- Labels on each part in the exploded view
- A link to share your chosen design
