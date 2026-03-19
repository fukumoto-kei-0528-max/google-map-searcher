"use client";

import { useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  BarChart2,
  Zap,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Brain,
} from "lucide-react";
import StockChart from "./StockChart";

// ——— Types ———

interface StockMetrics {
  totalROI: number;
  cagr: number;
  volatility: number;
  maxDrawdown: number;
  recentTrend: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: string | null;
  eps?: number;
  roe?: string | null;
  debtToEquity?: number;
  revenueGrowth?: string | null;
  sector?: string;
  industry?: string;
  country?: string;
}

interface StockData {
  symbol: string;
  name: string;
  currentPrice?: number;
  prices: { date: Date | string; close: number }[];
  metrics: StockMetrics;
  period: string;
}

interface TrendingStock {
  symbol: string;
  name: string;
  currentPrice?: number;
  change1d?: number;
  change3m: number;
  change1y: number;
  momentumScore: number;
  marketCap?: number;
  category: string;
}

interface AIAnalysis {
  summary: string;
  recommendations: {
    symbol: string;
    rating: string;
    score: number;
    reason: string;
    targetHorizon: string;
    risks: string[];
    strengths: string[];
  }[];
  topPick: string;
  marketInsight: string;
  diversificationAdvice: string;
}

// ——— Constants ———

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"];
const PERIOD_OPTIONS = [
  { value: "1y", label: "1年" },
  { value: "5y", label: "5年" },
  { value: "10y", label: "10年" },
  { value: "20y", label: "20年" },
  { value: "30y", label: "30年" },
];
const RISK_OPTIONS = [
  { value: "conservative", label: "保守的" },
  { value: "moderate", label: "中程度" },
  { value: "aggressive", label: "積極的" },
];
const RATING_COLOR: Record<string, string> = {
  強く推奨: "bg-green-100 text-green-800",
  推奨: "bg-emerald-100 text-emerald-700",
  中立: "bg-yellow-100 text-yellow-800",
  様子見: "bg-orange-100 text-orange-800",
  避ける: "bg-red-100 text-red-800",
};

// ——— Helpers ———

const fmt = (v?: number | null, decimals = 1) =>
  v == null || isNaN(v) ? "N/A" : v.toFixed(decimals);
const fmtPct = (v?: number | null) => (v == null ? "N/A" : `${v > 0 ? "+" : ""}${fmt(v)}%`);
const fmtCap = (v?: number | null) => {
  if (!v) return "N/A";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
};

// ——— Sub-components ———

