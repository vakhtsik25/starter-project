import { NextResponse } from "next/server";
import { getPriceData } from "@/lib/yahoo";

// Curated set of US index/volatility tickers for the home page snapshot.
// Names are our own (Yahoo's meta.longName is inconsistent — e.g. Russell
// 2000 comes back with a leading space).
const INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "Nasdaq Composite" },
  { symbol: "^DJI", name: "Dow Jones Industrial Average" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^VIX", name: "CBOE Volatility Index (VIX)" },
] as const;

export async function GET() {
  const results = await Promise.all(
    INDICES.map(async ({ symbol, name }) => {
      try {
        const data = await getPriceData(symbol);
        if (!data) return { symbol, name, error: "No data" };
        return {
          symbol,
          name,
          currentPrice: data.currentPrice,
          previousClose: data.previousClose,
          changePct:
            ((data.currentPrice - data.previousClose) / data.previousClose) * 100,
          fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: data.fiftyTwoWeekLow,
          series: data.series,
        };
      } catch (err: any) {
        return { symbol, name, error: err?.message || "Failed to fetch" };
      }
    })
  );

  return NextResponse.json({ indices: results, fetchedAt: Date.now() });
}
