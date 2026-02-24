"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatAUD } from "@/lib/utils";
import { Expense, SettlementResult } from "@/lib/types";
import { USER_ME, USER_PARTNER } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Calculate net settlement from a list of unsettled shared expenses.
 *
 * split_ratio format: "me_share:partner_share" (percentages, sum=100)
 *
 * - If paid_by = USER_ME:   partner owes me   = amount_in_aud * (partner_share/100)
 * - If paid_by = USER_PARTNER: I owe partner  = amount_in_aud * (me_share/100)
 *
 * Positive net  → partner owes me
 * Negative net  → I owe partner
 */
function calcSettlement(expenses: Expense[]): SettlementResult {
  let net = 0;

  for (const exp of expenses) {
    if (!exp.split_ratio) continue;
    const [meRatioStr, partnerRatioStr] = exp.split_ratio.split(":");
    const meRatio = parseFloat(meRatioStr) / 100;
    const partnerRatio = parseFloat(partnerRatioStr) / 100;
    const aud = Number(exp.amount_in_aud);

    if (exp.paid_by === USER_ME) {
      // I paid everything; partner owes their share
      net += aud * partnerRatio;
    } else {
      // Partner paid everything; I owe my share
      net -= aud * meRatio;
    }
  }

  return { netBalance: net, totalExpenses: expenses.length };
}

export default function SettleUp({ onSettled }: { onSettled?: () => void }) {
  const [result, setResult] = useState<SettlementResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [expenseIds, setExpenseIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setSettled(false);
    const supabase = createClient();
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("expense_type", "shared")
      .eq("is_settled", false);

    const list = (data as Expense[]) ?? [];
    setExpenseIds(list.map((e) => e.id));
    setResult(calcSettlement(list));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSettle = async () => {
    if (expenseIds.length === 0) return;
    setSettling(true);
    const supabase = createClient();
    await supabase
      .from("expenses")
      .update({ is_settled: true })
      .in("id", expenseIds);
    setSettled(true);
    setSettling(false);
    setResult({ netBalance: 0, totalExpenses: 0 });
    setExpenseIds([]);
    onSettled?.();
  };

  const abs = Math.abs(result?.netBalance ?? 0);
  const payer = (result?.netBalance ?? 0) < 0 ? USER_ME : USER_PARTNER;
  const payee = payer === USER_ME ? USER_PARTNER : USER_ME;
  const noBalance = !result || Math.abs(result.netBalance) < 0.01;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Settle Up</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {loading ? "Loading…" : `${result?.totalExpenses ?? 0} unsettled shared expense(s)`}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={load}
            disabled={loading || settling}
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-gray-400 text-sm">Loading…</div>
        ) : settled ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-green-700 font-medium">All settled!</p>
          </div>
        ) : noBalance ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600 text-sm font-medium">You&apos;re all square</p>
            <p className="text-gray-400 text-xs mt-1">No outstanding balance</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Balance display */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-center justify-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Payer</p>
                  <Badge
                    variant={payer === USER_ME ? "default" : "secondary"}
                    className="text-sm px-3 py-1"
                  >
                    {payer}
                  </Badge>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRight className="h-5 w-5 text-blue-500" />
                  <span className="text-lg font-bold text-blue-700 mt-1">
                    {formatAUD(abs)}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Receiver</p>
                  <Badge
                    variant={payee === USER_ME ? "default" : "secondary"}
                    className="text-sm px-3 py-1"
                  >
                    {payee}
                  </Badge>
                </div>
              </div>
              <p className="text-center text-xs text-gray-500 mt-3">
                <strong>{payer}</strong> pays <strong>{payee}</strong> {formatAUD(abs)} to settle up
              </p>
            </div>

            {/* Settle button */}
            <Button
              variant="success"
              className="w-full"
              onClick={handleSettle}
              disabled={settling}
            >
              {settling ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {settling ? "Settling…" : "Mark as Settled"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