function MetricBadge({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-bold ${color || "text-gray-800"}`}>{value}</span>
    </div>
  );
}

function StockCard({ stock, analysis }: { stock: StockData; analysis?: AIAnalysis | null }) {
  const [expanded, setExpanded] = useState(false);
  const rec = analysis?.recommendations.find((r) => r.symbol === stock.symbol);
  const isTopPick = analysis?.topPick === stock.symbol;
  const m = stock.metrics;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border ${isTopPick ? "border-yellow-400" : "border-gray-100"} overflow-hidden`}
    >
      {isTopPick && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1 flex items-center justify-center gap-1">
          <Star className="h-3 w-3" /> AI トップピック
        </div>
      )}
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">{stock.symbol}</h3>
              {rec && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RATING_COLOR[rec.rating] || "bg-gray-100 text-gray-600"}`}>
                  {rec.rating}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{stock.name}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              ${stock.currentPrice?.toFixed(2) || "N/A"}
            </div>
            <div
              className={`text-xs font-semibold ${m.recentTrend >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {m.recentTrend >= 0 ? (
                <TrendingUp className="inline h-3 w-3 mr-0.5" />
              ) : (
                <TrendingDown className="inline h-3 w-3 mr-0.5" />
              )}
              {fmtPct(m.recentTrend)} (3ヶ月)
            </div>
          </div>
        </div>

        {/* Chart */}
        <StockChart prices={stock.prices} symbol={stock.symbol} />

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <MetricBadge
            label={`ROI (${stock.period})`}
            value={fmtPct(m.totalROI)}
            color={m.totalROI >= 0 ? "text-green-700" : "text-red-700"}
          />
          <MetricBadge label="CAGR" value={`${fmt(m.cagr)}%`} color="text-blue-700" />
          <MetricBadge
            label="ボラティリティ"
            value={`${fmt(m.volatility)}%`}
            color={m.volatility > 30 ? "text-red-600" : m.volatility > 20 ? "text-orange-600" : "text-green-600"}
          />
          <MetricBadge label="最大DD" value={`-${fmt(m.maxDrawdown)}%`} color="text-red-600" />
          <MetricBadge label="PER" value={fmt(m.peRatio)} />
          <MetricBadge label="配当" value={m.dividendYield ? `${m.dividendYield}%` : "N/A"} />
        </div>

        {/* AI Analysis */}
        {rec && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="w-full flex items-center justify-between text-xs text-blue-600 font-medium py-2 border-t border-gray-100"
            >
              <span className="flex items-center gap-1">
                <Brain className="h-3 w-3" /> AI分析詳細
              </span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expanded && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">スコア:</span>
                  <div className="flex gap-0.5">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-4 rounded-sm ${i < rec.score ? "bg-blue-500" : "bg-gray-200"}`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-blue-700">{rec.score}/10</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{rec.reason}</p>
                <div className="flex gap-1">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {rec.targetHorizon}
                  </span>
                </div>
                {rec.strengths.length > 0 && (
                  <div>
                    <p className="font-semibold text-green-700 mb-1">強み</p>
                    {rec.strengths.map((s, i) => (
                      <p key={i} className="text-gray-600">
                        ✓ {s}
                      </p>
                    ))}
                  </div>
                )}
                {rec.risks.length > 0 && (
                  <div>
                    <p className="font-semibold text-red-700 mb-1">リスク</p>
                    {rec.risks.map((r, i) => (
                      <p key={i} className="text-gray-600">
                        ⚠ {r}
                      </p>
                    ))}
                  </div>
                )}
                <div className="text-gray-400 text-right">
                  {m.sector && (
                    <span>
                      {m.sector} • {m.country}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TrendingStockRow({ stock, rank }: { stock: TrendingStock; rank: number }) {
  const isHot = stock.momentumScore > 20;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-sm w-5 text-center font-medium">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-sm text-gray-900">{stock.symbol}</span>
          {isHot && <Zap className="h-3 w-3 text-orange-500" />}
        </div>
        <p className="text-xs text-gray-400 truncate">{stock.name}</p>
      </div>
      <div className="text-right">
        <div className={`text-sm font-bold ${stock.change3m >= 0 ? "text-green-600" : "text-red-600"}`}>
          {fmtPct(stock.change3m)}
        </div>
        <div className="text-xs text-gray-400">{fmtCap(stock.marketCap)}</div>
      </div>
    </div>
  );
}

// ——— Main Component ———

export default function InvestmentDashboard() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [inputSymbol, setInputSymbol] = useState("");
  const [period, setPeriod] = useState("10y");
  const [riskProfile, setRiskProfile] = useState("moderate");
  const [stocksData, setStocksData] = useState<StockData[]>([]);
  const [trendingData, setTrendingData] = useState<{
    trending: TrendingStock[];
    hotStocks: TrendingStock[];
    yearBest: TrendingStock[];
  } | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analyze" | "trending">("analyze");

  const fetchStocksAndAnalyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const results = await Promise.allSettled(
        symbols.map((s) =>
          fetch(`/api/investment/stocks?symbol=${encodeURIComponent(s)}&period=${period}`).then(
            (r) => r.json()
          )
        )
      );

      const validStocks: StockData[] = results
        .filter((r) => r.status === "fulfilled" && !r.value.error)
        .map((r) => (r as PromiseFulfilledResult<StockData>).value);

      setStocksData(validStocks);

      if (validStocks.length === 0) {
        setError("データ取得に失敗しました。シンボルを確認してください。");
        return;
      }

      // AI analysis
      setAnalysisLoading(true);
      try {
        const aiRes = await fetch("/api/investment/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stocks: validStocks, riskProfile }),
        });
        const aiData = await aiRes.json();
        if (!aiData.error) setAnalysis(aiData);
      } finally {
        setAnalysisLoading(false);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [symbols, period, riskProfile]);

  const fetchTrending = useCallback(async () => {
    setTrendingLoading(true);
    try {
      const res = await fetch("/api/investment/trending");
      const data = await res.json();
      if (!data.error) setTrendingData(data);
      else setError(data.error);
    } catch (e) {
      setError(String(e));
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  const addSymbol = () => {
    const s = inputSymbol.trim().toUpperCase();
    if (s && !symbols.includes(s)) {
      setSymbols((prev) => [...prev, s]);
    }
    setInputSymbol("");
  };

  const removeSymbol = (s: string) => setSymbols((prev) => prev.filter((x) => x !== s));

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex">
        <button
          onClick={() => setActiveTab("analyze")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "analyze" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500"
          }`}
        >
          <BarChart2 className="inline h-4 w-4 mr-1" />
          銘柄分析
        </button>
        <button
          onClick={() => {
            setActiveTab("trending");
            if (!trendingData) fetchTrending();
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "trending" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500"
          }`}
        >
          <Zap className="inline h-4 w-4 mr-1" />
          急上昇トレンド
        </button>
      </div>

      {/* Analysis Tab */}
      {activeTab === "analyze" && (
        <>
          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              投資分析ツール
            </h2>

            {/* Symbol input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSymbol()}
                placeholder="銘柄コード追加 (例: TSLA)"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={addSymbol}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            {/* Symbol chips */}
            <div className="flex flex-wrap gap-2">
              {symbols.map((s) => (
                <button
                  key={s}
                  onClick={() => removeSymbol(s)}
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  {s} ×
                </button>
              ))}
            </div>

            {/* Options row */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">期間</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {PERIOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">リスク</label>
                <select
                  value={riskProfile}
                  onChange={(e) => setRiskProfile(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {RISK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={fetchStocksAndAnalyze}
              disabled={loading || symbols.length === 0}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  取得中...
                </>
              ) : (
                <>
                  <BarChart2 className="h-4 w-4" />
                  AI分析を開始
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">エラー</p>
                <p className="text-red-600 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {analysisLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
              <p className="text-blue-700 text-sm">AI が投資分析中...</p>
            </div>
          )}

          {analysis && !analysisLoading && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-blue-900 flex items-center gap-2">
                <Brain className="h-5 w-5" /> AI 投資分析レポート
              </h3>
              <p className="text-blue-800 text-sm leading-relaxed">{analysis.summary}</p>
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">市場インサイト</p>
                <p className="text-gray-700 text-xs leading-relaxed">{analysis.marketInsight}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">分散投資アドバイス</p>
                <p className="text-gray-700 text-xs leading-relaxed">{analysis.diversificationAdvice}</p>
              </div>
            </div>
          )}

          {/* Stock Cards */}
          {stocksData.length > 0 && (
            <div className="space-y-4">
              {stocksData
                .sort((a, b) => {
                  if (analysis?.topPick === a.symbol) return -1;
                  if (analysis?.topPick === b.symbol) return 1;
                  const ra = analysis?.recommendations.find((r) => r.symbol === a.symbol);
                  const rb = analysis?.recommendations.find((r) => r.symbol === b.symbol);
                  return (rb?.score || 0) - (ra?.score || 0);
                })
                .map((stock) => (
                  <StockCard key={stock.symbol} stock={stock} analysis={analysis} />
                ))}
            </div>
          )}
        </>
      )}

      {/* Trending Tab */}
      {activeTab === "trending" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                急上昇トレンド株
              </h2>
              <button
                onClick={fetchTrending}
                disabled={trendingLoading}
                className="text-orange-500 hover:text-orange-700"
              >
                <RefreshCw className={`h-4 w-4 ${trendingLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {trendingLoading && (
              <div className="text-center py-8 text-gray-400">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">データ取得中（少々お待ちください）...</p>
              </div>
            )}

            {trendingData && !trendingLoading && (
              <div className="space-y-5">
                {/* Hot stocks */}
                <div>
                  <h3 className="text-sm font-semibold text-orange-600 mb-2 flex items-center gap-1">
                    <Zap className="h-4 w-4" /> 直近3ヶ月 急上昇 TOP5
                  </h3>
                  {trendingData.hotStocks.map((s, i) => (
                    <TrendingStockRow key={s.symbol} stock={s} rank={i + 1} />
                  ))}
                </div>

                {/* Year best */}
                <div>
                  <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> 1年間 パフォーマンス TOP5
                  </h3>
                  {trendingData.yearBest.map((s, i) => (
                    <div key={s.symbol} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-400 text-sm w-5 text-center font-medium">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-gray-900">{s.symbol}</span>
                        <p className="text-xs text-gray-400 truncate">{s.name}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${s.change1y >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {fmtPct(s.change1y)}
                        </div>
                        <div className="text-xs text-gray-400">{fmtCap(s.marketCap)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Momentum ranking */}
                <div>
                  <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1">
                    <Star className="h-4 w-4" /> モメンタム総合ランキング TOP10
                  </h3>
                  {trendingData.trending.map((s, i) => (
                    <div key={s.symbol} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-400 text-sm w-5 text-center font-medium">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm text-gray-900">{s.symbol}</span>
                          {s.momentumScore > 30 && <Zap className="h-3 w-3 text-orange-500" />}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{s.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-2 text-xs">
                          <span className={`font-medium ${s.change3m >= 0 ? "text-green-600" : "text-red-600"}`}>
                            3M: {fmtPct(s.change3m)}
                          </span>
                          <span className={`font-medium ${s.change1y >= 0 ? "text-green-600" : "text-red-600"}`}>
                            1Y: {fmtPct(s.change1y)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">{fmtCap(s.marketCap)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analyze trending button */}
          {trendingData && (
            <button
              onClick={() => {
                const topSymbols = trendingData.trending.slice(0, 5).map((s) => s.symbol);
                setSymbols(topSymbols);
                setActiveTab("analyze");
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-sm"
            >
              <Brain className="h-4 w-4" />
              トレンド上位5銘柄をAI分析する
            </button>
          )}
        </>
      )}
    </div>
  );
}
