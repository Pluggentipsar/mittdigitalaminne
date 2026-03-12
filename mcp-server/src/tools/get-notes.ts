import type { SupabaseClient } from "../db/supabase.js";

export async function handleGetNotes(supabase: SupabaseClient, args: Record<string, unknown>) {
  const { memory_id } = args;

  const { data, error } = await supabase
    .from("memory_notes")
    .select("*")
    .eq("memory_id", memory_id)
    .order("created_at", { ascending: true });

  if (error) {
    return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
  }

  if (!data || data.length === 0) {
    return { content: [{ type: "text" as const, text: "No notes found for this memory." }] };
  }

  const lines = data.map(
    (n: any, i: number) =>
      `[${i + 1}] ${n.content}\n    (${n.created_at} | ID: ${n.id})`
  );

  return {
    content: [{ type: "text" as const, text: `Notes for memory ${memory_id}:\n\n${lines.join("\n\n")}` }],
  };
}
