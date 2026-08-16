import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export const RANGE_CONFIG = {
  "1D": { interval: "5m", days: 5 },
  "5D": { interval: "15m", days: 9 },
  "1M": { interval: "1d", days: 30 },
  "6M": { interval: "1d", days: 182 },
  "1Y": { interval: "1d", days: 365 },
  "2Y": { interval: "1d", days: 365 * 2 },
  "3Y": { interval: "1wk", days: 365 * 3 },
  "4Y": { interval: "1wk", days: 365 * 4 },
  "5Y": { interval: "1wk", days: 365 * 5 },
} as const;

export type RangeKey = keyof typeof RANGE_CONFIG;

function isRangeKey(value: string): value is RangeKey {
  return value in RANGE_CONFIG;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const rangeParam = request.nextUrl.searchParams.get("range") ?? "1M";

  if (!isRangeKey(rangeParam)) {
    return NextResponse.json(
      { error: `Invalid range. Use one of: ${Object.keys(RANGE_CONFIG).join(", ")}` },
      { status: 400 }
    );
  }

  const { interval, days } = RANGE_CONFIG[rangeParam];
  const period2 = new Date();
  const period1 = new Date(period2.getTime() - days * 24 * 60 * 60 * 1000);

  try {
    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval,
    });

    let candles = result.quotes
      .filter(
        (q) =>
          q.open != null && q.high != null && q.low != null && q.close != null
      )
      .map((q) => ({
        time: Math.floor(new Date(q.date).getTime() / 1000),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume ?? 0,
      }));

    // Intraday ranges fetch a wider calendar window to skip weekends/holidays,
    // then trim to just the most recent N trading sessions actually returned.
    if (rangeParam === "1D" || rangeParam === "5D") {
      const sessionsToKeep = rangeParam === "1D" ? 1 : 5;
      const dateKey = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
      const distinctDates = [...new Set(candles.map((c) => dateKey(c.time)))].sort();
      const keepDates = new Set(distinctDates.slice(-sessionsToKeep));
      candles = candles.filter((c) => keepDates.has(dateKey(c.time)));
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      range: rangeParam,
      interval,
      candles,
      fetchedAt: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch data for "${symbol}": ${message}` },
      { status: 502 }
    );
  }
}
