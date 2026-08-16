import { downloadIcs } from "@/lib/ics";

export type EarningsData = {
  nextEarningsDate: string | null;
  isEstimate: boolean | null;
  earningsAverage: number | null;
  earningsLow: number | null;
  earningsHigh: number | null;
  revenueAverage: number | null;
  revenueLow: number | null;
  revenueHigh: number | null;
  exDividendDate: string | null;
  dividendDate: string | null;
};

function fmtUSD(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export default function EarningsCalendar({
  data,
  ticker,
  name,
}: {
  data: EarningsData;
  ticker: string;
  name: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <dl className="flex-1 divide-y divide-border">
          <Row
            label="Next Earnings Date"
            value={
              data.nextEarningsDate
                ? `${fmtDate(data.nextEarningsDate)}${
                    data.isEstimate ? " (estimate)" : ""
                  }`
                : "n/a"
            }
          />
          <Row
            label="EPS Estimate"
            value={
              data.earningsAverage != null
                ? `$${data.earningsAverage.toFixed(2)} (range $${data.earningsLow?.toFixed(2)}–$${data.earningsHigh?.toFixed(2)})`
                : "n/a"
            }
          />
          <Row
            label="Revenue Estimate"
            value={
              data.revenueAverage != null
                ? `${fmtUSD(data.revenueAverage)} (range ${
                    data.revenueLow != null ? fmtUSD(data.revenueLow) : "n/a"
                  }–${data.revenueHigh != null ? fmtUSD(data.revenueHigh) : "n/a"})`
                : "n/a"
            }
          />
          <Row
            label="Ex-Dividend Date"
            value={data.exDividendDate ? fmtDate(data.exDividendDate) : "n/a"}
          />
          <Row
            label="Dividend Payment Date"
            value={data.dividendDate ? fmtDate(data.dividendDate) : "n/a"}
          />
        </dl>
        {data.nextEarningsDate && (
          <button
            onClick={() =>
              downloadIcs(
                name,
                ticker,
                data.nextEarningsDate!.slice(0, 10),
                "Earnings Call"
              )
            }
            className="shrink-0 rounded border border-border px-3 py-1.5 text-xs text-muted hover:bg-background"
          >
            + calendar
          </button>
        )}
      </div>
      <p className="text-xs text-muted">
        Estimates from Yahoo Finance analyst consensus; the date is often
        preliminary until the company confirms it.
      </p>
    </div>
  );
}
