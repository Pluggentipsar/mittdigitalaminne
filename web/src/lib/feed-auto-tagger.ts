import { STOPWORDS } from "@/lib/stopwords";

/**
 * Auto-tag a feed item by matching its title + summary against
 * the user's existing tag vocabulary.
 *
 * Returns an array of matched tag names (lowercase), max 5.
 */
export function autoTagItem(
  title: string,
  summary: string | null,
  existingTags: string[]
): string[] {
  if (existingTags.length === 0) return [];

  const text = `${title} ${summary || ""}`.toLowerCase();
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);

  const matched: { tag: string; score: number }[] = [];

  for (const tagName of existingTags) {
    const tagLower = tagName.toLowerCase();
    const tagWords = tagLower.split(/\s+/).filter((w) => w.length >= 2);

    let score = 0;

    // Exact tag name found in text (strongest signal)
    if (text.includes(tagLower)) {
      score += 3;
    }

    // Individual tag words found in tokens
    for (const word of tagWords) {
      if (word.length >= 3 && tokenSet.has(word)) {
        score += 1;
      }
    }

    if (score > 0) {
      matched.push({ tag: tagName, score });
    }
  }

  // Sort by score and return top 5
  return matched
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((m) => m.tag);
}

/**
 * Batch auto-tag multiple feed items.
 */
export function autoTagItems(
  items: { id: string; title: string; summary: string | null }[],
  existingTags: string[]
): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const item of items) {
    const tags = autoTagItem(item.title, item.summary, existingTags);
    result.set(item.id, tags);
  }
  return result;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}
