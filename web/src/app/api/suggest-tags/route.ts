import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { STOPWORDS } from "@/lib/stopwords";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // keep letters + numbers
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

export async function POST(req: NextRequest) {
  try {
    const { title, summary, content } = await req.json();
    const supabase = createServerClient();

    // Fetch all existing tags
    const { data: tags } = await supabase
      .from("tags")
      .select("name")
      .order("name");

    const existingTagNames = (tags || []).map((t) => t.name);

    // Build corpus and tokenize
    const corpus = [title, summary, content].filter(Boolean).join(" ");
    if (!corpus.trim()) {
      return NextResponse.json({ data: { existing: [], suggested: [] } });
    }

    const tokens = tokenize(corpus);

    // Count frequencies
    const freq = new Map<string, number>();
    for (const token of tokens) {
      freq.set(token, (freq.get(token) || 0) + 1);
    }

    const corpusLower = corpus.toLowerCase();

    // Match against existing tags
    const existingMatches = existingTagNames.filter((tagName) => {
      // Tag appears in corpus as word or substring
      if (corpusLower.includes(tagName)) return true;
      // Or a corpus word contains the tag
      for (const token of freq.keys()) {
        if (token.includes(tagName) || tagName.includes(token)) return true;
      }
      return false;
    });

    // Sort existing matches by relevance (frequency in corpus)
    existingMatches.sort((a, b) => {
      const aFreq = freq.get(a) || 0;
      const bFreq = freq.get(b) || 0;
      return bFreq - aFreq;
    });

    // Get top keywords not already matching an existing tag
    const existingSet = new Set(existingMatches);
    const suggested = Array.from(freq.entries())
      .filter(([word]) => !existingSet.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);

    return NextResponse.json({
      data: {
        existing: existingMatches.slice(0, 10),
        suggested: suggested.slice(0, 6),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to suggest tags" },
      { status: 500 }
    );
  }
}
