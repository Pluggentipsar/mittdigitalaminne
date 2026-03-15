import { NextRequest, NextResponse } from "next/server";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";

interface UnfurlResult {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  domain: string;
  content_type_hint: "youtube" | "linkedin" | "instagram" | "twitter" | "audio" | null;
  video_id?: string;
  channel_name?: string;
  article_text?: string;
  snapshot_html?: string;
  author?: string;
  word_count?: number;
  read_time_minutes?: number;
  spotify_uri?: string;
  podcast_name?: string;
  episode_name?: string;
}

// HTML → Markdown converter
const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

// Remove image tags (we don't want images inline in article text)
turndown.addRule("removeImages", {
  filter: "img",
  replacement: () => "",
});

// Remove figure/figcaption noise
turndown.addRule("removeFigcaption", {
  filter: "figcaption",
  replacement: () => "",
});

// Ensure <br> tags produce line breaks
turndown.addRule("lineBreak", {
  filter: "br",
  replacement: () => "\n",
});

// Remove script/style/nav/footer/aside noise that Readability might leave
turndown.addRule("removeNoise", {
  filter: ["script", "style", "nav", "footer", "aside", "button", "form", "input", "select"],
  replacement: () => "",
});

/**
 * Post-process markdown to clean up common issues from news sites.
 * - Remove excessive whitespace
 * - Clean up orphaned formatting
 * - Ensure paragraph spacing
 */
function cleanMarkdown(md: string): string {
  return md
    // Remove empty links like [](url)
    .replace(/\[]\([^)]*\)/g, "")
    // Remove empty bold/italic
    .replace(/\*{1,3}\s*\*{1,3}/g, "")
    // Collapse 3+ newlines to 2
    .replace(/\n{3,}/g, "\n\n")
    // Remove trailing whitespace on lines
    .replace(/[ \t]+$/gm, "")
    // Remove lines that are just "---" or "***" separators if too many
    .replace(/([-*_]{3,}\n){2,}/g, "---\n\n")
    .trim();
}

function detectType(hostname: string): "youtube" | "linkedin" | "instagram" | "twitter" | "audio" | null {
  if (hostname.includes("youtube.com") || hostname === "youtu.be") return "youtube";
  if (hostname.includes("linkedin.com")) return "linkedin";
  if (hostname.includes("instagram.com")) return "instagram";
  if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
  if (
    hostname.includes("spotify.com") ||
    hostname.includes("podcasts.apple.com") ||
    hostname.includes("podcasts.google.com") ||
    hostname.includes("soundcloud.com") ||
    hostname.includes("overcast.fm") ||
    hostname.includes("pocketcasts.com")
  ) return "audio";
  return null;
}

function extractYouTubeId(url: URL): string | null {
  if (url.hostname.includes("youtube.com")) return url.searchParams.get("v");
  if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0];
  return null;
}

async function unfurlYouTube(url: string): Promise<UnfurlResult> {
  const parsed = new URL(url);
  const videoId = extractYouTubeId(parsed);

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
    if (res.ok) {
      const data: any = await res.json();
      return {
        title: data.title || null,
        description: null,
        image: videoId
          ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          : data.thumbnail_url || null,
        favicon: "https://www.youtube.com/favicon.ico",
        domain: "youtube.com",
        content_type_hint: "youtube",
        video_id: videoId || undefined,
        channel_name: data.author_name || undefined,
      };
    }
  } catch {}

  return {
    title: null,
    description: null,
    image: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null,
    favicon: "https://www.youtube.com/favicon.ico",
    domain: "youtube.com",
    content_type_hint: "youtube",
    video_id: videoId || undefined,
  };
}

