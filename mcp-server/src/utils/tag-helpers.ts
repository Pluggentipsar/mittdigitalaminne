import type { SupabaseClient } from "../db/supabase.js";

export async function ensureTagsExist(
  supabase: SupabaseClient,
  tagNames: string[]
): Promise<{ id: string; name: string }[]> {
  const tags: { id: string; name: string }[] = [];

  for (const name of tagNames) {
    const normalized = name.trim().toLowerCase();
    if (!normalized) continue;

    // Try to find existing tag
    const { data: existing } = await supabase
      .from("tags")
      .select("id, name")
      .eq("name", normalized)
      .single();

    if (existing) {
      tags.push(existing);
    } else {
      // Create new tag
      const { data: created, error } = await supabase
        .from("tags")
        .insert({ name: normalized })
        .select("id, name")
        .single();

      if (created) {
        tags.push(created);
      } else if (error) {
        // Race condition: tag was created between check and insert
        const { data: retry } = await supabase
          .from("tags")
          .select("id, name")
          .eq("name", normalized)
          .single();
        if (retry) tags.push(retry);
      }
    }
  }

  return tags;
}

export async function setMemoryTags(
  supabase: SupabaseClient,
  memoryId: string,
  tagNames: string[]
): Promise<void> {
  // Remove existing tags
  await supabase.from("memory_tags").delete().eq("memory_id", memoryId);

  if (tagNames.length === 0) return;

  // Ensure all tags exist
  const tags = await ensureTagsExist(supabase, tagNames);

  // Link tags to memory
  const links = tags.map((tag) => ({
    memory_id: memoryId,
    tag_id: tag.id,
  }));

  await supabase.from("memory_tags").insert(links);
}
