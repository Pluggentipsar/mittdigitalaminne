import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/memories/bulk
 *
 * Bulk operations on memories.
 *
 * Body: {
 *   ids: string[]           — memory UUIDs
 *   action: "favorite" | "unfavorite" | "delete" | "add_to_project"
 *   project_id?: string     — required for add_to_project
 * }
 */
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { ids, action, project_id } = body as {
    ids: string[];
    action: "favorite" | "unfavorite" | "delete" | "add_to_project";
    project_id?: string;
  };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "ids array is required" },
      { status: 400 }
    );
  }

  if (!action) {
    return NextResponse.json(
      { error: "action is required" },
      { status: 400 }
    );
  }

  try {
    switch (action) {
      case "favorite": {
        const { error } = await supabase
          .from("memories")
          .update({ is_favorite: true })
          .in("id", ids);
        if (error) throw error;
        break;
      }
      case "unfavorite": {
        const { error } = await supabase
          .from("memories")
          .update({ is_favorite: false })
          .in("id", ids);
        if (error) throw error;
        break;
      }
      case "delete": {
        // Delete associated images from storage first
        const { data: toDelete } = await supabase
          .from("memories")
          .select("id, image_storage_path")
          .in("id", ids);

        const storagePaths = (toDelete || [])
          .map((m: any) => m.image_storage_path)
          .filter(Boolean);

        if (storagePaths.length > 0) {
          await supabase.storage.from("memory-images").remove(storagePaths);
        }

        const { error } = await supabase
          .from("memories")
          .delete()
          .in("id", ids);
        if (error) throw error;
        break;
      }
      case "add_to_project": {
        if (!project_id) {
          return NextResponse.json(
            { error: "project_id is required for add_to_project" },
            { status: 400 }
          );
        }

        // Insert all, ignore duplicates via onConflict
        const rows = ids.map((memory_id) => ({
          project_id,
          memory_id,
        }));

        const { error } = await supabase
          .from("memory_projects")
          .upsert(rows, { onConflict: "memory_id,project_id", ignoreDuplicates: true });
        if (error) throw error;
        break;
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      affected: ids.length,
      action,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Bulk operation failed" },
      { status: 500 }
    );
  }
}
