// SEC EDGAR requires a descriptive User-Agent with contact info.
const UA = "starter-project hackathon (vtsiklauri@mba2028.hbs.edu)";

export type Point = { year: number; value: number | null };
export type Filing = { form: string; date: string; title: string; url: string };

async function edgar(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    // cache for an hour so we don't hammer SEC during demos
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`EDGAR ${res.status} for ${url}`);
  return res.json();
}

// ticker -> { cik (10-digit), title }. Cached in module memory after first load.
let tickerMap: Record<string, { cik: string; title: string }> | null = null;
async function loadTickerMap() {
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
  return tickerMap;
}

export async function getCompany(ticker: string) {
  const map = await loadTickerMap();
  return map[ticker.toUpperCase()] || null;
}

// For the search-by-name autocomplete: ticker prefix match OR name substring
// match, ranked ticker-matches first. Capped so the response stays small.
export async function searchCompanies(query: string, limit = 10) {
  const map = await loadTickerMap();
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const tickerMatches: { ticker: string; name: string }[] = [];
  const nameMatches: { ticker: string; name: string }[] = [];
  for (const ticker of Object.keys(map)) {
    const { title } = map[ticker];
    if (ticker.startsWith(q)) {
      tickerMatches.push({ ticker, name: title });
    } else if (title.toUpperCase().includes(q)) {
      nameMatches.push({ ticker, name: title });
    }
    if (tickerMatches.length >= limit) break;
  }
  return [...tickerMatches, ...nameMatches].slice(0, limit);
}

// Resolve one concept's own value per REPORTING PERIOD. SEC's frames array is
// NOT keyed usefully by the `fy` field for this: a single 10-K reports 2-3
// years of comparatives (income statement) or 1-2 (balance sheet), and EDGAR
// stamps ALL of them with the filing's own `fy` — so multiple genuinely
// different periods can collide under the same `fy` bucket. The period's
// `end` date is the only unambiguous key. Within one `end` date, the LAST
// entry in array order wins (later filings' restated comparative, if any,
// supersedes the original).
function resolveByEndDate(
  node: any[],
  formFilter: (form: string, fp: string) => boolean
): Record<string, number> {
  const byEnd: Record<string, number> = {};
  for (const e of node) {
    if (typeof e.end === "string" && formFilter(e.form, e.fp)) {
      byEnd[e.end] = e.val;
    }
  }
  return byEnd;
}

// Build an annual series merged across concept-name fallbacks (companies
// re-tag the same line item under different XBRL concepts as the taxonomy
// evolves — e.g. Tesla used "Revenues" pre-2023, then switched). A fallback
// concept only fills END DATES the higher-priority concept has no data for;
// it never overrides a period the preferred concept already answered.
function annualSeries(
  facts: any,
  concepts: string[],
  unit: string
): Point[] {
  const byEnd: Record<string, number> = {};
  for (const concept of concepts) {
    const node = facts?.facts?.["us-gaap"]?.[concept]?.units?.[unit];
    if (!Array.isArray(node)) continue;
    const localByEnd = resolveByEndDate(
      node,
      (form, fp) => form === "10-K" && fp === "FY"
    );
    for (const [end, v] of Object.entries(localByEnd)) {
      if (!(end in byEnd)) byEnd[end] = v;
    }
  }
  const ends = Object.keys(byEnd).sort(); // ISO dates sort chronologically
  if (!ends.length) return [];

  // Contiguous trailing 5-year window, one point per year, labeled by the
  // calendar year the fiscal period ends in (matches how companies with a
  // Q4/Sept/June fiscal year-end are conventionally labeled; a company with
  // an early-calendar-year FYE may be off by one label year — cosmetic only).
  const latestYear = new Date(ends[ends.length - 1]).getUTCFullYear();
  const byYear: Record<number, number> = {};
  for (const end of ends) {
    byYear[new Date(end).getUTCFullYear()] = byEnd[end];
  }
  const window: Point[] = [];
  for (let y = latestYear - 4; y <= latestYear; y++) {
    window.push({ year: y, value: y in byYear ? byYear[y] : null });
  }
  return window;
}

// Most recent value for a concept regardless of form (10-K or 10-Q) — used
// for "as of today" figures like shares outstanding.
function latestValue(
  facts: any,
  taxonomy: string,
  concept: string,
  unit: string
): number | null {
  const node = facts?.facts?.[taxonomy]?.[concept]?.units?.[unit];
  if (!Array.isArray(node) || !node.length) return null;
  const byEnd = resolveByEndDate(node, () => true);
  const ends = Object.keys(byEnd).sort();
  return ends.length ? byEnd[ends[ends.length - 1]] : null;
}

export type FinancialStatements = {
  incomeStatement: {
    revenue: Point[];
    netIncome: Point[];
    eps: Point[];
    operatingIncome: Point[];
  };
  balanceSheet: {
    totalAssets: Point[];
    totalLiabilities: Point[];
    stockholdersEquity: Point[];
    cash: Point[];
  };
  cashFlow: {
    operatingCashFlow: Point[];
    capex: Point[];
    freeCashFlow: Point[];
  };
  sharesOutstanding: number | null;
};

export function buildFinancialStatements(facts: any): FinancialStatements {
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
  const operatingIncome = annualSeries(
    facts,
    ["OperatingIncomeLoss"],
    "USD"
  );

  const totalAssets = annualSeries(facts, ["Assets"], "USD");
  const totalLiabilities = annualSeries(facts, ["Liabilities"], "USD");
  const stockholdersEquity = annualSeries(
    facts,
    ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"],
    "USD"
  );
  const cash = annualSeries(
    facts,
    [
      "CashAndCashEquivalentsAtCarryingValue",
      "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
    ],
    "USD"
  );

  const operatingCashFlow = annualSeries(
    facts,
    ["NetCashProvidedByUsedInOperatingActivities"],
    "USD"
  );
  const capex = annualSeries(
    facts,
    [
      "PaymentsToAcquirePropertyPlantAndEquipment",
      "PaymentsToAcquireProductiveAssets",
    ],
    "USD"
  );
  const freeCashFlow: Point[] = operatingCashFlow.map((ocf) => {
    const capexPoint = capex.find((c) => c.year === ocf.year);
    if (ocf.value === null || !capexPoint || capexPoint.value === null) {
      return { year: ocf.year, value: null };
    }
    return { year: ocf.year, value: ocf.value - capexPoint.value };
  });

  const sharesOutstanding = latestValue(
    facts,
    "dei",
    "EntityCommonStockSharesOutstanding",
    "shares"
  );

  return {
    incomeStatement: { revenue, netIncome, eps, operatingIncome },
    balanceSheet: { totalAssets, totalLiabilities, stockholdersEquity, cash },
    cashFlow: { operatingCashFlow, capex, freeCashFlow },
    sharesOutstanding,
  };
}

export async function getCompanyFacts(cik: string) {
  return edgar(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
}

export async function getSubmissions(cik: string) {
  return edgar(`https://data.sec.gov/submissions/CIK${cik}.json`);
}

export function extractFilings(submissions: any, cik: string): Filing[] {
  const recent = submissions?.filings?.recent;
  const cikNoPad = String(parseInt(cik, 10));
  const filings: Filing[] = [];
  if (recent?.accessionNumber) {
    for (
      let i = 0;
      i < recent.accessionNumber.length && filings.length < 8;
      i++
    ) {
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
  return filings;
}
