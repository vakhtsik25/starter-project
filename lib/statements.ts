import type { Point } from "@/lib/edgar";

export type StatementRow = { label: string; points: Point[] };
export type Statement = { title: string; rows: StatementRow[] };

// Shared shape both the on-page tables and the CSV/PDF export pull from, so
// the numbers a user sees always match what they download.
export function buildStatements(dossier: any): Statement[] {
  return [
    {
      title: "Income Statement",
      rows: [
        { label: "Revenue", points: dossier.incomeStatement.revenue },
        { label: "Operating Income", points: dossier.incomeStatement.operatingIncome },
        { label: "Net Income", points: dossier.incomeStatement.netIncome },
        { label: "Diluted EPS", points: dossier.incomeStatement.eps },
      ],
    },
    {
      title: "Balance Sheet",
      rows: [
        { label: "Total Assets", points: dossier.balanceSheet.totalAssets },
        { label: "Total Liabilities", points: dossier.balanceSheet.totalLiabilities },
        { label: "Stockholders' Equity", points: dossier.balanceSheet.stockholdersEquity },
        { label: "Cash & Equivalents", points: dossier.balanceSheet.cash },
      ],
    },
    {
      title: "Cash Flow Statement",
      rows: [
        { label: "Operating Cash Flow", points: dossier.cashFlow.operatingCashFlow },
        { label: "Capital Expenditures", points: dossier.cashFlow.capex },
        { label: "Free Cash Flow", points: dossier.cashFlow.freeCashFlow },
      ],
    },
  ];
}

// Union of every year across every row in a statement, ascending — some rows
// (e.g. a bank's missing capex) have fewer points than others.
export function yearsFor(statement: Statement): number[] {
  const years = new Set<number>();
  for (const row of statement.rows) {
    for (const p of row.points) years.add(p.year);
  }
  return Array.from(years).sort((a, b) => a - b);
}

export function valueFor(row: StatementRow, year: number): number | null {
  const point = row.points.find((p) => p.year === year);
  return point ? point.value : null;
}
