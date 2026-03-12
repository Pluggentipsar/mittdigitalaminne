import type { SupabaseClient } from "../db/supabase.js";

export async function handleListTags(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, color, memory_tags(memory_id)")
    .order("name");

  if (error) {
    return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
  }

  if (!data || data.length === 0) {
    return { content: [{ type: "text" as const, text: "No tags found." }] };
  }

  const formatted = data
    .map((tag: any) => {
      const count = (tag.memory_tags || []).length;
      return `${tag.name} (${count} memories) [${tag.color}]`;
    })
    .join("\n");

  return {
    content: [
      { type: "text" as const, text: `Tags (${data.length}):\n${formatted}` },
    ],
  };
}
