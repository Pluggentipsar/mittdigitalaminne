import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("query");
  const content_type = searchParams.get("content_type");
  const tags = searchParams.get("tags");
  const date_from = searchParams.get("date_from");
  const date_to = searchParams.get("date_to");
  const favorites_only = searchParams.get("favorites_only") === "true";
  const sort = searchParams.get("sort") || "newest";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const sortBy = query && sort === "newest" ? "relevance" : sort;

  const { data, error } = await supabase.rpc("search_memories", {
    search_query: query || null,
    filter_content_type: content_type || null,
    filter_tags: tags ? tags.split(",").map((t) => t.trim().toLowerCase()) : null,
    filter_date_from: date_from || null,
    filter_date_to: date_to || null,
    filter_favorites_only: favorites_only,
    sort_by: sortBy,
    result_limit: limit,
    result_offset: offset,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = data || [];
  const totalCount = results.length > 0 ? results[0]?.total_count : 0;

  // Transform to match expected frontend shape
  const transformed = results.map((m: any) => {
    const tagIds = m.tag_ids || [];
    const tagNames = m.tag_names || [];
    const tagColors = m.tag_colors || [];

    return {
      id: m.id,
      content_type: m.content_type,
      title: m.title,
      original_content: m.original_content,
      summary: m.summary,
      image_url: m.image_url,
      image_storage_path: m.image_storage_path,
      link_url: m.link_url,
      link_metadata: m.link_metadata,
      source: m.source,
      is_favorite: m.is_favorite,
      created_at: m.created_at,
      updated_at: m.updated_at,
      tags: tagIds.map((id: string, i: number) => ({
        id,
        name: tagNames[i] || "",
        color: tagColors[i] || "#6B7280",
      })),
    };
  });

  return NextResponse.json({ data: transformed, count: totalCount });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { tags: tagNames, ...memoryData } = body;

  // Create memory
  const { data: memory, error } = await supabase
    .from("memories")
    .insert({ ...memoryData, source: "web" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Handle tags
  if (tagNames && tagNames.length > 0) {
    for (const name of tagNames) {
      const normalized = name.trim().toLowerCase();
      if (!normalized) continue;

      // Upsert tag
      let { data: tag } = await supabase
        .from("tags")
        .select("id")
        .eq("name", normalized)
        .single();

      if (!tag) {
        const { data: created } = await supabase
          .from("tags")
          .insert({ name: normalized })
          .select("id")
          .single();
        tag = created;
      }

      if (tag) {
        await supabase
          .from("memory_tags")
          .insert({ memory_id: memory.id, tag_id: tag.id });
      }
    }
  }

  return NextResponse.json({ data: memory }, { status: 201 });
}
