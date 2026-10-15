import { FINISHES, type SpeakerConfig } from "../config";

/**
 * Static, zero-JS-cost stand-in for the 3D view. It is the LCP element,
 * the loading state and the reduced-motion / low-power fallback, and it
 * still reflects the configurator choices.
 */
export default function Poster({ config }: { config: SpeakerConfig }) {
  const accent = FINISHES[config.finish].color;
  const { color, base, exploded, glow } = config;
  const capY = exploded ? 40 : 70;
  const ringY = exploded ? 22 : 62;
  const baseY = exploded ? 378 : 352;

  return (
    <svg className="poster" viewBox="0 0 320 420" role="img" aria-label="Illustration of the Aura One speaker">
      <defs>
        <linearGradient id="fabric" x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.75" />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
        <pattern id="knit" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#000" opacity="0.12" />
        </pattern>
        <radialGradient id="shadow">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="160" cy="398" rx="120" ry="14" fill="url(#shadow)" />

      {base === "puck" ? (
        <path d={`M86 ${baseY - 10} h148 l-10 22 h-128 z`} fill={accent} />
      ) : (
        <g stroke={accent} strokeWidth="7" strokeLinecap="round">
          <line x1="100" y1={baseY - 8} x2="88" y2={baseY + 26} />
          <line x1="220" y1={baseY - 8} x2="232" y2={baseY + 26} />
          <line x1="160" y1={baseY - 6} x2="160" y2={baseY + 30} />
        </g>
      )}

      <rect x="94" y="78" width="132" height="270" rx="14" fill="url(#fabric)" />
      <rect x="94" y="78" width="132" height="270" rx="14" fill="url(#knit)" />

      <rect x="91" y={capY} width="138" height="14" rx="5" fill={accent} />
      <ellipse
        cx="160"
        cy={ringY}
        rx="48"
        ry="6"
        fill="none"
        stroke={glow ? color : "#555"}
        strokeWidth="3"
        style={glow ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
      />
    </svg>
  );
}
