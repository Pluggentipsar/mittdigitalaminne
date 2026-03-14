import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const windows = [
    { label: "1 månad sedan", monthsBack: 1, range: 3 },
    { label: "3 månader sedan", monthsBack: 3, range: 3 },
    { label: "6 månader sedan", monthsBack: 6, range: 5 },
    { label: "1 år sedan", monthsBack: 12, range: 5 },
  ];

  const results: { label: string; memories: any[] }[] = [];

  for (const w of windows) {
    const now = new Date();
    const target = new Date(now);
    if (w.monthsBack === 12) {
      target.setFullYear(target.getFullYear() - 1);
    } else {
      target.setMonth(target.getMonth() - w.monthsBack);
    }

    const from = new Date(target);
    from.setDate(from.getDate() - w.range);
    const to = new Date(target);
    to.setDate(to.getDate() + w.range);

    const { data: memories } = await supabase
      .from("memories")
      .select(
        "id, content_type, title, summary, link_url, link_metadata, created_at"
      )
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .eq("is_inbox", false)
      .order("created_at", { ascending: false })
      .limit(3);

    if (memories && memories.length > 0) {
      results.push({ label: w.label, memories });
    }
  }

  return NextResponse.json({ data: results });
}
