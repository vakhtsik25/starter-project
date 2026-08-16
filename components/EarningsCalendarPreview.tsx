import Link from "next/link";
import { dateKey, getMonthGrid, isSameDay, isSameMonth } from "@/lib/calendar-utils";
import type { CalendarEntry } from "@/components/EarningsCalendarGrid";

const WEEKDAY_INITIAL = ["S", "M", "T", "W", "T", "F", "S"];

function todayUtc() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export default function EarningsCalendarPreview({
  entries,
}: {
  entries: CalendarEntry[];
}) {
  const today = todayUtc();
  const weeks = getMonthGrid(today);

  const byDate = new Map<string, CalendarEntry[]>();
  for (const e of entries) {
    const key = dateKey(new Date(e.nextEarningsDate));
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(e);
  }

  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(today);

  const next = [...entries]
    .sort((a, b) => a.nextEarningsDate.localeCompare(b.nextEarningsDate))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="w-full max-w-[260px] overflow-hidden rounded-lg border border-border">
        <div className="bg-background/40 px-2 py-1 text-center text-xs font-medium text-foreground">
          {monthLabel}
        </div>
        <div className="grid grid-cols-7 text-center text-[10px] text-muted">
          {WEEKDAY_INITIAL.map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flat().map((day) => {
            const key = dateKey(day);
            const dayEntries = byDate.get(key) ?? [];
            const inMonth = isSameMonth(day, today);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={key}
                className="flex h-8 flex-col items-center justify-center border-t border-border"
                title={dayEntries.length ? dayEntries.map((e) => e.ticker).join(", ") : undefined}
              >
                <span
                  className={
                    isToday
                      ? "flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground"
                      : `text-[11px] ${inMonth ? "text-foreground" : "text-muted/40"}`
                  }
                >
                  {day.getUTCDate()}
                </span>
                {dayEntries.length > 0 && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-accent" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 text-sm">
        {next.length > 0 ? (
          <ul className="space-y-1.5">
            {next.map((e) => (
              <li key={e.ticker} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <Link href={`/company/${e.ticker}`} className="font-medium text-accent hover:underline">
                  {e.ticker}
                </Link>
                <span className="text-muted">
                  {new Date(e.nextEarningsDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No upcoming reports in the curated list right now.</p>
        )}
        <Link
          href="/earnings-calendar"
          className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
        >
          View full calendar →
        </Link>
      </div>
    </div>
  );
}
