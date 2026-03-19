"use client";

import { useState } from "react";
import { LayoutDashboard, PlusCircle, Settings, TrendingUp } from "lucide-react";
import BudgetTracker from "@/components/BudgetTracker";
import SettleUp from "@/components/SettleUp";
import ExpenseForm from "@/components/ExpenseForm";
import CategorySettings from "@/components/CategorySettings";
import InvestmentDashboard from "@/components/investment/InvestmentDashboard";
import { USER_ME, USER_PARTNER } from "@/lib/config";

type Tab = "dashboard" | "add" | "investment" | "settings";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
    setTab("dashboard");
  };

  const headerBg =
    tab === "investment"
      ? "bg-gradient-to-r from-indigo-700 to-blue-600"
      : "bg-blue-600";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className={`${headerBg} text-white px-4 pt-12 pb-4 shadow-md transition-colors`}>
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold tracking-tight">
            {tab === "investment" ? "投資分析ツール" : "Couple Budget"}
          </h1>
          <p className="text-blue-100 text-xs mt-0.5">
            {tab === "investment"
              ? "AI × 過去数十年データで最適銘柄をピックアップ"
              : `${USER_ME} & ${USER_PARTNER}`}
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24 space-y-4">
        {tab === "dashboard" && (
          <>
            <BudgetTracker key={`budget-${refreshKey}`} />
            <SettleUp
              key={`settle-${refreshKey}`}
              onSettled={() => setRefreshKey((k) => k + 1)}
            />
          </>
        )}
        {tab === "add" && <ExpenseForm onSuccess={handleSuccess} />}
        {tab === "investment" && <InvestmentDashboard />}
        {tab === "settings" && <CategorySettings />}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
        <div className="max-w-lg mx-auto flex">
          <NavButton
            active={tab === "dashboard"}
            onClick={() => setTab("dashboard")}
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="ダッシュボード"
          />
          <NavButton
            active={tab === "add"}
            onClick={() => setTab("add")}
            icon={<PlusCircle className="h-5 w-5" />}
            label="支出追加"
          />
          <NavButton
            active={tab === "investment"}
            onClick={() => setTab("investment")}
            icon={<TrendingUp className="h-5 w-5" />}
            label="投資分析"
            highlight
          />
          <NavButton
            active={tab === "settings"}
            onClick={() => setTab("settings")}
            icon={<Settings className="h-5 w-5" />}
            label="設定"
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  const activeColor = highlight ? "text-indigo-600" : "text-blue-600";
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
        ${active ? activeColor : "text-gray-400 hover:text-gray-600"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
