import { NextRequest, NextResponse } from "next/server";
import { isAmountTier, isIndustry, isRiskLevel, isGoal } from "@/lib/early-access";

// No database in this app yet — logging is the record of signups.
// Retrieve captured leads via Vercel's runtime logs, filtered on
// "early_access_signup".
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const tier = typeof body?.tier === "string" ? body.tier : "";
  const risk = typeof body?.risk === "string" ? body.risk : "";
  const goal = typeof body?.goal === "string" ? body.goal : "";
  const industries = Array.isArray(body?.industries)
    ? body.industries.filter(
        (i: unknown): i is string => typeof i === "string" && isIndustry(i)
      )
    : [];

  if (
    !email ||
    !email.includes("@") ||
    !isAmountTier(tier) ||
    !isRiskLevel(risk) ||
    !isGoal(goal)
  ) {
    return NextResponse.json({ error: "Invalid signup." }, { status: 400 });
  }

  console.log(
    JSON.stringify({
      event: "early_access_signup",
      email,
      tier,
      risk,
      goal,
      industries,
      ts: new Date().toISOString(),
    })
  );

  return NextResponse.json({ ok: true });
}
