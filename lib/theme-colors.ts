// lightweight-charts renders to <canvas>, so it can't consume CSS custom
// properties directly the way DOM elements can — it needs a literal resolved
// color string at the moment a series/option is set. These helpers bridge
// that gap: read the current value of a CSS var, and re-run a callback
// whenever the theme toggle flips the `dark` class on <html>.

export function readCssVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// lightweight-charts gradient fills (AreaSeries topColor/bottomColor) need an
// rgba string with alpha baked in — CSS vars here are stored as plain hex.
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function watchThemeChange(callback: () => void): () => void {
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.attributeName === "class")) callback();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}
