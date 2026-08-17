"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AMOUNT_TIERS,
  isAmountTier,
  INDUSTRIES,
  RISK_LEVELS,
  GOALS,
  type Industry,
  type RiskLevel,
  type Goal,
} from "@/lib/early-access";

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-background text-foreground hover:border-accent"
      }`}
    >
      {children}
    </button>
  );
}

export default function JoinPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier: tierParam } = use(params);
  const router = useRouter();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [risk, setRisk] = useState<RiskLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = isAmountTier(tierParam)
    ? AMOUNT_TIERS.find((t) => t.key === tierParam)!
    : null;

  function toggleIndustry(key: Industry) {
    setIndustries((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tier || !risk || !goal) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/early-access/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tier: tier.key,
          industries,
          risk,
          goal,
        }),
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

  const canSubmit = !!risk && !!goal;

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-lg text-muted">
        Starting with <strong className="text-foreground">{tier.label}</strong>{" "}
        ({tier.range}) — this just gets you on the early access list, no
        money moves yet.
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-left">
        <div>
          <div className="text-sm font-medium text-foreground">
            Which industries interest you?{" "}
            <span className="font-normal text-muted">(optional)</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {INDUSTRIES.map((industry) => (
              <ChipButton
                key={industry.key}
                active={industries.includes(industry.key)}
                onClick={() => toggleIndustry(industry.key)}
              >
                {industry.label}
              </ChipButton>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-foreground">
            How do you feel about risk?
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {RISK_LEVELS.map((level) => (
              <ChipButton
                key={level.key}
                active={risk === level.key}
                onClick={() => setRisk(level.key)}
              >
                {level.label}
              </ChipButton>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-foreground">
            What's your goal?
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <ChipButton
                key={g.key}
                active={goal === g.key}
                onClick={() => setGoal(g.key)}
              >
                {g.label}
              </ChipButton>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
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
            disabled={submitting || !canSubmit}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {submitting ? "Joining…" : "Join"}
          </button>
        </div>
        {!canSubmit && (
          <p className="text-xs text-muted">
            Pick a risk comfort level and a goal to continue.
          </p>
        )}
      </form>
      {error && <p className="mt-3 text-center text-sm text-negative">{error}</p>}

      <footer className="mt-10 text-center text-xs text-muted">
        For informational and educational purposes only. Not investment
        advice.
      </footer>
    </main>
  );
}
