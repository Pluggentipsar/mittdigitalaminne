import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  // Total count
  const { count: total } = await supabase
    .from("memories")
    .select("*", { count: "exact", head: true });

  // Count per type
  const types = ["image", "link", "article", "thought", "youtube", "linkedin", "instagram", "twitter", "audio"] as const;
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

  // Inbox count
  const { count: inbox_count } = await supabase
    .from("memories")
    .select("*", { count: "exact", head: true })
    .eq("is_inbox", true);

  // Recent
  const { data: recent } = await supabase
    .from("memories")
    .select("id, title, content_type, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Reminders due (remind_at <= now)
  const now = new Date().toISOString();
  const { data: remindersData, count: reminders_due } = await supabase
    .from("memories")
    .select("id, title, content_type, remind_at", { count: "exact" })
    .not("remind_at", "is", null)
    .lte("remind_at", now)
    .order("remind_at", { ascending: true })
    .limit(10);

  // Activity calendar (last 120 days — count memories per day)
  const activityStart = new Date();
  activityStart.setDate(activityStart.getDate() - 120);
  const { data: activityData } = await supabase
    .from("memories")
    .select("created_at")
    .gte("created_at", activityStart.toISOString())
    .order("created_at", { ascending: true });

  // Group by date
  const activityMap: Record<string, number> = {};
  (activityData || []).forEach((m: any) => {
    const date = m.created_at.slice(0, 10); // YYYY-MM-DD
    activityMap[date] = (activityMap[date] || 0) + 1;
  });
  const activity = Object.entries(activityMap).map(([date, count]) => ({ date, count }));

  // Unread feed items count
  let unread_feed_count = 0;
  try {
    const { count: feedCount } = await supabase
      .from("feed_items")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);
    unread_feed_count = feedCount || 0;
  } catch {
    // feed_items table might not exist yet
  }

  return NextResponse.json({
    data: {
      total: total || 0,
      this_week: this_week || 0,
      favorites: favorites || 0,
      inbox_count: inbox_count || 0,
      reminders_due: reminders_due || 0,
      unread_feed_count,
      by_type,
      top_tags,
      recent: recent || [],
      reminders: remindersData || [],
      activity,
    },
  });
}
