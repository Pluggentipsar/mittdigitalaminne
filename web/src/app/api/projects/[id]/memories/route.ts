import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: junctions, error: junctionError } = await supabase
    .from("memory_projects")
    .select("memory_id, sort_order")
    .eq("project_id", id)
    .order("sort_order", { ascending: true })
    .order("added_at", { ascending: false });

  if (junctionError) {
    return NextResponse.json({ error: junctionError.message }, { status: 500 });
  }

  if (!junctions || junctions.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const memoryIds = junctions.map((j: any) => j.memory_id);

  const { data: memories, error: memoriesError } = await supabase
    .from("memories")
    .select("*, memory_tags(tag_id, tags(id, name, color))")
    .in("id", memoryIds);

  if (memoriesError) {
    return NextResponse.json({ error: memoriesError.message }, { status: 500 });
  }

  const transformed = (memories || []).map((m: any) => ({
    ...m,
    tags: (m.memory_tags || []).map((mt: any) => mt.tags).filter(Boolean),
    memory_tags: undefined,
  }));

  // Preserve the order from the junction table
  const ordered = memoryIds
    .map((mid: string) => transformed.find((m: any) => m.id === mid))
    .filter(Boolean);

  return NextResponse.json({ data: ordered });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("memory_projects")
    .insert({ project_id: id, memory_id: body.memory_id })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const memoryId = searchParams.get("memory_id");

  if (!memoryId) {
    return NextResponse.json({ error: "memory_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("memory_projects")
    .delete()
    .eq("project_id", id)
    .eq("memory_id", memoryId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
