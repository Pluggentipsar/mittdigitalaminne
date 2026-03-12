import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data: spaces, error } = await supabase
    .from("smart_spaces")
    .select("*")
    .order("sort_order")
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute memory count for each space by running search with its filters
  const enriched = await Promise.all(
    (spaces || []).map(async (space) => {
      const f = space.filters || {};
      const { data } = await supabase.rpc("search_memories", {
        search_query: f.query || null,
        filter_content_type: f.content_type || null,
        filter_tags: f.tags || null,
        filter_date_from: f.date_from || null,
        filter_date_to: f.date_to || null,
        filter_favorites_only: f.favorites_only || false,
        sort_by: "newest",
        result_limit: 1,
        result_offset: 0,
      });
      const count = data?.[0]?.total_count ?? 0;
      return { ...space, memory_count: Number(count) };
    })
  );

  return NextResponse.json({ data: enriched });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { name, filters, icon } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("smart_spaces")
    .insert({
      name: name.trim(),
      filters: filters || {},
      icon: icon || "folder",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
