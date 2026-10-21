// Single source of truth for applying the theme. Every component that changes
// the theme goes through applyTheme(); components that display it read the
// live <html> classes via isDarkActive() so they can never disagree.

export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";

const STORAGE_KEY = "theme";

export function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  // SYSTEM leaves both classes off so the prefers-color-scheme CSS decides
  if (pref === "DARK") root.classList.add("dark");
  if (pref === "LIGHT") root.classList.add("light");

  try {
    localStorage.setItem(STORAGE_KEY, pref.toLowerCase());
  } catch {
    // storage blocked (private mode etc.) — the class above still applies
  }
}

export function isDarkActive() {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return true;
  if (root.classList.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Runs inline in <head> before the page paints, so a reload never flashes
// or shows the wrong theme while React is still loading.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var r=document.documentElement;if(t==="dark"){r.classList.add("dark")}else if(t==="light"){r.classList.add("light")}}catch(e){}})();`;
