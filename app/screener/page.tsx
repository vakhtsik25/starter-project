"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PERIODS, type Period } from "@/lib/stock-performance";

type Stock = {
  ticker: string;
  name: string;
  industry: string;
  price: number | null;
  performance: Partial<Record<Period, number>>;
  error?: string;
};

function fmtPct(v: number | undefined) {
  if (v == null) return "n/a";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function pctClass(v: number | undefined) {
  if (v == null) return "text-muted";
  return v >= 0 ? "text-positive" : "text-negative";
}

function StockRow({ stock, showIndustry }: { stock: Stock; showIndustry: boolean }) {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2">
        <Link
          href={`/company/${stock.ticker}`}
          className="font-medium text-accent hover:underline"
        >
          {stock.ticker}
        </Link>
      </td>
      <td className="px-2 py-2 text-foreground">{stock.name}</td>
      {showIndustry && <td className="px-2 py-2 text-muted">{stock.industry}</td>}
      <td className="px-2 py-2 text-right tabular-nums text-foreground">
        {stock.price != null ? `$${stock.price.toFixed(2)}` : "n/a"}
      </td>
      {PERIODS.map((p) => (
        <td
          key={p}
          className={`px-2 py-2 text-right tabular-nums ${pctClass(stock.performance[p])}`}
        >
          {fmtPct(stock.performance[p])}
        </td>
      ))}
    </tr>
  );
}

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<Stock[] | null>(null);
  const [sortPeriod, setSortPeriod] = useState<Period>("1D");
  const [groupByIndustry, setGroupByIndustry] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stocks/screener");
        const json = await res.json();
        if (!cancelled) setStocks(json.stocks);
      } catch {
        // Screener is best-effort; page just stays on the loading state.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    if (!stocks) return [];
    return [...stocks].sort((a, b) => {
      const av = a.performance[sortPeriod];
      const bv = b.performance[sortPeriod];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return bv - av; // descending — best performers first
    });
  }, [stocks, sortPeriod]);

  const grouped = useMemo(() => {
    if (!groupByIndustry) return null;
    const map = new Map<string, Stock[]>();
    for (const s of sorted) {
      if (!map.has(s.industry)) map.set(s.industry, []);
      map.get(s.industry)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sorted, groupByIndustry]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Screener</h1>
          <p className="text-sm text-muted">
            A curated set of large-cap US stocks. Click a period column to sort
            by it.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={groupByIndustry}
            onChange={(e) => setGroupByIndustry(e.target.checked)}
          />
          Group by industry
        </label>
      </div>

      {!stocks ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-surface" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="px-4 py-2">Ticker</th>
                <th className="px-2 py-2">Name</th>
                {!groupByIndustry && <th className="px-2 py-2">Industry</th>}
                <th className="px-2 py-2 text-right">Price</th>
                {PERIODS.map((p) => (
                  <th key={p} className="px-2 py-2 text-right">
                    <button
                      onClick={() => setSortPeriod(p)}
                      className={
                        sortPeriod === p
                          ? "font-bold text-accent"
                          : "text-muted hover:text-foreground"
                      }
                    >
                      {p}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupByIndustry
                ? grouped!.map(([industry, list]) => (
                    <Fragment key={industry}>
                      <tr>
                        <td
                          colSpan={3 + PERIODS.length}
                          className="bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted"
                        >
                          {industry}
                        </td>
                      </tr>
                      {list.map((s) => (
                        <StockRow key={s.ticker} stock={s} showIndustry={false} />
                      ))}
                    </Fragment>
                  ))
                : sorted.map((s) => (
                    <StockRow key={s.ticker} stock={s} showIndustry />
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        Curated list of large-cap stocks, not the full market. Data from
        Yahoo Finance. For informational and educational purposes only. Not
        investment advice.
      </p>
    </main>
  );
}
