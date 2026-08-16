"use client";

import { useState } from "react";
import { computeMultiples, formatUSD, type MultiplesInput } from "@/lib/multiples";

type Multiples = ReturnType<typeof computeMultiples>;
type Peer = {
  ticker: string;
  name: string;
  multiples: Multiples | null;
  loading: boolean;
  error: string | null;
};

const MAX_PEERS = 4;

function fmtRatio(n: number | null) {
  return n != null ? `${n.toFixed(1)}x` : "n/a";
}

async function fetchMultiplesFor(ticker: string): Promise<{
  name: string;
  multiples: Multiples;
}> {
  const dossierRes = await fetch(`/api/company/${ticker}`);
  const dossierJson = await dossierRes.json();
  if (!dossierRes.ok) throw new Error(dossierJson.error || "Lookup failed.");

  let price: MultiplesInput["price"] = null;
  try {
    const priceRes = await fetch(`/api/company/${ticker}/price`);
    const priceJson = await priceRes.json();
    if (priceRes.ok) price = priceJson;
  } catch {
    // price is best-effort
  }

  return {
    name: dossierJson.name,
    multiples: computeMultiples({ dossier: dossierJson, price }),
  };
}

export default function PeerValuation({
  ticker,
  name,
  multiples,
}: {
  ticker: string;
  name: string;
  multiples: Multiples;
}) {
  const [peerInput, setPeerInput] = useState("");
  const [peers, setPeers] = useState<Peer[]>([]);

  const addPeer = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = peerInput.trim().toUpperCase();
    if (!t || t === ticker) return;
    if (peers.some((p) => p.ticker === t)) return;
    if (peers.length >= MAX_PEERS) return;
    setPeerInput("");

    setPeers((prev) => [
      ...prev,
      { ticker: t, name: t, multiples: null, loading: true, error: null },
    ]);

    try {
      const { name: peerName, multiples: peerMultiples } =
        await fetchMultiplesFor(t);
      setPeers((prev) =>
        prev.map((p) =>
          p.ticker === t
            ? { ...p, name: peerName, multiples: peerMultiples, loading: false }
            : p
        )
      );
    } catch (err) {
      setPeers((prev) =>
        prev.map((p) =>
          p.ticker === t
            ? {
                ...p,
                loading: false,
                error: err instanceof Error ? err.message : "Failed to load.",
              }
            : p
        )
      );
    }
  };

  const removePeer = (t: string) => {
    setPeers((prev) => prev.filter((p) => p.ticker !== t));
  };

  const columns = [{ ticker, name, multiples, loading: false, error: null }, ...peers];

  return (
    <div className="space-y-4">
      <form onSubmit={addPeer} className="flex gap-2">
        <input
          value={peerInput}
          onChange={(e) => setPeerInput(e.target.value)}
          placeholder="Add peer ticker, e.g. MSFT"
          disabled={peers.length >= MAX_PEERS}
          className="w-48 rounded border border-border bg-transparent px-3 py-1.5 text-sm font-mono uppercase disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={peers.length >= MAX_PEERS}
          className="rounded bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
        >
          Add
        </button>
        {peers.length >= MAX_PEERS && (
          <span className="self-center text-xs text-muted">
            Max {MAX_PEERS} peers
          </span>
        )}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="py-2 pr-4 font-medium">Metric</th>
              {columns.map((c) => (
                <th key={c.ticker} className="px-4 py-2 font-medium">
                  <div className="flex items-center gap-2">
                    {c.ticker}
                    {c.ticker !== ticker && (
                      <button
                        onClick={() => removePeer(c.ticker)}
                        className="text-muted hover:text-foreground"
                        aria-label={`Remove ${c.ticker}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(
              [
                ["P/E", (m: Multiples) => fmtRatio(m.pe)],
                ["P/S", (m: Multiples) => fmtRatio(m.ps)],
                ["P/B", (m: Multiples) => fmtRatio(m.pb)],
                [
                  "Market Cap",
                  (m: Multiples) => (m.marketCap != null ? formatUSD(m.marketCap) : "n/a"),
                ],
                [
                  "Revenue",
                  (m: Multiples) => (m.revenue != null ? formatUSD(m.revenue) : "n/a"),
                ],
                [
                  "Net Income",
                  (m: Multiples) => (m.netIncome != null ? formatUSD(m.netIncome) : "n/a"),
                ],
              ] as const
            ).map(([label, format]) => (
              <tr key={label}>
                <td className="py-2 pr-4 text-muted">{label}</td>
                {columns.map((c) => (
                  <td key={c.ticker} className="px-4 py-2 tabular-nums text-foreground">
                    {"loading" in c && c.loading
                      ? "…"
                      : c.error
                        ? "error"
                        : c.multiples
                          ? format(c.multiples)
                          : "n/a"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {peers.some((p) => p.error) && (
        <p className="text-xs text-negative">
          {peers.find((p) => p.error)?.ticker}: {peers.find((p) => p.error)?.error}
        </p>
      )}
    </div>
  );
}
