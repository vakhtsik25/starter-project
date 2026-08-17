"use client";

import { useEffect, useState } from "react";
import { track, identify } from "@/lib/posthog";

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

const AMOUNT_TIERS = [
  { key: "small", label: "Small", range: "$50 – $200" },
  { key: "medium", label: "Medium", range: "$500 – $2,000" },
  { key: "large", label: "Large", range: "$5,000+" },
] as const;

type AmountTier = (typeof AMOUNT_TIERS)[number]["key"];

function StockCard({ stock }: { stock: SampleStock }) {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [viewed, setViewed] = useState(false);

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

  useEffect(() => {
    if (!viewed) {
      track("stock_card_viewed", { symbol: stock.symbol });
      setViewed(true);
    }
  }, [viewed, stock.symbol]);

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
  const [ctaClicked, setCtaClicked] = useState(false);
  const [amountTier, setAmountTier] = useState<AmountTier | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    track("page_view", { page: "early_access" });
  }, []);

  function handleAmountSelect(tier: AmountTier) {
    if (!ctaClicked) {
      track("cta_click");
      setCtaClicked(true);
    }
    setAmountTier(tier);
    track("amount_selected", { amount_tier: tier });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !amountTier) return;
    setSubmitting(true);
    identify(email, { amount_tier: amountTier });
    track("signup_completed", { amount_tier: amountTier, email });
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground">FinLens</h1>
        <p className="mx-auto mt-3 max-w-lg text-lg text-muted">
          Understand a stock in plain language before you decide whether to
          invest — and how much.
        </p>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        {SAMPLE_STOCKS.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 text-center">
        {!submitted ? (
          <>
            <h2 className="text-lg font-semibold text-foreground">
              Ready to try investing?
            </h2>
            <p className="mt-1 text-sm text-muted">
              Choose how much you'd start with — this just gets you on the
              early access list, no money moves yet.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {AMOUNT_TIERS.map((tier) => (
                <button
                  key={tier.key}
                  type="button"
                  onClick={() => handleAmountSelect(tier.key)}
                  className={`rounded-xl border px-5 py-3 text-sm font-medium transition-colors ${
                    amountTier === tier.key
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-background text-foreground hover:border-accent"
                  }`}
                >
                  <div>{tier.label}</div>
                  <div className="text-xs opacity-80">{tier.range}</div>
                </button>
              ))}
            </div>

            {amountTier && (
              <form
                onSubmit={handleSubmit}
                className="mx-auto mt-6 flex max-w-sm gap-2"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
                >
                  {submitting ? "Joining…" : "Join early access"}
                </button>
              </form>
            )}
          </>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              You're on the list.
            </h2>
            <p className="mt-1 text-sm text-muted">
              We'll email you when FinLens investing opens up.
            </p>
          </div>
        )}
      </section>

      <footer className="mt-10 text-center text-xs text-muted">
        For informational and educational purposes only. Not investment
        advice. Volatility labels are illustrative, not a risk rating.
      </footer>
    </main>
  );
}
