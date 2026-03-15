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
    // Smart sort: fetch broadly, then score client-side
    query = query.order("fetched_at", { ascending: false });
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

  // Smart sort: compute source save rates, then interleave
  if (sort === "smart") {
    const saveRates = await getSourceSaveRates(supabase);
    items = smartInterleave(items, saveRates);
  }

  // Apply final limit
  const finalItems = items.slice(0, limit);
  const finalCount = needsClientFilter ? items.length : (count || 0);

  return NextResponse.json({ data: finalItems, count: finalCount });
}

/**
 * Calculate save rate per source: saved_count / total_count.
 * Sources where the user saves more get a higher boost.
 * Returns a map of source_id → save rate (0–1).
 */
async function getSourceSaveRates(supabase: any): Promise<Map<string, number>> {
  const rates = new Map<string, number>();

  const { data } = await supabase
    .from("feed_items")
    .select("source_id, is_saved");

  if (!data || data.length === 0) return rates;

  // Aggregate per source
  const stats = new Map<string, { total: number; saved: number }>();
  for (const item of data) {
    const s = stats.get(item.source_id) || { total: 0, saved: 0 };
    s.total++;
    if (item.is_saved) s.saved++;
    stats.set(item.source_id, s);
  }

  for (const [sourceId, { total, saved }] of stats) {
    // Require at least 3 items to avoid noisy rates
    if (total >= 3) {
      rates.set(sourceId, saved / total);
    }
  }

  return rates;
}

/**
 * Calculate a recency score (0–1) with exponential decay.
 * today = 1.0, 1 day = ~0.85, 3 days = ~0.6, 1 week = ~0.35, 2 weeks = ~0.12
 */
function recencyScore(dateStr: string | null): number {
  if (!dateStr) return 0.1;
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const ageHours = Math.max(0, ageMs / 3600000);
  // Half-life of ~48 hours
  return Math.exp(-0.015 * ageHours);
}

/**
 * Smart sort: ranks items by a combined score of relevance, recency,
 * unread status, and source engagement, then interleaves for diversity.
 *
 * Score = relevance * 0.30 + recency * 0.35 + unread * 0.20 + sourceEngagement * 0.15
 */
function smartInterleave(items: any[], saveRates: Map<string, number>): any[] {
  if (items.length <= 1) return items;

  // Score each item
  const scored = items.map((item) => {
    const relevance = item.relevance_score || 0;
    const recency = recencyScore(item.published_at || item.fetched_at);
    const unreadBonus = item.is_read ? 0 : 1;
    const sourceEngagement = saveRates.get(item.source_id) || 0;

    const score =
      relevance * 0.30 +
      recency * 0.35 +
      unreadBonus * 0.20 +
      sourceEngagement * 0.15;

    return { item, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Greedy pick with diversity: penalize picking from same source as recent picks
  const result: any[] = [];
  const remaining = new Set(scored.map((_, i) => i));
  const recentSources: string[] = []; // track last N sources picked

  while (remaining.size > 0) {
    let bestIdx = -1;
    let bestAdjusted = -Infinity;

    for (const idx of remaining) {
      const { item, score } = scored[idx];
      let adjusted = score;

      // Penalize if this source appeared recently in picks
      const sourceId = item.source_id;
      const lastPos = recentSources.lastIndexOf(sourceId);
      if (lastPos !== -1) {
        const distance = recentSources.length - lastPos;
        // Stronger penalty the more recent the same source appeared
        adjusted -= 0.3 / distance;
      }

      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIdx = idx;
      }
    }

    if (bestIdx === -1) break;

    const picked = scored[bestIdx];
    result.push(picked.item);
    remaining.delete(bestIdx);

    recentSources.push(picked.item.source_id);
    // Only track last 4 picks for diversity window
    if (recentSources.length > 4) recentSources.shift();
  }

  return result;
}
