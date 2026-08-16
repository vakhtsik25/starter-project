import { NextResponse } from "next/server";
import { getEarningsInfo } from "@/lib/earnings-calendar";

export async function GET(
  _req: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  const info = await getEarningsInfo(ticker);
  if (!info) {
    return NextResponse.json(
      { error: `Failed to fetch earnings calendar for "${ticker}".` },
      { status: 502 }
    );
  }
  return NextResponse.json({ ticker: ticker.toUpperCase(), ...info });
}
