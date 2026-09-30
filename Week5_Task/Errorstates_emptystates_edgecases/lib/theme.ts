export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "devlog-assistant:theme";

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
