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

function Sparkline({
  series,
  positive,
}: {
  series: { close: number }[];
  positive: boolean;
}) {
  if (series.length < 2) return null;
  const closes = series.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const width = 100;
  const height = 32;
  const points = closes
    .map((c, i) => {
      const x = (i / (closes.length - 1)) * width;
      const y = height - ((c - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-8 w-24"
      preserveAspectRatio="none"
    >
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="pb-2">Index</th>
            <th className="pb-2 text-right">Last</th>
            <th className="pb-2 text-right">Change</th>
            <th className="pb-2 text-right">1yr trend</th>
          </tr>
        </thead>
        <tbody>
          {indices.map((idx) => (
            <tr key={idx.symbol} className="border-t border-border">
              <td className="py-3 font-medium text-foreground">{idx.name}</td>
              {idx.error || idx.currentPrice == null ? (
                <td colSpan={3} className="py-3 text-right text-muted">
                  n/a
                </td>
              ) : (
                <>
                  <td className="py-3 text-right tabular-nums text-foreground">
                    {fmtNumber(idx.currentPrice)}
                  </td>
                  <td
                    className={`py-3 text-right tabular-nums ${
                      (idx.changePct ?? 0) >= 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {(idx.changePct ?? 0) >= 0 ? "+" : ""}
                    {idx.changePct?.toFixed(2)}%
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end">
                      {idx.series && (
                        <Sparkline
                          series={idx.series}
                          positive={(idx.changePct ?? 0) >= 0}
                        />
                      )}
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
