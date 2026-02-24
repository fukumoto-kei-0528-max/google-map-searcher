"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, Check, X, Plus, Trash2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Category, CategoryType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditState {
  id: string;
  name: string;
  weekly_budget_aud: string;
}

interface NewRow {
  type: CategoryType;
  name: string;
  weekly_budget_aud: string;
}

const emptyNew = (type: CategoryType): NewRow => ({
  type,
  name: "",
  weekly_budget_aud: "",
});

export default function CategorySettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [adding, setAdding] = useState<NewRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("type")
      .order("name");
    setCategories((data as Category[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Save edit ── */
  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const supabase = createClient();
    const budget = editing.weekly_budget_aud === ""
      ? null
      : parseFloat(editing.weekly_budget_aud);

    await supabase
      .from("categories")
      .update({ name: editing.name.trim(), weekly_budget_aud: budget })
      .eq("id", editing.id);

    setEditing(null);
    setSaving(false);
    load();
  };

  /* ── Add new category ── */
  const saveNew = async () => {
    if (!adding || !adding.name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const budget = adding.weekly_budget_aud === ""
      ? null
      : parseFloat(adding.weekly_budget_aud);

    await supabase.from("categories").insert({
      name: adding.name.trim(),
      type: adding.type,
      weekly_budget_aud: budget,
    });

    setAdding(null);
    setSaving(false);
    load();
  };

  /* ── Delete ── */
  const deleteCategory = async (id: string) => {
    if (!confirm("このカテゴリを削除しますか？\n（過去の支出データは残ります）")) return;
    setDeleting(id);
    const supabase = createClient();
    await supabase.from("categories").delete().eq("id", id);
    setDeleting(null);
    load();
  };

  const shared = categories.filter((c) => c.type === "shared");
  const personal = categories.filter((c) => c.type === "personal");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">カテゴリ・予算の設定</CardTitle>
            <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">読み込み中…</div>
          ) : (
            <>
              <Section
                title="共有カテゴリ"
                type="shared"
                items={shared}
                editing={editing}
                setEditing={setEditing}
                saving={saving}
                saveEdit={saveEdit}
                deleting={deleting}
                deleteCategory={deleteCategory}
                adding={adding}
                setAdding={setAdding}
                saveNew={saveNew}
              />
              <Section
                title="個人カテゴリ"
                type="personal"
                items={personal}
                editing={editing}
                setEditing={setEditing}
                saving={saving}
                saveEdit={saveEdit}
                deleting={deleting}
                deleteCategory={deleteCategory}
                adding={adding}
                setAdding={setAdding}
                saveNew={saveNew}
              />
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-center text-gray-400 pb-2">
        予算を空欄にすると「未設定」になります
      </p>
    </div>
  );
}

/* ────────────────────────────── Section ────────────────────────────── */

function Section({
  title, type, items,
  editing, setEditing, saving, saveEdit,
  deleting, deleteCategory,
  adding, setAdding, saveNew,
}: {
  title: string;
  type: CategoryType;
  items: Category[];
  editing: EditState | null;
  setEditing: (e: EditState | null) => void;
  saving: boolean;
  saveEdit: () => void;
  deleting: string | null;
  deleteCategory: (id: string) => void;
  adding: NewRow | null;
  setAdding: (n: NewRow | null) => void;
  saveNew: () => void;
}) {
  const isAddingThis = adding?.type === type;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </p>

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
        {items.map((cat) =>
          editing?.id === cat.id ? (
            /* ── Editing row ── */
            <div key={cat.id} className="flex items-center gap-2 p-3 bg-blue-50">
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="カテゴリ名"
                className="flex-1 h-8 text-sm"
                autoFocus
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">A$</span>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={editing.weekly_budget_aud}
                  onChange={(e) => setEditing({ ...editing, weekly_budget_aud: e.target.value })}
                  placeholder="予算"
                  className="w-24 h-8 text-sm"
                />
              </div>
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={saveEdit} disabled={saving}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            /* ── Normal row ── */
            <div key={cat.id} className="flex items-center gap-2 px-3 py-3 bg-white">
              <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
              <span className="text-sm font-mono text-gray-500">
                {cat.weekly_budget_aud != null
                  ? `A$${Number(cat.weekly_budget_aud).toFixed(0)}/週`
                  : <span className="text-gray-300">未設定</span>}
              </span>
              <button
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                onClick={() =>
                  setEditing({
                    id: cat.id,
                    name: cat.name,
                    weekly_budget_aud: cat.weekly_budget_aud?.toString() ?? "",
                  })
                }
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                onClick={() => deleteCategory(cat.id)}
                disabled={deleting === cat.id}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        )}

        {/* ── Add new row ── */}
        {isAddingThis ? (
          <div className="flex items-center gap-2 p-3 bg-green-50">
            <Input
              value={adding!.name}
              onChange={(e) => setAdding({ ...adding!, name: e.target.value })}
              placeholder="カテゴリ名"
              className="flex-1 h-8 text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && saveNew()}
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">A$</span>
              <Input
                type="number"
                min="0"
                step="any"
                value={adding!.weekly_budget_aud}
                onChange={(e) => setAdding({ ...adding!, weekly_budget_aud: e.target.value })}
                placeholder="予算"
                className="w-24 h-8 text-sm"
              />
            </div>
            <Button size="icon" variant="success" className="h-8 w-8 shrink-0" onClick={saveNew} disabled={saving}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setAdding(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => {
              setEditing(null);
              setAdding(emptyNew(type));
            }}
          >
            <Plus className="h-4 w-4" />
            カテゴリを追加
          </button>
        )}
      </div>
    </div>
  );
}
