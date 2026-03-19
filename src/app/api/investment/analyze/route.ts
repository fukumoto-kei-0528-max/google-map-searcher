import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stocks, riskProfile = "moderate" } = body;

    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return NextResponse.json({ error: "stocks array is required" }, { status: 400 });
    }

    const stockSummary = stocks
      .map(
        (s: {
          symbol: string;
          name: string;
          metrics: {
            totalROI: number;
            cagr: number;
            volatility: number;
            maxDrawdown: number;
            recentTrend: number;
            peRatio?: number;
            pbRatio?: number;
            dividendYield?: string | null;
            roe?: string | null;
            revenueGrowth?: string | null;
            sector?: string;
          };
          currentPrice?: number;
          period: string;
        }) => `
銘柄: ${s.symbol} (${s.name})
現在値: $${s.currentPrice?.toFixed(2) || "N/A"}
期間: ${s.period}
総ROI: ${s.metrics.totalROI}%
CAGR (年間複利成長率): ${s.metrics.cagr}%
ボラティリティ: ${s.metrics.volatility}%
最大ドローダウン: ${s.metrics.maxDrawdown}%
直近3ヶ月トレンド: ${s.metrics.recentTrend}%
PER: ${s.metrics.peRatio?.toFixed(1) || "N/A"}
PBR: ${s.metrics.pbRatio?.toFixed(2) || "N/A"}
配当利回り: ${s.metrics.dividendYield || "N/A"}%
ROE: ${s.metrics.roe || "N/A"}%
売上成長率: ${s.metrics.revenueGrowth || "N/A"}%
セクター: ${s.metrics.sector || "N/A"}
`
      )
      .join("\n---\n");

    const riskProfiles: Record<string, string> = {
      conservative: "保守的（低リスク・安定重視、配当重視）",
      moderate: "中程度（バランス型、成長と安定の両立）",
      aggressive: "積極的（高リスク・高リターン、グロース重視）",
    };

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `あなたは数十年の投資経験を持つプロの投資アナリストです。以下の株式データを分析して、投資判断を提供してください。

リスク許容度: ${riskProfiles[riskProfile] || riskProfiles.moderate}

【分析対象銘柄データ】
${stockSummary}

以下の形式でJSON形式のみで回答してください（説明文なし）:

{
  "summary": "全体的な市場状況と分析の概要（2-3文）",
  "recommendations": [
    {
      "symbol": "銘柄シンボル",
      "rating": "強く推奨|推奨|中立|様子見|避ける",
      "score": 1-10の数値,
      "reason": "推奨理由（具体的に100字以内）",
      "targetHorizon": "短期(1年以内)|中期(1-3年)|長期(3年以上)",
      "risks": ["リスク1", "リスク2"],
      "strengths": ["強み1", "強み2"]
    }
  ],
  "topPick": "最も推奨する銘柄シンボル",
  "marketInsight": "歴史的トレンドと現在の市場状況に関する洞察（3-5文）",
  "diversificationAdvice": "ポートフォリオ分散に関するアドバイス（2-3文）"
}`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "AI analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}
