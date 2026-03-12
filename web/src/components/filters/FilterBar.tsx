"use client";

import { Search, Image, Link2, FileText, Lightbulb, Youtube, Star, SlidersHorizontal, Tag, Bookmark } from "lucide-react";
import type { ContentType, MemoryFilters } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useTags } from "@/hooks/useTags";
import { useSpaces } from "@/hooks/useSpaces";
import { SaveSpaceDialog } from "@/components/spaces/SaveSpaceDialog";
import { useState, useEffect } from "react";

interface FilterBarProps {
  filters: MemoryFilters;
  onFiltersChange: (filters: MemoryFilters) => void;
}

const typeButtons: { type: ContentType | null; label: string; icon: any }[] = [
  { type: null, label: "Alla", icon: null },
  { type: "image", label: "Bilder", icon: Image },
  { type: "link", label: "Länkar", icon: Link2 },
  { type: "article", label: "Artiklar", icon: FileText },
  { type: "thought", label: "Tankar", icon: Lightbulb },
  { type: "youtube", label: "YouTube", icon: Youtube },
  { type: "linkedin", label: "LinkedIn", icon: Link2 },
  { type: "instagram", label: "Instagram", icon: Image },
];

const sortOptions = [
  { value: "newest", label: "Nyast först" },
  { value: "oldest", label: "Äldst först" },
  { value: "title", label: "Titel A-Ö" },
];

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.query || "");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);
  const { tags } = useTags();
  const { createSpace } = useSpaces();
  const selectedTags = filters.tags || [];

  const hasActiveFilters = !!(
    filters.query ||
    filters.content_type ||
    filters.favorites_only ||
    (filters.tags && filters.tags.length > 0) ||
    filters.sort && filters.sort !== "newest"
  );

  useEffect(() => {
    setSearchInput(filters.query || "");
  }, [filters.query]);

  useEffect(() => {
    if (debouncedSearch !== filters.query) {
      onFiltersChange({ ...filters, query: debouncedSearch || undefined });
    }
  }, [debouncedSearch]);

  return (
    <div className="space-y-3 animate-fade-in stagger-1">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="Sök i minnen..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-border/80 bg-card text-[13px] font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/25 transition-all"
        />
      </div>

      {/* Type filters + sort */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-0.5 bg-muted/60 rounded-xl p-1 overflow-x-auto max-w-full scrollbar-none">
          {typeButtons.map(({ type, label, icon: Icon }) => {
            const isActive =
              filters.content_type === type ||
              (!filters.content_type && type === null);
            return (
              <button
                key={type || "all"}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    content_type: type || undefined,
                  })
                }
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200",
                  isActive
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {Icon && <Icon className="h-3 w-3" strokeWidth={1.5} />}
                {label}
              </button>
            );
          })}

          <div className="w-px h-4 bg-border/60 mx-1" />

          <button
            onClick={() =>
              onFiltersChange({
                ...filters,
                favorites_only: !filters.favorites_only,
              })
            }
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200",
              filters.favorites_only
                ? "bg-amber-50 text-amber-700 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Star
              className={cn(
                "h-3 w-3",
                filters.favorites_only && "fill-amber-400"
              )}
            />
            Favoriter
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => setSaveDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-primary hover:bg-primary/8 border border-primary/15 transition-all"
              title="Spara som Space"
            >
              <Bookmark className="h-3 w-3" />
              Spara
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3 w-3 text-muted-foreground/50" />
            <select
              value={filters.sort || "newest"}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  sort: e.target.value as MemoryFilters["sort"],
                })
              }
              className="px-2.5 py-1.5 rounded-lg border border-border/80 bg-card text-[11px] font-semibold text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tag filters */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <Tag className="h-3 w-3 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
          <div className="flex items-center gap-1.5">
            {tags.map((tag) => {
              const isActive = selectedTags.includes(tag.name);
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    const next = isActive
                      ? selectedTags.filter((t) => t !== tag.name)
                      : [...selectedTags, tag.name];
                    onFiltersChange({
                      ...filters,
                      tags: next.length > 0 ? next : undefined,
                    });
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all duration-200 border",
                    isActive
                      ? "bg-primary/8 text-primary border-primary/15"
                      : "bg-card text-muted-foreground border-border/60 hover:border-primary/15 hover:text-foreground"
                  )}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <SaveSpaceDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={(name) => createSpace(name, filters)}
      />
    </div>
  );
}
