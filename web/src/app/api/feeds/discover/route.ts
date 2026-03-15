import { NextRequest, NextResponse } from "next/server";
import { discoverFeeds, resolveYouTubeFeed, parseFeed, resolveSpotifyShow } from "@/lib/feed-parser";

/**
 * POST /api/feeds/discover — Auto-discover feed URLs from a website URL
 * Returns discovered feeds with metadata for the "Add Source" form.
 */
export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL krävs" }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    const results: {
      feed_url: string;
      title: string | null;
      feed_type: string;
      site_url: string | null;
      icon_url: string | null;
    }[] = [];

    // YouTube channel
    if (parsed.hostname.includes("youtube.com") || parsed.hostname === "youtu.be") {
      const yt = await resolveYouTubeFeed(url);
      if (yt) {
        // Validate by fetching
        try {
          const feed = await parseFeed(yt.feedUrl);
          results.push({
            feed_url: yt.feedUrl,
            title: yt.channelName || feed.title,
            feed_type: "youtube",
            site_url: url,
            icon_url: "https://www.youtube.com/favicon.ico",
          });
        } catch {}
      }
    }

    // Spotify podcast/show
    else if (parsed.hostname.includes("spotify.com")) {
      const spotify = await resolveSpotifyShow(url);
      if (spotify) {
        results.push({
          feed_url: url,
          title: spotify.name,
          feed_type: "podcast",
          site_url: url,
          icon_url: spotify.image_url || "https://open.spotify.com/favicon.ico",
        });
      }
    }

    // Try RSS/Atom discovery from HTML
    else {
      const discovered = await discoverFeeds(url);
      for (const d of discovered.slice(0, 5)) {
        try {
          const feed = await parseFeed(d.url);
          results.push({
            feed_url: d.url,
            title: d.title || feed.title,
            feed_type: "rss",
            site_url: feed.site_url || url,
            icon_url: feed.icon_url,
          });
        } catch {
          // Feed URL found but not parseable — skip
        }
      }

      // If no feeds found via HTML, try the URL directly as a feed
      if (results.length === 0) {
        try {
          const feed = await parseFeed(url);
          if (feed.items.length > 0) {
            results.push({
              feed_url: url,
              title: feed.title,
              feed_type: "rss",
              site_url: feed.site_url,
              icon_url: feed.icon_url,
            });
          }
        } catch {}
      }
    }

    if (results.length === 0) {
      return NextResponse.json({ error: "Kunde inte hitta något RSS-flöde" }, { status: 404 });
    }

    return NextResponse.json({ data: results });
  } catch {
    return NextResponse.json({ error: "Ogiltig URL" }, { status: 400 });
  }
}
