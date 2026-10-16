import './style.css';
import { startHero } from './hero';

const canvas = document.querySelector<HTMLCanvasElement>('#hero-canvas')!;
const toggle = document.querySelector<HTMLButtonElement>('#motion-toggle')!;
const toggleLabel = toggle.querySelector('span')!;

const hero = startHero({
  canvas,
  textBlock: document.querySelector<HTMLElement>('.hero__content')!,
  // No WebGL (or the GPU dropped us): hide the canvas, the CSS gradient
  // in the same palette shows through instead.
  onFail() {
    document.documentElement.classList.add('no-webgl');
    toggle.hidden = true;
  },
  onPausedChange(paused) {
    toggle.setAttribute('aria-pressed', String(paused));
    toggleLabel.textContent = paused ? 'Play motion' : 'Pause motion';
  },
});

if (hero) {
  toggle.addEventListener('click', () => hero.setPaused(!hero.isPaused()));
}

if (import.meta.env.DEV && hero) {
  // Type __contrast() in the console to measure text contrast on the shader.
  import('./devContrast').then((m) => m.installContrastCheck(hero));
}

document.querySelector('#year')!.textContent = String(new Date().getFullYear());
