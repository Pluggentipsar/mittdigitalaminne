import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { parseFeed, resolveYouTubeFeed, discoverFeeds, youtubeVideoThumbnail, resolveSpotifyShow, isSpotifyUrl } from "@/lib/feed-parser";
import type { ParsedFeedItem } from "@/lib/feed-parser";

/**
 * GET /api/feeds — List all feed sources
 */
export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("feed_sources")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

/**
 * POST /api/feeds — Add a new feed source
 * Accepts { url: string, name?: string, feed_type?: string, color?: string, fetch_interval_minutes?: number }
 * Auto-discovers feed URL from website URLs, YouTube channels, Spotify podcasts, etc.
 */
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();
  const { url, name, feed_type, color, fetch_interval_minutes, category } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL krävs" }, { status: 400 });
  }

  let feedUrl = url.trim();
  let detectedType = feed_type || "rss";
  let detectedName = name || null;
  let siteUrl: string | null = null;
  let iconUrl: string | null = null;

  try {
    const parsed = new URL(feedUrl);

    // YouTube channel — resolve to RSS feed
    if (parsed.hostname.includes("youtube.com") || parsed.hostname === "youtu.be") {
      const yt = await resolveYouTubeFeed(feedUrl);
      if (yt) {
        siteUrl = feedUrl;
        feedUrl = yt.feedUrl;
        detectedName = detectedName || yt.channelName;
        detectedType = "youtube";
        iconUrl = "https://www.youtube.com/favicon.ico";
      } else {
        return NextResponse.json({ error: "Kunde inte hitta YouTube-kanalens RSS-flöde" }, { status: 400 });
      }
    }

    // Spotify podcast/show URLs — special handling (no RSS)
    else if (parsed.hostname.includes("spotify.com")) {
      detectedType = "podcast";
      siteUrl = feedUrl;

      const spotify = await resolveSpotifyShow(feedUrl);
      if (!spotify) {
        return NextResponse.json({ error: "Kunde inte hämta Spotify-podden. Kontrollera att URL:en pekar på en podcast/show." }, { status: 400 });
      }

      detectedName = detectedName || spotify.name;
      iconUrl = spotify.image_url || "https://open.spotify.com/favicon.ico";

      // Check for duplicates
      const { data: existing } = await supabase
        .from("feed_sources")
        .select("id")
        .eq("feed_url", feedUrl)
        .single();

      if (existing) {
        return NextResponse.json({ error: "Det här flödet finns redan" }, { status: 409 });
      }

      // Create the feed source
      const { data: source, error: insertError } = await supabase
        .from("feed_sources")
        .insert({
          name: detectedName,
          feed_url: feedUrl,
          site_url: siteUrl,
          feed_type: "podcast",
          icon_url: iconUrl,
          color: color || "#1db954",
          category: category || null,
          fetch_interval_minutes: fetch_interval_minutes || 60,
          last_fetched_at: new Date().toISOString(),
          item_count: 0,
        })
        .select("*")
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Insert episodes
      let insertedCount = 0;
      for (const ep of spotify.episodes.slice(0, 30)) {
        const { error: itemError } = await supabase
          .from("feed_items")
          .upsert(
            {
              source_id: source.id,
              guid: ep.guid,
              title: ep.title,
              summary: ep.summary,
              link_url: ep.link_url,
              image_url: ep.image_url,
              author: ep.author,
              published_at: ep.published_at,
              metadata: ep.metadata,
            },
            { onConflict: "source_id,guid" }
          );
        if (!itemError) insertedCount++;
      }

      await supabase
        .from("feed_sources")
        .update({ item_count: insertedCount })
        .eq("id", source.id);

      return NextResponse.json({
        data: { ...source, item_count: insertedCount },
      }, { status: 201 });
    }

    // Apple Podcasts
    else if (parsed.hostname.includes("podcasts.apple.com")) {
      detectedType = "podcast";
      siteUrl = feedUrl;
    }

    // If URL doesn't look like an RSS feed, try to discover it
    else if (!feedUrl.match(/\.(xml|rss|atom)($|\?)|\/feed\/?$|\/rss\/?$/i)) {
      const discovered = await discoverFeeds(feedUrl);
      if (discovered.length > 0) {
        siteUrl = feedUrl;
        feedUrl = discovered[0].url;
        detectedName = detectedName || discovered[0].title;
      }
      // If no feed found, try the URL directly — it might be a direct feed URL
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from("feed_sources")
      .select("id")
      .eq("feed_url", feedUrl)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Det här flödet finns redan" }, { status: 409 });
    }

    // Validate by trying to parse the feed
    let parsedFeed;
    try {
      parsedFeed = await parseFeed(feedUrl);
    } catch {
      return NextResponse.json({ error: "Kunde inte läsa flödet. Kontrollera URL:en." }, { status: 400 });
    }

    // Use feed metadata for defaults
    const finalName = detectedName || parsedFeed.title || new URL(feedUrl).hostname;
    siteUrl = siteUrl || parsedFeed.site_url;
    iconUrl = iconUrl || parsedFeed.icon_url;

    // Create the feed source
    const { data: source, error: insertError } = await supabase
      .from("feed_sources")
      .insert({
        name: finalName,
        feed_url: feedUrl,
        site_url: siteUrl,
        feed_type: detectedType,
        icon_url: iconUrl,
        color: color || getDefaultColor(detectedType),
        category: category || null,
        fetch_interval_minutes: fetch_interval_minutes || 60,
        last_fetched_at: new Date().toISOString(),
        item_count: 0,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Insert initial items from the feed
    let insertedCount = 0;
    for (const item of parsedFeed.items.slice(0, 50)) {
      // For YouTube feeds, generate thumbnails
      let imageUrl = item.image_url;
      if (detectedType === "youtube" && !imageUrl && item.link_url) {
        imageUrl = youtubeVideoThumbnail(item.link_url);
      }

      const { error: itemError } = await supabase
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
          { onConflict: "source_id,guid" }
        );

      if (!itemError) insertedCount++;
    }

    // Update item count
    await supabase
      .from("feed_sources")
      .update({ item_count: insertedCount })
      .eq("id", source.id);

    return NextResponse.json({
      data: { ...source, item_count: insertedCount },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Något gick fel" }, { status: 500 });
  }
}

function getDefaultColor(type: string): string {
  switch (type) {
    case "youtube": return "#ff0000";
    case "podcast": return "#1db954";
    case "newsletter": return "#6366f1";
    default: return "#b45309";
  }
}
