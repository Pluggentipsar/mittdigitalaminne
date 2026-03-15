import type { SupabaseClient } from "../db/supabase.js";

export async function handleSearchMemories(supabase: SupabaseClient, args: Record<string, unknown>) {
  const {
    query,
    content_type,
    tags,
    date_from,
    date_to,
    favorites_only,
    inbox,
    limit = 20,
    offset = 0,
  } = args;

  const { data, error } = await supabase.rpc("search_memories", {
    search_query: (query as string) || null,
    filter_content_type: (content_type as string) || null,
    filter_tags: tags && Array.isArray(tags) && tags.length > 0
      ? (tags as string[]).map((t) => t.toLowerCase())
      : null,
    filter_date_from: (date_from as string) || null,
    filter_date_to: (date_to as string) || null,
    filter_favorites_only: !!favorites_only,
    filter_inbox: inbox != null ? !!inbox : null,
    sort_by: "relevance",
    result_limit: limit as number,
    result_offset: offset as number,
  });

  if (error) {
    return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
  }

  const results = data || [];

  if (results.length === 0) {
    return {
      content: [{ type: "text" as const, text: "No memories found matching your search." }],
    };
  }

  const totalCount = results[0]?.total_count ?? results.length;

  const formatted = results
    .map((m: any) => {
      const tagNames = m.tag_names || [];
      return `[${m.content_type}] ${m.title}\n  ID: ${m.id}\n  Summary: ${m.summary || "N/A"}\n  ${m.link_url ? `URL: ${m.link_url}\n  ` : ""}${tagNames.length ? `Tags: ${tagNames.join(", ")}\n  ` : ""}Favorite: ${m.is_favorite ? "Yes" : "No"}\n  Date: ${m.created_at}`;
    })
    .join("\n\n");

  return {
    content: [
      {
        type: "text" as const,
        text: `Found ${totalCount} memories (showing ${results.length}):\n\n${formatted}`,
      },
    ],
  };
}
