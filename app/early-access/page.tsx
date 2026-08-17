"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AMOUNT_TIERS } from "@/lib/early-access";

type SampleStock = {
  symbol: string;
  name: string;
  blurb: string;
  volatility: "Low" | "Medium" | "High";
};

const SAMPLE_STOCKS: SampleStock[] = [
  {
    symbol: "AAPL",
    name: "Apple",
    blurb: "Makes the iPhone, Mac, and a growing services business (App Store, subscriptions).",
    volatility: "Low",
  },
  {
    symbol: "COST",
    name: "Costco",
    blurb: "Membership warehouse retailer — revenue comes largely from membership fees, not just what's on the shelf.",
    volatility: "Low",
  },
  {
    symbol: "NVDA",
    name: "Nvidia",
    blurb: "Makes chips that power AI and gaming — demand has been growing fast, which can cut both ways.",
    volatility: "High",
  },
];

type PriceData = {
  currentPrice?: number;
  previousClose?: number;
};

function StockCard({ stock }: { stock: SampleStock }) {
  const [price, setPrice] = useState<PriceData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/company/${stock.symbol}/price`);
        const json = await res.json();
        if (!cancelled && res.ok) setPrice(json);
      } catch {
        // Best-effort — card still shows the education content without a live price.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stock.symbol]);

  const changePct =
    price?.currentPrice != null && price?.previousClose
      ? ((price.currentPrice - price.previousClose) / price.previousClose) * 100
      : null;
  const positive = (changePct ?? 0) >= 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">{stock.symbol}</div>
          <div className="text-xs text-muted">{stock.name}</div>
        </div>
        {price?.currentPrice != null ? (
          <div className="text-right">
            <div className="tabular-nums font-semibold text-foreground">
              ${price.currentPrice.toFixed(2)}
            </div>
            {changePct != null && (
              <div
                className={`text-xs font-medium tabular-nums ${
                  positive ? "text-positive" : "text-negative"
                }`}
              >
                {positive ? "+" : ""}
                {changePct.toFixed(2)}%
              </div>
            )}
          </div>
        ) : (
          <div className="h-8 w-16 animate-pulse rounded bg-background" />
        )}
      </div>
      <p className="mt-3 text-sm text-muted">{stock.blurb}</p>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            stock.volatility === "High"
              ? "bg-negative"
              : stock.volatility === "Medium"
                ? "bg-accent"
                : "bg-positive"
          }`}
        />
        {stock.volatility} volatility (illustrative)
      </div>
    </div>
  );
}

export default function EarlyAccessPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10 text-center">
        <h1 className="mx-auto max-w-lg text-lg text-muted">
          Understand a stock in plain language before you decide whether to
          invest — and how much.
        </h1>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        {SAMPLE_STOCKS.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Ready to try investing?
        </h2>
        <p className="mt-1 text-sm text-muted">
          Choose how much you'd start with — this just gets you on the
          early access list, no money moves yet.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {AMOUNT_TIERS.map((tier) => (
            <Link
              key={tier.key}
              href={`/early-access/join/${tier.key}`}
              className="rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent"
            >
              <div>{tier.label}</div>
              <div className="text-xs opacity-80">{tier.range}</div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-muted">
        For informational and educational purposes only. Not investment
        advice. Volatility labels are illustrative, not a risk rating.
      </footer>
    </main>
  );
}
