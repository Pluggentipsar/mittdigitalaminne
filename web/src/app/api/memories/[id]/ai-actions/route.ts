import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const AI_ACTIONS: Record<string, { label: string; prompt: string }> = {
  summarize_short: {
    label: "Kort sammanfattning",
    prompt:
      "Sammanfatta följande innehåll i 2-3 koncisa meningar på svenska:",
  },
  summarize_detailed: {
    label: "Detaljerad sammanfattning",
    prompt:
      "Skapa en detaljerad sammanfattning med huvudpunkter (bullet points) på svenska:",
  },
  lesson_plan: {
    label: "Lektionsidé",
    prompt:
      "Baserat på följande innehåll, skapa en lektionsplanidé med mål, aktiviteter och reflektionsfrågor. Skriv på svenska:",
  },
  key_quotes: {
    label: "Nyckelcitat",
    prompt:
      "Extrahera de viktigaste citaten och nyckelinsikterna från följande text. Skriv på svenska:",
  },
  linkedin_draft: {
    label: "LinkedIn-utkast",
    prompt:
      "Omvandla följande innehåll till ett engagerande LinkedIn-inlägg på svenska. Inkludera en stark öppning, huvudpunkter, och en avslutande uppmaning:",
  },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action } = await req.json();

  if (!action || !AI_ACTIONS[action]) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = createServerClient();
  const { data: memory, error } = await supabase
    .from("memories")
    .select("title, summary, original_content")
    .eq("id", id)
    .single();

  if (error || !memory) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  const content = [
    memory.title && `Titel: ${memory.title}`,
    memory.summary && `Sammanfattning: ${memory.summary}`,
    memory.original_content && `Innehåll: ${memory.original_content}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!content) {
    return NextResponse.json(
      { error: "Memory has no content to process" },
      { status: 400 }
    );
  }

  const actionDef = AI_ACTIONS[action];

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${actionDef.prompt}\n\n${content.slice(0, 15000)}`,
        },
      ],
    });

    const result = message.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text;
        return "";
      })
      .join("\n");

    return NextResponse.json({ data: { result, action: actionDef.label } });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "AI processing failed" },
      { status: 500 }
    );
  }
}
