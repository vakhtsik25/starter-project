import Link from "next/link";

export type UpcomingEarning = {
  ticker: string;
  name: string;
  nextEarningsDate: string;
  isEstimate: boolean | null;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function UpcomingEarnings({
  upcoming,
  windowDays,
}: {
  upcoming: UpcomingEarning[];
  windowDays: number;
}) {
  if (upcoming.length === 0) {
    return (
      <p className="text-sm text-muted">
        No earnings reports in the curated large-cap list over the next{" "}
        {windowDays} days.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {upcoming.map((e) => (
        <li key={e.ticker} className="flex items-center justify-between gap-3 py-2 text-sm">
          <Link href={`/company/${e.ticker}`} className="font-medium text-accent hover:underline">
            {e.ticker}
          </Link>
          <span className="flex-1 text-foreground">{e.name}</span>
          <span className="text-muted">
            {fmtDate(e.nextEarningsDate)}
            {e.isEstimate ? " (est.)" : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
