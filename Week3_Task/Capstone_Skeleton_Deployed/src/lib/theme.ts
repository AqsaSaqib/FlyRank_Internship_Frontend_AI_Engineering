export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "devlog-theme";

/**
 * Runs inline in <head> before the page paints, so there is no flash of the
 * wrong theme. Uses the saved choice, otherwise the system preference.
 */
export const themeInitScript = `(function () {
  try {
    var saved = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme = saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = "light";
  }
})();`;
