export type AnalystData = {
  recommendationKey: string | null;
  recommendationMean: number | null;
  numberOfAnalysts: number | null;
  targetHigh: number | null;
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  currentPrice: number | null;
  trend: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  } | null;
};

// A proper diverging scale (sell ← hold → buy), not five arbitrary hues:
// two arms off the app's real --positive/--negative tokens, gray midpoint.
// Ties to the theme automatically in both light and dark — no separate
// dark-mode palette to keep in sync.
const SEGMENTS = [
  { key: "strongBuy", label: "Strong Buy", color: "var(--positive)" },
  { key: "buy", label: "Buy", color: "color-mix(in srgb, var(--positive) 55%, var(--surface))" },
  { key: "hold", label: "Hold", color: "var(--border)" },
  { key: "sell", label: "Sell", color: "color-mix(in srgb, var(--negative) 55%, var(--surface))" },
  { key: "strongSell", label: "Strong Sell", color: "var(--negative)" },
] as const;

function recommendationLabel(key: string | null) {
  if (!key) return "n/a";
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AnalystRatings({ data }: { data: AnalystData }) {
  const trend = data.trend;
  const total = trend
    ? trend.strongBuy + trend.buy + trend.hold + trend.sell + trend.strongSell
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
        <div className="flex items-baseline justify-between py-1.5">
          <dt className="text-muted">Consensus</dt>
          <dd className="font-medium capitalize text-foreground">
            {recommendationLabel(data.recommendationKey)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between py-1.5">
          <dt className="text-muted"># of Analysts</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {data.numberOfAnalysts ?? "n/a"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between py-1.5">
          <dt className="text-muted">Price Target (mean)</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {data.targetMean != null ? `$${data.targetMean.toFixed(2)}` : "n/a"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between py-1.5">
          <dt className="text-muted">Price Target (range)</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {data.targetLow != null && data.targetHigh != null
              ? `$${data.targetLow.toFixed(0)} – $${data.targetHigh.toFixed(0)}`
              : "n/a"}
          </dd>
        </div>
      </div>

      {trend && total > 0 && (
        <div>
          <div className="flex h-4 w-full overflow-hidden rounded-full">
            {SEGMENTS.map((s) => {
              const count = trend[s.key];
              if (count <= 0) return null;
              return (
                <div
                  key={s.key}
                  style={{
                    width: `${(count / total) * 100}%`,
                    backgroundColor: s.color,
                  }}
                  title={`${s.label}: ${count}`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {SEGMENTS.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label} ({trend[s.key]})
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        Aggregated analyst consensus from Yahoo Finance. Individual analyst
        names/firms aren&apos;t available without a paid data provider.
      </p>
    </div>
  );
}
