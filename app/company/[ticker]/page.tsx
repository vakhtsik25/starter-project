"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BarChart from "@/components/BarChart";
import StockChart from "@/app/components/StockChart";
import StatementTable from "@/components/StatementTable";
import NewsList, { type NewsItem } from "@/components/NewsList";
import AnalystRatings, { type AnalystData } from "@/components/AnalystRatings";
import EarningsCalendar, { type EarningsData } from "@/components/EarningsCalendar";
import PeerValuation from "@/components/PeerValuation";
import { buildStatements } from "@/lib/statements";
import { downloadStatementsCsv, downloadStatementsPdf } from "@/lib/export";
import { downloadIcs } from "@/lib/ics";
import { computeMultiples } from "@/lib/multiples";

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

// Dense label/value row for the Capital-IQ-style summary boxes.
function Row({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-medium tabular-nums text-foreground ${valueClassName}`}>
        {value}
      </dd>
    </div>
  );
}

const TABS = [
  "Overview",
  "Financials",
  "Filings",
  "News",
  "Analysts",
  "Earnings",
  "Valuation",
] as const;
type Tab = (typeof TABS)[number];

export default function CompanyDashboard() {
  const params = useParams<{ ticker: string }>();
  const ticker = (params.ticker || "").toUpperCase();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [price, setPrice] = useState<PriceData | null>(null);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [analysts, setAnalysts] = useState<AnalystData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Intentional: captures a render-safe "now" for relative news timestamps.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDossier(null);
    setPrice(null);
    setNews(null);
    setAnalysts(null);
    setEarnings(null);

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

      // Price and news are best-effort — a dashboard is still useful without them.
      try {
        const priceRes = await fetch(`/api/company/${ticker}/price`);
        const priceJson = await priceRes.json();
        if (!cancelled && priceRes.ok) setPrice(priceJson);
      } catch {
        // ignore
      }

      try {
        const newsRes = await fetch(`/api/company/${ticker}/news`);
        const newsJson = await newsRes.json();
        if (!cancelled && newsRes.ok) setNews(newsJson.news);
      } catch {
        // ignore
      }

      try {
        const analystsRes = await fetch(`/api/company/${ticker}/analysts`);
        const analystsJson = await analystsRes.json();
        if (!cancelled && analystsRes.ok) setAnalysts(analystsJson);
      } catch {
        // ignore
      }

      try {
        const earningsRes = await fetch(`/api/company/${ticker}/earnings`);
        const earningsJson = await earningsRes.json();
        if (!cancelled && earningsRes.ok) setEarnings(earningsJson);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const statements = useMemo(() => (dossier ? buildStatements(dossier) : []), [dossier]);

  const multiples = useMemo(
    () => (dossier ? computeMultiples({ dossier, price }) : null),
    [dossier, price]
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
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

          {/* Stock Quote — dense two-column summary, Capital IQ style */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Stock Quote
            </h2>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <dl className="divide-y divide-border">
                <Row
                  label="Last"
                  value={price ? `$${price.currentPrice.toFixed(2)}` : "n/a"}
                />
                <Row
                  label="Change on Day"
                  value={
                    price
                      ? `${price.currentPrice >= price.previousClose ? "+" : ""}${(
                          ((price.currentPrice - price.previousClose) /
                            price.previousClose) *
                          100
                        ).toFixed(2)}%`
                      : "n/a"
                  }
                  valueClassName={
                    price
                      ? price.currentPrice >= price.previousClose
                        ? "text-positive"
                        : "text-negative"
                      : ""
                  }
                />
                <Row
                  label="52 Wk High"
                  value={price ? `$${price.fiftyTwoWeekHigh.toFixed(2)}` : "n/a"}
                />
                <Row
                  label="52 Wk Low"
                  value={price ? `$${price.fiftyTwoWeekLow.toFixed(2)}` : "n/a"}
                />
              </dl>
              <dl className="divide-y divide-border">
                <Row
                  label="Market Cap"
                  value={multiples?.marketCap ? fmtUSD(multiples.marketCap) : "n/a"}
                />
                <Row
                  label="Shares Outstanding"
                  value={multiples?.shares ? multiples.shares.toLocaleString() : "n/a"}
                />
                <Row
                  label="Diluted EPS (FY)"
                  value={multiples?.eps != null ? `$${multiples.eps.toFixed(2)}` : "n/a"}
                />
                <Row
                  label="P/Diluted EPS (FY)"
                  value={multiples?.pe ? `${multiples.pe.toFixed(1)}x` : "n/a"}
                />
              </dl>
            </div>
          </section>

          {/* Financial Information — latest fiscal year, from SEC EDGAR */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Financial Information (Latest FY)
            </h2>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <dl className="divide-y divide-border">
                <Row
                  label="Total Revenue"
                  value={multiples?.revenue != null ? fmtUSD(multiples.revenue) : "n/a"}
                />
                <Row
                  label="Net Income"
                  value={multiples?.netIncome != null ? fmtUSD(multiples.netIncome) : "n/a"}
                />
                <Row
                  label="Total Assets"
                  value={multiples?.assets != null ? fmtUSD(multiples.assets) : "n/a"}
                />
              </dl>
              <dl className="divide-y divide-border">
                <Row
                  label="Price/Sales"
                  value={multiples?.ps ? `${multiples.ps.toFixed(1)}x` : "n/a"}
                />
                <Row
                  label="Price/Book"
                  value={multiples?.pb ? `${multiples.pb.toFixed(1)}x` : "n/a"}
                />
              </dl>
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

          {tab === "News" && (
            <section className="rounded-xl border border-border bg-surface p-5">
              {news === null || now === null ? (
                <p className="text-sm text-muted">Loading news…</p>
              ) : (
                <NewsList news={news} now={now} />
              )}
            </section>
          )}

          {tab === "Analysts" && (
            <section className="rounded-xl border border-border bg-surface p-5">
              {analysts === null ? (
                <p className="text-sm text-muted">Loading analyst ratings…</p>
              ) : (
                <AnalystRatings data={analysts} />
              )}
            </section>
          )}

          {tab === "Earnings" && (
            <section className="rounded-xl border border-border bg-surface p-5">
              {earnings === null ? (
                <p className="text-sm text-muted">Loading earnings calendar…</p>
              ) : (
                <EarningsCalendar
                  data={earnings}
                  ticker={dossier.ticker}
                  name={dossier.name}
                />
              )}
            </section>
          )}

          {tab === "Valuation" && (
            <section className="rounded-xl border border-border bg-surface p-5">
              {multiples === null ? (
                <p className="text-sm text-muted">Loading valuation…</p>
              ) : (
                <PeerValuation
                  ticker={dossier.ticker}
                  name={dossier.name}
                  multiples={multiples}
                />
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
