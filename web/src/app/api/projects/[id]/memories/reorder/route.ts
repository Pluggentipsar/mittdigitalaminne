import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * PUT /api/projects/[id]/memories/reorder
 *
 * Reorder memories within a project.
 *
 * Body: {
 *   memory_ids: string[]  — ordered array of memory IDs (first = top)
 * }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = createServerClient();
  const body = await req.json();

  const { memory_ids } = body as { memory_ids: string[] };

  if (!memory_ids || !Array.isArray(memory_ids) || memory_ids.length === 0) {
    return NextResponse.json(
      { error: "memory_ids array is required" },
      { status: 400 }
    );
  }

  try {
    // Update sort_order for each memory in the project
    // We use the array index as sort_order (0 = first/top)
    const updates = memory_ids.map((memoryId, index) =>
      supabase
        .from("memory_projects")
        .update({ sort_order: index })
        .eq("project_id", projectId)
        .eq("memory_id", memoryId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      throw new Error(errors[0].error!.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Reorder failed" },
      { status: 500 }
    );
  }
}
