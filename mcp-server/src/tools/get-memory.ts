import type { SupabaseClient } from "../db/supabase.js";

export async function handleGetMemory(supabase: SupabaseClient, args: Record<string, unknown>) {
  const { id } = args;

  const { data, error } = await supabase
    .from("memories")
    .select(
      `*, memory_tags(tag_id, tags(name, color))`
    )
    .eq("id", id)
    .single();

  if (error) {
    return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
  }

  const tags = (data.memory_tags || [])
    .map((mt: any) => mt.tags?.name)
    .filter(Boolean);

  const lines = [
    `Title: ${data.title}`,
    `Type: ${data.content_type}`,
    `Summary: ${data.summary || "N/A"}`,
  ];

  if (data.original_content) lines.push(`Content: ${data.original_content}`);
  if (data.link_url) lines.push(`URL: ${data.link_url}`);
  if (data.image_url) lines.push(`Image: ${data.image_url}`);
  if (tags.length) lines.push(`Tags: ${tags.join(", ")}`);
  lines.push(`Favorite: ${data.is_favorite ? "Yes" : "No"}`);
  lines.push(`Source: ${data.source}`);
  lines.push(`Created: ${data.created_at}`);
  lines.push(`Updated: ${data.updated_at}`);
  lines.push(`ID: ${data.id}`);

  return {
    content: [{ type: "text" as const, text: lines.join("\n") }],
  };
}
