"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Category, Currency, ExpenseType } from "@/lib/types";
import { USER_ME, USER_PARTNER, SPLIT_RATIOS, CURRENCIES } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const today = () => new Date().toISOString().split("T")[0];

interface FormState {
  date: string;
  expense_type: ExpenseType;
  paid_by: string;
  split_ratio: string;
  category_id: string;
  currency: Currency;
  amount: string;
  note: string;
}

const defaultForm = (): FormState => ({
  date: today(),
  expense_type: "shared",
  paid_by: USER_ME,
  split_ratio: "50:50",
  category_id: "",
  currency: "AUD",
  amount: "",
  note: "",
});

async function fetchExchangeRate(from: Currency): Promise<number> {
  if (from === "AUD") return 1;
  const res = await fetch(`/api/exchange-rate?from=${from}`);
  if (!res.ok) throw new Error("Failed to fetch rate");
  const { rate } = await res.json();
  return rate as number;
}

export default function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("type")
      .order("name");
    setCategories((data as Category[]) ?? []);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Filter categories by expense_type
  const filteredCategories = categories.filter(
    (c) => c.type === form.expense_type
  );

  // Reset category when expense_type changes
  const handleExpenseTypeChange = (val: ExpenseType) => {
    setForm((f) => ({ ...f, expense_type: val, category_id: "" }));
  };

  const set = (key: keyof FormState) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.amount || isNaN(parseFloat(form.amount))) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    setSubmitting(true);
    try {
      const amount = parseFloat(form.amount);
      const rate = await fetchExchangeRate(form.currency);
      const amount_in_aud = parseFloat((amount / rate).toFixed(2));

      const payload = {
        date: form.date,
        expense_type: form.expense_type,
        paid_by: form.paid_by,
        split_ratio: form.expense_type === "shared" ? form.split_ratio : null,
        category_id: form.category_id,
        currency: form.currency,
        amount,
        amount_in_aud,
        is_settled: false,
        note: form.note || null,
      };

      const supabase = createClient();
      const { error: dbErr } = await supabase.from("expenses").insert(payload);
      if (dbErr) throw dbErr;

      setSuccess(true);
      setForm(defaultForm());
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => set("date")(e.target.value)}
              required
            />
          </div>

          {/* Expense Type toggle */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["shared", "personal"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleExpenseTypeChange(type)}
                  className={`h-10 rounded-md text-sm font-medium border transition-colors
                    ${
                      form.expense_type === type
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {type === "shared" ? "Shared" : "Personal"}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category_id} onValueChange={set("category_id")}>
              <SelectTrigger>
                <SelectValue placeholder="Select category…" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount + Currency */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => set("amount")(e.target.value)}
                className="flex-1"
                required
              />
              <Select value={form.currency} onValueChange={set("currency") as (v: string) => void}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.currency !== "AUD" && (
              <p className="text-xs text-gray-500">
                Will be auto-converted to AUD using the latest exchange rate.
              </p>
            )}
          </div>

          {/* Paid By */}
          <div className="space-y-1.5">
            <Label>Paid by</Label>
            <div className="grid grid-cols-2 gap-2">
              {[USER_ME, USER_PARTNER].map((user) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => set("paid_by")(user)}
                  className={`h-10 rounded-md text-sm font-medium border transition-colors
                    ${
                      form.paid_by === user
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {user}
                </button>
              ))}
            </div>
          </div>

          {/* Split Ratio — only for shared */}
          {form.expense_type === "shared" && (
            <div className="space-y-1.5">
              <Label>
                Split Ratio
                <span className="ml-1 text-xs text-gray-400">
                  ({USER_ME} : {USER_PARTNER})
                </span>
              </Label>
              <Select value={form.split_ratio} onValueChange={set("split_ratio")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPLIT_RATIOS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              type="text"
              placeholder="e.g. Woolworths weekly shop"
              value={form.note}
              onChange={(e) => set("note")(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </p>
          )}

          {/* Success */}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2">
              Expense saved successfully!
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            {submitting ? "Saving…" : "Save Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
