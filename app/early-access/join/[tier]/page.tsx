"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AMOUNT_TIERS, isAmountTier } from "@/lib/early-access";

export default function JoinPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier: tierParam } = use(params);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = isAmountTier(tierParam)
    ? AMOUNT_TIERS.find((t) => t.key === tierParam)!
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tier) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/early-access/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tier: tier.key }),
      });
      if (!res.ok) throw new Error();
      router.push("/early-access/thanks");
    } catch {
      setError("Something went wrong — try again.");
      setSubmitting(false);
    }
  }

  if (!tier) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted">That doesn't look like a valid option.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">FinLens</h1>
      <p className="mt-3 text-muted">
        Starting with <strong className="text-foreground">{tier.label}</strong>{" "}
        ({tier.range}) — this just gets you on the early access list, no
        money moves yet.
      </p>

      <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-sm gap-2">
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
          {submitting ? "Joining…" : "Join"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-negative">{error}</p>}

      <footer className="mt-10 text-xs text-muted">
        For informational and educational purposes only. Not investment
        advice.
      </footer>
    </main>
  );
}
