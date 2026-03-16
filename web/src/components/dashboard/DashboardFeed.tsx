"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  BookmarkPlus,
  Check,
  ExternalLink,
  Archive,
  Pencil,
  Sparkles,
  Rss,
  ArrowRight,
  Inbox,
  Play,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeDate, contentTypeConfig } from "@/lib/utils";
import { ContentTypeIcon } from "@/components/memories/ContentTypeIcon";
import type { Memory, FeedItem, ContentType } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────

type FeedTab = "all" | "memories" | "suggestions";

interface UnifiedItem {
  kind: "memory" | "feed";
  sortDate: Date;
  memory?: Memory;
  feedItem?: FeedItem;
}

interface DashboardFeedProps {
  memories: Memory[];
  feedItems: FeedItem[];
  feedLoading: boolean;
  memoriesLoading: boolean;
  onSaveFeedItem: (id: string) => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
  onArchiveMemory: (id: string) => void;
  onFeedItemClick: (item: FeedItem) => void;
}

// ─── Helpers ─────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m sedan`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h sedan`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d sedan`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}v sedan`;
  return date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
  } catch {}
  return null;
}

function getSourceFavicon(source: FeedItem["source"]): string | null {
  if (source?.icon_url) return source.icon_url;
  const siteUrl = source?.site_url || source?.feed_url;
  if (!siteUrl) return null;
  try {
    const domain = new URL(siteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

// ─── Memory Card (compact, for the unified feed) ─────────────

function MemoryCard({
  memory,
  onArchive,
}: {
  memory: Memory;
  onArchive: (id: string) => void;
}) {
  const config = contentTypeConfig[memory.content_type];
  const domain = memory.link_url
    ? (() => {
        try {
          return new URL(memory.link_url).hostname.replace("www.", "");
        } catch {
          return null;
        }
      })()
    : null;

  const thumbnail =
    memory.image_url ||
    memory.link_metadata?.og_image ||
    memory.link_metadata?.thumbnail_url;

  const isYoutube = memory.content_type === "youtube";
  const videoId = memory.link_url ? extractVideoId(memory.link_url) : null;
  const ytThumb =
    thumbnail ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card overflow-hidden transition-all duration-200 hover:border-border/80 hover:shadow-md",
        "border-border/50"
      )}
    >
      {/* Memory indicator strip */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />

      {/* YouTube thumbnail */}
      {isYoutube && ytThumb && (
        <div className="relative aspect-video bg-muted">
          <img
            src={ytThumb}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.classList.add("hidden");
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-9 bg-black/70 rounded-xl flex items-center justify-center">
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3.5 p-4">
        {/* Type icon */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5"
          style={{ backgroundColor: `${config.hex}10` }}
        >
          <ContentTypeIcon type={memory.content_type} className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-primary/60 bg-primary/6">
              Ditt minne
            </span>
            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide", config.badgeClass)}>
              {config.label}
            </span>
            {domain && (
              <span className="text-[10px] text-muted-foreground/35 truncate hidden sm:inline">
                {domain}
              </span>
            )}
          </div>

          <Link href={`/minnen/${memory.id}`}>
            <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 text-foreground/90 hover:text-primary transition-colors">
              {memory.title}
            </h3>
          </Link>

          {memory.summary && (
            <p className="text-[11px] text-muted-foreground/50 leading-relaxed line-clamp-1 mt-0.5">
              {memory.summary}
            </p>
          )}

          {/* Non-YouTube thumbnail inline */}
          {!isYoutube && thumbnail && (
            <div className="mt-2 w-full max-w-[200px] h-24 rounded-lg overflow-hidden bg-muted">
              <img
                src={thumbnail as string}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.style.display = "none";
                }}
              />
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-muted-foreground/30 font-medium tabular-nums">
              {relativeDate(memory.created_at)}
            </span>

            {memory.is_inbox && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/minnen/${memory.id}/redigera`}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all"
                >
                  <Pencil className="h-2.5 w-2.5" />
                  Bearbeta
                </Link>
                <button
                  onClick={() => onArchive(memory.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground/50 hover:text-amber-600 hover:bg-amber-500/8 transition-all"
                >
                  <Archive className="h-2.5 w-2.5" />
                  Arkivera
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feed Suggestion Card (compact, with "Från ditt flöde" label) ────

function SuggestionCard({
  item,
  onSave,
  onMarkRead,
  onClick,
}: {
  item: FeedItem;
  onSave: (id: string) => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
  onClick: (item: FeedItem) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(item.id);
    } finally {
      setSaving(false);
    }
  };

  const source = item.source;
  const feedType = source?.feed_type;
  const favicon = getSourceFavicon(source);

  const isYoutube = feedType === "youtube";
  const isPodcast = feedType === "podcast";
  const videoId = item.link_url ? extractVideoId(item.link_url) : null;
  const thumbnail =
    item.image_url ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);

  const feedTypeLabel =
    feedType === "youtube" ? "YouTube" :
    feedType === "podcast" ? "Podd" :
    feedType === "newsletter" ? "Nyhetsbrev" :
    "RSS";

  const feedTypeColor =
    feedType === "youtube" ? "text-red-500/60 bg-red-500/6" :
    feedType === "podcast" ? "text-emerald-500/60 bg-emerald-500/6" :
    feedType === "newsletter" ? "text-indigo-500/60 bg-indigo-500/6" :
    "text-amber-500/60 bg-amber-500/6";

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card/60 overflow-hidden transition-all duration-200 hover:border-border/80 hover:shadow-md cursor-pointer",
        "border-border/40 border-dashed",
        item.is_read && "opacity-60"
      )}
      onClick={() => onClick(item)}
    >
      {/* YouTube thumbnail */}
      {isYoutube && thumbnail && (
        <div className="relative aspect-video bg-muted">
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.classList.add("hidden");
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-9 bg-black/70 group-hover:bg-red-600 rounded-xl flex items-center justify-center transition-colors">
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3.5 p-4">
        {/* Source icon */}
        <div className="shrink-0 mt-0.5">
          {isPodcast && (item.image_url || source?.icon_url) ? (
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-muted">
              <img
                src={item.image_url || source?.icon_url || ""}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.parentElement!.innerHTML = `<div class="w-full h-full bg-emerald-500/8 flex items-center justify-center"><svg class="h-4 w-4 text-emerald-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/></svg></div>`;
                }}
              />
            </div>
          ) : favicon && !imgError ? (
            <img
              src={favicon}
              alt=""
              className="w-7 h-7 rounded-md object-contain mt-1"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <Rss className="h-3.5 w-3.5 text-muted-foreground/30" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold", feedTypeColor)}>
              <Rss className="h-2 w-2" />
              Från flödet
            </span>
            <span className="text-[11px] font-medium text-muted-foreground/50 truncate">
              {source?.name || "Okänd källa"}
            </span>
            <span className="text-[10px] text-muted-foreground/25 shrink-0">
              {timeAgo(item.published_at || item.fetched_at)}
            </span>
            {!item.is_read && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
            )}
            {item.relevance_score > 0.3 && (
              <span className="flex items-center gap-0.5 text-[9px] font-semibold text-amber-500/60 shrink-0 ml-auto">
                <Sparkles className="h-2 w-2" />
                {Math.round(item.relevance_score * 100)}%
              </span>
            )}
          </div>

          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 text-foreground/85 group-hover:text-foreground transition-colors">
            {item.title}
          </h3>

          {item.summary && (
            <p className="text-[11px] text-muted-foreground/45 leading-relaxed line-clamp-2 mt-0.5">
              {item.summary}
            </p>
          )}

          {/* Non-YouTube image */}
          {!isYoutube && item.image_url && (
            <div className="mt-2 w-full max-w-[200px] h-24 rounded-lg overflow-hidden bg-muted hidden sm:block">
              <img
                src={item.image_url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 mt-2">
            {!item.is_saved ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                disabled={saving}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-muted-foreground/45 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40"
              >
                <BookmarkPlus className="h-3 w-3" strokeWidth={1.5} />
                Spara
              </button>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-emerald-600 bg-emerald-500/5">
                <Check className="h-3 w-3" strokeWidth={2} />
                Sparad
              </span>
            )}
            {item.link_url && (
              <a
                href={item.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-all ml-auto"
              >
                <ExternalLink className="h-2.5 w-2.5" strokeWidth={1.5} />
                Öppna
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function DashboardFeed({
  memories,
  feedItems,
  feedLoading,
  memoriesLoading,
  onSaveFeedItem,
  onMarkRead,
  onArchiveMemory,
  onFeedItemClick,
}: DashboardFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>("all");

  // Merge and sort by date
  const unified: UnifiedItem[] = [];

  if (activeTab !== "suggestions") {
    for (const m of memories) {
      unified.push({
        kind: "memory",
        sortDate: new Date(m.created_at),
        memory: m,
      });
    }
  }

  if (activeTab !== "memories") {
    for (const fi of feedItems) {
      unified.push({
        kind: "feed",
        sortDate: new Date(fi.published_at || fi.fetched_at),
        feedItem: fi,
      });
    }
  }

  unified.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  const isLoading = feedLoading || memoriesLoading;
  const memoryCount = memories.length;
  const feedCount = feedItems.filter((f) => !f.is_read).length;

  const tabs: { key: FeedTab; label: string; count?: number }[] = [
    { key: "all", label: "Allt" },
    { key: "memories", label: "Dina minnen", count: memoryCount },
    { key: "suggestions", label: "Förslag", count: feedCount },
  ];

  // Split YouTube suggestions for grid layout
  const youtubeItems = unified.filter(
    (u) => u.kind === "feed" && u.feedItem?.source?.feed_type === "youtube"
  );
  const otherItems = unified.filter(
    (u) => !(u.kind === "feed" && u.feedItem?.source?.feed_type === "youtube")
  );

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all duration-200",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground/50 hover:text-foreground hover:bg-accent"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                  activeTab === tab.key
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground/50"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}

        {/* Link to full feed */}
        <Link
          href="/flode"
          className="flex items-center gap-1 ml-auto px-3 py-2 rounded-xl text-[11px] font-medium text-muted-foreground/35 hover:text-primary transition-colors shrink-0 group"
        >
          Hela flödet
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && unified.length === 0 && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/40 bg-card p-4"
            >
              <div className="flex gap-3.5">
                <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-20 rounded-md" />
                  <div className="skeleton h-4 w-3/4 rounded-md" />
                  <div className="skeleton h-3 w-1/2 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && unified.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
            {activeTab === "suggestions" ? (
              <Rss className="h-6 w-6 text-muted-foreground/30" strokeWidth={1.5} />
            ) : (
              <Inbox className="h-6 w-6 text-muted-foreground/30" strokeWidth={1.5} />
            )}
          </div>
          <h3 className="heading-serif text-[18px] text-foreground/70 mb-1.5">
            {activeTab === "memories"
              ? "Inga senaste minnen"
              : activeTab === "suggestions"
                ? "Inga förslag just nu"
                : "Inget att visa ännu"
            }
          </h3>
          <p className="text-[13px] text-muted-foreground/40 max-w-xs">
            {activeTab === "suggestions"
              ? "Lägg till RSS-källor, YouTube-kanaler eller poddar i ditt flöde."
              : "Använd + knappen för att spara din första länk eller tanke!"
            }
          </p>
          {activeTab === "suggestions" && (
            <Link
              href="/flode/kallor"
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-all"
            >
              <Rss className="h-3.5 w-3.5" />
              Lägg till källa
            </Link>
          )}
        </div>
      )}

      {/* Unified feed */}
      {!isLoading && unified.length > 0 && (
        <div className="space-y-3">
          {/* YouTube grid if we have YouTube items */}
          {activeTab !== "memories" && youtubeItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1">
              {youtubeItems.slice(0, 4).map((u) => (
                <SuggestionCard
                  key={`feed-${u.feedItem!.id}`}
                  item={u.feedItem!}
                  onSave={onSaveFeedItem}
                  onMarkRead={onMarkRead}
                  onClick={onFeedItemClick}
                />
              ))}
            </div>
          )}

          {/* Other items as list */}
          {otherItems.map((u) => {
            if (u.kind === "memory" && u.memory) {
              return (
                <MemoryCard
                  key={`mem-${u.memory.id}`}
                  memory={u.memory}
                  onArchive={onArchiveMemory}
                />
              );
            }
            if (u.kind === "feed" && u.feedItem) {
              return (
                <SuggestionCard
                  key={`feed-${u.feedItem.id}`}
                  item={u.feedItem}
                  onSave={onSaveFeedItem}
                  onMarkRead={onMarkRead}
                  onClick={onFeedItemClick}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Footer link */}
      {unified.length > 0 && (
        <div className="flex items-center justify-center pt-2 pb-4">
          <Link
            href={activeTab === "suggestions" ? "/flode" : "/minnen"}
            className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/40 hover:text-primary transition-colors group"
          >
            {activeTab === "suggestions" ? "Se hela flödet" : "Se alla minnen"}
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
