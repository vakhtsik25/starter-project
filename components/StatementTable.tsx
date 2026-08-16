import type { Statement } from "@/lib/statements";
import { yearsFor, valueFor } from "@/lib/statements";

function fmt(v: number | null, isEps: boolean) {
  if (v === null) return "n/a";
  if (isEps) return `$${v.toFixed(2)}`;
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
}

export default function StatementTable({ statement }: { statement: Statement }) {
  const years = yearsFor(statement);
  if (!years.length) {
    return <p className="text-sm text-muted">No data available.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="pb-2 pr-4 font-medium">Line item</th>
            {years.map((y) => (
              <th key={y} className="pb-2 pl-4 text-right font-medium">
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statement.rows.map((row) => {
            const isEps = row.label.toLowerCase().includes("eps");
            return (
              <tr key={row.label} className="border-t border-border">
                <td className="py-2 pr-4 font-medium text-foreground">
                  {row.label}
                </td>
                {years.map((y) => {
                  const v = valueFor(row, y);
                  return (
                    <td
                      key={y}
                      className={`py-2 pl-4 text-right tabular-nums ${
                        v === null
                          ? "text-muted"
                          : v < 0
                          ? "text-negative"
                          : "text-foreground"
                      }`}
                    >
                      {fmt(v, isEps)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
