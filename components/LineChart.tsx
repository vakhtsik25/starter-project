type PricePoint = { date: string; close: number };

export default function LineChart({
  series,
  height = 160,
}: {
  series: PricePoint[];
  height?: number;
}) {
  if (series.length < 2) {
    return <p className="text-sm text-muted">No price history available.</p>;
  }

  const width = 600;
  const padding = 8;
  const values = series.map((p) => p.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = series.map((p, i) => {
    const x = (i / (series.length - 1)) * (width - padding * 2) + padding;
    const y =
      height - padding - ((p.close - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${
    height - padding
  } L ${points[0].x.toFixed(1)} ${height - padding} Z`;

  const rising = series[series.length - 1].close >= series[0].close;
  const strokeColor = rising ? "var(--positive)" : "var(--negative)";

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        height={height}
      >
        <path d={areaPath} fill={strokeColor} opacity={0.08} stroke="none" />
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2} />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{series[0].date}</span>
        <span>
          Low ${min.toFixed(2)} · High ${max.toFixed(2)}
        </span>
        <span>{series[series.length - 1].date}</span>
      </div>
    </div>
  );
}
