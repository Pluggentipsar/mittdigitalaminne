import { NextRequest, NextResponse } from "next/server";

interface UnfurlResult {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  domain: string;
  content_type_hint: "youtube" | "linkedin" | "instagram" | null;
  video_id?: string;
  channel_name?: string;
}

function detectType(hostname: string): "youtube" | "linkedin" | "instagram" | null {
  if (hostname.includes("youtube.com") || hostname === "youtu.be") return "youtube";
  if (hostname.includes("linkedin.com")) return "linkedin";
  if (hostname.includes("instagram.com")) return "instagram";
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

    return {
      title: title ? decodeHTMLEntities(title) : null,
      description: description ? decodeHTMLEntities(description) : null,
      image: absUrl(image),
      favicon: absUrl(favicon),
      domain,
      content_type_hint: typeHint,
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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
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

    const result = isYouTube ? await unfurlYouTube(url) : await unfurlGeneric(url);

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
}
