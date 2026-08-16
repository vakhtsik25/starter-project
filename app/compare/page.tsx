"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  computeMetrics,
  type CompanyMetrics,
  type Dossier,
  type PriceData,
} from "@/lib/company-metrics";

const MAX_TICKERS = 4;

type CompanyState = {
  ticker: string;
  name?: string;
  metrics?: CompanyMetrics;
  error?: string;
  loading: boolean;
};

function fmtUSD(n: number | null) {
  if (n == null) return "n/a";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number | null) {
  if (n == null) return "n/a";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtX(n: number | null) {
  if (n == null) return "n/a";
  return `${n.toFixed(1)}x`;
}

const ROWS: {
  label: string;
  get: (m: CompanyMetrics) => string;
  colorByValue?: (m: CompanyMetrics) => string;
}[] = [
  { label: "Market Cap", get: (m) => fmtUSD(m.marketCap) },
  { label: "P/E (FY)", get: (m) => fmtX(m.pe) },
  { label: "Price/Sales", get: (m) => fmtX(m.ps) },
  { label: "Price/Book", get: (m) => fmtX(m.pb) },
  { label: "Revenue (FY)", get: (m) => fmtUSD(m.revenue) },
  {
    label: "Revenue Growth YoY",
    get: (m) => fmtPct(m.revenueGrowthYoY),
    colorByValue: (m) =>
      m.revenueGrowthYoY == null
        ? ""
        : m.revenueGrowthYoY >= 0
        ? "text-positive"
        : "text-negative",
  },
  { label: "Net Income (FY)", get: (m) => fmtUSD(m.netIncome) },
  {
    label: "Net Margin",
    get: (m) => fmtPct(m.netMargin),
    colorByValue: (m) =>
      m.netMargin == null ? "" : m.netMargin >= 0 ? "text-positive" : "text-negative",
  },
  { label: "Operating Margin", get: (m) => fmtPct(m.operatingMargin) },
  { label: "Diluted EPS (FY)", get: (m) => (m.eps != null ? `$${m.eps.toFixed(2)}` : "n/a") },
];

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<CompanyState[]>([]);
  const [input, setInput] = useState("");

  const fetchCompany = useCallback(async (ticker: string) => {
    setCompanies((prev) =>
      prev.map((c) => (c.ticker === ticker ? { ...c, loading: true, error: undefined } : c))
    );
    try {
      const [dossierRes, priceRes] = await Promise.all([
        fetch(`/api/company/${ticker}`),
        fetch(`/api/company/${ticker}/price`),
      ]);
      const dossierJson: Dossier = await dossierRes.json();
      if (!dossierRes.ok) {
        setCompanies((prev) =>
          prev.map((c) =>
            c.ticker === ticker
              ? { ...c, loading: false, error: dossierJson.error || "Lookup failed." }
              : c
          )
        );
        return;
      }
      let priceJson: PriceData | null = null;
      if (priceRes.ok) priceJson = await priceRes.json();
      const metrics = computeMetrics(dossierJson, priceJson);
      setCompanies((prev) =>
        prev.map((c) =>
          c.ticker === ticker
            ? { ...c, loading: false, name: dossierJson.name, metrics }
            : c
        )
      );
    } catch (err: any) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.ticker === ticker
            ? { ...c, loading: false, error: err?.message || "Failed to load." }
            : c
        )
      );
    }
  }, []);

  // Seed from ?tickers=AAPL,MSFT on first load.
  useEffect(() => {
    const fromUrl = searchParams.get("tickers");
    if (fromUrl) {
      const tickers = fromUrl
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, MAX_TICKERS);
      setCompanies(tickers.map((ticker) => ({ ticker, loading: true })));
      tickers.forEach(fetchCompany);
    }
    // Only seed once on mount — subsequent URL updates are driven BY this
    // page (see syncUrl), not the other way around.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncUrl(tickers: string[]) {
    const query = tickers.join(",");
    router.replace(query ? `/compare?tickers=${query}` : "/compare");
  }

  function addTicker(e: React.FormEvent) {
    e.preventDefault();
    const ticker = input.trim().toUpperCase();
    if (!ticker) return;
    if (companies.some((c) => c.ticker === ticker)) {
      setInput("");
      return;
    }
    if (companies.length >= MAX_TICKERS) return;
    const next = [...companies, { ticker, loading: true }];
    setCompanies(next);
    syncUrl(next.map((c) => c.ticker));
    setInput("");
    fetchCompany(ticker);
  }

  function removeTicker(ticker: string) {
    const next = companies.filter((c) => c.ticker !== ticker);
    setCompanies(next);
    syncUrl(next.map((c) => c.ticker));
  }

  const hasData = companies.some((c) => c.metrics);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Compare Companies</h1>
      <p className="mb-6 text-sm text-muted">
        Add up to {MAX_TICKERS} tickers to compare multiples, growth, and
        margins side by side.
      </p>

      <form onSubmit={addTicker} className="mb-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a ticker, e.g. AAPL"
          disabled={companies.length >= MAX_TICKERS}
          className="w-64 rounded-lg border border-border bg-surface px-4 py-2 uppercase text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={companies.length >= MAX_TICKERS}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {companies.length === 0 ? (
        <p className="text-sm text-muted">
          No companies added yet. Try comparing a few peers, e.g. AAPL, MSFT,
          GOOGL.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="px-4 py-3">Metric</th>
                {companies.map((c) => (
                  <th key={c.ticker} className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div>
                        <Link
                          href={`/company/${c.ticker}`}
                          className="font-semibold text-accent hover:underline"
                        >
                          {c.ticker}
                        </Link>
                        {c.name && (
                          <div className="text-xs font-normal text-muted">{c.name}</div>
                        )}
                      </div>
                      <button
                        onClick={() => removeTicker(c.ticker)}
                        aria-label={`Remove ${c.ticker}`}
                        className="text-muted hover:text-negative"
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.some((c) => c.loading) && !hasData ? (
                <tr>
                  <td colSpan={companies.length + 1} className="px-4 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : (
                ROWS.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="px-4 py-2 font-medium text-foreground">{row.label}</td>
                    {companies.map((c) => (
                      <td
                        key={c.ticker}
                        className={`px-4 py-2 text-right tabular-nums ${
                          c.error
                            ? "text-muted"
                            : c.metrics
                            ? row.colorByValue?.(c.metrics) || "text-foreground"
                            : "text-muted"
                        }`}
                      >
                        {c.error ? "n/a" : c.metrics ? row.get(c.metrics) : "…"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {companies.some((c) => c.error) && (
                <tr className="border-t border-border">
                  <td className="px-4 py-2 text-xs text-negative" colSpan={1}>
                    Errors:
                  </td>
                  {companies.map((c) => (
                    <td key={c.ticker} className="px-4 py-2 text-right text-xs text-negative">
                      {c.error || ""}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        Data from SEC EDGAR and Yahoo Finance. For informational and
        educational purposes only. Not investment advice.
      </p>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareContent />
    </Suspense>
  );
}
