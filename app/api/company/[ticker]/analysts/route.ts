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
      modules: ["financialData", "recommendationTrend"],
    });

    const trend = result.recommendationTrend?.trend?.[0] ?? null;
    const fd = result.financialData;

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      recommendationKey: fd?.recommendationKey ?? null,
      recommendationMean: fd?.recommendationMean ?? null,
      numberOfAnalysts: fd?.numberOfAnalystOpinions ?? null,
      targetHigh: fd?.targetHighPrice ?? null,
      targetLow: fd?.targetLowPrice ?? null,
      targetMean: fd?.targetMeanPrice ?? null,
      targetMedian: fd?.targetMedianPrice ?? null,
      currentPrice: fd?.currentPrice ?? null,
      trend: trend
        ? {
            strongBuy: trend.strongBuy,
            buy: trend.buy,
            hold: trend.hold,
            sell: trend.sell,
            strongSell: trend.strongSell,
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch analyst data for "${ticker}": ${message}` },
      { status: 502 }
    );
  }
}
