export const AMOUNT_TIERS = [
  { key: "small", label: "Small", range: "$50 – $200" },
  { key: "medium", label: "Medium", range: "$500 – $2,000" },
  { key: "large", label: "Large", range: "$5,000+" },
] as const;

export type AmountTier = (typeof AMOUNT_TIERS)[number]["key"];

export function isAmountTier(value: string): value is AmountTier {
  return AMOUNT_TIERS.some((tier) => tier.key === value);
}

export const INDUSTRIES = [
  { key: "technology", label: "Technology" },
  { key: "healthcare", label: "Healthcare" },
  { key: "energy", label: "Energy" },
  { key: "consumer", label: "Consumer & Retail" },
  { key: "financials", label: "Financials" },
  { key: "industrials", label: "Industrials" },
  { key: "real_estate", label: "Real Estate" },
] as const;

export type Industry = (typeof INDUSTRIES)[number]["key"];

export function isIndustry(value: string): value is Industry {
  return INDUSTRIES.some((industry) => industry.key === value);
}

export const RISK_LEVELS = [
  { key: "low", label: "Play it safe" },
  { key: "medium", label: "Balanced" },
  { key: "high", label: "Comfortable with swings" },
] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number]["key"];

export function isRiskLevel(value: string): value is RiskLevel {
  return RISK_LEVELS.some((risk) => risk.key === value);
}

export const GOALS = [
  { key: "learn", label: "Learning first, invest later" },
  { key: "growth", label: "Long-term growth" },
  { key: "short_term", label: "Short-term opportunities" },
] as const;

export type Goal = (typeof GOALS)[number]["key"];

export function isGoal(value: string): value is Goal {
  return GOALS.some((goal) => goal.key === value);
}
