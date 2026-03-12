import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("tags")
    .select("id, name, color, memory_tags(memory_id)")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const transformed = (data || []).map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    memory_count: (tag.memory_tags || []).length,
  }));

  return NextResponse.json({ data: transformed });
}
