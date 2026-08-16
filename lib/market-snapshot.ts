import type { IndexData } from "@/components/MarketOverview";

// Every sentence here is derived directly from the fetched numbers — no
// fabricated opinions or analysis. If you extend this, keep that rule: only
// describe what the data says (direction, magnitude, relative moves,
// thresholds), never invent a take.

function find(indices: IndexData[], symbol: string) {
  return indices.find((i) => i.symbol === symbol);
}

function direction(pct: number) {
  return pct >= 0 ? "up" : "down";
}

function vixContext(vix: number) {
  if (vix < 15) return "low, suggesting relative calm";
  if (vix < 25) return "moderate";
  return "elevated, suggesting caution";
}

export function buildMarketSnapshot(indices: IndexData[]): string | null {
  const sp500 = find(indices, "^GSPC");
  const nasdaq = find(indices, "^IXIC");
  const russell = find(indices, "^RUT");
  const vix = find(indices, "^VIX");

  if (sp500?.changePct == null || nasdaq?.changePct == null) return null;

  const parts: string[] = [];

  parts.push(
    `The S&P 500 is ${direction(sp500.changePct)} ${Math.abs(sp500.changePct).toFixed(
      2
    )}% today, and the Nasdaq Composite is ${direction(nasdaq.changePct)} ${Math.abs(
      nasdaq.changePct
    ).toFixed(2)}%.`
  );

  if (russell?.changePct != null) {
    const diff = russell.changePct - sp500.changePct;
    if (Math.abs(diff) > 0.3) {
      parts.push(
        `Small caps (Russell 2000, ${direction(russell.changePct)} ${Math.abs(
          russell.changePct
        ).toFixed(2)}%) are ${
          diff > 0 ? "outperforming" : "underperforming"
        } large caps today.`
      );
    }
  }

  if (vix?.currentPrice != null) {
    parts.push(
      `The VIX is at ${vix.currentPrice.toFixed(1)}, ${vixContext(vix.currentPrice)}.`
    );
  }

  return parts.join(" ");
}
