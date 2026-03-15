import Parser from "rss-parser";

export interface ParsedFeedItem {
  guid: string;
  title: string;
  summary: string | null;
  content_html: string | null;
  link_url: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ParsedFeed {
  title: string | null;
  description: string | null;
  site_url: string | null;
  icon_url: string | null;
  items: ParsedFeedItem[];
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "MittMinne/1.0 (RSS Reader)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure", { keepArray: false }],
    ],
  },
});

/**
 * Parse an RSS/Atom feed URL and return normalized items.
 */
export async function parseFeed(feedUrl: string): Promise<ParsedFeed> {
  const feed = await parser.parseURL(feedUrl);

  const items: ParsedFeedItem[] = (feed.items || []).map((item: any) => {
    // Build a stable GUID
    const guid = item.guid || item.id || item.link || `${item.title}-${item.pubDate}`;

    // Extract image from various sources
    const image_url =
      extractImageFromContent(item.content || item["content:encoded"]) ||
      item.mediaThumbnail?.["$"]?.url ||
      item.mediaContent?.["$"]?.url ||
      (item.enclosure?.url && isImageUrl(item.enclosure.url) ? item.enclosure.url : null) ||
      null;

    // Extract summary (prefer contentSnippet, then description)
    const summary = item.contentSnippet || item.summary || item.description || null;
    const cleanSummary = summary ? stripHtml(summary).slice(0, 500) : null;

    // Published date
    const published_at = item.pubDate || item.isoDate || null;

    // Extra metadata (podcast duration, enclosure, etc.)
    const metadata: Record<string, unknown> = {};
    if (item.enclosure) {
      metadata.enclosure_url = item.enclosure.url;
      metadata.enclosure_type = item.enclosure.type;
      metadata.enclosure_length = item.enclosure.length;
    }
    if (item.itunes) {
      metadata.duration = item.itunes.duration;
      metadata.episode = item.itunes.episode;
      metadata.season = item.itunes.season;
    }

    return {
      guid,
      title: item.title || "Utan titel",
      summary: cleanSummary,
      content_html: item["content:encoded"] || item.content || null,
      link_url: item.link || null,
      image_url: typeof image_url === "string" ? image_url : null,
      author: item.creator || item.author || item["dc:creator"] || null,
      published_at,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    };
  });

  return {
    title: feed.title || null,
    description: feed.description || null,
    site_url: feed.link || null,
    icon_url: feed.image?.url || null,
    items,
  };
}

/**
 * Convert a YouTube channel URL to its RSS feed URL.
 * Supports: /channel/ID, /@username, /c/name, video URLs
 */
export async function resolveYouTubeFeed(url: string): Promise<{ feedUrl: string; channelName: string | null } | null> {
  const parsed = new URL(url);

  // Direct channel ID in URL
  const channelMatch = parsed.pathname.match(/\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelMatch) {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`;
    // Validate the feed works
    const name = await validateYouTubeFeed(feedUrl);
    if (name !== false) {
      return { feedUrl, channelName: name };
    }
  }

  // Any YouTube page — fetch HTML and extract channel ID from multiple sources
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const html = await res.text();

    // Try multiple patterns to find channel ID
    const channelId = extractChannelIdFromHtml(html);

    if (channelId) {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      // Extract channel name from page
      const channelName =
        extractMetaContent(html, "og:title") ||
        extractMetaContent(html, "title") ||
        null;

      // Validate the feed actually works
      const validName = await validateYouTubeFeed(feedUrl);
      if (validName !== false) {
        return { feedUrl, channelName: validName || channelName };
      }
    }

    // Fallback: look for RSS link in HTML head
    const rssMatch = html.match(/<link[^>]*type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/i);
    if (rssMatch) {
      const feedUrl = new URL(rssMatch[1], url).href;
      const name = await validateYouTubeFeed(feedUrl);
      if (name !== false) {
        return { feedUrl, channelName: name };
      }
    }

    // Fallback: look for canonical channel URL in the page, then construct feed
    const canonicalMatch = html.match(/\/channel\/([a-zA-Z0-9_-]{20,})/);
    if (canonicalMatch) {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${canonicalMatch[1]}`;
      const name = await validateYouTubeFeed(feedUrl);
      if (name !== false) {
        return { feedUrl, channelName: name };
      }
    }
  } catch {}

  return null;
}

/**
 * Extract channel ID from YouTube page HTML using multiple strategies.
 */
