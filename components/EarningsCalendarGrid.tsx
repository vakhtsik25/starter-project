"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  dateKey,
  getMonthGrid,
  getWeekDays,
  isSameDay,
  isSameMonth,
} from "@/lib/calendar-utils";

export type CalendarEntry = {
  ticker: string;
  name: string;
  nextEarningsDate: string;
  isEstimate: boolean | null;
};

type ViewMode = "month" | "week" | "day";

function todayUtc() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const DAY_LABEL = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EarningsCalendarGrid({ entries }: { entries: CalendarEntry[] }) {
  const [mode, setMode] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => todayUtc());
  const today = useMemo(() => todayUtc(), []);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      const key = dateKey(new Date(e.nextEarningsDate));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [entries]);

  const navigate = (dir: -1 | 1) => {
    setCursor((prev) => {
      if (mode === "month") return addMonths(prev, dir);
      if (mode === "week") return addDays(prev, dir * 7);
      return addDays(prev, dir);
    });
  };

  const goToday = () => setCursor(todayUtc());

  const headerLabel =
    mode === "day" ? DAY_LABEL.format(cursor) : MONTH_LABEL.format(cursor);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Previous"
            className="rounded-full px-2.5 py-1 text-muted hover:bg-background hover:text-foreground"
          >
            ‹
          </button>
          <h2 className="min-w-[10rem] text-sm font-semibold text-foreground">
            {headerLabel}
          </h2>
          <button
            type="button"
            onClick={() => navigate(1)}
            aria-label="Next"
            className="rounded-full px-2.5 py-1 text-muted hover:bg-background hover:text-foreground"
          >
            ›
          </button>
          <button
            type="button"
            onClick={goToday}
            className="ml-1 rounded-full bg-background/60 px-3 py-1 text-xs font-medium text-muted hover:bg-background hover:text-foreground"
          >
            Today
          </button>
        </div>
        <div className="flex gap-1 rounded-full bg-background/60 p-1">
          {(["month", "week", "day"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                mode === m
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "month" && (
        <MonthView cursor={cursor} today={today} byDate={byDate} />
      )}
      {mode === "week" && <WeekView cursor={cursor} today={today} byDate={byDate} />}
      {mode === "day" && <DayView cursor={cursor} byDate={byDate} />}
    </div>
  );
}

function EntryChip({ entry }: { entry: CalendarEntry }) {
  return (
    <Link
      href={`/company/${entry.ticker}`}
      className="block truncate rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent hover:bg-accent/25"
      title={entry.name}
    >
      {entry.ticker}
    </Link>
  );
}

function MonthView({
  cursor,
  today,
  byDate,
}: {
  cursor: Date;
  today: Date;
  byDate: Map<string, CalendarEntry[]>;
}) {
  const weeks = useMemo(() => getMonthGrid(cursor), [cursor]);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-background/40 text-center text-xs font-medium text-muted">
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const key = dateKey(day);
          const dayEntries = byDate.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={key}
              className={`min-h-[84px] border-b border-r border-border p-1.5 last:border-r-0 ${
                inMonth ? "" : "bg-background/30"
              }`}
            >
              <div
                className={`mb-1 text-xs ${
                  isToday
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent font-medium text-accent-foreground"
                    : inMonth
                      ? "text-foreground"
                      : "text-muted/50"
                }`}
              >
                {day.getUTCDate()}
              </div>
              <div className="space-y-0.5">
                {dayEntries.slice(0, 3).map((e) => (
                  <EntryChip key={e.ticker} entry={e} />
                ))}
                {dayEntries.length > 3 && (
                  <div className="text-[10px] text-muted">
                    +{dayEntries.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  cursor,
  today,
  byDate,
}: {
  cursor: Date;
  today: Date;
  byDate: Map<string, CalendarEntry[]>;
}) {
  const days = useMemo(() => getWeekDays(cursor), [cursor]);

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const key = dateKey(day);
        const dayEntries = byDate.get(key) ?? [];
        const isToday = isSameDay(day, today);
        return (
          <div
            key={key}
            className="min-h-[160px] rounded-xl border border-border p-2"
          >
            <div className="mb-2 text-xs">
              <span className="text-muted">{WEEKDAY_SHORT[day.getUTCDay()]}</span>{" "}
              <span
                className={
                  isToday
                    ? "rounded-full bg-accent px-1.5 py-0.5 font-medium text-accent-foreground"
                    : "font-medium text-foreground"
                }
              >
                {day.getUTCDate()}
              </span>
            </div>
            <div className="space-y-1">
              {dayEntries.map((e) => (
                <EntryChip key={e.ticker} entry={e} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({
  cursor,
  byDate,
}: {
  cursor: Date;
  byDate: Map<string, CalendarEntry[]>;
}) {
  const dayEntries = byDate.get(dateKey(cursor)) ?? [];
  if (dayEntries.length === 0) {
    return <p className="text-sm text-muted">No earnings reports this day.</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {dayEntries.map((e) => (
        <li key={e.ticker} className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href={`/company/${e.ticker}`} className="font-medium text-accent hover:underline">
            {e.ticker}
          </Link>
          <span className="flex-1 text-sm text-foreground">{e.name}</span>
          {e.isEstimate && <span className="text-xs text-muted">estimate</span>}
        </li>
      ))}
    </ul>
  );
}
