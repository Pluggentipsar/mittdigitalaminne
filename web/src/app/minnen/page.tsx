"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckSquare } from "lucide-react";
import type { MemoryFilters } from "@/lib/types";
import { useMemories } from "@/hooks/useMemories";
import { useSpaces } from "@/hooks/useSpaces";
import { useProjects } from "@/hooks/useProjects";
import { FilterBar } from "@/components/filters/FilterBar";
import { MemoryGrid } from "@/components/memories/MemoryGrid";
import { cn } from "@/lib/utils";

function MinnenContent() {
  const searchParams = useSearchParams();
  const spaceId = searchParams.get("space");
  const { spaces } = useSpaces();
  const { projects } = useProjects();
  const [filters, setFilters] = useState<MemoryFilters>({ is_inbox: false });
  const [activeSpaceName, setActiveSpaceName] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const { memories, count, isLoading, mutate } = useMemories(filters);

  const handleAddToProject = async (memoryId: string, projectId: string) => {
    await fetch(`/api/projects/${projectId}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory_id: memoryId }),
    });
  };

  useEffect(() => {
    if (spaceId && spaces.length > 0) {
      const space = spaces.find((s) => s.id === spaceId);
      if (space) {
        setFilters(space.filters as MemoryFilters);
        setActiveSpaceName(space.name);
        return;
      }
    }
    setActiveSpaceName(null);
  }, [spaceId, spaces]);

  const handleToggleFavorite = async (id: string, current: boolean) => {
    await fetch(`/api/memories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !current }),
    });
    mutate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Vill du verkligen ta bort detta minne?")) return;
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    mutate();
  };

  const handleBulkComplete = useCallback(() => {
    mutate();
    setSelectionMode(false);
  }, [mutate]);

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.18em] mb-3">
              Samling
            </p>
            <h1 className="heading-serif text-[36px] md:text-[44px] text-foreground leading-[1.05]">
              {activeSpaceName || "Minnen"}
            </h1>
            <p className="text-[14px] text-muted-foreground/70 mt-2.5">
              {activeSpaceName
                ? `${count} minnen i detta space`
                : count > 0
                ? `${count} sparade minnen`
                : "Bläddra och sök bland dina minnen"}
            </p>
          </div>

          {/* Selection mode toggle */}
          {memories.length > 0 && (
            <button
              onClick={() => setSelectionMode(!selectionMode)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all mt-2 shrink-0",
                selectionMode
                  ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                  : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground"
              )}
            >
              <CheckSquare className="h-4 w-4" strokeWidth={1.5} />
              {selectionMode ? "Avsluta" : "Markera"}
            </button>
          )}
        </div>

        <div className="divider-ornament mt-7 max-w-md">
          <span className="text-primary/30 text-[8px]">&#9670;</span>
        </div>
      </div>

      <FilterBar filters={filters} onFiltersChange={setFilters} projects={projects} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card overflow-hidden"
            >
              <div className="skeleton h-36 w-full rounded-none" />
              <div className="p-5">
                <div className="skeleton h-4 w-16 mb-3 rounded-md" />
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-full mb-1" />
                <div className="skeleton h-3 w-4/5 mb-4" />
                <div className="skeleton h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <MemoryGrid
          memories={memories}
          projects={projects}
          selectionMode={selectionMode}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
          onAddToProject={handleAddToProject}
          onBulkComplete={handleBulkComplete}
        />
      )}
    </div>
  );
}

export default function MinnenPage() {
  return (
    <Suspense>
      <MinnenContent />
    </Suspense>
  );
}
