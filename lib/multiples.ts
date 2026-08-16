export type Point = { year: number; value: number | null };

export function formatUSD(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

export function latestKnown(points: Point[]): number | null {
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].value !== null) return points[i].value;
  }
  return null;
}

export type MultiplesInput = {
  dossier: {
    incomeStatement: { eps: Point[]; revenue: Point[]; netIncome: Point[] };
    balanceSheet: { totalAssets: Point[]; stockholdersEquity: Point[] };
    sharesOutstanding: number | null;
  };
  price: { currentPrice: number } | null;
};

export function computeMultiples({ dossier, price }: MultiplesInput) {
  const eps = latestKnown(dossier.incomeStatement.eps);
  const revenue = latestKnown(dossier.incomeStatement.revenue);
  const netIncome = latestKnown(dossier.incomeStatement.netIncome);
  const assets = latestKnown(dossier.balanceSheet.totalAssets);
  const equity = latestKnown(dossier.balanceSheet.stockholdersEquity);
  const shares = dossier.sharesOutstanding;
  const marketCap = price && shares ? price.currentPrice * shares : null;
  return {
    eps,
    revenue,
    netIncome,
    assets,
    shares,
    marketCap,
    pe: price && eps !== null && eps > 0 ? price.currentPrice / eps : null,
    pb: marketCap && equity && equity > 0 ? marketCap / equity : null,
    ps: marketCap && revenue && revenue > 0 ? marketCap / revenue : null,
  };
}
