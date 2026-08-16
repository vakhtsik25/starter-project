"use client";

import { useEffect, useState } from "react";
import MarketOverview, { type IndexData } from "@/components/MarketOverview";
import NewsList, { type NewsItem } from "@/components/NewsList";
import EarningsCalendarPreview from "@/components/EarningsCalendarPreview";
import type { CalendarEntry } from "@/components/EarningsCalendarGrid";
import { buildMarketSnapshot } from "@/lib/market-snapshot";
import { loadProfile, type Profile } from "@/lib/profile";

export default function Home() {
  const [indices, setIndices] = useState<IndexData[] | null>(null);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [earnings, setEarnings] = useState<CalendarEntry[] | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Intentional: captures a render-safe "now" for relative news timestamps,
    // and hydrates the local profile for the greeting below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/market/overview");
        const json = await res.json();
        if (!cancelled) setIndices(json.indices);
      } catch {
        // Market overview is best-effort — the page is still useful without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/market/news");
        const json = await res.json();
        if (!cancelled && res.ok) setNews(json.news);
      } catch {
        // Best-effort.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/market/earnings-calendar");
        const json = await res.json();
        if (!cancelled && res.ok) setEarnings(json.upcoming);
      } catch {
        // Best-effort.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const snapshot = indices ? buildMarketSnapshot(indices) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">FinLens</h1>
        {profile && (
          <p className="mt-1 text-sm text-muted">
            Welcome back, {profile.name} {profile.avatar}
          </p>
        )}
        <p className="mx-auto mt-2 max-w-md text-muted">
          Investor snapshots from the primary source — SEC EDGAR. Search a
          ticker or company name above to see historical financials, filings,
          and stock price history.
        </p>
      </header>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Market Overview
        </h2>
        {indices ? (
          <MarketOverview indices={indices} />
        ) : (
          <div className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-background" />
            ))}
          </div>
        )}
      </section>

      {snapshot && (
        <section className="mb-6 rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Market Snapshot
          </h2>
          <p className="text-sm text-foreground">{snapshot}</p>
          <p className="mt-2 text-xs text-muted">
            Auto-generated from live index data — not commentary or analysis,
            just a plain-language read of the numbers above.
          </p>
        </section>
      )}

      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Market News
        </h2>
        {news === null || now === null ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-background" />
            ))}
          </div>
        ) : (
          <NewsList news={news} now={now} initialCount={4} />
        )}
      </section>

      <section className="mb-10 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Earnings Calendar
        </h2>
        <p className="mb-3 text-xs text-muted">
          Curated large-cap list, not the full market.
        </p>
        {earnings === null ? (
          <div className="h-32 animate-pulse rounded bg-background" />
        ) : (
          <EarningsCalendarPreview entries={earnings} />
        )}
      </section>

      <footer className="mt-10 border-t border-border pt-4 text-center text-xs text-muted">
        For informational and educational purposes only. Not investment advice.
        Data from SEC EDGAR and Yahoo Finance.
      </footer>
    </main>
  );
}
