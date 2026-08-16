"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import {
  loadHoldings,
  saveHoldings,
  newHoldingId,
  type Holding,
} from "@/lib/portfolio";
import { formatUSD } from "@/lib/multiples";
import {
  PERFORMANCE_PERIODS,
  computePortfolioPerformance,
  type PerformancePeriod,
  type SeriesPoint,
} from "@/lib/portfolio-performance";

type PriceState = { currentPrice: number } | "loading" | "error";
type SeriesState = SeriesPoint[] | "loading" | "error";

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [prices, setPrices] = useState<Record<string, PriceState>>({});
  const [series, setSeries] = useState<Record<string, SeriesState>>({});
  const [period, setPeriod] = useState<PerformancePeriod>("1M");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Intentional one-time capture for period-performance math.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [dateBought, setDateBought] = useState("");
  const [searchKey, setSearchKey] = useState(0);

  // Load once on mount
  useEffect(() => {
    // Intentional one-time hydration from localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHoldings(loadHoldings());
    setLoaded(true);
  }, []);

  // Persist whenever holdings change, but not before the initial load completes
  useEffect(() => {
    if (loaded) saveHoldings(holdings);
  }, [holdings, loaded]);

  // Fetch current price for every distinct ticker we don't already have
  useEffect(() => {
    const tickers = [...new Set(holdings.map((h) => h.ticker))];
    const missing = tickers.filter((t) => !(t in prices));
    if (missing.length === 0) return;

    // Intentional: marks newly-seen tickers as loading before fetching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrices((prev) => {
      const next = { ...prev };
      for (const t of missing) next[t] = "loading";
      return next;
    });

    missing.forEach(async (t) => {
      try {
        const res = await fetch(`/api/company/${t}/price`);
        const json = await res.json();
        setPrices((prev) => ({
          ...prev,
          [t]: res.ok ? { currentPrice: json.currentPrice } : "error",
        }));
      } catch {
        setPrices((prev) => ({ ...prev, [t]: "error" }));
      }
    });
  }, [holdings, prices]);

  // Fetch a 1Y daily price series per distinct ticker, for period-performance math
  useEffect(() => {
    const tickers = [...new Set(holdings.map((h) => h.ticker))];
    const missing = tickers.filter((t) => !(t in series));
    if (missing.length === 0) return;

    // Intentional: marks newly-seen tickers as loading before fetching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeries((prev) => {
      const next = { ...prev };
      for (const t of missing) next[t] = "loading";
      return next;
    });

    missing.forEach(async (t) => {
      try {
        // 2Y (not 1Y) so the longest supported period (1Y) always has a
        // data point at or before its cutoff, even with trading-day trimming.
        const res = await fetch(`/api/stock/${t}?range=2Y`);
        const json = await res.json();
        setSeries((prev) => ({
          ...prev,
          [t]: res.ok ? (json.candles as SeriesPoint[]) : "error",
        }));
      } catch {
        setSeries((prev) => ({ ...prev, [t]: "error" }));
      }
    });
  }, [holdings, series]);

  const addHolding = (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    const sharesNum = parseFloat(shares);
    const costNum = parseFloat(costBasis);
    if (!t || !Number.isFinite(sharesNum) || sharesNum <= 0 || !Number.isFinite(costNum) || costNum < 0) {
      return;
    }
    const holding: Holding = {
      id: newHoldingId(),
      ticker: t,
      shares: sharesNum,
      costBasis: costNum,
      dateBought: dateBought || todayIso(),
    };
    setHoldings((prev) => [...prev, holding]);
    setTicker("");
    setShares("");
    setCostBasis("");
    setDateBought("");
    setSearchKey((k) => k + 1);
  };

  const removeHolding = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  const rows = useMemo(
    () =>
      holdings.map((h) => {
        const priceState = prices[h.ticker];
        const currentPrice =
          priceState && typeof priceState === "object" ? priceState.currentPrice : null;
        const costTotal = h.shares * h.costBasis;
        const currentValue = currentPrice != null ? h.shares * currentPrice : null;
        const gainAbs = currentValue != null ? currentValue - costTotal : null;
        const gainPct = gainAbs != null && costTotal > 0 ? (gainAbs / costTotal) * 100 : null;
        return { holding: h, priceState, costTotal, currentValue, gainAbs, gainPct };
      }),
    [holdings, prices]
  );

  const totals = useMemo(() => {
    const withValue = rows.filter((r) => r.currentValue != null);
    const costTotal = rows.reduce((sum, r) => sum + r.costTotal, 0);
    const currentValue = withValue.reduce((sum, r) => sum + (r.currentValue ?? 0), 0);
    const complete = withValue.length === rows.length && rows.length > 0;
    return { costTotal, currentValue, gainAbs: currentValue - costTotal, complete };
  }, [rows]);

  const performance = useMemo(() => {
    if (now == null || holdings.length === 0) return null;
    const seriesByTicker: Record<string, SeriesPoint[] | undefined> = {};
    for (const [t, s] of Object.entries(series)) {
      if (Array.isArray(s)) seriesByTicker[t] = s;
    }
    const priceByTicker: Record<string, number | undefined> = {};
    for (const [t, p] of Object.entries(prices)) {
      if (typeof p === "object") priceByTicker[t] = p.currentPrice;
    }
    return computePortfolioPerformance(
      holdings,
      seriesByTicker,
      priceByTicker,
      period,
      new Date(now)
    );
  }, [holdings, series, prices, period, now]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Portfolio</h1>
      <p className="mb-6 text-sm text-muted">
        Stored only in this browser (no account/sync). Add holdings to track
        cost basis vs. current value.
      </p>

      <form
        onSubmit={addHolding}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <label className="flex flex-col text-xs text-muted">
          Ticker or company
          <SearchBox
            key={searchKey}
            compact
            onSelect={(t) => setTicker(t)}
            placeholder="AAPL or Apple"
            inputClassName="mt-1 w-40 rounded border border-border bg-transparent px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col text-xs text-muted">
          Shares
          <input
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            type="number"
            min="0"
            step="any"
            placeholder="10"
            className="mt-1 w-24 rounded border border-border bg-transparent px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col text-xs text-muted">
          Price paid / share
          <input
            value={costBasis}
            onChange={(e) => setCostBasis(e.target.value)}
            type="number"
            min="0"
            step="any"
            placeholder="150.00"
            className="mt-1 w-28 rounded border border-border bg-transparent px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col text-xs text-muted">
          Date bought
          <input
            value={dateBought}
            onChange={(e) => setDateBought(e.target.value)}
            type="date"
            className="mt-1 rounded border border-border bg-transparent px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-foreground px-4 py-1.5 text-sm font-medium text-background"
        >
          Add Holding
        </button>
      </form>

      {holdings.length === 0 ? (
        <p className="text-sm text-muted">
          No holdings yet — add one above, or{" "}
          <Link href="/" className="underline">
            search a company
          </Link>{" "}
          first.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex flex-wrap items-center gap-1">
              {PERFORMANCE_PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded px-2.5 py-1 text-sm font-medium ${
                    period === p
                      ? "bg-accent text-accent-foreground"
                      : "text-muted hover:bg-background hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {performance == null ? (
              <p className="text-sm text-muted">Loading performance…</p>
            ) : performance.includedCount === 0 ? (
              <p className="text-sm text-muted">
                No holdings owned before the start of this period yet.
              </p>
            ) : (
              <>
                <p className="text-sm">
                  <span className="text-muted">Portfolio change ({period}): </span>
                  <span
                    className={`font-medium tabular-nums ${
                      (performance.changePct ?? 0) >= 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {performance.changePct != null
                      ? `${performance.changePct >= 0 ? "+" : ""}${performance.changePct.toFixed(1)}% (${
                          performance.changeAbs >= 0 ? "+" : ""
                        }${formatUSD(performance.changeAbs)})`
                      : "n/a"}
                  </span>
                </p>
                {performance.excludedCount > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    Based on {performance.includedCount} of{" "}
                    {performance.includedCount + performance.excludedCount} holdings —{" "}
                    {performance.excludedCount} excluded (bought after this period started,
                    or price history unavailable).
                  </p>
                )}
              </>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="px-4 py-2 font-medium">Ticker</th>
                  <th className="px-4 py-2 font-medium">Shares</th>
                  <th className="px-4 py-2 font-medium">Cost / Share</th>
                  <th className="px-4 py-2 font-medium">Date Bought</th>
                  <th className="px-4 py-2 font-medium">Current Price</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium">Gain/Loss</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ holding, priceState, currentValue, gainAbs, gainPct }) => (
                  <tr key={holding.id}>
                    <td className="px-4 py-2 font-medium text-foreground">
                      <Link href={`/company/${holding.ticker}`} className="hover:underline">
                        {holding.ticker}
                      </Link>
                    </td>
                    <td className="px-4 py-2 tabular-nums text-foreground">{holding.shares}</td>
                    <td className="px-4 py-2 tabular-nums text-foreground">
                      ${holding.costBasis.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-foreground">{holding.dateBought}</td>
                    <td className="px-4 py-2 tabular-nums text-foreground">
                      {priceState === "loading"
                        ? "…"
                        : priceState === "error" || !priceState
                          ? "n/a"
                          : `$${priceState.currentPrice.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-foreground">
                      {currentValue != null ? formatUSD(currentValue) : "n/a"}
                    </td>
                    <td
                      className={`px-4 py-2 tabular-nums ${
                        gainAbs == null
                          ? "text-muted"
                          : gainAbs >= 0
                            ? "text-positive"
                            : "text-negative"
                      }`}
                    >
                      {gainAbs != null && gainPct != null
                        ? `${gainAbs >= 0 ? "+" : ""}${formatUSD(gainAbs)} (${gainPct.toFixed(1)}%)`
                        : "n/a"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeHolding(holding.id)}
                        className="text-muted hover:text-foreground"
                        aria-label={`Remove ${holding.ticker}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
            <span>
              <span className="text-muted">Total Cost: </span>
              <span className="font-medium tabular-nums text-foreground">
                {formatUSD(totals.costTotal)}
              </span>
            </span>
            <span>
              <span className="text-muted">Total Value: </span>
              <span className="font-medium tabular-nums text-foreground">
                {totals.complete ? formatUSD(totals.currentValue) : "n/a (loading)"}
              </span>
            </span>
            <span>
              <span className="text-muted">Total Gain/Loss: </span>
              <span
                className={`font-medium tabular-nums ${
                  totals.gainAbs >= 0 ? "text-positive" : "text-negative"
                }`}
              >
                {totals.complete
                  ? `${totals.gainAbs >= 0 ? "+" : ""}${formatUSD(totals.gainAbs)}`
                  : "n/a (loading)"}
              </span>
            </span>
          </div>
        </div>
      )}

      <footer className="mt-8 border-t border-border pt-4 text-center text-xs text-muted">
        For informational and educational purposes only. Not investment
        advice. Prices from Yahoo Finance.
      </footer>
    </main>
  );
}
