import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("memories")
    .select("*, memory_tags(tag_id, tags(id, name, color))")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const transformed = {
    ...data,
    tags: (data.memory_tags || []).map((mt: any) => mt.tags).filter(Boolean),
    memory_tags: undefined,
  };

  return NextResponse.json({ data: transformed });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json();

  const { tags: tagNames, ...fields } = body;

  if (Object.keys(fields).length > 0) {
    const { error } = await supabase
      .from("memories")
      .update(fields)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Update tags if provided
  if (tagNames !== undefined) {
    // Remove existing
    await supabase.from("memory_tags").delete().eq("memory_id", id);

    // Add new
    for (const name of tagNames) {
      const normalized = name.trim().toLowerCase();
      if (!normalized) continue;

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
          .insert({ memory_id: id, tag_id: tag.id });
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  // Get memory to check for image
  const { data: memory } = await supabase
    .from("memories")
    .select("image_storage_path")
    .eq("id", id)
    .single();

  if (memory?.image_storage_path) {
    await supabase.storage
      .from("memory-images")
      .remove([memory.image_storage_path]);
  }

  const { error } = await supabase.from("memories").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
