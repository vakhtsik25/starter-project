import { fetchChart } from "@/lib/yahoo";

export const PERIODS = ["1D", "1W", "1M", "3M", "6M", "12M", "5Y"] as const;
export type Period = (typeof PERIODS)[number];

const PERIOD_DAYS: Record<Period, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 91,
  "6M": 182,
  "12M": 365,
  "5Y": 365 * 5,
};

type SeriesPoint = { time: number; close: number };

function extractSeries(result: any): SeriesPoint[] {
  const timestamps: number[] = result?.timestamp || [];
  const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close || [];
  return timestamps
    .map((t, i) => ({ time: t, close: closes[i] }))
    .filter((p): p is SeriesPoint => typeof p.close === "number");
}

// Closest point at or before the target time. Falls back to the earliest
// point available if the target predates the whole series (e.g. a 12M
// lookback on a stock that only has 8 months of daily history in the
// window we fetched) — better than crashing or hiding the period, though
// the resulting return then covers less than the nominal period.
function closestAtOrBefore(series: SeriesPoint[], targetSec: number): SeriesPoint | null {
  if (!series.length) return null;
  let best = series[0];
  for (const p of series) {
    if (p.time <= targetSec) best = p;
    else break;
  }
  return best;
}

export type Performance = Partial<Record<Period, number>>;

export async function getStockPerformance(ticker: string): Promise<{
  price: number;
  performance: Performance;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
} | null> {
  const [daily, weekly] = await Promise.all([
    fetchChart(ticker, "1y", "1d"),
    fetchChart(ticker, "5y", "1wk"),
  ]);
  if (!daily) return null;

  const dailySeries = extractSeries(daily);
  const weeklySeries = extractSeries(weekly);
  if (!dailySeries.length) return null;

  const latest = dailySeries[dailySeries.length - 1];
  const nowSec = latest.time;
  const performance: Performance = {};

  for (const period of PERIODS) {
    const targetSec = nowSec - PERIOD_DAYS[period] * 86400;
    // Daily series (1y) covers 1D through 12M; 5Y needs the weekly series.
    const series = period === "5Y" ? weeklySeries : dailySeries;
    const past = closestAtOrBefore(series, targetSec);
    if (past && past.close > 0 && past.time !== latest.time) {
      performance[period] = ((latest.close - past.close) / past.close) * 100;
    }
  }

  // Already present on the same chart response we fetched for performance —
  // no extra request needed.
  const meta = daily.meta;
  return {
    price: latest.close,
    performance,
    fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: meta?.fiftyTwoWeekLow ?? null,
  };
}
