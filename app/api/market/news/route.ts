import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function GET() {
  try {
    const result = await yahooFinance.search("stock market", {
      newsCount: 10,
      quotesCount: 0,
    });

    const news = result.news.map((n) => ({
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      publishedAt: n.providerPublishTime,
    }));

    return NextResponse.json({ news });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch market news: ${message}` },
      { status: 502 }
    );
  }
}
