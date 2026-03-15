import { createServerClient } from "@/lib/supabase/server";

/**
 * Simple keyword-based relevance scoring.
 * Matches feed item title+summary against user's top tags.
 * Returns a score between 0 and 1.
 */
export async function scoreFeedItems(
  items: { id: string; title: string; summary: string | null }[]
): Promise<Map<string, number>> {
  const supabase = createServerClient();
  const scores = new Map<string, number>();

  // Get user's tags with memory counts
  const { data: tags } = await supabase
    .from("tags")
    .select("name, memory_tags(memory_id)");

  if (!tags || tags.length === 0) {
    // No tags — everything scores 0
    for (const item of items) scores.set(item.id, 0);
    return scores;
  }

  // Build weighted keyword list
  const tagWeights = tags
    .map((t: any) => ({
      name: t.name.toLowerCase(),
      // Split multi-word tags into individual keywords too
      keywords: t.name.toLowerCase().split(/\s+/),
      weight: (t.memory_tags || []).length,
    }))
    .filter((t) => t.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 30); // Top 30 tags

  if (tagWeights.length === 0) {
    for (const item of items) scores.set(item.id, 0);
    return scores;
  }

  const maxWeight = tagWeights[0].weight;

  for (const item of items) {
    const text = `${item.title} ${item.summary || ""}`.toLowerCase();
    let totalScore = 0;
    let matchCount = 0;

    for (const tag of tagWeights) {
      // Check if any keyword from this tag appears in the text
      const found = tag.keywords.some((kw: string) => kw.length >= 3 && text.includes(kw));
      if (found) {
        // Weight by how frequently the tag is used
        totalScore += tag.weight / maxWeight;
        matchCount++;
      }
    }

    // Normalize: more matches = higher score, but cap at 1.0
    const score = matchCount > 0
      ? Math.min(1.0, (totalScore / tagWeights.length) * 3 + (matchCount / tagWeights.length) * 0.5)
      : 0;

    scores.set(item.id, Math.round(score * 100) / 100);
  }

  return scores;
}
