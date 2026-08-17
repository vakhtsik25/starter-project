import Link from "next/link";
import type { Mover } from "@/app/api/market/movers/route";

function fmtPrice(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MoversList({
  title,
  movers,
  positive,
}: {
  title: string;
  movers: Mover[];
  positive: boolean;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <ul className="divide-y divide-border">
        {movers.map((m) => (
          <li key={m.ticker}>
            <Link
              href={`/company/${m.ticker}`}
              className="flex items-center justify-between gap-3 py-2 hover:opacity-80"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{m.ticker}</div>
                <div className="truncate text-xs text-muted">{m.name}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm tabular-nums text-foreground">
                  ${fmtPrice(m.price)}
                </div>
                <div
                  className={`text-xs font-medium tabular-nums ${
                    positive ? "text-positive" : "text-negative"
                  }`}
                >
                  {positive ? "+" : ""}
                  {m.changePct.toFixed(2)}%
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
