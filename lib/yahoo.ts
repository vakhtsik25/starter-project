// Yahoo Finance's public chart endpoint. Unofficial and undocumented, but
// widely used and doesn't require an API key — good enough for free price
// history + a live quote. If Yahoo ever blocks this, swap the fetch URL.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export type PricePoint = { date: string; close: number };
export type PriceData = {
  currentPrice: number;
  previousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currency: string;
  series: PricePoint[];
};

export async function fetchChart(ticker: string, range: string, interval: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?range=${range}&interval=${interval}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 900 }, // prices move fast; cache 15 min, not 1 hour
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.chart?.result?.[0] || null;
}

export async function getPriceData(ticker: string): Promise<PriceData | null> {
  // Yahoo's `chartPreviousClose` is relative to whatever range you ask for
  // (i.e. with range=1y it means "a year-plus-a-day ago", not "yesterday").
  // Fetch a short daily range for an accurate quote, and a separate 1-year
  // weekly range for the chart series.
  const [quote, history] = await Promise.all([
    fetchChart(ticker, "5d", "1d"),
    fetchChart(ticker, "1y", "1wk"),
  ]);
  if (!quote) return null;

  const meta = quote.meta;
  const historyResult = history || quote;
  const timestamps: number[] = historyResult.timestamp || [];
  const closes: (number | null)[] =
    historyResult.indicators?.quote?.[0]?.close || [];
  const series: PricePoint[] = timestamps
    .map((ts, i) => ({ ts, close: closes[i] }))
    .filter((p) => typeof p.close === "number")
    .map((p) => ({
      date: new Date(p.ts * 1000).toISOString().slice(0, 10),
      close: p.close as number,
    }));

  return {
    currentPrice: meta.regularMarketPrice,
    previousClose: meta.chartPreviousClose ?? meta.regularMarketPrice,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    currency: meta.currency || "USD",
    series,
  };
}
