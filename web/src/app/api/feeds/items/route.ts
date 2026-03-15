import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/feeds/items — List feed items across all sources
 * Query params: source_id, feed_type, category, unread_only, sort (newest|oldest|relevance|smart), limit, offset
 */
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);

  const source_id = searchParams.get("source_id");
  const feed_type = searchParams.get("feed_type");
  const category = searchParams.get("category");
  const unread_only = searchParams.get("unread_only") === "true";
  const sort = searchParams.get("sort") || "newest";
  const limit = parseInt(searchParams.get("limit") || "30");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("feed_items")
    .select("*, source:feed_sources(*)", { count: "exact" });

  if (source_id) {
    query = query.eq("source_id", source_id);
  }

  if (unread_only) {
    query = query.eq("is_read", false);
  }

  // Sorting
  if (sort === "oldest") {
    query = query.order("fetched_at", { ascending: true });
  } else if (sort === "relevance") {
    query = query.order("relevance_score", { ascending: false });
  } else if (sort === "smart") {
    // Smart sort: unread first, then by recency
    query = query
      .order("is_read", { ascending: true })
      .order("fetched_at", { ascending: false });
  } else {
    // newest (default)
    query = query.order("fetched_at", { ascending: false });
  }

  // Fetch extra items for client-side filtering + smart interleaving
  const needsClientFilter = !!(feed_type || category);
  const fetchLimit = needsClientFilter || sort === "smart" ? limit * 3 : limit;
  query = query.range(offset, offset + fetchLimit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let items = data || [];

  // Filter by feed_type (Supabase can't filter on joined table directly)
  if (feed_type) {
    items = items.filter((item: any) => item.source?.feed_type === feed_type);
  }

  // Filter by category (supports comma-separated multi-category on sources)
  if (category) {
    const catLower = category.toLowerCase();
    items = items.filter((item: any) => {
      const sourceCat = item.source?.category;
      if (!sourceCat) return false;
      const cats = sourceCat.split(",").map((c: string) => c.trim().toLowerCase());
      return cats.includes(catLower);
    });
  }

  // Smart sort: interleave items from different sources
  if (sort === "smart") {
    items = smartInterleave(items);
  }

  // Apply final limit
  const finalItems = items.slice(0, limit);
  const finalCount = needsClientFilter ? items.length : (count || 0);

  return NextResponse.json({ data: finalItems, count: finalCount });
}

/**
 * Smart interleave: distributes items from different sources evenly
 * so the feed feels diverse. Unread items are prioritized.
 */
function smartInterleave(items: any[]): any[] {
  if (items.length <= 1) return items;

  const unread = items.filter((i) => !i.is_read);
  const read = items.filter((i) => i.is_read);

  return [...interleaveBySource(unread), ...interleaveBySource(read)];
}

function interleaveBySource(items: any[]): any[] {
  if (items.length <= 1) return items;

  // Group by source_id
  const groups = new Map<string, any[]>();
  for (const item of items) {
    const key = item.source_id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  // Round-robin pick from each source
  const result: any[] = [];
  const queues = Array.from(groups.values());

  // Sort queues: higher relevance sources first
  queues.sort((a, b) => {
    const scoreA = a[0]?.relevance_score || 0;
    const scoreB = b[0]?.relevance_score || 0;
    return scoreB - scoreA;
  });

  const maxLen = Math.max(...queues.map((q) => q.length));
  for (let i = 0; i < maxLen; i++) {
    for (const queue of queues) {
      if (i < queue.length) {
        result.push(queue[i]);
      }
    }
  }

  return result;
}
