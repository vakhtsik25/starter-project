export const PERFORMANCE_PERIODS = ["1W", "1M", "6M", "YTD", "1Y"] as const;
export type PerformancePeriod = (typeof PERFORMANCE_PERIODS)[number];

export type SeriesPoint = { time: number; close: number };

export function periodStartDate(period: PerformancePeriod, now: Date): Date {
  const d = new Date(now);
  switch (period) {
    case "1W":
      d.setUTCDate(d.getUTCDate() - 7);
      return d;
    case "1M":
      d.setUTCMonth(d.getUTCMonth() - 1);
      return d;
    case "6M":
      d.setUTCMonth(d.getUTCMonth() - 6);
      return d;
    case "YTD":
      return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    case "1Y":
      d.setUTCFullYear(d.getUTCFullYear() - 1);
      return d;
  }
}

// series assumed sorted ascending by time (unix seconds)
export function closestAtOrBefore(
  series: SeriesPoint[],
  targetMs: number
): SeriesPoint | null {
  let result: SeriesPoint | null = null;
  for (const point of series) {
    if (point.time * 1000 <= targetMs) result = point;
    else break;
  }
  return result;
}

export type PortfolioHolding = {
  ticker: string;
  shares: number;
  dateBought: string;
};

export function computePortfolioPerformance(
  holdings: PortfolioHolding[],
  seriesByTicker: Record<string, SeriesPoint[] | undefined>,
  currentPriceByTicker: Record<string, number | undefined>,
  period: PerformancePeriod,
  now: Date
) {
  const cutoff = periodStartDate(period, now);
  const cutoffMs = cutoff.getTime();

  let valueAtStart = 0;
  let valueNow = 0;
  let includedCount = 0;
  let excludedCount = 0;

  for (const h of holdings) {
    const boughtMs = new Date(h.dateBought).getTime();
    const currentPrice = currentPriceByTicker[h.ticker];
    const series = seriesByTicker[h.ticker];

    if (boughtMs > cutoffMs || !series || currentPrice == null) {
      excludedCount++;
      continue;
    }
    const startPoint = closestAtOrBefore(series, cutoffMs);
    if (!startPoint) {
      excludedCount++;
      continue;
    }
    valueAtStart += h.shares * startPoint.close;
    valueNow += h.shares * currentPrice;
    includedCount++;
  }

  const changeAbs = valueNow - valueAtStart;
  const changePct = valueAtStart > 0 ? (changeAbs / valueAtStart) * 100 : null;

  return { valueAtStart, valueNow, changeAbs, changePct, includedCount, excludedCount };
}
