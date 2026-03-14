"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Archive,
  Trash2,
  Plus,
  Calendar,
  FolderKanban,
  RotateCcw,
  Folder,
  Book,
  Lightbulb,
  Target,
  Star,
  Bookmark,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import useSWR from "swr";
import type { Project, Memory } from "@/lib/types";
import { useProjectMemories } from "@/hooks/useProjectMemories";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { MemoryCard } from "@/components/memories/MemoryCard";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const iconMap: Record<string, React.ComponentType<any>> = {
  folder: Folder,
  book: Book,
  lightbulb: Lightbulb,
  target: Target,
  star: Star,
  bookmark: Bookmark,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Memory[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: projectData, error: projectError, isLoading: projectLoading, mutate: mutateProject } =
    useSWR<{ data: Project }>(
      `/api/projects/${id}`,
      fetcher
    );

  const { memories, isLoading: memoriesLoading, mutate: mutateMemories, removeMemory, addMemory } =
    useProjectMemories(id);

  const project = projectData?.data;
  const IconComponent = project ? iconMap[project.icon] || Folder : Folder;

  const handleEdit = async (data: Partial<Project>) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    mutateProject();
  };

  const handleArchiveToggle = async () => {
    if (!project) return;
    const newStatus = project.status === "active" ? "archived" : "active";
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    mutateProject();
  };

  const handleDelete = async () => {
    if (!confirm("Vill du verkligen ta bort detta projekt?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/projekt");
  };

  const handleToggleFavorite = async (memoryId: string, current: boolean) => {
    await fetch(`/api/memories/${memoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !current }),
    });
    mutateMemories();
  };

  const handleRemoveFromProject = async (memoryId: string) => {
    if (!confirm("Ta bort detta minne från projektet?")) return;
    await removeMemory(memoryId);
    mutateProject();
  };

  const handleSearchMemories = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/memories?query=${encodeURIComponent(query)}&limit=10`);
      const json = await res.json();
      // Filter out memories already in project
      const existingIds = new Set(memories.map((m) => m.id));
      setSearchResults((json.data || []).filter((m: Memory) => !existingIds.has(m.id)));
    } finally {
      setSearching(false);
    }
  }, [memories]);

  const handleAddMemory = async (memoryId: string) => {
    await addMemory(memoryId);
    mutateProject();
    // Remove from search results
    setSearchResults((prev) => prev.filter((m) => m.id !== memoryId));
  };

  if (projectLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-10 w-2/3" />
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-5">
          <FolderKanban className="h-7 w-7 text-muted-foreground/35" strokeWidth={1.5} />
        </div>
        <p className="heading-serif text-[20px] text-foreground/70 mb-1">
          Projektet hittades inte
        </p>
        <Link
          href="/projekt"
          className="text-[13px] text-primary font-medium mt-3 hover:underline"
        >
          Tillbaka till projekt
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/projekt"
          className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Tillbaka
        </Link>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setEditOpen(true)}
            className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground/50 hover:text-foreground transition-all"
            title="Redigera"
          >
            <Pencil className="h-[17px] w-[17px]" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleArchiveToggle}
            className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground/50 hover:text-foreground transition-all"
            title={project.status === "active" ? "Arkivera" : "Aktivera"}
          >
            {project.status === "active" ? (
              <Archive className="h-[17px] w-[17px]" strokeWidth={1.5} />
            ) : (
              <RotateCcw className="h-[17px] w-[17px]" strokeWidth={1.5} />
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl hover:bg-red-50 text-muted-foreground/50 hover:text-destructive transition-all"
            title="Ta bort"
          >
            <Trash2 className="h-[17px] w-[17px]" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Project header */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
            style={{ backgroundColor: `${project.color}15` }}
          >
            <IconComponent
              className="h-6 w-6"
              style={{ color: project.color }}
              strokeWidth={1.5}
            />
          </div>
          <div>
            <h1 className="heading-serif text-[28px] md:text-[36px] leading-[1.12] text-foreground">
              {project.name}
            </h1>
          </div>
        </div>

        {project.description && (
          <p className="text-[14px] text-muted-foreground/70 leading-relaxed mt-2 max-w-2xl">
            {project.description}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold",
              project.status === "active"
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-muted text-muted-foreground/60"
            )}
          >
            {project.status === "active" ? "Aktiv" : "Arkiverad"}
          </span>

          {project.deadline && (
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
              Deadline: {format(new Date(project.deadline), "d MMMM yyyy", { locale: sv })}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
            <FolderKanban className="h-3.5 w-3.5" strokeWidth={1.5} />
            {project.memory_count || 0} {(project.memory_count || 0) === 1 ? "minne" : "minnen"}
          </div>
        </div>
      </div>

      {/* Decorative divider */}
      <div className="divider-ornament">
        <span className="text-primary/30 text-[8px]">&#9670;</span>
      </div>

      {/* Add memory section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em]">
            Minnen i projektet
          </h2>
          <button
            onClick={() => setAddOpen(!addOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-primary hover:bg-accent transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Lägg till minne
          </button>
        </div>

        {/* Add memory search panel */}
        {addOpen && (
          <div className="rounded-2xl border border-border/50 bg-card p-5 mb-6 animate-fade-in shadow-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchMemories(e.target.value)}
              placeholder="Sök efter minnen att lägga till..."
              className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-[14px] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all mb-3"
              autoFocus
            />
            {searching && (
              <p className="text-[12px] text-muted-foreground/50 py-2">Söker...</p>
            )}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {searchResults.map((memory) => (
                  <div
                    key={memory.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/60 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">
                        {memory.title}
                      </p>
                      {memory.summary && (
                        <p className="text-[11px] text-muted-foreground/50 truncate">
                          {memory.summary}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddMemory(memory.id)}
                      className="shrink-0 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-all"
                    >
                      Lägg till
                    </button>
                  </div>
                ))}
              </div>
            )}
            {searchQuery && !searching && searchResults.length === 0 && (
              <p className="text-[12px] text-muted-foreground/50 py-2">
                Inga matchande minnen hittades
              </p>
            )}
          </div>
        )}
      </div>

      {/* Memory grid */}
      {memoriesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-[200px] rounded-2xl" />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <FolderKanban className="h-6 w-6 text-muted-foreground/30" strokeWidth={1.5} />
          </div>
          <p className="heading-serif text-[18px] text-foreground/60 mb-1">
            Inga minnen i projektet
          </p>
          <p className="text-[13px] text-muted-foreground/50">
            Klicka &quot;Lägg till minne&quot; för att koppla dina minnen hit
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onToggleFavorite={handleToggleFavorite}
              onDelete={(memoryId) => handleRemoveFromProject(memoryId)}
            />
          ))}
        </div>
      )}

      {/* Edit form modal */}
      <ProjectForm
        project={project}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEdit}
      />
    </div>
  );
}
