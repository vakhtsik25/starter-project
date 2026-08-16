import { NextResponse } from "next/server";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { getStockPerformance } from "@/lib/stock-performance";
import { getAnalystSnapshot } from "@/lib/stock-analysts";
import { getEarningsInfo } from "@/lib/earnings-calendar";

export async function GET() {
  const stocks = await Promise.all(
    STOCK_UNIVERSE.map(async (entry) => {
      const [perfResult, analystResult, earningsResult] = await Promise.all([
        getStockPerformance(entry.ticker).catch(() => null),
        getAnalystSnapshot(entry.ticker).catch(() => null),
        getEarningsInfo(entry.ticker).catch(() => null),
      ]);

      if (!perfResult) {
        return {
          ...entry,
          price: null,
          performance: {},
          fiftyTwoWeekHigh: null,
          fiftyTwoWeekLow: null,
          analysts: null,
          nextEarningsDate: earningsResult?.nextEarningsDate ?? null,
          error: "No data",
        };
      }
      return {
        ...entry,
        price: perfResult.price,
        performance: perfResult.performance,
        fiftyTwoWeekHigh: perfResult.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: perfResult.fiftyTwoWeekLow,
        analysts: analystResult,
        nextEarningsDate: earningsResult?.nextEarningsDate ?? null,
      };
    })
  );

  return NextResponse.json({ stocks, fetchedAt: Date.now() });
}
