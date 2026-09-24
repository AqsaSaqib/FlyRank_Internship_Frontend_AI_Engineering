const levelClasses = [
  "bg-surface-muted",
  "bg-primary/20",
  "bg-primary/45",
  "bg-primary/70",
  "bg-primary",
];

// Deterministic pseudo-random levels so server and client render the same grid.
function buildLevels(weeks: number, seed: number): number[] {
  let state = seed;
  const levels: number[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    state = (state * 1103515245 + 12345) % 2147483648;
    const r = state / 2147483648;
    const weekday = i % 7 !== 0 && i % 7 !== 6;
    const recentBoost = i / (weeks * 7);
    const score = r * (weekday ? 1 : 0.5) + recentBoost * 0.35;
    levels.push(score < 0.3 ? 0 : score < 0.5 ? 1 : score < 0.7 ? 2 : score < 0.9 ? 3 : 4);
  }
  return levels;
}

type ContributionGraphProps = {
  weeks?: number;
  seed?: number;
  showLegend?: boolean;
};

export default function ContributionGraph({
  weeks = 20,
  seed = 7,
  showLegend = true,
}: ContributionGraphProps) {
  const levels = buildLevels(weeks, seed);

  return (
    <div>
      <div
        role="img"
        aria-label={`Contribution activity over the last ${weeks} weeks (placeholder data)`}
        className="grid grid-flow-col grid-rows-7 gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {levels.map((level, i) => (
          <span
            key={i}
            className={`aspect-square rounded-[3px] ${levelClasses[level]}`}
          />
        ))}
      </div>
      {showLegend && (
        <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted">
          Less
          {levelClasses.map((cls) => (
            <span key={cls} className={`h-2.5 w-2.5 rounded-[3px] ${cls}`} />
          ))}
          More
        </div>
      )}
    </div>
  );
}
