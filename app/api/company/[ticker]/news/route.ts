import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function GET(
  _req: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  try {
    const result = await yahooFinance.search(ticker, {
      newsCount: 10,
      quotesCount: 0,
    });

    const news = result.news.map((n) => ({
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      publishedAt: n.providerPublishTime,
    }));

    return NextResponse.json({ ticker: ticker.toUpperCase(), news });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch news for "${ticker}": ${message}` },
      { status: 502 }
    );
  }
}
