import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  // Total count
  const { count: total } = await supabase
    .from("memories")
    .select("*", { count: "exact", head: true });

  // Count per type
  const types = ["image", "link", "article", "thought", "youtube", "linkedin", "instagram"] as const;
  const by_type: Record<string, number> = {};
  for (const type of types) {
    const { count } = await supabase
      .from("memories")
      .select("*", { count: "exact", head: true })
      .eq("content_type", type);
    by_type[type] = count || 0;
  }

  // Favorites
  const { count: favorites } = await supabase
    .from("memories")
    .select("*", { count: "exact", head: true })
    .eq("is_favorite", true);

  // This week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: this_week } = await supabase
    .from("memories")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo.toISOString());

  // Top tags
  const { data: tags } = await supabase
    .from("tags")
    .select("name, memory_tags(memory_id)")
    .order("name");

  const top_tags = (tags || [])
    .map((t: any) => ({ name: t.name, count: (t.memory_tags || []).length }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);

  // Recent
  const { data: recent } = await supabase
    .from("memories")
    .select("id, title, content_type, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    data: {
      total: total || 0,
      this_week: this_week || 0,
      favorites: favorites || 0,
      by_type,
      top_tags,
      recent: recent || [],
    },
  });
}
