import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

const WATCHLIST: Record<string, string[]> = {
  us_mega: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "BRK-B", "LLY", "V"],
  us_growth: ["PLTR", "SMCI", "CRWD", "DDOG", "SNOW", "NET", "MSTR", "ARM", "AVGO", "AMD"],
  us_dividend: ["JNJ", "PG", "KO", "PEP", "MCD", "O", "VZ", "T", "XOM", "CVX"],
  japan: ["7203.T", "6758.T", "7974.T", "6861.T", "9984.T", "4063.T", "8306.T", "6367.T"],
};

export async function GET() {
  try {
    const allSymbols = Object.values(WATCHLIST).flat();

    // Fetch quotes
    const quoteResults: Record<string, unknown>[] = [];
    for (const symbol of allSymbols) {
      try {
        const q = await yahooFinance.quote(symbol) as Record<string, unknown>;
        quoteResults.push(q);
      } catch {
        // skip failed
      }
    }

    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    type StockEntry = {
      symbol: string;
      name: string;
      currentPrice: number | undefined;
      marketCap: number | undefined;
      change1d: number | undefined;
      change3m: number;
      change1y: number;
      momentumScore: number;
      volume: number | undefined;
      avgVolume: number | undefined;
      category: string;
    };

    const stocks: StockEntry[] = [];

    for (const quote of quoteResults) {
      const sym = quote.symbol as string | undefined;
      if (!sym) continue;

      let change3m = 0;
      let change1y = 0;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hist3m = await (yahooFinance.historical as any)(sym, { period1: threeMonthsAgo, period2: new Date(), interval: "1wk" }) as { close: number }[];
        if (hist3m.length >= 2) {
          change3m = ((hist3m[hist3m.length - 1].close - hist3m[0].close) / hist3m[0].close) * 100;
        }
      } catch { /* skip */ }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hist1y = await (yahooFinance.historical as any)(sym, { period1: oneYearAgo, period2: new Date(), interval: "1mo" }) as { close: number }[];
        if (hist1y.length >= 2) {
          change1y = ((hist1y[hist1y.length - 1].close - hist1y[0].close) / hist1y[0].close) * 100;
        }
      } catch { /* skip */ }

      const momentumScore = change3m * 0.7 + change1y * 0.3;

      let category = "us_mega";
      for (const [cat, symbols] of Object.entries(WATCHLIST)) {
        if (symbols.includes(sym)) { category = cat; break; }
      }

      stocks.push({
        symbol: sym,
        name: (quote.longName || quote.shortName || sym) as string,
        currentPrice: quote.regularMarketPrice as number | undefined,
        marketCap: quote.marketCap as number | undefined,
        change1d: quote.regularMarketChangePercent as number | undefined,
        change3m: parseFloat(change3m.toFixed(2)),
        change1y: parseFloat(change1y.toFixed(2)),
        momentumScore: parseFloat(momentumScore.toFixed(2)),
        volume: quote.regularMarketVolume as number | undefined,
        avgVolume: quote.averageDailyVolume3Month as number | undefined,
        category,
      });
    }

    const sorted = (arr: StockEntry[], key: keyof StockEntry) =>
      [...arr].sort((a, b) => ((b[key] as number) || 0) - ((a[key] as number) || 0));

    return NextResponse.json({
      trending: sorted(stocks, "momentumScore").slice(0, 10),
      hotStocks: sorted(stocks, "change3m").slice(0, 5),
      yearBest: sorted(stocks, "change1y").slice(0, 5),
      allStocks: stocks,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trending fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending data", details: String(error) },
      { status: 500 }
    );
  }
}
