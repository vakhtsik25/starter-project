import { NextResponse } from "next/server";
import { getCompany } from "@/lib/edgar";
import { getInsiderTransactions } from "@/lib/insider";

export async function GET(
  _req: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await context.params;
    const company = await getCompany(ticker);
    if (!company) {
      return NextResponse.json(
        { error: `Ticker "${ticker}" not found in SEC EDGAR.` },
        { status: 404 }
      );
    }
    const transactions = await getInsiderTransactions(company.cik);
    return NextResponse.json({ transactions });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load insider transactions." },
      { status: 500 }
    );
  }
}
