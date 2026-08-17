export const AMOUNT_TIERS = [
  { key: "small", label: "Small", range: "$50 – $200" },
  { key: "medium", label: "Medium", range: "$500 – $2,000" },
  { key: "large", label: "Large", range: "$5,000+" },
] as const;

export type AmountTier = (typeof AMOUNT_TIERS)[number]["key"];

export function isAmountTier(value: string): value is AmountTier {
  return AMOUNT_TIERS.some((tier) => tier.key === value);
}
