import { NextResponse } from "next/server";
import { getPriceData } from "@/lib/yahoo";

export async function GET(
  _req: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  try {
    const data = await getPriceData(ticker);
    if (!data) {
      return NextResponse.json(
        { error: `No price data for "${ticker}".` },
        { status: 404 }
      );
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load price data." },
      { status: 500 }
    );
  }
}
