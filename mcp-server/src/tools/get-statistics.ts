import type { SupabaseClient } from "../db/supabase.js";

export async function handleGetStatistics(supabase: SupabaseClient) {
  // Total count
  const { count: total } = await supabase
    .from("memories")
    .select("*", { count: "exact", head: true });

  // Count per type
  const types = ["image", "link", "article", "thought", "youtube", "linkedin", "instagram"];
  const typeCounts: Record<string, number> = {};
  for (const type of types) {
    const { count } = await supabase
      .from("memories")
      .select("*", { count: "exact", head: true })
      .eq("content_type", type);
    typeCounts[type] = count || 0;
  }

  // Favorites count
  const { count: favorites } = await supabase
    .from("memories")
    .select("*", { count: "exact", head: true })
    .eq("is_favorite", true);

  // This week count
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: thisWeek } = await supabase
    .from("memories")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo.toISOString());

  // Top tags
  const { data: tags } = await supabase
    .from("tags")
    .select("name, memory_tags(memory_id)")
    .order("name");

  const topTags = (tags || [])
    .map((t: any) => ({ name: t.name, count: (t.memory_tags || []).length }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);

  // Recent 5 memories
  const { data: recent } = await supabase
    .from("memories")
    .select("title, content_type, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const lines = [
    `=== Memory Bank Statistics ===`,
    `Total memories: ${total || 0}`,
    `This week: ${thisWeek || 0}`,
    `Favorites: ${favorites || 0}`,
    ``,
    `By type:`,
    ...types.map((t) => `  ${t}: ${typeCounts[t]}`),
    ``,
    `Top tags:`,
    ...(topTags.length
      ? topTags.map((t: any) => `  ${t.name} (${t.count})`)
      : ["  No tags yet"]),
    ``,
    `Recent:`,
    ...(recent || []).map(
      (m: any) => `  [${m.content_type}] ${m.title} (${m.created_at})`
    ),
  ];

  return {
    content: [{ type: "text" as const, text: lines.join("\n") }],
  };
}
