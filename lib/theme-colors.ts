// lightweight-charts renders to <canvas>, so it can't consume CSS custom
// properties directly the way DOM elements can — it needs a literal resolved
// color string at the moment a series/option is set. These helpers bridge
// that gap: read the current value of a CSS var, and re-run a callback
// whenever the theme toggle flips the `dark` class on <html>.

export function readCssVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
