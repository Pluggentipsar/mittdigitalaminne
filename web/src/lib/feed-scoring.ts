import { createServerClient } from "@/lib/supabase/server";

/**
 * Keyword-based relevance scoring.
 * Matches feed item title+summary against:
 * 1. User's top tags (weighted by usage frequency)
 * 2. Feed source categories (the user's chosen interests)
 * 3. Titles of recently saved memories (implicit interests)
 * Returns a score between 0 and 1.
 */
export async function scoreFeedItems(
  items: { id: string; title: string; summary: string | null }[]
): Promise<Map<string, number>> {
  const supabase = createServerClient();
  const scores = new Map<string, number>();

  // Fetch signals in parallel
  const [tagsRes, categoriesRes, recentRes] = await Promise.all([
    // 1. User's tags with memory counts
    supabase.from("tags").select("name, memory_tags(memory_id)"),
    // 2. Feed source categories (user's chosen interests)
    supabase.from("feed_sources").select("category").eq("is_active", true),
    // 3. Recently saved memories (implicit interests from last 30 days)
    supabase
      .from("memories")
      .select("title")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const tags = tagsRes.data || [];
  const categoryData = categoriesRes.data || [];
  const recentMemories = recentRes.data || [];

  // Build weighted keyword list from tags
  const tagWeights = tags
    .map((t: any) => ({
      name: t.name.toLowerCase(),
      keywords: t.name.toLowerCase().split(/\s+/),
      weight: (t.memory_tags || []).length,
    }))
    .filter((t) => t.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 30);

  const maxTagWeight = tagWeights.length > 0 ? tagWeights[0].weight : 1;

  // Extract category keywords (e.g., "ai, skola" → ["ai", "skola"])
  const categoryKeywords = new Set<string>();
  for (const src of categoryData) {
    if (src.category) {
      for (const cat of src.category.split(",")) {
        const trimmed = cat.trim().toLowerCase();
        if (trimmed.length >= 2) categoryKeywords.add(trimmed);
      }
    }
  }

  // Extract keywords from recent memory titles
  const recentKeywords = new Map<string, number>();
  for (const mem of recentMemories) {
    if (!mem.title) continue;
    const words = mem.title.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 4);
    for (const word of words) {
      // Skip common words
      if (STOP_WORDS.has(word)) continue;
      recentKeywords.set(word, (recentKeywords.get(word) || 0) + 1);
    }
  }
  // Keep only words that appear 2+ times (actual interests, not noise)
  const significantRecent = new Map(
    [...recentKeywords.entries()].filter(([, count]) => count >= 2)
  );

  const hasSignals = tagWeights.length > 0 || categoryKeywords.size > 0 || significantRecent.size > 0;

  if (!hasSignals) {
    for (const item of items) scores.set(item.id, 0);
    return scores;
  }

  for (const item of items) {
    const text = `${item.title} ${item.summary || ""}`.toLowerCase();
    let tagScore = 0;
    let tagMatches = 0;
    let categoryScore = 0;
    let recentScore = 0;

    // Tag matching (strongest signal)
    for (const tag of tagWeights) {
      const found = tag.keywords.some((kw: string) => kw.length >= 3 && text.includes(kw));
      if (found) {
        tagScore += tag.weight / maxTagWeight;
        tagMatches++;
      }
    }
    const normalizedTagScore = tagWeights.length > 0
      ? Math.min(1.0, (tagScore / tagWeights.length) * 3 + (tagMatches / tagWeights.length) * 0.5)
      : 0;

    // Category matching (user-chosen interests)
    for (const cat of categoryKeywords) {
      if (text.includes(cat)) {
        categoryScore += 0.3;
      }
    }
    categoryScore = Math.min(1.0, categoryScore);

    // Recent memory keyword matching (implicit interests)
    for (const [word, count] of significantRecent) {
      if (text.includes(word)) {
        recentScore += Math.min(count / 5, 0.3);
      }
    }
    recentScore = Math.min(1.0, recentScore);

    // Combined score: tags (50%), categories (30%), recent interests (20%)
    const combined = normalizedTagScore * 0.50 + categoryScore * 0.30 + recentScore * 0.20;
    scores.set(item.id, Math.round(combined * 100) / 100);
  }

  return scores;
}

/** Common Swedish/English stop words to ignore */
const STOP_WORDS = new Set([
  "alla", "andra", "bara", "blev", "blivit", "come", "dans", "dans",
  "denna", "dessa", "ditt", "efter", "eller", "från", "förr", "gång",
  "gäller", "göra", "hade", "hans", "hela", "helt", "hennes", "här",
  "inte", "just", "kunde", "kvar", "lite", "läsa", "länk", "matt",
  "mera", "mest", "mitt", "mycket", "nämn", "nere", "ning", "nnan",
  "noch", "något", "några", "också", "redan", "sedan", "sina", "sina",
  "sitt", "skall", "skog", "slut", "stan", "stor", "säga", "till",
  "tion", "tror", "tänk", "under", "utan", "vara", "vill", "väl",
  "your", "about", "also", "been", "best", "come", "could", "does",
  "each", "even", "find", "first", "from", "good", "great", "have",
  "here", "high", "http", "https", "into", "just", "know", "last",
  "like", "long", "look", "made", "make", "many", "more", "most",
  "much", "must", "need", "next", "only", "open", "over", "part",
  "same", "show", "some", "such", "take", "than", "that", "them",
  "then", "they", "this", "time", "very", "want", "well", "were",
  "what", "when", "will", "with", "work", "year",
]);
