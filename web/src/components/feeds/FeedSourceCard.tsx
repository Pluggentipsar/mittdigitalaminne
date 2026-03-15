"use client";

import { useState, useRef, useEffect } from "react";
import {
  Trash2,
  Pause,
  Play,
  RefreshCw,
  AlertCircle,
  Rss,
  Youtube,
  Headphones,
  Mail,
  Hash,
  Plus,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedSource } from "@/lib/types";

interface FeedSourceCardProps {
  source: FeedSource;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  existingCategories?: string[];
}

function feedTypeIcon(type: string) {
  switch (type) {
    case "youtube":
      return Youtube;
    case "podcast":
      return Headphones;
    case "newsletter":
      return Mail;
    default:
      return Rss;
  }
}

function feedTypeLabel(type: string) {
  switch (type) {
    case "youtube":
      return "YouTube";
    case "podcast":
      return "Podcast";
    case "newsletter":
      return "Nyhetsbrev";
    default:
      return "RSS";
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Aldrig";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m sedan`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h sedan`;
  const days = Math.floor(hours / 24);
  return `${days}d sedan`;
}

/** Parse comma-separated categories into an array */
function parseCategories(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

/** Join categories back to comma-separated string */
function joinCategories(cats: string[]): string {
  return cats.join(", ");
}

export function FeedSourceCard({
  source,
  onDelete,
  onToggleActive,
  onUpdate,
  existingCategories = [],
}: FeedSourceCardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const [catInput, setCatInput] = useState("");
  const [localCats, setLocalCats] = useState<string[]>(() =>
    parseCategories(source.category)
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = feedTypeIcon(source.feed_type);

  // Sync local categories when source changes
  useEffect(() => {
    setLocalCats(parseCategories(source.category));
  }, [source.category]);

  // Focus input when editing
  useEffect(() => {
    if (editingCategories && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCategories]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/feeds/fetch");
    } finally {
      setRefreshing(false);
    }
  };

  const addCategory = (cat: string) => {
    const normalized = cat.trim().toLowerCase();
    if (!normalized || localCats.includes(normalized)) return;
    const newCats = [...localCats, normalized];
    setLocalCats(newCats);
    setCatInput("");
  };

  const removeCategory = (cat: string) => {
    const newCats = localCats.filter((c) => c !== cat);
    setLocalCats(newCats);
  };

  const saveCategories = () => {
    // Add any remaining input text
    if (catInput.trim()) {
      addCategory(catInput);
      const finalCats = catInput.trim().toLowerCase()
        ? [...localCats, catInput.trim().toLowerCase()]
        : localCats;
      const unique = Array.from(new Set(finalCats));
      setLocalCats(unique);
      onUpdate(source.id, { category: joinCategories(unique) || null });
    } else {
      onUpdate(source.id, {
        category: joinCategories(localCats) || null,
      });
    }
    setCatInput("");
    setEditingCategories(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (catInput.trim()) {
        addCategory(catInput);
      }
    }
    if (e.key === "Escape") {
      setEditingCategories(false);
      setLocalCats(parseCategories(source.category));
      setCatInput("");
    }
    if (e.key === "Backspace" && !catInput && localCats.length > 0) {
      removeCategory(localCats[localCats.length - 1]);
    }
  };

  // Suggestions: existing categories not already added
  const suggestions = existingCategories.filter(
    (c) => !localCats.includes(c.toLowerCase())
  );

  return (
    <div className="group relative rounded-2xl border border-border/50 bg-card p-4 md:p-5 shadow-xs transition-all hover:border-border/80 hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
          style={{ backgroundColor: `${source.color}15` }}
        >
          {source.icon_url ? (
            <img
              src={source.icon_url}
              alt=""
              className="w-5 h-5 rounded object-contain"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
              }}
            />
          ) : (
            <Icon
              className="h-5 w-5"
              style={{ color: source.color }}
              strokeWidth={1.5}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-foreground truncate">
            {source.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                color: source.color,
                backgroundColor: `${source.color}15`,
              }}
            >
              {feedTypeLabel(source.feed_type)}
            </span>
            {!source.is_active && (
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                Pausad
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Categories section */}
      <div className="mb-3">
        {!editingCategories ? (
          <button
            onClick={() => setEditingCategories(true)}
            className="flex items-center gap-1.5 flex-wrap group/cat"
          >
            {localCats.length > 0 ? (
              localCats.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/6 text-primary/70 text-[10px] font-semibold capitalize"
                >
                  <Hash className="h-2.5 w-2.5" strokeWidth={2} />
                  {cat}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-muted-foreground/30 text-[10px] font-medium group-hover/cat:text-muted-foreground/50 transition-colors">
                <Plus className="h-2.5 w-2.5" strokeWidth={2} />
                Lägg till ämne
              </span>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            {/* Tag input */}
            <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl border border-primary/30 bg-background min-h-[36px]">
              {localCats.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold capitalize"
                >
                  {cat}
                  <button
                    onClick={() => removeCategory(cat)}
                    className="p-0.5 rounded hover:bg-primary/20 transition-colors"
                  >
                    <X className="h-2.5 w-2.5" strokeWidth={2} />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={localCats.length === 0 ? "t.ex. AI, Skola..." : "Lägg till..."}
                className="flex-1 min-w-[80px] text-[12px] bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
              />
              <button
                onClick={saveCategories}
                className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                title="Spara"
              >
                <Check className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {suggestions.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => addCategory(cat)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground/40 text-[10px] font-medium hover:text-foreground hover:bg-muted transition-all capitalize"
                  >
                    <Plus className="h-2 w-2" strokeWidth={2} />
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground/40 font-medium mb-3">
        <span>{source.item_count} objekt</span>
        <span>Hämtad {timeAgo(source.last_fetched_at)}</span>
      </div>

      {/* Error state */}
      {source.last_error && (
        <div className="flex items-center gap-2 text-[11px] text-destructive/70 bg-destructive/5 rounded-lg px-3 py-2 mb-3">
          <AlertCircle
            className="h-3.5 w-3.5 shrink-0"
            strokeWidth={1.5}
          />
          <span className="truncate">{source.last_error}</span>
        </div>
      )}

      {/* Actions — compact on mobile */}
      <div className="flex items-center gap-0.5 pt-2 border-t border-border/30">
        <button
          onClick={() => onToggleActive(source.id, !source.is_active)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all",
            source.is_active
              ? "text-muted-foreground/50 hover:text-foreground hover:bg-accent"
              : "text-primary hover:bg-primary/8"
          )}
        >
          {source.is_active ? (
            <>
              <Pause className="h-3 w-3" strokeWidth={1.5} />
              <span className="hidden xs:inline">Pausa</span>
            </>
          ) : (
            <>
              <Play className="h-3 w-3" strokeWidth={1.5} />
              <span className="hidden xs:inline">Aktivera</span>
            </>
          )}
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all disabled:opacity-40"
        >
          <RefreshCw
            className={cn("h-3 w-3", refreshing && "animate-spin")}
            strokeWidth={1.5}
          />
          <span className="hidden xs:inline">Hämta</span>
        </button>
        <button
          onClick={() => {
            if (
              confirm(
                `Ta bort "${source.name}" och alla dess flödesobjekt?`
              )
            ) {
              onDelete(source.id);
            }
          }}
          className="ml-auto flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground/50 hover:text-destructive hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
        >
          <Trash2 className="h-3 w-3" strokeWidth={1.5} />
          <span className="hidden xs:inline">Ta bort</span>
        </button>
      </div>
    </div>
  );
}
