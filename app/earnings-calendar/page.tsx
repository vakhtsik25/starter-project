"use client";

import { useEffect, useState } from "react";
import EarningsCalendarGrid, {
  type CalendarEntry,
} from "@/components/EarningsCalendarGrid";

export default function EarningsCalendarPage() {
  const [entries, setEntries] = useState<CalendarEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/market/earnings-calendar");
        const json = await res.json();
        if (!cancelled && res.ok) setEntries(json.upcoming);
      } catch {
        // Best-effort.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Earnings Calendar</h1>
      <p className="mb-6 text-sm text-muted">
        Curated large-cap list (same universe as the Screener), not the full
        market. Yahoo only provides each company&apos;s single next reporting
        date — not a full history or multiple future quarters — so most
        months will legitimately show nothing.
      </p>

      {entries === null ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded bg-surface" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-4">
          <EarningsCalendarGrid entries={entries} />
        </div>
      )}
    </main>
  );
}
