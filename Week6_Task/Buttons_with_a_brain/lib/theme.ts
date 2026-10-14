export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "devlog-motion-button:theme";

/** Saved theme, else the system setting. Same logic as the inline script below. */
export function resolveTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage blocked: fall through to the system setting.
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Runs in <head> before the first paint: applies the saved theme, or the
 * system setting on a first visit, so the page never flashes the wrong theme.
 */
export const themeScript = `(function () {
  try {
    var saved = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme = saved === "light" || saved === "dark"
      ? saved
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();`;
