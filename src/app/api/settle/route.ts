import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** PATCH /api/settle — mark all given expense IDs as settled */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { ids }: { ids: string[] } = await req.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("expenses")
    .update({ is_settled: true })
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settled: ids.length });
}
