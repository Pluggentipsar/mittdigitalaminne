import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/feeds/items/[id]/save — Save a feed item to the memory bank
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  // Get the feed item with its source
  const { data: item, error: itemError } = await supabase
    .from("feed_items")
    .select("*, source:feed_sources(*)")
    .eq("id", id)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: "Flödesobjektet hittades inte" }, { status: 404 });
  }

  if (item.is_saved && item.saved_memory_id) {
    return NextResponse.json({ error: "Redan sparad", memory_id: item.saved_memory_id }, { status: 409 });
  }

  // Determine content type based on feed type
  const feedType = item.source?.feed_type || "rss";
  let contentType: string;
  switch (feedType) {
    case "youtube":
      contentType = "youtube";
      break;
    case "podcast":
      contentType = "audio";
      break;
    default:
      contentType = "article";
      break;
  }

  // Build link metadata
  const linkMetadata: Record<string, unknown> = {};
  if (item.source) {
    linkMetadata.domain = item.source.site_url
      ? new URL(item.source.site_url).hostname.replace("www.", "")
      : undefined;
    linkMetadata.favicon = item.source.icon_url || undefined;
    linkMetadata.og_image = item.image_url || undefined;
    linkMetadata.og_description = item.summary || undefined;
    linkMetadata.author_name = item.author || undefined;
  }

  // For YouTube, extract video ID
  if (contentType === "youtube" && item.link_url) {
    try {
      const url = new URL(item.link_url);
      const videoId = url.searchParams.get("v") ||
        (url.hostname === "youtu.be" ? url.pathname.slice(1) : null);
      if (videoId) {
        linkMetadata.video_id = videoId;
        linkMetadata.thumbnail_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
      linkMetadata.channel_name = item.author || item.source?.name || undefined;
    } catch {}
  }

  // Create the memory
  const { data: memory, error: memoryError } = await supabase
    .from("memories")
    .insert({
      content_type: contentType,
      title: item.title,
      original_content: item.summary || null,
      link_url: item.link_url || null,
      link_metadata: Object.keys(linkMetadata).length > 0 ? linkMetadata : null,
      source: "feed",
      is_inbox: false,
      is_favorite: false,
    })
    .select("*")
    .single();

  if (memoryError) {
    return NextResponse.json({ error: memoryError.message }, { status: 500 });
  }

  // Mark feed item as saved
  await supabase
    .from("feed_items")
    .update({
      is_saved: true,
      saved_memory_id: memory.id,
      is_read: true,
    })
    .eq("id", id);

  return NextResponse.json({ data: memory }, { status: 201 });
}
