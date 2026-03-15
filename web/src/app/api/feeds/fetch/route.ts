import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { parseFeed, youtubeVideoThumbnail, resolveSpotifyShow, isSpotifyUrl } from "@/lib/feed-parser";
import { scoreFeedItems } from "@/lib/feed-scoring";
import { autoTagItems } from "@/lib/feed-auto-tagger";

/**
 * GET /api/feeds/fetch — Cron endpoint to fetch new feed items
 * Called by Vercel Cron every hour.
 * Can also be called manually.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret if in production
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow manual calls without secret in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServerClient();
  const now = new Date();
  const results: { source: string; items_added: number; error?: string }[] = [];

  // Get all active sources that are due for fetching
  const { data: sources } = await supabase
    .from("feed_sources")
    .select("*")
    .eq("is_active", true);

  if (!sources || sources.length === 0) {
    return NextResponse.json({ data: { message: "Inga aktiva källor", results: [] } });
  }

  for (const source of sources) {
    // Check if enough time has passed since last fetch
    if (source.last_fetched_at) {
      const lastFetch = new Date(source.last_fetched_at);
      const minutesSince = (now.getTime() - lastFetch.getTime()) / 60000;
      if (minutesSince < source.fetch_interval_minutes) {
        continue; // Skip — not due yet
      }
    }

    try {
      let feedItems: { guid: string; title: string; summary: string | null; content_html: string | null; link_url: string | null; image_url: string | null; author: string | null; published_at: string | null; metadata: Record<string, unknown> | null }[] = [];

      // Spotify sources — use special scraping
      if (isSpotifyUrl(source.feed_url)) {
        const spotify = await resolveSpotifyShow(source.feed_url);
        if (spotify) {
          feedItems = spotify.episodes;
        }
      } else {
        // Standard RSS/Atom feed
        const feed = await parseFeed(source.feed_url);
        feedItems = feed.items;
      }

      let addedCount = 0;

      for (const item of feedItems.slice(0, 50)) {
        // For YouTube feeds, generate thumbnails
        let imageUrl = item.image_url;
        if (source.feed_type === "youtube" && !imageUrl && item.link_url) {
          imageUrl = youtubeVideoThumbnail(item.link_url);
        }

        const { error: upsertError } = await supabase
          .from("feed_items")
          .upsert(
            {
              source_id: source.id,
              guid: item.guid,
              title: item.title,
              summary: item.summary,
              content_html: item.content_html?.slice(0, 50000) || null,
              link_url: item.link_url,
              image_url: imageUrl,
              author: item.author,
              published_at: item.published_at,
              metadata: item.metadata,
            },
            { onConflict: "source_id,guid", ignoreDuplicates: true }
          );

        if (!upsertError) addedCount++;
      }

      // Update source metadata
      const { count: totalItems } = await supabase
        .from("feed_items")
        .select("*", { count: "exact", head: true })
        .eq("source_id", source.id);

      await supabase
        .from("feed_sources")
        .update({
          last_fetched_at: now.toISOString(),
          last_error: null,
          item_count: totalItems || 0,
        })
        .eq("id", source.id);

      results.push({ source: source.name, items_added: addedCount });
    } catch (err: any) {
      // Record error on the source
      await supabase
        .from("feed_sources")
        .update({
          last_fetched_at: now.toISOString(),
          last_error: err.message || "Unknown error",
        })
        .eq("id", source.id);

      results.push({ source: source.name, items_added: 0, error: err.message });
    }
  }

  // Score new unscored items
  try {
    const { data: unscoredItems } = await supabase
      .from("feed_items")
      .select("id, title, summary")
      .eq("relevance_score", 0)
      .limit(200);

    if (unscoredItems && unscoredItems.length > 0) {
      const scores = await scoreFeedItems(unscoredItems);
      for (const [itemId, score] of scores) {
        if (score > 0) {
          await supabase
            .from("feed_items")
            .update({ relevance_score: score })
            .eq("id", itemId);
        }
      }
    }
  } catch {
    // Scoring failure is non-critical
  }

  // Auto-tag items that don't have tags yet
  try {
    const { data: allTags } = await supabase
      .from("tags")
      .select("name");

    const tagNames = (allTags || []).map((t: any) => t.name);

    if (tagNames.length > 0) {
      const { data: untaggedItems } = await supabase
        .from("feed_items")
        .select("id, title, summary")
        .or("tags.is.null,tags.eq.{}")
        .limit(200);

      if (untaggedItems && untaggedItems.length > 0) {
        const tagMap = autoTagItems(untaggedItems, tagNames);
        for (const [itemId, tags] of tagMap) {
          if (tags.length > 0) {
            await supabase
              .from("feed_items")
              .update({ tags })
              .eq("id", itemId);
          }
        }
      }
    }
  } catch {
    // Tagging failure is non-critical
  }

  // Cleanup: delete old unsaved items (>30 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  await supabase
    .from("feed_items")
    .delete()
    .eq("is_saved", false)
    .lt("fetched_at", cutoff.toISOString());

  return NextResponse.json({ data: { results } });
}
