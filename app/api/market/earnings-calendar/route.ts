import { NextResponse } from "next/server";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { getEarningsInfo } from "@/lib/earnings-calendar";

const WINDOW_DAYS = 21;

export async function GET() {
  const now = Date.now();
  const windowEnd = now + WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const results = await Promise.all(
    STOCK_UNIVERSE.map(async (entry) => {
      const info = await getEarningsInfo(entry.ticker);
      if (!info?.nextEarningsDate) return null;
      const dateMs = new Date(info.nextEarningsDate).getTime();
      if (dateMs < now || dateMs > windowEnd) return null;
      return {
        ticker: entry.ticker,
        name: entry.name,
        nextEarningsDate: info.nextEarningsDate,
        isEstimate: info.isEstimate,
      };
    })
  );

  const upcoming = results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.nextEarningsDate.localeCompare(b.nextEarningsDate));

  return NextResponse.json({ upcoming, windowDays: WINDOW_DAYS });
}
