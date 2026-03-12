import type { SupabaseClient } from "../db/supabase.js";

export async function handleDeleteMemory(supabase: SupabaseClient, args: Record<string, unknown>) {
  const { id } = args;

  // Get memory first to check for image storage path
  const { data: memory } = await supabase
    .from("memories")
    .select("id, title, image_storage_path")
    .eq("id", id)
    .single();

  if (!memory) {
    return { content: [{ type: "text" as const, text: `Memory ${id} not found.` }] };
  }

  // Delete image from storage if it exists
  if (memory.image_storage_path) {
    await supabase.storage
      .from("memory-images")
      .remove([memory.image_storage_path]);
  }

  // Delete memory (cascade removes memory_tags)
  const { error } = await supabase.from("memories").delete().eq("id", id);

  if (error) {
    return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
  }

  return {
    content: [
      { type: "text" as const, text: `Memory "${memory.title}" (${id}) deleted.` },
    ],
  };
}