function extractChannelIdFromHtml(html: string): string | null {
  // Pattern 1: JSON data — "channelId":"UCxxxxx"
  const jsonMatch = html.match(/"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]+)"/);
  if (jsonMatch) return jsonMatch[1];

  // Pattern 2: meta tag — <meta itemprop="channelId" content="UCxxxxx">
  const metaMatch = html.match(/<meta[^>]*itemprop=["']channelId["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*itemprop=["']channelId["']/i);
  if (metaMatch) return metaMatch[1];

  // Pattern 3: browse_id in JSON — "browseId":"UCxxxxx"
  const browseMatch = html.match(/"browseId"\s*:\s*"(UC[a-zA-Z0-9_-]+)"/);
  if (browseMatch) return browseMatch[1];

  // Pattern 4: externalId — "externalId":"UCxxxxx"
  const extMatch = html.match(/"externalId"\s*:\s*"(UC[a-zA-Z0-9_-]+)"/);
  if (extMatch) return extMatch[1];

  // Pattern 5: RSS link tag — channel_id=UCxxxxx
  const rssMatch = html.match(/channel_id=(UC[a-zA-Z0-9_-]+)/);
  if (rssMatch) return rssMatch[1];

  // Pattern 6: /channel/UCxxxxx anywhere in the page
  const channelUrlMatch = html.match(/\/channel\/(UC[a-zA-Z0-9_-]{20,})/);
  if (channelUrlMatch) return channelUrlMatch[1];

  return null;
}

/**
 * Extract meta content from HTML
 */
function extractMetaContent(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name|itemprop)=["'](?:og:)?${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["'](?:og:)?${property}["']`,
    "i"
  );
  const match = html.match(regex);
  return match ? (match[1] || match[2] || null) : null;
}

/**
 * Validate a YouTube RSS feed URL by trying to parse it.
 * Returns the channel name if valid, false if invalid.
 */
async function validateYouTubeFeed(feedUrl: string): Promise<string | null | false> {
  try {
    const feed = await parser.parseURL(feedUrl);
    if (feed.items && feed.items.length > 0) {
      return feed.title || null;
    }
    // Feed exists but is empty — still valid
    return feed.title || null;
  } catch {
    return false;
  }
}

/**
 * Auto-discover RSS/Atom feed URLs from a website's HTML.
 */
export async function discoverFeeds(url: string): Promise<{ url: string; title: string | null }[]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MittMinneBot/1.0)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    const html = await res.text();
    const feeds: { url: string; title: string | null }[] = [];

    // Find <link> tags with RSS/Atom types
    const linkRegex = /<link[^>]*type=["'](application\/rss\+xml|application\/atom\+xml)["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const tag = match[0];
      const hrefMatch = tag.match(/href=["']([^"']+)["']/);
      const titleMatch = tag.match(/title=["']([^"']+)["']/);
      if (hrefMatch) {
        const feedUrl = new URL(hrefMatch[1], url).href;
        feeds.push({ url: feedUrl, title: titleMatch?.[1] || null });
      }
    }

    return feeds;
  } catch {
    return [];
  }
}

/**
 * Resolve a Spotify show/podcast URL to metadata and episodes.
 * Strategy:
 * 1. oEmbed for show metadata (name, thumbnail)
 * 2. Fetch the HTML page and extract episode IDs from embedded data + HTML
 * 3. Enrich each episode via individual oEmbed calls
 * 4. If HTML scraping fails, create a single entry for the show itself
 */
export async function resolveSpotifyShow(url: string): Promise<{
  name: string;
  description: string | null;
  image_url: string | null;
  episodes: ParsedFeedItem[];
} | null> {
  const parsed = new URL(url);

  // Extract show or episode ID
  const showMatch = parsed.pathname.match(/\/show\/([a-zA-Z0-9]+)/);
  const episodeMatch = parsed.pathname.match(/\/episode\/([a-zA-Z0-9]+)/);

  // Get metadata via oEmbed
  let showName = "Spotify Podcast";
  let description: string | null = null;
  let image_url: string | null = null;

  try {
    const oembedRes = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
    );
    if (oembedRes.ok) {
      const oembed: any = await oembedRes.json();
      showName = oembed.title || showName;
      image_url = oembed.thumbnail_url || null;
      description = oembed.description || null;
    }
  } catch {}

  const episodes: ParsedFeedItem[] = [];

  // Try to extract episode IDs from the Spotify page
  const episodeIds = new Set<string>();

  try {
    const targetUrl = showMatch
      ? `https://open.spotify.com/show/${showMatch[1]}`
      : url;

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    const html = await res.text();

    // Extract show name from page meta if oEmbed didn't work well
    if (showName === "Spotify Podcast") {
      const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) showName = titleMatch[1].replace(/ \| Spotify$/, "").replace(/ - Spotify$/, "");
    }
    if (!image_url) {
      const imgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      if (imgMatch) image_url = imgMatch[1];
    }
    if (!description) {
      const descMatch = html.match(/<meta[^>]*(?:property=["']og:description["']|name=["']description["'])[^>]*content=["']([^"']+)["']/i);
      if (descMatch) description = descMatch[1];
    }

    // Strategy 1: Look for episode IDs in embedded JSON (Spotify includes data in script tags)
    // Pattern: "episode" objects with IDs in the page's JSON data
    const jsonEpRegex = /"id"\s*:\s*"([a-zA-Z0-9]{22})"[^}]*"type"\s*:\s*"episode"/g;
    let jm;
    while ((jm = jsonEpRegex.exec(html)) !== null) {
      episodeIds.add(jm[1]);
    }

    // Strategy 2: Reverse pattern
    const jsonEpRegex2 = /"type"\s*:\s*"episode"[^}]*"id"\s*:\s*"([a-zA-Z0-9]{22})"/g;
    while ((jm = jsonEpRegex2.exec(html)) !== null) {
      episodeIds.add(jm[1]);
    }

    // Strategy 3: URI pattern — spotify:episode:XXXXX
    const uriRegex = /spotify:episode:([a-zA-Z0-9]{22})/g;
    while ((jm = uriRegex.exec(html)) !== null) {
      episodeIds.add(jm[1]);
    }

    // Strategy 4: URL pattern — /episode/XXXXX in any context
    const urlEpRegex = /\/episode\/([a-zA-Z0-9]{22})/g;
    while ((jm = urlEpRegex.exec(html)) !== null) {
      episodeIds.add(jm[1]);
    }
  } catch {}

  // Enrich episode IDs via oEmbed (max 20 to avoid rate limits)
  const idsToFetch = Array.from(episodeIds).slice(0, 20);

  for (const epId of idsToFetch) {
    const epUrl = `https://open.spotify.com/episode/${epId}`;
    let title = `Episode ${epId.slice(0, 6)}`;
    let epImage = image_url;

    try {
      const epOembed = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(epUrl)}`
      );
      if (epOembed.ok) {
        const data: any = await epOembed.json();
        title = data.title || title;
        if (data.thumbnail_url) epImage = data.thumbnail_url;
      }
    } catch {}

    episodes.push({
      guid: `spotify:episode:${epId}`,
      title,
      summary: null,
      content_html: null,
      link_url: epUrl,
      image_url: epImage,
      author: showName,
      published_at: null,
      metadata: { spotify_episode_id: epId },
    });
  }

  // Fallback: if we couldn't extract any episodes, create one entry for the show itself
  // so the source at least appears with something
  if (episodes.length === 0) {
    const showUrl = showMatch
      ? `https://open.spotify.com/show/${showMatch[1]}`
      : url;

    episodes.push({
      guid: `spotify:show:${showMatch?.[1] || episodeMatch?.[1] || "unknown"}`,
      title: showName,
      summary: description,
      content_html: null,
      link_url: showUrl,
      image_url: image_url,
      author: showName,
      published_at: null,
      metadata: { spotify_show: true },
    });
  }

  return {
    name: showName,
    description,
    image_url,
    episodes,
  };
}

/**
 * Check if a URL is a Spotify podcast/show URL.
 */
export function isSpotifyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("spotify.com");
  } catch {
    return false;
  }
}

// -- Helpers --

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImageFromContent(html: string | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]*src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url);
}

/**
 * Generate a YouTube thumbnail URL from a video URL.
 */
export function youtubeVideoThumbnail(videoUrl: string): string | null {
  try {
    const parsed = new URL(videoUrl);
    let videoId: string | null = null;
    if (parsed.hostname.includes("youtube.com")) {
      videoId = parsed.searchParams.get("v");
    } else if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1).split("/")[0];
    }
    // Also handle feed links like /watch?v=ID
    if (!videoId) {
      const match = videoUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      videoId = match ? match[1] : null;
    }
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  } catch {}
  return null;
}
