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
import { computeMetrics, type Dossier, type PriceData } from "@/lib/company-metrics";
import { buildScorecard, type ScorecardItem } from "@/lib/scorecard";

type InsiderTransaction = {
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

function fmtUSD(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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
  "Analysis",
  "Financials",
  "Valuation",
  "Analysts",
  "Earnings",
  "News",
  "Insiders",
  "Filings",
] as const;
type Tab = (typeof TABS)[number];

export default function CompanyDashboard() {
  const params = useParams<{ ticker: string }>();
  const ticker = (params.ticker || "").toUpperCase();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [price, setPrice] = useState<PriceData | null>(null);
  const [insiders, setInsiders] = useState<InsiderTransaction[] | null>(null);
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
    setInsiders(null);
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

      // Price, insider activity, news, analysts, and earnings are all
      // best-effort — the dashboard is still useful without any of them.
      try {
        const priceRes = await fetch(`/api/company/${ticker}/price`);
        const priceJson = await priceRes.json();
        if (!cancelled && priceRes.ok) setPrice(priceJson);
      } catch {
        // ignore
      }

      try {
        const insidersRes = await fetch(`/api/company/${ticker}/insiders`);
        const insidersJson = await insidersRes.json();
        if (!cancelled && insidersRes.ok) setInsiders(insidersJson.transactions);
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
    () => (dossier ? computeMetrics(dossier, price) : null),
    [dossier, price]
  );

  const scorecard = useMemo(
    () => (dossier ? buildScorecard(dossier) : []),
    [dossier]
  );

  const growthMarginRows = useMemo(() => {
    if (!dossier) return [];
    const revenue = dossier.incomeStatement.revenue.filter(
      (p): p is { year: number; value: number } => p.value !== null
    );
    const netIncome = dossier.incomeStatement.netIncome.filter(
      (p): p is { year: number; value: number } => p.value !== null
    );
    const operatingIncome = dossier.incomeStatement.operatingIncome.filter(
      (p): p is { year: number; value: number } => p.value !== null
    );
    return revenue.map((r, i) => {
      const prior = i > 0 ? revenue[i - 1] : null;
      const growth =
        prior && prior.value !== 0 ? ((r.value - prior.value) / Math.abs(prior.value)) * 100 : null;
      const ni = netIncome.find((n) => n.year === r.year)?.value;
      const oi = operatingIncome.find((o) => o.year === r.year)?.value;
      return {
        year: r.year,
        growth,
        netMargin: ni != null && r.value > 0 ? (ni / r.value) * 100 : null,
        opMargin: oi != null && r.value > 0 ? (oi / r.value) * 100 : null,
      };
    });
  }, [dossier]);

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

          {tab === "Analysis" && (
            <div className="space-y-6">
              <section className="rounded-xl border border-border bg-surface p-5">
                <h2 className="mb-2 text-lg font-semibold text-foreground">
                  Scorecard
                </h2>
                <p className="mb-4 text-xs text-muted">
                  Each line is a plain restatement of the numbers in the
                  Financials tab — not a recommendation, and not a
                  substitute for reading the actual filings.
                </p>
                {scorecard.length === 0 ? (
                  <p className="text-sm text-muted">
                    Not enough historical data to compute trend signals.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {scorecard.map((item: ScorecardItem) => (
                      <li key={item.label} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 shrink-0 ${
                            item.status === "good"
                              ? "text-positive"
                              : item.status === "bad"
                              ? "text-negative"
                              : item.status === "warn"
                              ? "text-negative"
                              : "text-muted"
                          }`}
                        >
                          {item.status === "good"
                            ? "✅"
                            : item.status === "bad"
                            ? "❌"
                            : item.status === "warn"
                            ? "⚠️"
                            : "•"}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {item.label}
                          </div>
                          <div className="text-sm text-muted">{item.detail}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-border bg-surface p-5">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Growth &amp; Margin Trend
                </h2>
                {growthMarginRows.length === 0 ? (
                  <p className="text-sm text-muted">No data available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted">
                          <th className="pb-2 pr-4">Metric</th>
                          {growthMarginRows.map((r) => (
                            <th key={r.year} className="pb-2 pl-4 text-right">
                              {r.year}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="py-2 pr-4 font-medium text-foreground">
                            Revenue Growth YoY
                          </td>
                          {growthMarginRows.map((r) => (
                            <td
                              key={r.year}
                              className={`py-2 pl-4 text-right tabular-nums ${
                                r.growth == null
                                  ? "text-muted"
                                  : r.growth >= 0
                                  ? "text-positive"
                                  : "text-negative"
                              }`}
                            >
                              {r.growth != null ? `${r.growth >= 0 ? "+" : ""}${r.growth.toFixed(1)}%` : "n/a"}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-t border-border">
                          <td className="py-2 pr-4 font-medium text-foreground">
                            Net Margin
                          </td>
                          {growthMarginRows.map((r) => (
                            <td key={r.year} className="py-2 pl-4 text-right tabular-nums text-foreground">
                              {r.netMargin != null ? `${r.netMargin.toFixed(1)}%` : "n/a"}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-t border-border">
                          <td className="py-2 pr-4 font-medium text-foreground">
                            Operating Margin
                          </td>
                          {growthMarginRows.map((r) => (
                            <td key={r.year} className="py-2 pl-4 text-right tabular-nums text-foreground">
                              {r.opMargin != null ? `${r.opMargin.toFixed(1)}%` : "n/a"}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
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

          {tab === "Insiders" && (
            <section className="rounded-xl border border-border bg-surface p-5">
              <p className="mb-4 text-xs text-muted">
                Recent Form 4 filings from SEC EDGAR — officers, directors,
                and 10%+ owners are required to report trades within 2
                business days. Not all codes represent a discretionary
                buy/sell decision (e.g. option exercises and tax
                withholding are largely mechanical).
              </p>
              {!insiders ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 rounded bg-background" />
                  ))}
                </div>
              ) : insiders.length === 0 ? (
                <p className="text-sm text-muted">No recent insider activity found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted">
                        <th className="pb-2 pr-4">Insider</th>
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">Transaction</th>
                        <th className="pb-2 pr-4 text-right">Shares</th>
                        <th className="pb-2 pr-4 text-right">Price</th>
                        <th className="pb-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insiders.map((t, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="py-2 pr-4">
                            <div className="font-medium text-foreground">
                              {t.ownerName}
                            </div>
                            <div className="text-xs text-muted">
                              {t.officerTitle ||
                                (t.isDirector
                                  ? "Director"
                                  : t.isTenPercentOwner
                                  ? "10%+ Owner"
                                  : "")}
                            </div>
                          </td>
                          <td className="py-2 pr-4 text-muted">{t.date}</td>
                          <td
                            className={`py-2 pr-4 font-medium ${
                              t.code === "P"
                                ? "text-positive"
                                : t.code === "S"
                                ? "text-negative"
                                : "text-muted"
                            }`}
                          >
                            {t.codeLabel}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-foreground">
                            {t.shares.toLocaleString()}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-foreground">
                            {t.pricePerShare > 0 ? `$${t.pricePerShare.toFixed(2)}` : "n/a"}
                          </td>
                          <td className="py-2 text-right tabular-nums text-foreground">
                            {t.value > 0 ? fmtUSD(t.value) : "n/a"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
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
