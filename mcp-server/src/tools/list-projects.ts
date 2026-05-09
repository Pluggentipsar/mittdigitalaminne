import type { SupabaseClient } from "../db/supabase.js";

export async function handleListProjects(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, color, icon, status, deadline, memory_projects(memory_id)")
    .order("sort_order")
    .order("created_at");

  if (error) {
    return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
  }

  if (!data || data.length === 0) {
    return { content: [{ type: "text" as const, text: "No projects found." }] };
  }

  const formatted = data
    .map((p: any) => {
      const count = (p.memory_projects || []).length;
      return `${p.name} (${count} memories) [${p.status}]\n  ID: ${p.id}\n  ${p.description ? `Description: ${p.description}\n  ` : ""}Color: ${p.color} | Icon: ${p.icon}${p.deadline ? `\n  Deadline: ${p.deadline}` : ""}`;
    })
    .join("\n\n");

  return {
    content: [
      { type: "text" as const, text: `Projects (${data.length}):\n\n${formatted}` },
    ],
  };
}
