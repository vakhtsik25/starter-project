import { NextRequest, NextResponse } from "next/server";
import { isAmountTier } from "@/lib/early-access";

// No database in this app yet — logging is the record of signups.
// Retrieve captured leads via Vercel's runtime logs, filtered on
// "early_access_signup".
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const tier = typeof body?.tier === "string" ? body.tier : "";

  if (!email || !email.includes("@") || !isAmountTier(tier)) {
    return NextResponse.json({ error: "Invalid signup." }, { status: 400 });
  }

  console.log(
    JSON.stringify({
      event: "early_access_signup",
      email,
      tier,
      ts: new Date().toISOString(),
    })
  );

  return NextResponse.json({ ok: true });
}
