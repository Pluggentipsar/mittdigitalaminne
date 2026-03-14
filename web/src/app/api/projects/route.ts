import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, memory_projects(memory_id)")
    .order("sort_order")
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const transformed = (projects || []).map((p: any) => ({
    ...p,
    memory_count: (p.memory_projects || []).length,
    memory_projects: undefined,
  }));

  return NextResponse.json({ data: transformed });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("projects")
    .insert(body)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
