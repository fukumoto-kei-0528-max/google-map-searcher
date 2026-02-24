-- ============================================================
-- Couple Budget App — Supabase Database Schema
-- ============================================================
-- Run this SQL in the Supabase SQL Editor to initialise the DB.
-- ============================================================

-- ① Categories table
CREATE TABLE IF NOT EXISTS categories (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  type              TEXT        NOT NULL CHECK (type IN ('shared', 'personal')),
  weekly_budget_aud DECIMAL(10, 2),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ② Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  expense_type  TEXT        NOT NULL CHECK (expense_type IN ('shared', 'personal')),
  paid_by       TEXT        NOT NULL,
  -- split_ratio: "me_share:partner_share" e.g. "50:50", "100:0", "0:100"
  -- NULL for personal expenses
  split_ratio   TEXT,
  category_id   UUID        REFERENCES categories (id) ON DELETE SET NULL,
  currency      TEXT        NOT NULL CHECK (currency IN ('AUD', 'JPY', 'KRW')),
  amount        DECIMAL(12, 2) NOT NULL,
  amount_in_aud DECIMAL(12, 2) NOT NULL,
  is_settled    BOOLEAN     NOT NULL DEFAULT FALSE,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_expenses_date
  ON expenses (date);

CREATE INDEX IF NOT EXISTS idx_expenses_category_id
  ON expenses (category_id);

CREATE INDEX IF NOT EXISTS idx_expenses_type_settled
  ON expenses (expense_type, is_settled);

CREATE INDEX IF NOT EXISTS idx_expenses_week
  ON expenses (date, expense_type);

-- ============================================================
-- Row Level Security
-- ============================================================
-- Enable RLS (no auth required for this 2-person app — both
-- users share the anon key. Add policies if you add auth later.)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses   ENABLE ROW LEVEL SECURITY;

-- Allow full access via anon key (shared 2-person app)
CREATE POLICY "Allow all for anon" ON categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON expenses
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Seed Data — Default categories
-- ============================================================
INSERT INTO categories (name, type, weekly_budget_aud) VALUES
  -- Shared categories
  ('Groceries',      'shared',   150.00),
  ('Dining Out',     'shared',   100.00),
  ('Household',      'shared',    50.00),
  ('Transport',      'shared',    80.00),
  ('Entertainment',  'shared',    60.00),
  ('Utilities',      'shared',   120.00),
  -- Personal categories
  ('Personal Care',  'personal',  30.00),
  ('Clothing',       'personal',  50.00),
  ('Personal Other', 'personal',   NULL)
ON CONFLICT DO NOTHING;
