import { NextRequest, NextResponse } from "next/server";

// Cache exchange rates for 1 hour
const rateCache = new Map<string, { rate: number; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from")?.toUpperCase();

  if (!from || from === "AUD") {
    return NextResponse.json({ rate: 1, currency: "AUD" });
  }

  const cached = rateCache.get(from);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ rate: cached.rate, currency: from });
  }

  try {
    // Open Exchange Rates: free, no API key, returns rates relative to USD
    // We fetch AUD base rates: 1 AUD = X <currency>
    const res = await fetch(
      `https://open.er-api.com/v6/latest/AUD`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error("Upstream API error");
    const json = await res.json();

    const rates: Record<string, number> = json.rates;
    if (!rates[from]) {
      return NextResponse.json(
        { error: `Currency ${from} not supported` },
        { status: 400 }
      );
    }

    // rates[from] = how many <from> per 1 AUD
    // To convert <from> to AUD: amount_in_aud = amount / rates[from]
    const rate = rates[from];
    rateCache.set(from, { rate, fetchedAt: Date.now() });

    return NextResponse.json({ rate, currency: from });
  } catch (err) {
    console.error("[exchange-rate]", err);
    // Fallback hardcoded rates (approximate, updated Feb 2026)
    const fallback: Record<string, number> = {
      JPY: 96,   // 1 AUD ≈ 96 JPY
      KRW: 900,  // 1 AUD ≈ 900 KRW
    };
    if (fallback[from]) {
      return NextResponse.json({ rate: fallback[from], currency: from, fallback: true });
    }
    return NextResponse.json({ error: "Failed to fetch rate" }, { status: 502 });
  }
}
