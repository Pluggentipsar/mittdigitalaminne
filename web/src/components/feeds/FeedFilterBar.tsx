"use client";

import {
  Rss,
  Youtube,
  Headphones,
  Mail,
  SlidersHorizontal,
  FileText,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedFilterBarProps {
  activeType: string | null;
  onTypeChange: (type: string | null) => void;
  unreadOnly: boolean;
  onUnreadChange: (v: boolean) => void;
  sort: "newest" | "oldest" | "relevance" | "smart";
  onSortChange: (s: "newest" | "oldest" | "relevance" | "smart") => void;
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: string[];
}

const typeFilters = [
  { value: null, label: "Alla", icon: Rss },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "podcast", label: "Podcasts", icon: Headphones },
  { value: "rss", label: "Artiklar", icon: FileText },
  { value: "newsletter", label: "Nyhetsbrev", icon: Mail },
] as const;

export function FeedFilterBar({
  activeType,
  onTypeChange,
  unreadOnly,
  onUnreadChange,
  sort,
  onSortChange,
  activeCategory,
  onCategoryChange,
  categories,
}: FeedFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Row 1: Type filters + unread + sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type filters */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
          {typeFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => onTypeChange(f.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                activeType === f.value
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground/50 hover:text-foreground"
              )}
            >
              <f.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Unread toggle */}
        <button
          onClick={() => onUnreadChange(!unreadOnly)}
          className={cn(
            "px-3 py-1.5 rounded-xl text-[12px] font-medium border transition-all",
            unreadOnly
              ? "bg-primary/8 border-primary/30 text-primary"
              : "border-border/50 text-muted-foreground/50 hover:border-border hover:text-foreground"
          )}
        >
          Olästa
        </button>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-1">
          <SlidersHorizontal
            className="h-3.5 w-3.5 text-muted-foreground/30"
            strokeWidth={1.5}
          />
          <select
            value={sort}
            onChange={(e) =>
              onSortChange(
                e.target.value as "newest" | "oldest" | "relevance" | "smart"
              )
            }
            className="text-[12px] font-medium text-muted-foreground/50 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option value="smart">Smart mix</option>
            <option value="newest">Senaste</option>
            <option value="oldest">Äldsta</option>
            <option value="relevance">Relevans</option>
          </select>
        </div>
      </div>

      {/* Row 2: Category pills (only shown if categories exist) */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mb-0.5">
          <Hash
            className="h-3 w-3 text-muted-foreground/30 shrink-0"
            strokeWidth={2}
          />
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              "shrink-0 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all",
              activeCategory === null
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/40 hover:text-foreground hover:bg-accent"
            )}
          >
            Alla ämnen
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                onCategoryChange(activeCategory === cat ? null : cat)
              }
              className={cn(
                "shrink-0 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all capitalize",
                activeCategory === cat
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/40 hover:text-foreground hover:bg-accent"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
