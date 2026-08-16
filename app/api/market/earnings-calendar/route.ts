import { NextRequest, NextResponse } from "next/server";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { getEarningsInfo } from "@/lib/earnings-calendar";

export async function GET(request: NextRequest) {
  const daysParam = request.nextUrl.searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : null;
  const now = Date.now();
  const windowEnd = days != null ? now + days * 24 * 60 * 60 * 1000 : null;

  const results = await Promise.all(
    STOCK_UNIVERSE.map(async (entry) => {
      const info = await getEarningsInfo(entry.ticker);
      if (!info?.nextEarningsDate) return null;
      if (windowEnd != null) {
        const dateMs = new Date(info.nextEarningsDate).getTime();
        if (dateMs < now || dateMs > windowEnd) return null;
      }
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

  return NextResponse.json({ upcoming, windowDays: days });
}
