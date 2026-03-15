import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServerClient();

  // Look up the share
  const { data: share, error: shareError } = await supabase
    .from("memory_shares")
    .select("*")
    .eq("share_token", token)
    .single();

  if (shareError || !share) {
    return NextResponse.json(
      { error: "Share not found or has been removed" },
      { status: 404 }
    );
  }

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This share link has expired" },
      { status: 410 }
    );
  }

  // Fetch the memory with tags
  const { data: memory, error: memError } = await supabase
    .from("memories")
    .select("*, memory_tags(tag_id, tags(id, name, color))")
    .eq("id", share.memory_id)
    .single();

  if (memError || !memory) {
    return NextResponse.json(
      { error: "Memory not found" },
      { status: 404 }
    );
  }

  // Transform tags
  const transformed = {
    ...memory,
    tags: (memory.memory_tags || []).map((mt: any) => mt.tags).filter(Boolean),
    memory_tags: undefined,
    // Don't expose sensitive fields
    image_storage_path: undefined,
  };

  return NextResponse.json({
    data: {
      memory: transformed,
      shared_at: share.created_at,
      expires_at: share.expires_at,
    },
  });
}
