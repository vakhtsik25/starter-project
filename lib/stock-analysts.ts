import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

// Minimal shape of what we read — quoteSummary()'s return type isn't
// available with validateResult:false (Yahoo occasionally returns enum
// values outside the library's own schema), so we trust this manually.
type RawQuoteSummary = {
  financialData?: {
    recommendationKey?: string;
    targetMeanPrice?: number;
    numberOfAnalystOpinions?: number;
  };
  upgradeDowngradeHistory?: {
    history: {
      epochGradeDate: string | Date;
      firm: string;
      toGrade: string;
      fromGrade?: string;
      action: string;
    }[];
  };
};

export type RecentAction = {
  firm: string;
  action: string;
  toGrade: string;
  fromGrade: string | null;
  date: string;
};

export type AnalystSnapshot = {
  recommendationKey: string | null;
  targetMean: number | null;
  numberOfAnalysts: number | null;
  recentAction: RecentAction | null;
};

export async function getAnalystSnapshot(ticker: string): Promise<AnalystSnapshot | null> {
  try {
    // Yahoo occasionally returns enum values outside the library's schema
    // (e.g. priceTargetAction: "Removes") — validateResult:false stops that
    // from failing the whole request; we trust the shape still matches.
    const result = (await yahooFinance.quoteSummary(
      ticker,
      { modules: ["financialData", "recommendationTrend", "upgradeDowngradeHistory"] },
      { validateResult: false }
    )) as RawQuoteSummary;

    const fd = result.financialData;
    const history = result.upgradeDowngradeHistory?.history ?? [];
    const mostRecent = history.length
      ? history.reduce((latest, h) =>
          new Date(h.epochGradeDate) > new Date(latest.epochGradeDate) ? h : latest
        )
      : null;

    return {
      recommendationKey: fd?.recommendationKey ?? null,
      targetMean: fd?.targetMeanPrice ?? null,
      numberOfAnalysts: fd?.numberOfAnalystOpinions ?? null,
      recentAction: mostRecent
        ? {
            firm: mostRecent.firm,
            action: mostRecent.action,
            toGrade: mostRecent.toGrade,
            fromGrade: mostRecent.fromGrade ?? null,
            date: new Date(mostRecent.epochGradeDate).toISOString().slice(0, 10),
          }
        : null,
    };
  } catch {
    return null;
  }
}
