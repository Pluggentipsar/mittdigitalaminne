import type { SupabaseClient } from "../db/supabase.js";
import { setMemoryTags } from "../utils/tag-helpers.js";

export async function handleUpdateMemory(supabase: SupabaseClient, args: Record<string, unknown>) {
  const { id, tags, ...fields } = args;

  // Build update object with only provided fields
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) update[key] = value;
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase
      .from("memories")
      .update(update)
      .eq("id", id);

    if (error) {
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    }
  }

  // Handle tags if provided
  if (tags && Array.isArray(tags)) {
    await setMemoryTags(supabase, id as string, tags as string[]);
  }

  return {
    content: [{ type: "text" as const, text: `Memory ${id} updated successfully.` }],
  };
}
