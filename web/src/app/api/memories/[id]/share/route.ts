import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

function generateToken(): string {
  return crypto.randomBytes(16).toString("base64url");
}

// GET — get existing share for this memory
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("memory_shares")
    .select("*")
    .eq("memory_id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST — create a share link
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json().catch(() => ({}));

  // Check if memory exists
  const { data: memory } = await supabase
    .from("memories")
    .select("id")
    .eq("id", id)
    .single();

  if (!memory) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  // Check if share already exists
  const { data: existing } = await supabase
    .from("memory_shares")
    .select("*")
    .eq("memory_id", id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ data: existing });
  }

  // Calculate expires_at if provided
  let expiresAt: string | null = null;
  if (body.expires_in_days) {
    const d = new Date();
    d.setDate(d.getDate() + body.expires_in_days);
    expiresAt = d.toISOString();
  }

  const token = generateToken();

  const { data, error } = await supabase
    .from("memory_shares")
    .insert({
      memory_id: id,
      share_token: token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE — remove share link
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { error } = await supabase
    .from("memory_shares")
    .delete()
    .eq("memory_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
