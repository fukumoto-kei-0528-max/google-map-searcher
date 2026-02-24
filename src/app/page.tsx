"use client";

import { useState } from "react";
import { LayoutDashboard, PlusCircle } from "lucide-react";
import BudgetTracker from "@/components/BudgetTracker";
import SettleUp from "@/components/SettleUp";
import ExpenseForm from "@/components/ExpenseForm";
import { USER_ME, USER_PARTNER } from "@/lib/config";

type Tab = "dashboard" | "add";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
    setTab("dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 pt-12 pb-4 shadow-md">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold tracking-tight">Couple Budget</h1>
          <p className="text-blue-100 text-xs mt-0.5">
            {USER_ME} &amp; {USER_PARTNER}
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24 space-y-4">
        {tab === "dashboard" ? (
          <>
            <BudgetTracker key={`budget-${refreshKey}`} />
            <SettleUp
              key={`settle-${refreshKey}`}
              onSettled={() => setRefreshKey((k) => k + 1)}
            />
          </>
        ) : (
          <ExpenseForm onSuccess={handleSuccess} />
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
        <div className="max-w-lg mx-auto flex">
          <NavButton
            active={tab === "dashboard"}
            onClick={() => setTab("dashboard")}
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
          />
          <NavButton
            active={tab === "add"}
            onClick={() => setTab("add")}
            icon={<PlusCircle className="h-5 w-5" />}
            label="Add Expense"
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
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
        ${active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
