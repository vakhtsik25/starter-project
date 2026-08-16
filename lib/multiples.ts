// The multiples/growth calculation that used to live here moved to
// lib/company-metrics.ts (computeMetrics) when the dashboard, PeerValuation,
// and the Analysis tab needed to share one implementation instead of two
// that could drift apart. This file now holds only the display formatter
// that other pages (Portfolio) still depend on.
export function formatUSD(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
