"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MarketOverview, { type IndexData } from "@/components/MarketOverview";
import NewsList, { type NewsItem } from "@/components/NewsList";
import EarningsCalendarPreview from "@/components/EarningsCalendarPreview";
import type { CalendarEntry } from "@/components/EarningsCalendarGrid";
import MoversList from "@/components/MoversList";
import type { Mover } from "@/app/api/market/movers/route";
import { buildMarketSnapshot } from "@/lib/market-snapshot";
import { loadProfile, type Profile } from "@/lib/profile";

function DirectionCard({
  href,
  title,
  description,
  accent = false,
}: {
  href: string;
  title: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        accent
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-foreground"
      }`}
    >
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p
          className={`mt-1 text-sm ${
            accent ? "text-accent-foreground/85" : "text-muted"
          }`}
        >
          {description}
        </p>
      </div>
      <span
        className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${
          accent ? "text-accent-foreground" : "text-accent"
        }`}
      >
        {accent ? "Get started" : "Explore"}
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  );
}

export default function Home() {
  const [indices, setIndices] = useState<IndexData[] | null>(null);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [earnings, setEarnings] = useState<CalendarEntry[] | null>(null);
  const [movers, setMovers] = useState<{ gainers: Mover[]; losers: Mover[] } | null>(null);
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
        const res = await fetch("/api/market/movers");
        const json = await res.json();
        if (!cancelled && res.ok) setMovers(json);
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
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance">
          See what&apos;s really in the numbers.
        </h1>
        {profile && (
          <p className="mt-2 text-sm text-muted">
            Welcome back, {profile.name} {profile.avatar}
          </p>
        )}
        <p className="mx-auto mt-3 max-w-lg text-muted text-balance">
          Plain-language stock research pulled straight from SEC filings and
          live market data — explore any company, track today&apos;s movers,
          and start investing when you&apos;re ready.
        </p>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        <DirectionCard
          href="/stocks"
          title="Explore stocks"
          description="Search any public company for financials, filings, and price history — explained simply."
        />
        <DirectionCard
          href="#movers"
          title="Today's movers"
          description="See which stocks are up or down right now, and by how much."
        />
        <DirectionCard
          href="/early-access"
          title="Start investing"
          description="Get matched with an approach that fits your goals and risk comfort."
          accent
        />
      </section>

      <section id="movers" className="mb-6 scroll-mt-24 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Today&apos;s Gainers &amp; Losers
        </h2>
        {movers ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <MoversList title="Gainers" movers={movers.gainers} positive />
            <MoversList title="Losers" movers={movers.losers} positive={false} />
          </div>
        ) : (
          <div className="grid animate-pulse gap-6 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-10 rounded bg-background" />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

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
