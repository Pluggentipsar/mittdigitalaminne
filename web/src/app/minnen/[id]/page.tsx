"use client";

import { use, useState, useEffect, useCallback } from "react";
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
  Wand2,
  FolderPlus,
  Download,
  FileDown,
  FileText,
  Bell,
  BellOff,
} from "lucide-react";
import Link from "next/link";
import { useMemory } from "@/hooks/useMemories";
import { ContentTypeIcon } from "@/components/memories/ContentTypeIcon";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { NotesThread } from "@/components/memories/NotesThread";
import { RelatedMemories } from "@/components/memories/RelatedMemories";
import { AiActionsPanel } from "@/components/memories/AiActionsPanel";
import { SnapshotViewer } from "@/components/memories/SnapshotViewer";
import { AddToProjectDialog } from "@/components/projects/AddToProjectDialog";
import { YouTubePreview } from "@/components/memories/previews/YouTubePreview";
import { LinkPreview } from "@/components/memories/previews/LinkPreview";
import { SocialPreview } from "@/components/memories/previews/SocialPreview";
import { InstagramEmbed } from "@/components/memories/previews/InstagramEmbed";
import { contentTypeConfig, cn } from "@/lib/utils";
import { downloadAsText, downloadAsDocx } from "@/lib/export";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import type { Project } from "@/lib/types";

