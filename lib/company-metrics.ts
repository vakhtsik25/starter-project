export type Point = { year: number; value: number | null };
export type Filing = { form: string; date: string; title: string; url: string };
export type Dossier = {
  ticker: string;
  name: string;
  sic: string | null;
  incomeStatement: {
    revenue: Point[];
    netIncome: Point[];
    eps: Point[];
    operatingIncome: Point[];
  };
  balanceSheet: {
    totalAssets: Point[];
    totalLiabilities: Point[];
    stockholdersEquity: Point[];
    cash: Point[];
  };
  cashFlow: {
    operatingCashFlow: Point[];
    capex: Point[];
    freeCashFlow: Point[];
  };
  sharesOutstanding: number | null;
  filings: Filing[];
  error?: string;
};
export type PriceData = {
  currentPrice: number;
  previousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currency: string;
  series: { date: string; close: number }[];
  error?: string;
};

export function latestKnown(points: Point[]): number | null {
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].value !== null) return points[i].value;
  }
  return null;
}

// Most recent year-over-year growth %, matched by the `year` field (not
// array position) so it skips cleanly over a null gap instead of comparing
// two non-adjacent years as if they were consecutive.
export function yoyGrowth(points: Point[]): number | null {
  const known = points.filter(
    (p): p is { year: number; value: number } => p.value !== null
  );
  if (known.length < 2) return null;
  const latest = known[known.length - 1];
  const prior = known.find((p) => p.year === latest.year - 1);
  if (!prior || prior.value === 0) return null;
  return ((latest.value - prior.value) / Math.abs(prior.value)) * 100;
}

export type CompanyMetrics = {
  eps: number | null;
  revenue: number | null;
  netIncome: number | null;
  operatingIncome: number | null;
  assets: number | null;
  equity: number | null;
  shares: number | null;
  marketCap: number | null;
  pe: number | null;
  pb: number | null;
  ps: number | null;
  revenueGrowthYoY: number | null;
  netIncomeGrowthYoY: number | null;
  netMargin: number | null;
  operatingMargin: number | null;
};

export function computeMetrics(
  dossier: Dossier,
  price: PriceData | null
): CompanyMetrics {
  const eps = latestKnown(dossier.incomeStatement.eps);
  const revenue = latestKnown(dossier.incomeStatement.revenue);
  const netIncome = latestKnown(dossier.incomeStatement.netIncome);
  const operatingIncome = latestKnown(dossier.incomeStatement.operatingIncome);
  const assets = latestKnown(dossier.balanceSheet.totalAssets);
  const equity = latestKnown(dossier.balanceSheet.stockholdersEquity);
  const shares = dossier.sharesOutstanding;
  const marketCap = price && shares ? price.currentPrice * shares : null;

  return {
    eps,
    revenue,
    netIncome,
    operatingIncome,
    assets,
    equity,
    shares,
    marketCap,
    pe: price && eps !== null && eps > 0 ? price.currentPrice / eps : null,
    pb: marketCap && equity && equity > 0 ? marketCap / equity : null,
    ps: marketCap && revenue && revenue > 0 ? marketCap / revenue : null,
    revenueGrowthYoY: yoyGrowth(dossier.incomeStatement.revenue),
    netIncomeGrowthYoY: yoyGrowth(dossier.incomeStatement.netIncome),
    netMargin:
      revenue && netIncome !== null && revenue > 0
        ? (netIncome / revenue) * 100
        : null,
    operatingMargin:
      revenue && operatingIncome !== null && revenue > 0
        ? (operatingIncome / revenue) * 100
        : null,
  };
}
