import { NextResponse } from "next/server";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { getStockPerformance } from "@/lib/stock-performance";

export type Mover = {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
};

// Deliberately lighter than /api/stocks/screener — this only needs price
// and 1D performance, not the analyst/earnings data the full screener
// fetches per ticker, so the homepage widget stays fast.
export async function GET() {
  const results = await Promise.all(
    STOCK_UNIVERSE.map(async (entry) => {
      const perf = await getStockPerformance(entry.ticker).catch(() => null);
      const changePct = perf?.performance["1D"];
      if (!perf || changePct == null) return null;
      return {
        ticker: entry.ticker,
        name: entry.name,
        price: perf.price,
        changePct,
      } satisfies Mover;
    })
  );

  const movers = results.filter((m): m is Mover => m !== null);
  const sorted = [...movers].sort((a, b) => b.changePct - a.changePct);

  return NextResponse.json({
    gainers: sorted.slice(0, 5),
    losers: sorted.slice(-5).reverse(),
    fetchedAt: Date.now(),
  });
}
