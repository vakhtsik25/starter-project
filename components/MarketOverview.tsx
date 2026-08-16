import { useId } from "react";

export type IndexData = {
  symbol: string;
  name: string;
  currentPrice?: number;
  previousClose?: number;
  changePct?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  series?: { date: string; close: number }[];
  error?: string;
};

// Shorter labels for the compact tile — the full name still shows on hover
// (title attribute) for anyone who wants it.
const SHORT_NAME: Record<string, string> = {
  "S&P 500": "S&P 500",
  "Nasdaq Composite": "Nasdaq",
  "Dow Jones Industrial Average": "Dow",
  "Russell 2000": "Russell 2K",
  "CBOE Volatility Index (VIX)": "VIX",
};

function Sparkline({
  series,
  positive,
}: {
  series: { close: number }[];
  positive: boolean;
}) {
  const gradientId = useId();
  if (series.length < 2) return null;
  const closes = series.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const width = 100;
  const height = 24;
  const coords = closes.map((c, i) => ({
    x: (i / (closes.length - 1)) * width,
    y: height - ((c - min) / span) * height,
  }));
  const points = coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  // Same gradient-wash treatment as the main stock chart's area series —
  // a soft fill under the line, not a bare polyline.
  const fillPoints = `0,${height} ${points} ${width},${height}`;
  const colorVar = positive ? "var(--positive)" : "var(--negative)";
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-6 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorVar} stopOpacity={0.22} />
          <stop offset="100%" stopColor={colorVar} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${gradientId})`} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "var(--positive)" : "var(--negative)"}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function fmtNumber(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MarketOverview({ indices }: { indices: IndexData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {indices.map((idx) => {
        const positive = (idx.changePct ?? 0) >= 0;
        const hasData = !idx.error && idx.currentPrice != null;
        return (
          <div
            key={idx.symbol}
            title={idx.name}
            className="rounded-xl border border-border bg-background/40 px-3 py-2.5"
          >
            <div className="truncate text-xs font-medium text-muted">
              {SHORT_NAME[idx.name] ?? idx.name}
            </div>
            {hasData ? (
              <>
                <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {fmtNumber(idx.currentPrice!)}
                </div>
                <div
                  className={`text-xs font-medium tabular-nums ${
                    positive ? "text-positive" : "text-negative"
                  }`}
                >
                  {positive ? "+" : ""}
                  {idx.changePct?.toFixed(2)}%
                </div>
                {idx.series && (
                  <div className="mt-1">
                    <Sparkline series={idx.series} positive={positive} />
                  </div>
                )}
              </>
            ) : (
              <div className="mt-1 text-sm text-muted">n/a</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
