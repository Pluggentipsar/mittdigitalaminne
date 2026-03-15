import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface ImportMemory {
  title: string;
  content_type: string;
  original_content?: string | null;
  summary?: string | null;
  link_url?: string | null;
  image_url?: string | null;
  tags?: string[];
  is_inbox?: boolean;
}

const MAX_BATCH_SIZE = 200;

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const memories: ImportMemory[] = body.memories;
  if (!Array.isArray(memories) || memories.length === 0) {
    return NextResponse.json(
      { error: "Ingen data att importera" },
      { status: 400 }
    );
  }

  if (memories.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `Max ${MAX_BATCH_SIZE} minnen per batch` },
      { status: 400 }
    );
  }

  const errors: { row: number; error: string }[] = [];
  let imported = 0;

  // 1. Collect all unique tag names
  const allTagNames = new Set<string>();
  for (const mem of memories) {
    if (mem.tags) {
      for (const tag of mem.tags) {
        const normalized = tag.trim().toLowerCase();
        if (normalized) allTagNames.add(normalized);
      }
    }
  }

  // 2. Upsert tags in batch — fetch existing, create missing
  const tagNameToId: Record<string, string> = {};
  if (allTagNames.size > 0) {
    const tagList = Array.from(allTagNames);

    // Fetch existing
    const { data: existingTags } = await supabase
      .from("tags")
      .select("id, name")
      .in("name", tagList);

    for (const tag of existingTags || []) {
      tagNameToId[tag.name] = tag.id;
    }

    // Create missing
    const missingTags = tagList.filter((n) => !tagNameToId[n]);
    if (missingTags.length > 0) {
      const { data: created } = await supabase
        .from("tags")
        .insert(missingTags.map((name) => ({ name })))
        .select("id, name");

      for (const tag of created || []) {
        tagNameToId[tag.name] = tag.id;
      }
    }
  }

  // 3. Insert memories in batch
  const memoryRows = memories.map((mem, i) => ({
    content_type: mem.content_type || "thought",
    title: mem.title,
    original_content: mem.original_content || null,
    summary: mem.summary || null,
    link_url: mem.link_url || null,
    image_url: mem.image_url || null,
    is_inbox: mem.is_inbox ?? false,
    source: "import",
  }));

  const { data: insertedMemories, error: insertError } = await supabase
    .from("memories")
    .insert(memoryRows)
    .select("id");

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  imported = insertedMemories?.length || 0;

  // 4. Create tag junctions in batch
  const tagJunctions: { memory_id: string; tag_id: string }[] = [];
  if (insertedMemories) {
    for (let i = 0; i < insertedMemories.length; i++) {
      const mem = memories[i];
      const memId = insertedMemories[i].id;
      if (mem.tags) {
        for (const tag of mem.tags) {
          const normalized = tag.trim().toLowerCase();
          const tagId = tagNameToId[normalized];
          if (tagId) {
            tagJunctions.push({ memory_id: memId, tag_id: tagId });
          }
        }
      }
    }
  }

  if (tagJunctions.length > 0) {
    await supabase.from("memory_tags").insert(tagJunctions);
  }

  return NextResponse.json(
    { imported, errors },
    { status: 201 }
  );
}