async function unfurlGeneric(url: string): Promise<UnfurlResult> {
  const parsed = new URL(url);
  const domain = parsed.hostname.replace("www.", "");
  const typeHint = detectType(parsed.hostname);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MittMinneBot/1.0; +https://mittminne.app)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { title: null, description: null, image: null, favicon: null, domain, content_type_hint: typeHint };
    }

    const html = await res.text();

    const getMetaContent = (property: string): string | null => {
      // Match both property="..." and name="..."
      const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
        "i"
      );
      const match = html.match(regex);
      return match ? (match[1] || match[2] || null) : null;
    };

    const getTitle = (): string | null => {
      const og = getMetaContent("og:title");
      if (og) return og;
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      return titleMatch ? titleMatch[1].trim() : null;
    };

    const title = getTitle();
    const description = getMetaContent("og:description") || getMetaContent("description");
    const image = getMetaContent("og:image");
    const favicon =
      html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i)?.[1] ||
      `${parsed.origin}/favicon.ico`;

    // Make relative URLs absolute
    const absUrl = (u: string | null) => {
      if (!u) return null;
      try {
        return new URL(u, parsed.origin).href;
      } catch {
        return u;
      }
    };

    // Extract article content with Readability
    let article_text: string | undefined;
    let snapshot_html: string | undefined;
    let author: string | undefined;
    let word_count: number | undefined;
    let read_time_minutes: number | undefined;

    try {
      const { document } = parseHTML(html);
      const reader = new Readability(document as any);
      const article = reader.parse();
      if (article && article.content) {
        // Convert article HTML to Markdown to preserve structure (headings, lists, etc.)
        const rawMarkdown = turndown.turndown(article.content);
        const markdown = cleanMarkdown(rawMarkdown).slice(0, 50000);
        if (markdown.length > 100) {
          article_text = markdown;
          author = article.byline || undefined;
          // Count words from plain text for accurate word count
          const plainText = article.textContent || markdown;
          const words = plainText.split(/\s+/).filter(Boolean).length;
          word_count = words;
          read_time_minutes = Math.max(1, Math.round(words / 200));
        }
        // Capture cleaned article HTML for snapshot (max 500KB)
        snapshot_html = article.content.slice(0, 500000);
      }
    } catch {
      // Readability extraction failed, continue without it
    }

    // Fallback: capture raw HTML body if Readability didn't extract content
    if (!snapshot_html && html.length > 100) {
      // Strip scripts and styles, keep first 500KB
      const stripped = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .slice(0, 500000);
      snapshot_html = stripped;
    }

    const decodedTitle = title ? decodeHTMLEntities(title) : null;
    const decodedDesc = description ? decodeHTMLEntities(description) : null;

    // Smart-truncate long social media titles (Instagram/LinkedIn captions)
    const { title: truncatedTitle, fullCaption } = smartTruncateTitle(decodedTitle, typeHint);

    // If the full caption was truncated, store it as article_text so nothing is lost
    const finalArticleText = article_text || fullCaption || undefined;

    return {
      title: truncatedTitle,
      description: decodedDesc,
      image: absUrl(image),
      favicon: absUrl(favicon),
      domain,
      content_type_hint: typeHint,
      article_text: finalArticleText,
      snapshot_html,
      author,
      word_count,
      read_time_minutes,
    };
  } catch {
    return { title: null, description: null, image: null, favicon: null, domain, content_type_hint: typeHint };
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n)));
}

/**
 * For Instagram/LinkedIn, OG titles often contain the entire post caption.
 * Truncate to a sensible length and return the full text separately.
 */
function smartTruncateTitle(
  title: string | null,
  typeHint: string | null
): { title: string | null; fullCaption: string | null } {
  if (!title) return { title: null, fullCaption: null };

  const maxLength = 120;
  if (title.length <= maxLength) return { title, fullCaption: null };

  // Only truncate for social platforms
  if (typeHint !== "instagram" && typeHint !== "linkedin" && typeHint !== "twitter") {
    return { title, fullCaption: null };
  }

  const fullCaption = title;

  // Truncate at last word boundary before maxLength
  let truncated = title.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 60) {
    truncated = truncated.slice(0, lastSpace);
  }
  // Remove trailing punctuation that looks odd before ellipsis
  truncated = truncated.replace(/[,;:\s]+$/, "");

  return { title: truncated + "…", fullCaption };
}

function extractSpotifyId(url: URL): { type: string; id: string } | null {
  // https://open.spotify.com/episode/xxx or /track/xxx or /show/xxx
  const match = url.pathname.match(/\/(episode|track|show|album|playlist)\/([a-zA-Z0-9]+)/);
  if (match) return { type: match[1], id: match[2] };
  return null;
}

async function unfurlSpotify(url: string): Promise<UnfurlResult> {
  const parsed = new URL(url);
  const domain = parsed.hostname.replace("www.", "");
  const spotifyInfo = extractSpotifyId(parsed);

  // Build Spotify URI for embedding
  let spotify_uri: string | undefined;
  if (spotifyInfo) {
    spotify_uri = `spotify:${spotifyInfo.type}:${spotifyInfo.id}`;
  }

  // Use oEmbed for metadata
  try {
    const res = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
    );
    if (res.ok) {
      const data: any = await res.json();
      return {
        title: data.title || null,
        description: data.description || null,
        image: data.thumbnail_url || null,
        favicon: "https://open.spotify.com/favicon.ico",
        domain,
        content_type_hint: "audio",
        spotify_uri,
        podcast_name: data.provider_name || undefined,
        episode_name: data.title || undefined,
      };
    }
  } catch {}

  return {
    title: null,
    description: null,
    image: null,
    favicon: "https://open.spotify.com/favicon.ico",
    domain,
    content_type_hint: "audio",
    spotify_uri,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const parsed = new URL(url);
    const isYouTube =
      parsed.hostname.includes("youtube.com") || parsed.hostname === "youtu.be";
    const isSpotify = parsed.hostname.includes("spotify.com");

    let result: UnfurlResult;
    if (isYouTube) {
      result = await unfurlYouTube(url);
    } else if (isSpotify) {
      result = await unfurlSpotify(url);
    } else {
      result = await unfurlGeneric(url);
    }

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
}
