"use client";

import {
  Rss,
  Youtube,
  Headphones,
  Mail,
  SlidersHorizontal,
  FileText,
  Tag,
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
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  availableTags: string[];
}

const typeFilters = [
  { value: null, label: "Alla", icon: Rss },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "podcast", label: "Poddar", icon: Headphones },
  { value: "rss", label: "Artiklar", icon: FileText },
  { value: "newsletter", label: "Brev", icon: Mail },
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
  activeTag,
  onTagChange,
  availableTags,
}: FeedFilterBarProps) {
  // Merge categories and tags into unified topics list, deduplicated
  const allTopics = Array.from(
    new Set([
      ...categories.map((c) => c.toLowerCase()),
      ...availableTags.map((t) => t.toLowerCase()),
    ])
  ).sort();

  // Determine which filter is active (category or tag — they share one selection)
  const activeTopic = activeCategory || activeTag || null;

  const handleTopicChange = (topic: string | null) => {
    if (topic === null) {
      onCategoryChange(null);
      onTagChange(null);
      return;
    }
    // If it's a category, filter by category; if it's a tag, filter by tag
    // If it's in both, prefer category (source-level = broader filter)
    const isCat = categories.some((c) => c.toLowerCase() === topic);
    if (isCat) {
      onCategoryChange(topic);
      onTagChange(null);
    } else {
      onCategoryChange(null);
      onTagChange(topic);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Row 1: Type icons + unread + sort — all in one line */}
      <div className="flex items-center gap-2">
        {/* Type filter pills */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-0.5 overflow-x-auto">
          {typeFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => onTypeChange(f.value)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap",
                activeType === f.value
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground/45 hover:text-foreground"
              )}
              title={f.label}
            >
              <f.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Unread toggle */}
        <button
          onClick={() => onUnreadChange(!unreadOnly)}
          className={cn(
            "shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
            unreadOnly
              ? "bg-primary/8 border-primary/30 text-primary"
              : "border-border/40 text-muted-foreground/40 hover:border-border hover:text-foreground"
          )}
        >
          Olästa
        </button>

        {/* Sort — pushed right */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <SlidersHorizontal
            className="h-3 w-3 text-muted-foreground/25"
            strokeWidth={1.5}
          />
          <select
            value={sort}
            onChange={(e) =>
              onSortChange(
                e.target.value as "newest" | "oldest" | "relevance" | "smart"
              )
            }
            className="text-[11px] font-medium text-muted-foreground/45 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option value="smart">Smart mix</option>
            <option value="newest">Senaste</option>
            <option value="oldest">Äldsta</option>
            <option value="relevance">Relevans</option>
          </select>
        </div>
      </div>

      {/* Row 2: Unified topics (merged categories + tags) */}
      {allTopics.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 -mb-0.5 scrollbar-none">
          <Tag
            className="h-3 w-3 text-muted-foreground/25 shrink-0"
            strokeWidth={2}
          />
          <button
            onClick={() => handleTopicChange(null)}
            className={cn(
              "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all",
              activeTopic === null
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/35 hover:text-foreground hover:bg-accent"
            )}
          >
            Alla
          </button>
          {allTopics.map((topic) => (
            <button
              key={topic}
              onClick={() =>
                handleTopicChange(activeTopic === topic ? null : topic)
              }
              className={cn(
                "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all capitalize",
                activeTopic === topic
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/35 hover:text-foreground hover:bg-accent"
              )}
            >
              {topic}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
