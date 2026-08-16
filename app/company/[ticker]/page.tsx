"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import SearchBox from "@/components/SearchBox";
import BarChart from "@/components/BarChart";
import StockChart from "@/app/components/StockChart";
import StatementTable from "@/components/StatementTable";
import { buildStatements } from "@/lib/statements";
import { downloadStatementsCsv, downloadStatementsPdf } from "@/lib/export";
import { downloadIcs } from "@/lib/ics";

type Point = { year: number; value: number | null };
type Filing = { form: string; date: string; title: string; url: string };
type Dossier = {
  ticker: string;
  name: string;
  sic: string | null;
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
  filings: Filing[];
  error?: string;
};
type PriceData = {
  currentPrice: number;
  previousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currency: string;
  series: { date: string; close: number }[];
  error?: string;
};

function fmtUSD(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function latestKnown(points: Point[]): number | null {
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].value !== null) return points[i].value;
  }
  return null;
}

const TABS = ["Overview", "Financials", "Filings"] as const;
type Tab = (typeof TABS)[number];

export default function CompanyDashboard() {
  const params = useParams<{ ticker: string }>();
  const ticker = (params.ticker || "").toUpperCase();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDossier(null);
    setPrice(null);

    (async () => {
      const dossierRes = await fetch(`/api/company/${ticker}`);
      const dossierJson = await dossierRes.json();
      if (cancelled) return;
      if (!dossierRes.ok) {
        setError(dossierJson.error || "Lookup failed.");
        setLoading(false);
        return;
      }
      setDossier(dossierJson);
      setLoading(false);

      // Price is best-effort — a dashboard is still useful without it.
      try {
        const priceRes = await fetch(`/api/company/${ticker}/price`);
        const priceJson = await priceRes.json();
        if (!cancelled && priceRes.ok) setPrice(priceJson);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const statements = useMemo(() => (dossier ? buildStatements(dossier) : []), [dossier]);

  const multiples = useMemo(() => {
    if (!dossier) return null;
    const eps = latestKnown(dossier.incomeStatement.eps);
    const revenue = latestKnown(dossier.incomeStatement.revenue);
    const equity = latestKnown(dossier.balanceSheet.stockholdersEquity);
    const shares = dossier.sharesOutstanding;
    const marketCap = price && shares ? price.currentPrice * shares : null;
    return {
      marketCap,
      pe: price && eps !== null && eps > 0 ? price.currentPrice / eps : null,
      pb: marketCap && equity && equity > 0 ? marketCap / equity : null,
      ps: marketCap && revenue && revenue > 0 ? marketCap / revenue : null,
    };
  }, [dossier, price]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/" className="text-sm text-accent hover:underline">
          ← Search another company
        </Link>
        <ThemeToggle />
      </div>

      <div className="mb-6">
        <SearchBox placeholder="Search another company…" />
      </div>

      {loading && (
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-64 rounded bg-surface" />
          <div className="h-32 rounded-xl bg-surface" />
          <div className="h-32 rounded-xl bg-surface" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg bg-negative/10 px-4 py-3 text-sm text-negative">
          {error}{" "}
          <Link href="/" className="underline">
            Try another search.
          </Link>
        </div>
      )}

      {dossier && !loading && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {dossier.name}{" "}
              <span className="text-muted">({dossier.ticker})</span>
            </h1>
            {dossier.sic && <p className="text-muted">{dossier.sic}</p>}
          </div>

          {/* Price + multiples row */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted">Price</p>
              {price ? (
                <>
                  <p className="text-xl font-semibold text-foreground">
                    ${price.currentPrice.toFixed(2)}
                  </p>
                  <p
                    className={`text-xs ${
                      price.currentPrice >= price.previousClose
                        ? "text-positive"
                        : "text-negative"
                    }`}
                  >
                    {price.currentPrice >= price.previousClose ? "+" : ""}
                    {(
                      ((price.currentPrice - price.previousClose) /
                        price.previousClose) *
                      100
                    ).toFixed(2)}
                    % today
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">n/a</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted">Market Cap</p>
              <p className="text-xl font-semibold text-foreground">
                {multiples?.marketCap ? fmtUSD(multiples.marketCap) : "n/a"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted">P/E (FY)</p>
              <p className="text-xl font-semibold text-foreground">
                {multiples?.pe ? multiples.pe.toFixed(1) + "x" : "n/a"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted">P/S · P/B</p>
              <p className="text-xl font-semibold text-foreground">
                {multiples?.ps ? multiples.ps.toFixed(1) + "x" : "n/a"} ·{" "}
                {multiples?.pb ? multiples.pb.toFixed(1) + "x" : "n/a"}
              </p>
            </div>
          </section>

          {/* Price chart — candlestick/line with moving averages, 1D through 5Y */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <StockChart symbol={dossier.ticker} defaultRange="1Y" />
          </section>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium ${
                  tab === t
                    ? "border-b-2 border-accent text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Overview" && (
            <div className="grid gap-6 sm:grid-cols-2">
              <section className="rounded-xl border border-border bg-surface p-5">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Revenue (annual, 5yr)
                </h2>
                <BarChart data={dossier.incomeStatement.revenue} format={fmtUSD} />
              </section>
              <section className="rounded-xl border border-border bg-surface p-5">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Net Income (annual, 5yr)
                </h2>
                <BarChart data={dossier.incomeStatement.netIncome} format={fmtUSD} />
              </section>
            </div>
          )}

          {tab === "Financials" && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    downloadStatementsCsv(dossier.ticker, dossier.name, statements)
                  }
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-background"
                >
                  ⬇ Download CSV
                </button>
                <button
                  onClick={() =>
                    downloadStatementsPdf(dossier.ticker, dossier.name, statements)
                  }
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-background"
                >
                  ⬇ Download PDF
                </button>
              </div>
              {statements.map((s) => (
                <section
                  key={s.title}
                  className="rounded-xl border border-border bg-surface p-5"
                >
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    {s.title}
                  </h2>
                  <StatementTable statement={s} />
                </section>
              ))}
            </div>
          )}

          {tab === "Filings" && (
            <section className="rounded-xl border border-border bg-surface p-5">
              {dossier.filings.length === 0 ? (
                <p className="text-sm text-muted">No recent filings.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {dossier.filings.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <span>
                        <span className="inline-block w-14 font-medium text-accent">
                          {f.form}
                        </span>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:underline"
                        >
                          {f.date}
                        </a>
                      </span>
                      <button
                        onClick={() =>
                          downloadIcs(dossier.name, dossier.ticker, f.date, f.form)
                        }
                        className="rounded border border-border px-2 py-1 text-xs text-muted hover:bg-background"
                      >
                        + calendar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <footer className="border-t border-border pt-4 text-center text-xs text-muted">
            For informational and educational purposes only. Not investment
            advice. Data from SEC EDGAR and Yahoo Finance.
          </footer>
        </div>
      )}
    </main>
  );
}
