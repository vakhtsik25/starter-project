import { NextResponse } from "next/server";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { getStockPerformance } from "@/lib/stock-performance";

export async function GET() {
  const stocks = await Promise.all(
    STOCK_UNIVERSE.map(async (entry) => {
      try {
        const result = await getStockPerformance(entry.ticker);
        if (!result) {
          return { ...entry, price: null, performance: {}, error: "No data" };
        }
        return { ...entry, price: result.price, performance: result.performance };
      } catch (err: any) {
        return {
          ...entry,
          price: null,
          performance: {},
          error: err?.message || "Failed to fetch",
        };
      }
    })
  );

  return NextResponse.json({ stocks, fetchedAt: Date.now() });
}
