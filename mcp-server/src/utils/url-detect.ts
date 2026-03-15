/**
 * Auto-detect content type from URL patterns.
 * Returns the detected type or null if no match.
 */
export function detectContentType(url: string): "youtube" | "linkedin" | "instagram" | "twitter" | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    if (host.includes("linkedin.com")) return "linkedin";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("twitter.com") || host.includes("x.com")) return "twitter";
  } catch {}
  return null;
}

/**
 * Extract YouTube video ID from URL.
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0];
  } catch {}
  return null;
}

/**
 * Fetch YouTube metadata via free oEmbed API (no API key needed).
 */
export async function fetchYouTubeMetadata(url: string): Promise<Record<string, string> | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;

    const data: any = await res.json();
    const videoId = extractYouTubeVideoId(url);

    return {
      og_title: data.title || "",
      channel_name: data.author_name || "",
      author_name: data.author_name || "",
      video_id: videoId || "",
      thumbnail_url: videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : (data.thumbnail_url || ""),
      domain: "youtube.com",
    };
  } catch {
    return null;
  }
}
