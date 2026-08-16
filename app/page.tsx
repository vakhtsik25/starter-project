export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-foreground">Company Dossier</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Investor snapshots from the primary source — SEC EDGAR. Search a
        ticker or company name above to see historical financials, filings,
        and stock price history.
      </p>

      <footer className="mt-16 border-t border-border pt-4 text-center text-xs text-muted">
        For informational and educational purposes only. Not investment advice.
        Data from SEC EDGAR and Yahoo Finance.
      </footer>
    </main>
  );
}