export default function MemoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { memory, isLoading, mutate } = useMemory(id);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [memoryProjects, setMemoryProjects] = useState<Project[]>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [reminderMenuOpen, setReminderMenuOpen] = useState(false);

  const fetchMemoryProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      const allProjects: Project[] = json.data || [];
      const memberProjects: Project[] = [];
      for (const project of allProjects) {
        const memRes = await fetch(`/api/projects/${project.id}/memories`);
        const memJson = await memRes.json();
        const memories = memJson.data || [];
        if (memories.some((m: any) => m.id === id)) {
          memberProjects.push(project);
        }
      }
      setMemoryProjects(memberProjects);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    fetchMemoryProjects();
  }, [fetchMemoryProjects]);

  useEffect(() => {
    if (!projectDialogOpen) {
      fetchMemoryProjects();
    }
  }, [projectDialogOpen, fetchMemoryProjects]);

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
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-8 w-2/3" />
        <div className="skeleton h-4 w-1/4" />
        <div className="skeleton h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-5">
          <Sparkles className="h-7 w-7 text-muted-foreground/35" strokeWidth={1.5} />
        </div>
        <p className="heading-serif text-[20px] text-foreground/70 mb-1">
          Minnet hittades inte
        </p>
        <Link
          href="/minnen"
          className="text-[13px] text-primary font-medium mt-3 hover:underline"
        >
          Tillbaka till minnen
        </Link>
      </div>
    );
  }

  const config = contentTypeConfig[memory.content_type];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/minnen"
          className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Tillbaka
        </Link>
        <div className="flex items-center gap-0.5">
          <Link
            href={`/minnen/${id}/redigera`}
            className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground/50 hover:text-foreground transition-all"
            title="Redigera"
          >
            <Pencil className="h-[17px] w-[17px]" strokeWidth={1.5} />
          </Link>
          <button
            onClick={handleToggleFavorite}
            className="p-2.5 rounded-xl hover:bg-accent transition-all"
            title={memory.is_favorite ? "Ta bort favorit" : "Favorit"}
          >
            <Star
              className={cn(
                "h-[17px] w-[17px] transition-colors",
                memory.is_favorite
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/50 hover:text-amber-400"
              )}
            />
          </button>
          <button
            onClick={() => setProjectDialogOpen(true)}
            className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground/50 hover:text-foreground transition-all"
            title="Lägg till i projekt"
          >
            <FolderPlus className="h-[17px] w-[17px]" strokeWidth={1.5} />
          </button>
          {/* Remind me dropdown */}
          <div className="relative">
            <button
              onClick={() => setReminderMenuOpen(!reminderMenuOpen)}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                memory.remind_at
                  ? "bg-amber-50 text-amber-600"
                  : "hover:bg-accent text-muted-foreground/50 hover:text-foreground"
              )}
              title={memory.remind_at ? `Påminnelse: ${format(new Date(memory.remind_at), "d MMM, HH:mm", { locale: sv })}` : "Påminn mig"}
            >
              {memory.remind_at ? (
                <Bell className="h-[17px] w-[17px] fill-amber-400/30" strokeWidth={1.5} />
              ) : (
                <Bell className="h-[17px] w-[17px]" strokeWidth={1.5} />
              )}
            </button>
            {reminderMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setReminderMenuOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1.5 z-50 min-w-[200px] bg-card rounded-xl border border-border/60 shadow-lg py-1.5 animate-scale-in"
                  style={{ transformOrigin: "top right" }}
                >
                  <p className="px-3.5 py-1.5 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.1em]">
                    Påminn mig
                  </p>
                  {[
                    { label: "Om 1 timme", hours: 1 },
                    { label: "Imorgon", hours: 24 },
                    { label: "Om 3 dagar", hours: 72 },
                    { label: "Om 1 vecka", hours: 168 },
                    { label: "Om 1 månad", hours: 720 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={async () => {
                        const remindAt = new Date();
                        remindAt.setHours(remindAt.getHours() + opt.hours);
                        await fetch(`/api/memories/${id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ remind_at: remindAt.toISOString() }),
                        });
                        mutate();
                        setReminderMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-[13px] font-medium hover:bg-accent/70 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                  {memory.remind_at && (
                    <>
                      <div className="h-px bg-border/40 mx-2 my-1" />
                      <button
                        onClick={async () => {
                          await fetch(`/api/memories/${id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ remind_at: null }),
                          });
                          mutate();
                          setReminderMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-[13px] font-medium text-destructive hover:bg-red-50 transition-colors"
                      >
                        <BellOff className="h-4 w-4" strokeWidth={1.5} />
                        Ta bort påminnelse
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setAiPanelOpen(true)}
            className="p-2.5 rounded-xl hover:bg-amber-50 text-muted-foreground/50 hover:text-amber-600 transition-all"
            title="Bearbeta med AI"
          >
            <Wand2 className="h-[17px] w-[17px]" strokeWidth={1.5} />
          </button>
          {/* Export dropdown */}
          {(memory.original_content || memory.summary) && (
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground/50 hover:text-foreground transition-all"
                title="Ladda ned"
              >
                <Download className="h-[17px] w-[17px]" strokeWidth={1.5} />
              </button>
              {exportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] bg-card rounded-xl border border-border/60 shadow-lg py-1.5 animate-scale-in"
                       style={{ transformOrigin: "top right" }}>
                    <button
                      onClick={() => {
                        downloadAsText(memory);
                        setExportMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-[13px] font-medium hover:bg-accent/70 transition-colors"
                    >
                      <FileDown className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
                      Ladda ned som .txt
                    </button>
                    <button
                      onClick={async () => {
                        await downloadAsDocx(memory);
                        setExportMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-[13px] font-medium hover:bg-accent/70 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
                      Ladda ned som .docx
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl hover:bg-red-50 text-muted-foreground/50 hover:text-destructive transition-all"
            title="Ta bort"
          >
            <Trash2 className="h-[17px] w-[17px]" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold mb-4",
            config.badgeClass
          )}
        >
          <ContentTypeIcon type={memory.content_type} className="h-3 w-3" />
          {config.label}
        </span>
        <h1 className="heading-serif text-[28px] md:text-[36px] leading-[1.12] text-foreground">
          {memory.title}
        </h1>
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
            {format(new Date(memory.created_at), "d MMMM yyyy", { locale: sv })}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
            {format(new Date(memory.created_at), "HH:mm")}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
            <Hash className="h-3.5 w-3.5" strokeWidth={1.5} />
            {memory.source}
          </div>
          {memory.original_content && memory.original_content.length > 200 && (
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
              {Math.max(1, Math.round(memory.original_content.split(/\s+/).length / 200))} min lästid
            </div>
          )}
          {memory.remind_at && (
            <div className="flex items-center gap-1.5 text-[12px] text-amber-600 font-medium">
              <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
              Påminnelse: {format(new Date(memory.remind_at), "d MMM, HH:mm", { locale: sv })}
            </div>
          )}
        </div>
      </div>

      {/* Decorative divider */}
      <div className="divider-ornament">
        <span className="text-primary/30 text-[8px]">&#9670;</span>
      </div>

      {/* Image */}
      {memory.content_type === "image" && memory.image_url && (
        <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm">
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

      {/* Instagram embed */}
      {memory.content_type === "instagram" && memory.link_url && (
        <InstagramEmbed linkUrl={memory.link_url} title={memory.title} />
      )}

      {/* LinkedIn preview */}
      {memory.content_type === "linkedin" && memory.link_url && (
        <SocialPreview type="linkedin" linkUrl={memory.link_url} metadata={memory.link_metadata} />
      )}

      {/* Twitter/X preview */}
      {memory.content_type === "twitter" && memory.link_url && (
        <SocialPreview type="twitter" linkUrl={memory.link_url} metadata={memory.link_metadata} />
      )}

      {/* Link preview */}
      {memory.content_type === "link" && memory.link_url && memory.link_metadata?.og_image && (
        <LinkPreview linkUrl={memory.link_url} metadata={memory.link_metadata} />
      )}

      {/* Fallback link */}
      {memory.link_url && !["youtube", "linkedin", "instagram", "twitter"].includes(memory.content_type) && !(memory.content_type === "link" && memory.link_metadata?.og_image) && (
        <a
          href={memory.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3.5 px-5 py-4 rounded-2xl border border-border/50 bg-card hover:bg-accent/50 transition-all group shadow-xs"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-type-link/8">
            <ExternalLink className="h-4 w-4 text-type-link" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-type-link truncate group-hover:underline">
              {memory.link_url}
            </p>
            <p className="text-[11px] text-muted-foreground/50">
              {(() => { try { return new URL(memory.link_url).hostname.replace('www.', ''); } catch { return "extern länk"; } })()}
            </p>
          </div>
        </a>
      )}

      {/* Summary */}
      {memory.summary && (
        <div className="rounded-2xl border border-border/50 bg-card p-7 shadow-xs">
          <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em] mb-4">
            Sammanfattning
          </h2>
          <MarkdownContent content={memory.summary} />
        </div>
      )}

      {/* Original content */}
      {memory.original_content && (
        <div className="rounded-2xl border border-border/50 bg-card p-7 shadow-xs">
          <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em] mb-4">
            Innehåll
          </h2>
          <MarkdownContent content={memory.original_content} />
        </div>
      )}

      {/* Snapshot viewer */}
      <SnapshotViewer
        snapshotHtml={memory.snapshot_html}
        snapshotTakenAt={memory.snapshot_taken_at}
        linkUrl={memory.link_url}
      />

      {/* Notes thread */}
      <NotesThread memoryId={id} />

      {/* Related memories */}
      <RelatedMemories memoryId={id} />

      {/* Tags */}
      {memory.tags && memory.tags.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em] mb-3">
            Taggar
          </h2>
          <div className="flex flex-wrap gap-2">
            {memory.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-accent/80 text-muted-foreground border border-border/30 transition-colors hover:border-border/60"
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

      {/* Projekt */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em]">
            Projekt
          </h2>
          <button
            onClick={() => setProjectDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-primary hover:bg-accent transition-all"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Lägg till
          </button>
        </div>
        {memoryProjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {memoryProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projekt/${project.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-accent/80 text-muted-foreground border border-border/30 transition-colors hover:border-border/60"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground/40">
            Inte kopplad till något projekt
          </p>
        )}
      </div>

      {/* Metadata footer */}
      <div className="flex items-center gap-6 text-[11px] text-muted-foreground/30 pt-8 border-t border-border/30 font-medium">
        <span>ID: {memory.id.slice(0, 8)}...</span>
        <span>
          Uppdaterad:{" "}
          {format(new Date(memory.updated_at), "d MMM yyyy, HH:mm", { locale: sv })}
        </span>
      </div>

      {/* AI Actions Panel */}
      <AiActionsPanel
        memoryId={id}
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
      />

      {/* Add to Project Dialog */}
      <AddToProjectDialog
        memoryId={id}
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
      />
    </div>
  );
}
