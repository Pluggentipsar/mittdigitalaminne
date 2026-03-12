import type { SupabaseClient } from "../db/supabase.js";

export async function handleAddNote(supabase: SupabaseClient, args: Record<string, unknown>) {
  const { memory_id, content } = args;

  const { data, error } = await supabase
    .from("memory_notes")
    .insert({ memory_id, content })
    .select()
    .single();

  if (error) {
    return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
  }

  return {
    content: [{ type: "text" as const, text: `Note added (ID: ${data.id}) to memory ${memory_id}` }],
  };
}
