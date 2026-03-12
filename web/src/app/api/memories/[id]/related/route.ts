import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  // 1. Get tag_ids for current memory
  const { data: tagLinks, error: tagError } = await supabase
    .from("memory_tags")
    .select("tag_id")
    .eq("memory_id", id);

  if (tagError) {
    return NextResponse.json({ error: tagError.message }, { status: 500 });
  }

  const tagIds = tagLinks?.map((t) => t.tag_id) || [];
  if (tagIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // 2. Get all memories that share these tags (excluding current)
  const { data: sharedLinks, error: sharedError } = await supabase
    .from("memory_tags")
    .select("memory_id, tag_id")
    .in("tag_id", tagIds)
    .neq("memory_id", id);

  if (sharedError) {
    return NextResponse.json({ error: sharedError.message }, { status: 500 });
  }

  if (!sharedLinks || sharedLinks.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // 3. Count shared tags per memory
  const countMap = new Map<string, number>();
  for (const link of sharedLinks) {
    countMap.set(link.memory_id, (countMap.get(link.memory_id) || 0) + 1);
  }

  // Sort by shared count descending, take top 6
  const ranked = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const memoryIds = ranked.map(([mid]) => mid);

  // 4. Fetch the actual memory data
  const { data: memories, error: memError } = await supabase
    .from("memories")
    .select("id, content_type, title, summary, image_url, link_url, link_metadata, created_at")
    .in("id", memoryIds);

  if (memError) {
    return NextResponse.json({ error: memError.message }, { status: 500 });
  }

  // 5. Merge with shared_tag_count and sort
  const result = (memories || [])
    .map((m) => ({
      ...m,
      shared_tag_count: countMap.get(m.id) || 0,
    }))
    .sort((a, b) => b.shared_tag_count - a.shared_tag_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ data: result });
}
