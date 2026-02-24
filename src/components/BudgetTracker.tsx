"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentWeekRange, formatAUD } from "@/lib/utils";
import { Category, Expense, BudgetProgress } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BudgetTracker() {
  const [progress, setProgress] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekLabel, setWeekLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { from, to } = getCurrentWeekRange();

    // Format label: "Mon 24 Feb – Sun 1 Mar"
    const fmt = (d: string) =>
      new Date(d + "T12:00:00").toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    setWeekLabel(`${fmt(from)} – ${fmt(to)}`);

    const [{ data: categories }, { data: expenses }] = await Promise.all([
      supabase.from("categories").select("*").order("type").order("name"),
      supabase
        .from("expenses")
        .select("*, category:categories(*)")
        .gte("date", from)
        .lte("date", to),
    ]);

    if (!categories) {
      setLoading(false);
      return;
    }

    const expenseList = (expenses as (Expense & { category: Category })[]) ?? [];

    const budgets: BudgetProgress[] = categories.map((cat: Category) => {
      const spent = expenseList
        .filter((e) => e.category_id === cat.id)
        .reduce((sum, e) => sum + Number(e.amount_in_aud), 0);

      const budget = cat.weekly_budget_aud ? Number(cat.weekly_budget_aud) : null;
      const percentage = budget ? Math.min((spent / budget) * 100, 100) : 0;
      const isOverBudget = budget !== null && spent > budget;

      return { category: cat, spent, budget, percentage, isOverBudget };
    });

    setProgress(budgets);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sharedBudgets = progress.filter((p) => p.category.type === "shared");
  const personalBudgets = progress.filter((p) => p.category.type === "personal");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Weekly Budget</CardTitle>
            <CardDescription className="text-xs mt-0.5">{weekLabel}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={load}
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
        ) : (
          <>
            <Section title="Shared" items={sharedBudgets} />
            <Section title="Personal" items={personalBudgets} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ title, items }: { title: string; items: BudgetProgress[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <BudgetRow key={item.category.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function BudgetRow({ item }: { item: BudgetProgress }) {
  const { category, spent, budget, percentage, isOverBudget } = item;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-800">{category.name}</span>
        <div className="flex items-center gap-2">
          {isOverBudget && (
            <Badge variant="destructive" className="text-xs">Over</Badge>
          )}
          <span className={`font-mono text-xs ${isOverBudget ? "text-red-600" : "text-gray-600"}`}>
            {formatAUD(spent)}
            {budget !== null && (
              <span className="text-gray-400"> / {formatAUD(budget)}</span>
            )}
          </span>
        </div>
      </div>
      {budget !== null ? (
        <Progress
          value={percentage}
          indicatorClassName={isOverBudget ? "bg-red-500" : percentage >= 80 ? "bg-amber-500" : "bg-blue-500"}
        />
      ) : (
        <div className="h-3 rounded-full bg-gray-100 flex items-center px-2">
          <span className="text-xs text-gray-400">No budget set</span>
        </div>
      )}
    </div>
  );
}
