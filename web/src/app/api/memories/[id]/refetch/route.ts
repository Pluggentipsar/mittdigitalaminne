import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/memories/[id]/refetch
 * Re-fetches article content from the original URL and updates the memory
 * with properly formatted markdown content (using turndown HTML→MD conversion).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  // Get the memory
  const { data: memory, error: memError } = await supabase
    .from("memories")
    .select("id, link_url, content_type, title")
    .eq("id", id)
    .single();

  if (memError || !memory) {
    return NextResponse.json({ error: "Minnet hittades inte" }, { status: 404 });
  }

  if (!memory.link_url) {
    return NextResponse.json({ error: "Inget URL att hämta" }, { status: 400 });
  }

  // Call our own unfurl endpoint to get fresh content
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  try {
    const unfurlRes = await fetch(`${baseUrl}/api/unfurl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: memory.link_url }),
    });

    if (!unfurlRes.ok) {
      return NextResponse.json({ error: "Kunde inte hämta artikeln" }, { status: 502 });
    }

    const { data } = await unfurlRes.json();
    if (!data) {
      return NextResponse.json({ error: "Ingen data returnerades" }, { status: 502 });
    }

    // Build update payload
    const updates: Record<string, unknown> = {};

    if (data.article_text) {
      updates.original_content = data.article_text;
    }

    if (data.snapshot_html) {
      updates.snapshot_html = data.snapshot_html;
      updates.snapshot_taken_at = new Date().toISOString();
    }

    // Optionally update metadata
    if (data.title && !memory.title) {
      updates.title = data.title;
    }

    if (data.image || data.favicon || data.domain) {
      updates.link_metadata = {
        og_title: data.title || undefined,
        og_description: data.description || undefined,
        og_image: data.image || undefined,
        favicon: data.favicon || undefined,
        domain: data.domain || undefined,
        video_id: data.video_id || undefined,
        channel_name: data.channel_name || undefined,
        thumbnail_url: data.image || undefined,
        author_name: data.author || undefined,
      };
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Inget nytt innehåll hittades" }, { status: 422 });
    }

    // Update the memory
    const { error: updateError } = await supabase
      .from("memories")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        updated_fields: Object.keys(updates),
        has_article: !!data.article_text,
        word_count: data.word_count || null,
        read_time_minutes: data.read_time_minutes || null,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Något gick fel vid hämtningen" }, { status: 500 });
  }
}
