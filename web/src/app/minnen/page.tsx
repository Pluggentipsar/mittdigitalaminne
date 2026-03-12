"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { MemoryFilters } from "@/lib/types";
import { useMemories } from "@/hooks/useMemories";
import { useSpaces } from "@/hooks/useSpaces";
import { FilterBar } from "@/components/filters/FilterBar";
import { MemoryGrid } from "@/components/memories/MemoryGrid";

function MinnenContent() {
  const searchParams = useSearchParams();
  const spaceId = searchParams.get("space");
  const { spaces } = useSpaces();
  const [filters, setFilters] = useState<MemoryFilters>({});
  const [activeSpaceName, setActiveSpaceName] = useState<string | null>(null);
  const { memories, count, isLoading, mutate } = useMemories(filters);

  // Load space filters when ?space=ID changes
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

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {activeSpaceName || "Minnen"}
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          {activeSpaceName
            ? `${count} minnen i detta space`
            : count > 0
            ? `${count} minnen`
            : "Bläddra och sök bland dina minnen"}
        </p>
      </div>

      <FilterBar filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="skeleton h-5 w-20 mb-3" />
              <div className="skeleton h-5 w-3/4 mb-2" />
              <div className="skeleton h-4 w-full mb-1" />
              <div className="skeleton h-4 w-4/5 mb-4" />
              <div className="skeleton h-3 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <MemoryGrid
          memories={memories}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
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
