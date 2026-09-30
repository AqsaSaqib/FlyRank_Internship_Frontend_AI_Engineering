/**
 * Formatting helpers for tool inputs and results. Dates are YYYY-MM-DD strings
 * in UTC (what the tools use), so they're formatted in UTC too: "2026-09-28"
 * must read as Sep 28 everywhere, not Sep 27 west of Greenwich.
 */

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** "Sep 28". Falls back to the raw string while a date is still streaming in. */
export function formatDay(iso: string | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso ?? "";
  return dayFmt.format(toDate(iso));
}

/** "Mon, Sep 28" */
export function formatWeekday(iso: string): string {
  return weekdayFmt.format(toDate(iso));
}

/** "Sep 22 – Sep 28", "Since Sep 22", "Until Sep 28", or `fallback` when neither is set. */
export function formatRange(from: string | undefined, to: string | undefined, fallback = "All time"): string {
  if (from && to) return from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;
  if (from) return `Since ${formatDay(from)}`;
  if (to) return `Until ${formatDay(to)}`;
  return fallback;
}

/** 2.5 → "2.5h", 3 → "3h" */
export function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
