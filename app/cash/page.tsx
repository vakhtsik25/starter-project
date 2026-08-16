// Intentionally not linked from the NavBar or any other page — reachable
// only by typing /cash directly. Kept rather than deleted in case the
// product decision changes; if it's staying hidden long-term, delete it.

// Rates change monthly (tied to Fed policy + fund flows). Re-verify and bump
// CASH_RATES_AS_OF whenever you update this list — sources are in
// docs/03-decision-log.md. Whoever owns this file: keep it dated, don't guess.
const CASH_RATES_AS_OF = "August 2026";
const CASH_RATES = [
  {
    broker: "Interactive Brokers (IBKR)",
    rate: "3.13%",
    note: "USD balances > $10k; requires ~$100k account value for top tier (IBKR Lite is lower, ~2.14%)",
  },
  {
    broker: "Fidelity (SPAXX default sweep)",
    rate: "3.30%",
    note: "7-day yield, net of ~0.42% expense ratio",
  },
  {
    broker: "Schwab (default Bank Sweep)",
    rate: "0.01%–0.45%",
    note: "Very low by design — move idle cash to a money market fund manually",
  },
  {
    broker: "Robinhood Gold",
    rate: "~3.35%",
    note: "Requires Gold membership; check app for today's rate, it moves often",
  },
  {
    broker: "Wealthfront Cash Account",
    rate: "3.30%",
    note: "Base APY; temporary boosts available via referral/direct deposit",
  },
];

export default function CashPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Where to park idle cash
      </h1>
      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="pb-2">Broker</th>
              <th className="pb-2">Cash rate</th>
              <th className="pb-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {CASH_RATES.map((r) => (
              <tr key={r.broker} className="border-t border-border">
                <td className="py-2 font-medium text-foreground">{r.broker}</td>
                <td className="py-2 tabular-nums text-positive">{r.rate}</td>
                <td className="py-2 text-muted">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">
          Rates as of {CASH_RATES_AS_OF} — brokers change these monthly; verify
          on the provider&apos;s site before relying on them.
        </p>
      </section>
    </main>
  );
}
