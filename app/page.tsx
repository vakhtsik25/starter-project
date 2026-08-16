"use client";

import { useState } from "react";

type Point = { year: number; value: number };
type Filing = { form: string; date: string; title: string; url: string };
type Dossier = {
  ticker: string;
  name: string;
  sic: string | null;
  revenue: Point[];
  netIncome: Point[];
  eps: Point[];
  filings: Filing[];
  error?: string;
};

// --- Curated cash-rate table (Person B: keep these updated by hand) ---
const CASH_RATES = [
  { broker: "Interactive Brokers (IBKR)", rate: "3.83%", note: "On USD > $10k, tiered" },
  { broker: "Fidelity (SPAXX)", rate: "3.98%", note: "Government money market" },
  { broker: "Robinhood Gold", rate: "4.00%", note: "Requires Gold membership" },
  { broker: "Schwab (default sweep)", rate: "0.05%", note: "Very low — move to MMF" },
  { broker: "Wealthfront Cash", rate: "4.00%", note: "Partner-bank swept" },
];

function fmtUSD(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function BarChart({ data, format }: { data: Point[]; format: (n: number) => string }) {
  if (!data.length)
    return <p className="text-sm text-gray-500">No data available.</p>;
  const max = Math.max(...data.map((d) => Math.abs(d.value))) || 1;
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.year} className="flex items-center gap-3 text-sm">
          <span className="w-12 shrink-0 text-gray-500">{d.year}</span>
          <div className="h-5 flex-1 rounded bg-gray-100">
            <div
              className={`h-5 rounded ${d.value < 0 ? "bg-red-400" : "bg-blue-500"}`}
              style={{ width: `${(Math.abs(d.value) / max) * 100}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right tabular-nums">
            {format(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

// Build a downloadable .ics calendar file for a filing/earnings date.
function downloadIcs(name: string, ticker: string, date: string, label: string) {
  const dt = date.replace(/-/g, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//starter-project//EN",
    "BEGIN:VEVENT",
    `UID:${ticker}-${dt}-${label}@starter-project`,
    `DTSTART;VALUE=DATE:${dt}`,
    `SUMMARY:${ticker} — ${label}`,
    `DESCRIPTION:${name} (${label}) via SEC EDGAR`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ticker}-${label}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/company/${encodeURIComponent(t)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lookup failed.");
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Company Dossier</h1>
        <p className="mt-1 text-gray-600">
          Investor snapshots from the primary source — SEC EDGAR.
        </p>
      </header>

      <form onSubmit={search} className="mb-8 flex gap-2">
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Enter a ticker, e.g. AAPL"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 uppercase focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Loading…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {data.name}{" "}
              <span className="text-gray-400">({data.ticker})</span>
            </h2>
            {data.sic && <p className="text-gray-600">{data.sic}</p>}
          </div>

          <Section title="Revenue (annual, 5yr)">
            <BarChart data={data.revenue} format={fmtUSD} />
          </Section>

          <Section title="Net Income (annual, 5yr)">
            <BarChart data={data.netIncome} format={fmtUSD} />
          </Section>

          <Section title="Diluted EPS (annual, 5yr)">
            <BarChart
              data={data.eps}
              format={(n) => `$${n.toFixed(2)}`}
            />
          </Section>

          <Section title="Recent Filings & Calendar">
            {data.filings.length === 0 ? (
              <p className="text-sm text-gray-500">No recent filings.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.filings.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span>
                      <span className="inline-block w-14 font-medium text-blue-600">
                        {f.form}
                      </span>
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:underline"
                      >
                        {f.date}
                      </a>
                    </span>
                    <button
                      onClick={() =>
                        downloadIcs(data.name, data.ticker, f.date, f.form)
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      + calendar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}

      <div className="mt-6">
        <Section title="Where to park idle cash">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-2">Broker</th>
                <th className="pb-2">Cash rate</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {CASH_RATES.map((r) => (
                <tr key={r.broker} className="border-t border-gray-100">
                  <td className="py-2 font-medium text-gray-800">{r.broker}</td>
                  <td className="py-2 tabular-nums text-green-700">{r.rate}</td>
                  <td className="py-2 text-gray-500">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-400">
            Rates are illustrative — verify before relying on them.
          </p>
        </Section>
      </div>

      <footer className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
        For informational and educational purposes only. Not investment advice.
        Data from SEC EDGAR.
      </footer>
    </main>
  );
}
