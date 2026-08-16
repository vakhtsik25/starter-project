import { NextResponse } from "next/server";
import { searchCompanies } from "@/lib/edgar";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  try {
    const results = await searchCompanies(q);
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Search failed." },
      { status: 500 }
    );
  }
}
