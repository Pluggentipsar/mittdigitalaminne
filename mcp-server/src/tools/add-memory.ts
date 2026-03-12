import type { SupabaseClient } from "../db/supabase.js";
import { setMemoryTags } from "../utils/tag-helpers.js";
import { detectContentType, fetchYouTubeMetadata } from "../utils/url-detect.js";

export async function handleAddMemory(supabase: SupabaseClient, args: Record<string, unknown>) {
  const { title, original_content, summary, image_url, tags } = args;
  let content_type = args.content_type as string;
  let link_url = args.link_url as string | undefined;

  // Auto-detect content type from URL if saved as generic "link"
  const url = link_url || (original_content as string) || "";
  if (url && (content_type === "link" || !content_type)) {
    const detected = detectContentType(url);
    if (detected) {
      content_type = detected;
      if (!link_url) link_url = url;
    }
  }

  // Fetch metadata for YouTube URLs via free oEmbed API
  let link_metadata: Record<string, string> | null = null;
  if (content_type === "youtube" && link_url) {
    link_metadata = await fetchYouTubeMetadata(link_url);
  }

  const { data, error } = await supabase
    .from("memories")
    .insert({
      content_type,
      title,
      original_content: original_content || null,
      summary,
      link_url: link_url || null,
      image_url: image_url || null,
      link_metadata: link_metadata || null,
      source: "mcp",
    })
    .select("id, title, content_type, created_at")
    .single();

  if (error) {
    return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
  }

  // Handle tags
  if (tags && Array.isArray(tags) && tags.length > 0) {
    await setMemoryTags(supabase, data.id, tags as string[]);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `Memory saved!\n- ID: ${data.id}\n- Title: ${data.title}\n- Type: ${data.content_type}\n- Created: ${data.created_at}${tags && (tags as string[]).length > 0 ? `\n- Tags: ${(tags as string[]).join(", ")}` : ""}${link_metadata ? `\n- YouTube: "${link_metadata.og_title}" by ${link_metadata.channel_name}` : ""}`,
      },
    ],
  };
}
