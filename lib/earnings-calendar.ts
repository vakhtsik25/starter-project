import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export type EarningsInfo = {
  nextEarningsDate: string | null;
  isEstimate: boolean | null;
  earningsAverage: number | null;
  earningsLow: number | null;
  earningsHigh: number | null;
  revenueAverage: number | null;
  revenueLow: number | null;
  revenueHigh: number | null;
  exDividendDate: string | null;
  dividendDate: string | null;
};

export async function getEarningsInfo(ticker: string): Promise<EarningsInfo | null> {
  try {
    const result = await yahooFinance.quoteSummary(ticker, {
      modules: ["calendarEvents"],
    });

    const cal = result.calendarEvents;
    const earnings = cal?.earnings;

    return {
      nextEarningsDate: earnings?.earningsDate?.[0]
        ? new Date(earnings.earningsDate[0]).toISOString()
        : null,
      isEstimate: earnings?.isEarningsDateEstimate ?? null,
      earningsAverage: earnings?.earningsAverage ?? null,
      earningsLow: earnings?.earningsLow ?? null,
      earningsHigh: earnings?.earningsHigh ?? null,
      revenueAverage: earnings?.revenueAverage ?? null,
      revenueLow: earnings?.revenueLow ?? null,
      revenueHigh: earnings?.revenueHigh ?? null,
      exDividendDate: cal?.exDividendDate ? new Date(cal.exDividendDate).toISOString() : null,
      dividendDate: cal?.dividendDate ? new Date(cal.dividendDate).toISOString() : null,
    };
  } catch {
    return null;
  }
}
