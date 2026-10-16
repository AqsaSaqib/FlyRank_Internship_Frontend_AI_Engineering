// Dev-only: measures how readable each piece of hero text is against the
// shader's real pixels, across many moments of the animation.
// In the console: __contrast() -> worst WCAG contrast ratio per element.
import type { HeroController } from './hero';

const TARGETS: [label: string, selector: string, textColour: string][] = [
  ['eyebrow', '.hero__eyebrow', '#f5a36b'],
  ['name', '.hero__title', '#f6f1ea'],
  ['name (italic)', '.hero__title em', '#f5a36b'],
  ['intro', '.hero__intro', '#f6f1ea'],
  ['ghost button', '.btn--ghost', '#f6f1ea'],
  ['caption', '.hero__caption', '#c9c2cf'],
  ['nav links', '.nav nav', '#c9c2cf'],
];

const channel = (v: number) => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (r: number, g: number, b: number) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const hexLuminance = (hex: string) =>
  luminance(...([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]));

export function installContrastCheck(hero: HeroController) {
  (window as unknown as { __contrast: () => Record<string, string> }).__contrast = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#hero-canvas')!;
    const box = canvas.getBoundingClientRect();
    const sx = canvas.width / box.width;
    const sy = canvas.height / box.height;
    const result: Record<string, string> = {};

    for (const [label, selector, colour] of TARGETS) {
      const r = document.querySelector(selector)!.getBoundingClientRect();
      const x = Math.max(0, Math.round((r.left - box.left) * sx));
      const y = Math.max(0, Math.round(canvas.height - (r.bottom - box.top) * sy));
      const w = Math.min(canvas.width - x, Math.round(r.width * sx));
      const h = Math.min(canvas.height - y, Math.round(r.height * sy));
      const pixels = new Uint8Array(w * h * 4);
      const text = hexLuminance(colour);
      let worst = Infinity;
      let worstTime = 0;

      // 60 moments spread over 10 minutes of animation.
      for (let t = 0; t < 600; t += 10) {
        const gl = hero.renderNow(t);
        gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        const lums: number[] = [];
        for (let i = 0; i < pixels.length; i += 16) lums.push(luminance(pixels[i], pixels[i + 1], pixels[i + 2]));
        lums.sort((a, b) => a - b);
        const bright = lums[Math.floor(lums.length * 0.98)]; // ignore single grain specks
        const ratio = (text + 0.05) / (bright + 0.05);
        if (ratio < worst) {
          worst = ratio;
          worstTime = t;
        }
      }
      result[label] = `${worst.toFixed(2)}:1 (t=${worstTime}s)`;
    }
    return result;
  };
}
