import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import type { HistoricalRowHistory } from "yahoo-finance2/modules/historical";
import type { Quote } from "yahoo-finance2/modules/quote";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "AAPL";
  const period = searchParams.get("period") || "10y"; // 1y, 5y, 10y, 20y, max

  const periodToDate: Record<string, Date> = {
    "1y": new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    "5y": new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
    "10y": new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000),
    "20y": new Date(Date.now() - 20 * 365 * 24 * 60 * 60 * 1000),
    "30y": new Date(Date.now() - 30 * 365 * 24 * 60 * 60 * 1000),
  };

  try {
    const startDate = periodToDate[period] || periodToDate["10y"];

    let historicalData: HistoricalRowHistory[] = [];
    let quoteData: Quote | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let summaryData: any = null;

    try { historicalData = await yahooFinance.historical(symbol, { period1: startDate, period2: new Date(), interval: period === "1y" ? "1wk" : "1mo" }); } catch {}
    try { quoteData = await yahooFinance.quote(symbol) as Quote; } catch {}
    try { summaryData = await yahooFinance.quoteSummary(symbol, { modules: ["summaryDetail", "financialData", "defaultKeyStatistics", "assetProfile"] }); } catch {}

    // Calculate ROI and key metrics
    const prices = historicalData.map((d) => ({ date: d.date, close: d.close, open: d.open }));
    const firstPrice = prices[0]?.close || 1;
    const lastPrice = prices[prices.length - 1]?.close || firstPrice;
    const totalROI = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Calculate CAGR
    const years = (new Date().getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
    const cagr = (Math.pow(lastPrice / firstPrice, 1 / years) - 1) * 100;

    // Calculate volatility (standard deviation of monthly returns)
    const monthlyReturns = prices.slice(1).map((p, i) => {
      const prev = prices[i];
      return (p.close - prev.close) / prev.close;
    });
    const avgReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
    const variance = monthlyReturns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / monthlyReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(12) * 100; // annualized

    // Max drawdown
    let maxDrawdown = 0;
    let peak = prices[0]?.close || 0;
    for (const p of prices) {
      if (p.close > peak) peak = p.close;
      const drawdown = (peak - p.close) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Recent trend (last 3 months vs 3 months before)
    const last3m = prices.slice(-3);
    const prev3m = prices.slice(-6, -3);
    const recentTrend =
      last3m.length > 0 && prev3m.length > 0
        ? ((last3m[last3m.length - 1].close - prev3m[0].close) / prev3m[0].close) * 100
        : 0;

    return NextResponse.json({
      symbol,
      name: quoteData?.longName || quoteData?.shortName || symbol,
      prices,
      currentPrice: quoteData?.regularMarketPrice,
      metrics: {
        totalROI: parseFloat(totalROI.toFixed(2)),
        cagr: parseFloat(cagr.toFixed(2)),
        volatility: parseFloat(volatility.toFixed(2)),
        maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(2)),
        recentTrend: parseFloat(recentTrend.toFixed(2)),
        marketCap: quoteData?.marketCap,
        peRatio: summaryData?.summaryDetail?.trailingPE,
        pbRatio: summaryData?.summaryDetail?.priceToBook,
        dividendYield: summaryData?.summaryDetail?.dividendYield
          ? (summaryData.summaryDetail.dividendYield * 100).toFixed(2)
          : null,
        eps: summaryData?.defaultKeyStatistics?.trailingEps,
        roe: summaryData?.financialData?.returnOnEquity
          ? ((summaryData.financialData.returnOnEquity as number) * 100).toFixed(2)
          : null,
        debtToEquity: summaryData?.financialData?.debtToEquity,
        revenueGrowth: summaryData?.financialData?.revenueGrowth
          ? ((summaryData.financialData.revenueGrowth as number) * 100).toFixed(2)
          : null,
        sector: summaryData?.assetProfile?.sector,
        industry: summaryData?.assetProfile?.industry,
        country: summaryData?.assetProfile?.country,
      },
      period,
    });
  } catch (error) {
    console.error("Stock fetch error:", error);
    return NextResponse.json(
      { error: `Failed to fetch data for ${symbol}`, details: String(error) },
      { status: 500 }
    );
  }
}
