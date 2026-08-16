import type { Dossier, Point } from "@/lib/company-metrics";

// Every item here is a plain restatement of the underlying numbers — no
// fabricated opinions, no "buy/sell" language. If you add a rule, keep that
// discipline: the `detail` string should be verifiable just by looking at
// the numbers it cites.
export type ScorecardStatus = "good" | "warn" | "bad" | "neutral";
export type ScorecardItem = {
  label: string;
  status: ScorecardStatus;
  detail: string;
};

function known(points: Point[]): { year: number; value: number }[] {
  return points.filter(
    (p): p is { year: number; value: number } => p.value !== null
  );
}

function fmtUSD(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function revenueTrend(dossier: Dossier): ScorecardItem | null {
  const revenue = known(dossier.incomeStatement.revenue);
  if (revenue.length < 2) return null;
  const latest = revenue[revenue.length - 1];
  const prior = revenue[revenue.length - 2];
  if (latest.value > prior.value) {
    // Count how far the growth streak extends backward.
    let streak = 1;
    for (let i = revenue.length - 1; i > 0; i--) {
      if (revenue[i].value > revenue[i - 1].value) streak++;
      else break;
    }
    return {
      label: "Revenue trend",
      status: "good",
      detail:
        streak >= 3
          ? `Revenue has grown for ${streak} consecutive years, reaching ${fmtUSD(
              latest.value
            )} in ${latest.year}.`
          : `Revenue grew from ${fmtUSD(prior.value)} to ${fmtUSD(
              latest.value
            )} in ${latest.year}.`,
    };
  }
  return {
    label: "Revenue trend",
    status: "warn",
    detail: `Revenue declined from ${fmtUSD(prior.value)} to ${fmtUSD(
      latest.value
    )} in ${latest.year}.`,
  };
}

function marginTrend(dossier: Dossier): ScorecardItem | null {
  const revenue = known(dossier.incomeStatement.revenue);
  const netIncome = known(dossier.incomeStatement.netIncome);
  const margins = revenue
    .map((r) => {
      const ni = netIncome.find((n) => n.year === r.year);
      return ni && r.value > 0 ? { year: r.year, margin: (ni.value / r.value) * 100 } : null;
    })
    .filter((m): m is { year: number; margin: number } => m !== null);
  if (margins.length < 2) return null;

  const latest = margins[margins.length - 1];
  const earliest = margins[0];
  const delta = latest.margin - earliest.margin;

  if (Math.abs(delta) < 1) {
    return {
      label: "Margin trend",
      status: "neutral",
      detail: `Net margin has stayed roughly flat, around ${latest.margin.toFixed(
        1
      )}% from ${earliest.year} to ${latest.year}.`,
    };
  }
  return {
    label: "Margin trend",
    status: delta > 0 ? "good" : "warn",
    detail: `Net margin ${delta > 0 ? "expanded" : "compressed"} from ${earliest.margin.toFixed(
      1
    )}% (${earliest.year}) to ${latest.margin.toFixed(1)}% (${latest.year}).`,
  };
}

function freeCashFlowSign(dossier: Dossier): ScorecardItem | null {
  const fcf = known(dossier.cashFlow.freeCashFlow);
  if (!fcf.length) return null;
  const latest = fcf[fcf.length - 1];
  return {
    label: "Free cash flow",
    status: latest.value >= 0 ? "good" : "bad",
    detail:
      latest.value >= 0
        ? `Generated positive free cash flow of ${fmtUSD(latest.value)} in ${latest.year}.`
        : `Free cash flow was negative (${fmtUSD(latest.value)}) in ${latest.year}.`,
  };
}

function leverageTrend(dossier: Dossier): ScorecardItem | null {
  const assets = known(dossier.balanceSheet.totalAssets);
  const liabilities = known(dossier.balanceSheet.totalLiabilities);
  const ratios = assets
    .map((a) => {
      const l = liabilities.find((x) => x.year === a.year);
      return l && a.value > 0 ? { year: a.year, ratio: (l.value / a.value) * 100 } : null;
    })
    .filter((r): r is { year: number; ratio: number } => r !== null);
  if (ratios.length < 2) return null;

  const latest = ratios[ratios.length - 1];
  const earliest = ratios[0];
  const delta = latest.ratio - earliest.ratio;

  if (Math.abs(delta) < 3) {
    return {
      label: "Leverage",
      status: "neutral",
      detail: `Liabilities/assets has stayed roughly stable, around ${latest.ratio.toFixed(
        0
      )}% from ${earliest.year} to ${latest.year}.`,
    };
  }
  return {
    label: "Leverage",
    status: delta < 0 ? "good" : "warn",
    detail: `Liabilities/assets ${
      delta < 0 ? "decreased" : "increased"
    } from ${earliest.ratio.toFixed(0)}% (${earliest.year}) to ${latest.ratio.toFixed(
      0
    )}% (${latest.year}).`,
  };
}

function epsTrend(dossier: Dossier): ScorecardItem | null {
  const eps = known(dossier.incomeStatement.eps);
  if (eps.length < 2) return null;
  const latest = eps[eps.length - 1];
  const prior = eps[eps.length - 2];
  const growing = latest.value > prior.value;
  return {
    label: "EPS trend",
    status: growing ? "good" : "warn",
    detail: `Diluted EPS ${growing ? "grew" : "declined"} from $${prior.value.toFixed(
      2
    )} to $${latest.value.toFixed(2)} in ${latest.year}.`,
  };
}

export function buildScorecard(dossier: Dossier): ScorecardItem[] {
  return [
    revenueTrend(dossier),
    marginTrend(dossier),
    freeCashFlowSign(dossier),
    leverageTrend(dossier),
    epsTrend(dossier),
  ].filter((item): item is ScorecardItem => item !== null);
}
