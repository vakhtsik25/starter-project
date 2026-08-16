import { getSubmissions } from "@/lib/edgar";

// SEC EDGAR requires a descriptive User-Agent with contact info.
const UA = "starter-project hackathon (vtsiklauri@mba2028.hbs.edu)";

// Official SEC Form 4 transaction codes. We only need the common ones —
// anything else falls back to "Other".
const CODE_LABELS: Record<string, string> = {
  P: "Open market purchase",
  S: "Open market sale",
  A: "Grant / award",
  D: "Sale to issuer",
  F: "Tax withholding",
  M: "Option exercise",
  C: "Derivative conversion",
  G: "Gift",
  W: "Inheritance / will",
};

export type InsiderTransaction = {
  ownerName: string;
  officerTitle: string | null;
  isDirector: boolean;
  isOfficer: boolean;
  isTenPercentOwner: boolean;
  date: string;
  code: string;
  codeLabel: string;
  shares: number;
  pricePerShare: number;
  value: number;
  acquiredDisposed: "A" | "D" | null;
  filingUrl: string;
};

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>\\s*(?:<value>)?\\s*([^<]*)`, "i"));
  return m ? m[1].trim() : null;
}

function isTruthy(v: string | null): boolean {
  return v === "1" || v === "true";
}

function parseForm4(xml: string, filingUrl: string): InsiderTransaction[] {
  const ownerName = extractTag(xml, "rptOwnerName") || "Unknown";
  const officerTitle = extractTag(xml, "officerTitle");
  const isDirector = isTruthy(extractTag(xml, "isDirector"));
  const isOfficer = isTruthy(extractTag(xml, "isOfficer"));
  const isTenPercentOwner = isTruthy(extractTag(xml, "isTenPercentOwner"));

  const blocks = [
    ...xml.matchAll(/<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/g),
  ];

  return blocks
    .map((m): InsiderTransaction | null => {
      const block = m[1];
      const date = extractTag(block, "transactionDate");
      const code = extractTag(block, "transactionCode");
      const shares = parseFloat(extractTag(block, "transactionShares") || "");
      const pricePerShare = parseFloat(extractTag(block, "transactionPricePerShare") || "");
      const acquiredDisposed = extractTag(block, "transactionAcquiredDisposedCode") as
        | "A"
        | "D"
        | null;
      if (!date || !code || Number.isNaN(shares)) return null;
      return {
        ownerName,
        officerTitle,
        isDirector,
        isOfficer,
        isTenPercentOwner,
        date,
        code,
        codeLabel: CODE_LABELS[code] || `Other (${code})`,
        shares,
        pricePerShare: Number.isNaN(pricePerShare) ? 0 : pricePerShare,
        value: shares * (Number.isNaN(pricePerShare) ? 0 : pricePerShare),
        acquiredDisposed,
        filingUrl,
      };
    })
    .filter((t): t is InsiderTransaction => t !== null);
}

export async function getInsiderTransactions(
  cik: string,
  limit = 15
): Promise<InsiderTransaction[]> {
  const submissions = await getSubmissions(cik);
  const recent = submissions?.filings?.recent;
  if (!recent?.form) return [];

  const cikNoPad = String(parseInt(cik, 10));
  const candidates: { accession: string; doc: string }[] = [];
  for (let i = 0; i < recent.form.length && candidates.length < limit; i++) {
    if (recent.form[i] === "4" || recent.form[i] === "4/A") {
      const accession = String(recent.accessionNumber[i]).replace(/-/g, "");
      // The primaryDocument path points at the XSL-rendered viewer
      // (e.g. "xslF345X06/form4.xml"); the raw XML sits at the accession
      // root under just its filename — verified across multiple filers.
      const filename = String(recent.primaryDocument[i]).split("/").pop();
      if (filename) candidates.push({ accession, doc: filename });
    }
  }

  const filings = await Promise.all(
    candidates.map(async ({ accession, doc }) => {
      const url = `https://www.sec.gov/Archives/edgar/data/${cikNoPad}/${accession}/${doc}`;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": UA },
          next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseForm4(xml, url);
      } catch {
        return [];
      }
    })
  );

  return filings
    .flat()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
