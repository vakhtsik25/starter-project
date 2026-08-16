import { NextResponse } from "next/server";
import {
  getCompany,
  getCompanyFacts,
  getSubmissions,
  buildFinancialStatements,
  extractFilings,
} from "@/lib/edgar";

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

    const [facts, submissions] = await Promise.all([
      getCompanyFacts(company.cik),
      getSubmissions(company.cik),
    ]);

    const statements = buildFinancialStatements(facts);
    const filings = extractFilings(submissions, company.cik);

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      name: company.title,
      cik: company.cik,
      sic: submissions?.sicDescription || null,
      ...statements,
      filings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load company." },
      { status: 500 }
    );
  }
}
