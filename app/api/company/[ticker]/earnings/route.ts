import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function GET(
  _req: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  try {
    const result = await yahooFinance.quoteSummary(ticker, {
      modules: ["calendarEvents"],
    });

    const cal = result.calendarEvents;
    const earnings = cal?.earnings;
    const nextEarningsDate = earnings?.earningsDate?.[0] ?? null;

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      nextEarningsDate,
      isEstimate: earnings?.isEarningsDateEstimate ?? null,
      earningsAverage: earnings?.earningsAverage ?? null,
      earningsLow: earnings?.earningsLow ?? null,
      earningsHigh: earnings?.earningsHigh ?? null,
      revenueAverage: earnings?.revenueAverage ?? null,
      revenueLow: earnings?.revenueLow ?? null,
      revenueHigh: earnings?.revenueHigh ?? null,
      exDividendDate: cal?.exDividendDate ?? null,
      dividendDate: cal?.dividendDate ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch earnings calendar for "${ticker}": ${message}` },
      { status: 502 }
    );
  }
}
