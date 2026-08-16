import { NextResponse } from "next/server";

// SEC EDGAR requires a descriptive User-Agent with contact info.
// Replace with your team's email if you like.
const UA = "starter-project hackathon (vtsiklauri@mba2028.hbs.edu)";

async function edgar(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    // cache for an hour so we don't hammer SEC during the demo
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`EDGAR ${res.status} for ${url}`);
  return res.json();
}

// ticker -> { cik (10-digit), title }. Cached in module memory after first load.
let tickerMap: Record<string, { cik: string; title: string }> | null = null;
async function getCompany(ticker: string) {
  if (!tickerMap) {
    const data = await edgar("https://www.sec.gov/files/company_tickers.json");
    tickerMap = {};
    for (const key of Object.keys(data)) {
      const row = data[key];
      tickerMap[String(row.ticker).toUpperCase()] = {
        cik: String(row.cik_str).padStart(10, "0"),
        title: row.title,
      };
    }
  }
  return tickerMap[ticker.toUpperCase()] || null;
}

// Pull an annual (fiscal-year) series for the first concept name that exists.
function annualSeries(facts: any, concepts: string[], unit: string) {
  for (const concept of concepts) {
    const node = facts?.facts?.["us-gaap"]?.[concept]?.units?.[unit];
    if (!Array.isArray(node)) continue;
    const byYear: Record<number, number> = {};
    for (const e of node) {
      if (e.form === "10-K" && e.fp === "FY" && typeof e.fy === "number") {
        byYear[e.fy] = e.val;
      }
    }
    const years = Object.keys(byYear)
      .map(Number)
      .sort((a, b) => a - b);
    if (years.length) {
      return years.slice(-5).map((y) => ({ year: y, value: byYear[y] }));
    }
  }
  return [];
}

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
      edgar(
        `https://data.sec.gov/api/xbrl/companyfacts/CIK${company.cik}.json`
      ),
      edgar(`https://data.sec.gov/submissions/CIK${company.cik}.json`),
    ]);

    const revenue = annualSeries(
      facts,
      [
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "Revenues",
        "SalesRevenueNet",
      ],
      "USD"
    );
    const netIncome = annualSeries(facts, ["NetIncomeLoss"], "USD");
    const eps = annualSeries(
      facts,
      ["EarningsPerShareDiluted", "EarningsPerShareBasic"],
      "USD/shares"
    );

    // Most recent filings from the parallel-array structure EDGAR returns.
    const recent = submissions?.filings?.recent;
    const cikNoPad = String(parseInt(company.cik, 10));
    const filings: {
      form: string;
      date: string;
      title: string;
      url: string;
    }[] = [];
    if (recent?.accessionNumber) {
      for (let i = 0; i < recent.accessionNumber.length && filings.length < 8; i++) {
        const form = recent.form[i];
        if (!["10-K", "10-Q", "8-K"].includes(form)) continue;
        const accession = String(recent.accessionNumber[i]).replace(/-/g, "");
        const doc = recent.primaryDocument[i];
        filings.push({
          form,
          date: recent.filingDate[i],
          title: recent.primaryDocDescription?.[i] || form,
          url: `https://www.sec.gov/Archives/edgar/data/${cikNoPad}/${accession}/${doc}`,
        });
      }
    }

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      name: company.title,
      cik: company.cik,
      sic: submissions?.sicDescription || null,
      revenue,
      netIncome,
      eps,
      filings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load company." },
      { status: 500 }
    );
  }
}
