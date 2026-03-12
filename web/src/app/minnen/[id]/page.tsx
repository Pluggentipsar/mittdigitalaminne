"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Hash,
  Sparkles,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useMemory } from "@/hooks/useMemories";
import { ContentTypeIcon } from "@/components/memories/ContentTypeIcon";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { NotesThread } from "@/components/memories/NotesThread";
import { RelatedMemories } from "@/components/memories/RelatedMemories";
import { YouTubePreview } from "@/components/memories/previews/YouTubePreview";
import { LinkPreview } from "@/components/memories/previews/LinkPreview";
import { SocialPreview } from "@/components/memories/previews/SocialPreview";
import { contentTypeConfig, cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function MemoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { memory, isLoading, mutate } = useMemory(id);

  const handleToggleFavorite = async () => {
    if (!memory) return;
    await fetch(`/api/memories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !memory.is_favorite }),
    });
    mutate();
  };

  const handleDelete = async () => {
    if (!confirm("Vill du verkligen ta bort detta minne?")) return;
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    router.push("/minnen");
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton h-8 w-2/3" />
        <div className="skeleton h-5 w-1/4" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-[15px] font-semibold text-foreground/70 mb-1">
          Minnet hittades inte
        </p>
        <Link
          href="/minnen"
          className="text-[13px] text-primary font-medium mt-2 hover:underline"
        >
          Tillbaka till minnen
        </Link>
      </div>
    );
  }

  const config = contentTypeConfig[memory.content_type];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/minnen"
          className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={`/minnen/${id}/redigera`}
            className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
            title="Redigera"
          >
            <Pencil className="h-[18px] w-[18px]" />
          </Link>
          <button
            onClick={handleToggleFavorite}
            className="p-2.5 rounded-xl hover:bg-accent transition-all"
            title={memory.is_favorite ? "Ta bort favorit" : "Favorit"}
          >
            <Star
              className={cn(
                "h-[18px] w-[18px] transition-colors",
                memory.is_favorite
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground hover:text-amber-400"
              )}
            />
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-destructive transition-all"
            title="Ta bort"
          >
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold mb-3",
            config.badgeClass
          )}
        >
          <ContentTypeIcon type={memory.content_type} className="h-3.5 w-3.5" />
          {config.label}
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight leading-tight">
          {memory.title}
        </h1>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(memory.created_at), "d MMMM yyyy", {
              locale: sv,
            })}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
            <Clock className="h-3.5 w-3.5" />
            {format(new Date(memory.created_at), "HH:mm")}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
            <Hash className="h-3.5 w-3.5" />
            {memory.source}
          </div>
          {memory.original_content && memory.original_content.length > 200 && (
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
              <BookOpen className="h-3.5 w-3.5" />
              {Math.max(1, Math.round(memory.original_content.split(/\s+/).length / 200))} min lästid
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      {memory.content_type === "image" && memory.image_url && (
        <div className="rounded-2xl overflow-hidden border border-border">
          <img
            src={memory.image_url}
            alt={memory.title}
            className="w-full max-h-[600px] object-contain bg-muted"
          />
        </div>
      )}

      {/* YouTube embed */}
      {memory.content_type === "youtube" && memory.link_url && (
        <YouTubePreview linkUrl={memory.link_url} metadata={memory.link_metadata} embed />
      )}

      {/* LinkedIn / Instagram preview */}
      {(memory.content_type === "linkedin" || memory.content_type === "instagram") && memory.link_url && (
        <SocialPreview type={memory.content_type} linkUrl={memory.link_url} metadata={memory.link_metadata} />
      )}

      {/* Link preview (for link type with metadata) */}
      {memory.content_type === "link" && memory.link_url && memory.link_metadata?.og_image && (
        <LinkPreview linkUrl={memory.link_url} metadata={memory.link_metadata} />
      )}

      {/* Fallback link */}
      {memory.link_url && !["youtube", "linkedin", "instagram"].includes(memory.content_type) && !(memory.content_type === "link" && memory.link_metadata?.og_image) && (
        <a
          href={memory.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border bg-card hover:bg-accent/50 transition-all group"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-type-link/8">
            <ExternalLink className="h-4 w-4 text-type-link" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-type-link truncate group-hover:underline">
              {memory.link_url}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {(() => {
                try {
                  return new URL(memory.link_url).hostname;
                } catch {
                  return "extern länk";
                }
              })()}
            </p>
          </div>
        </a>
      )}

      {/* Summary */}
      {memory.summary && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Sammanfattning
          </h2>
          <MarkdownContent content={memory.summary} />
        </div>
      )}

      {/* Original content */}
      {memory.original_content && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Innehåll
          </h2>
          <MarkdownContent content={memory.original_content} />
        </div>
      )}

      {/* Notes thread */}
      <NotesThread memoryId={id} />

      {/* Related memories */}
      <RelatedMemories memoryId={id} />

      {/* Tags */}
      {memory.tags && memory.tags.length > 0 && (
        <div>
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Taggar
          </h2>
          <div className="flex flex-wrap gap-2">
            {memory.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-muted text-muted-foreground"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metadata footer */}
      <div className="flex items-center gap-6 text-[11px] text-muted-foreground/50 pt-6 border-t border-border font-medium">
        <span>ID: {memory.id.slice(0, 8)}...</span>
        <span>
          Uppdaterad:{" "}
          {format(new Date(memory.updated_at), "d MMM yyyy, HH:mm", {
            locale: sv,
          })}
        </span>
      </div>
    </div>
  );
}
