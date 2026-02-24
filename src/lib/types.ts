export type ExpenseType = "shared" | "personal";
export type Currency = "AUD" | "JPY" | "KRW";
export type CategoryType = "shared" | "personal";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  weekly_budget_aud: number | null;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  expense_type: ExpenseType;
  paid_by: string;
  split_ratio: string | null;
  category_id: string | null;
  currency: Currency;
  amount: number;
  amount_in_aud: number;
  is_settled: boolean;
  note: string | null;
  created_at: string;
  category?: Category;
}

export interface BudgetProgress {
  category: Category;
  spent: number;
  budget: number | null;
  percentage: number;
  isOverBudget: boolean;
}

export interface SettlementResult {
  /** Positive: partner owes me. Negative: I owe partner. */
  netBalance: number;
  totalExpenses: number;
}
