import type { Point } from "@/lib/edgar";

export default function BarChart({
  data,
  format,
}: {
  data: Point[];
  format: (n: number) => string;
}) {
  if (!data.length)
    return <p className="text-sm text-muted">No data available.</p>;
  const known = data.filter((d) => d.value !== null) as {
    year: number;
    value: number;
  }[];
  const max = Math.max(...known.map((d) => Math.abs(d.value))) || 1;
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.year} className="flex items-center gap-3 text-sm">
          <span className="w-12 shrink-0 text-muted">{d.year}</span>
          <div className="h-5 flex-1 rounded bg-background">
            {d.value !== null && (
              <div
                className={`h-5 rounded ${
                  d.value < 0 ? "bg-negative" : "bg-accent"
                }`}
                style={{ width: `${(Math.abs(d.value) / max) * 100}%` }}
              />
            )}
          </div>
          <span
            className={`w-20 shrink-0 text-right tabular-nums ${
              d.value === null ? "text-muted" : "text-foreground"
            }`}
          >
            {d.value !== null ? format(d.value) : "n/a"}
          </span>
        </div>
      ))}
    </div>
  );
}
