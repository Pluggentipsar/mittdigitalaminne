"use client";

import { useState, useRef } from "react";
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
  Hash,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeDate, contentTypeConfig } from "@/lib/utils";
import { ContentTypeIcon } from "@/components/memories/ContentTypeIcon";
import type { Memory, FeedItem } from "@/lib/types";

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

function getDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

// ─── Hero Memory Card (large, featured) ─────────────────────

function HeroMemoryCard({
  memory,
  onArchive,
}: {
  memory: Memory;
  onArchive: (id: string) => void;
}) {
  const config = contentTypeConfig[memory.content_type];
  const domain = getDomain(memory.link_url);
  const thumbnail =
    memory.image_url ||
    memory.link_metadata?.og_image ||
    memory.link_metadata?.thumbnail_url;
  const isYoutube = memory.content_type === "youtube";
  const videoId = memory.link_url ? extractVideoId(memory.link_url) : null;
  const ytThumb =
    thumbnail ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
  const displayText = memory.summary || memory.original_content;

  return (
    <Link href={`/minnen/${memory.id}`}>
      <div className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/50 via-primary/25 to-transparent" />

        {/* Large thumbnail */}
        {(isYoutube ? ytThumb : thumbnail) && (
          <div className={cn("relative bg-muted", isYoutube ? "aspect-video" : "h-48 sm:h-56")}>
            <img
              src={(isYoutube ? ytThumb : thumbnail) as string}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.classList.add("hidden");
              }}
            />
            {isYoutube && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                <div className="w-16 h-11 bg-black/70 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                </div>
              </div>
            )}
            {/* Gradient overlay for text readability */}
            {!isYoutube && (
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            )}
          </div>
        )}

        <div className="p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div
              className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
              style={{ backgroundColor: `${config.hex}15` }}
            >
              <ContentTypeIcon type={memory.content_type} className="h-3.5 w-3.5" />
            </div>
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide", config.badgeClass)}>
              {config.label}
            </span>
            {domain && (
              <span className="text-[11px] text-muted-foreground/40 truncate">
                {domain}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground/30 ml-auto shrink-0">
              {relativeDate(memory.created_at)}
            </span>
          </div>

          <h3 className="text-[17px] md:text-[19px] font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {memory.title}
          </h3>

          {displayText && displayText.length > 40 && (
            <p className="text-[13px] md:text-[14px] text-muted-foreground/55 leading-relaxed line-clamp-3 mt-2">
              {displayText}
            </p>
          )}

          {memory.tags && memory.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {memory.tags.slice(0, 5).map((tag) => (
                <span
                  key={typeof tag === "string" ? tag : tag.id}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium text-muted-foreground/40 bg-muted/50"
                >
                  <Hash className="h-2 w-2" strokeWidth={2} />
                  {typeof tag === "string" ? tag : tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Compact Memory Card (for grid) ─────────────────────────

function MemoryCard({
  memory,
  onArchive,
}: {
  memory: Memory;
  onArchive: (id: string) => void;
}) {
  const config = contentTypeConfig[memory.content_type];
  const domain = getDomain(memory.link_url);
  const thumbnail =
    memory.image_url ||
    memory.link_metadata?.og_image ||
    memory.link_metadata?.thumbnail_url;
  const isYoutube = memory.content_type === "youtube";
  const videoId = memory.link_url ? extractVideoId(memory.link_url) : null;
  const ytThumb =
    thumbnail ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);
  const displayText = memory.summary || memory.original_content;

  return (
    <Link href={`/minnen/${memory.id}`}>
      <div className="group relative h-full rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/40 via-primary/15 to-transparent" />

        {isYoutube && ytThumb && (
          <div className="relative aspect-video bg-muted">
            <img src={ytThumb} alt="" className="w-full h-full object-cover" loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.classList.add("hidden"); }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-9 bg-black/70 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">
                <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </div>
        )}

        {!isYoutube && thumbnail && (
          <div className="h-28 bg-muted">
            <img src={thumbnail as string} alt="" className="w-full h-full object-cover" loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center justify-center w-4 h-4 rounded shrink-0"
              style={{ backgroundColor: `${config.hex}15` }}>
              <ContentTypeIcon type={memory.content_type} className="h-2.5 w-2.5" />
            </div>
            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-semibold", config.badgeClass)}>
              {config.label}
            </span>
            <span className="text-[9px] text-muted-foreground/25 ml-auto">
              {relativeDate(memory.created_at)}
            </span>
          </div>

          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">
            {memory.title}
          </h3>

          {displayText && displayText.length > 50 && (
            <p className="text-[11px] text-muted-foreground/45 leading-relaxed line-clamp-2 mt-1">
              {displayText}
            </p>
          )}

          {memory.tags && memory.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {memory.tags.slice(0, 3).map((tag) => (
                <span key={typeof tag === "string" ? tag : tag.id}
                  className="px-1.5 py-0.5 rounded text-[8px] font-medium text-muted-foreground/35 bg-muted/40">
                  #{typeof tag === "string" ? tag : tag.name}
                </span>
              ))}
            </div>
          )}

          {memory.is_inbox && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/15">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onArchive(memory.id); }}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold text-muted-foreground/40 hover:text-amber-600 hover:bg-amber-500/8 transition-all">
                <Archive className="h-2.5 w-2.5" /> Arkivera
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Feed Suggestion Card (for grid) ────────────────────────

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
    try { await onSave(item.id); } finally { setSaving(false); }
  };

  const source = item.source;
  const feedType = source?.feed_type;
  const favicon = getSourceFavicon(source);
  const isPodcast = feedType === "podcast";

  const feedTypeColor =
    feedType === "youtube" ? "text-red-500/60 bg-red-500/6" :
    feedType === "podcast" ? "text-emerald-500/60 bg-emerald-500/6" :
    feedType === "newsletter" ? "text-indigo-500/60 bg-indigo-500/6" :
    "text-amber-500/60 bg-amber-500/6";

  return (
    <div
      className={cn(
        "group relative h-full rounded-2xl border bg-card/80 overflow-hidden transition-all duration-200",
        "hover:border-border/80 hover:shadow-lg cursor-pointer",
        "border-border/40",
        item.is_read && "opacity-55"
      )}
      onClick={() => onClick(item)}
    >
      {/* Article image */}
      {item.image_url && (
        <div className="h-28 bg-muted">
          <img src={item.image_url} alt="" className="w-full h-full object-cover" loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <div className="shrink-0">
            {isPodcast && (item.image_url || source?.icon_url) ? (
              <div className="w-4 h-4 rounded overflow-hidden bg-muted">
                <img src={item.image_url || source?.icon_url || ""} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ) : favicon && !imgError ? (
              <img src={favicon} alt="" className="w-4 h-4 rounded object-contain" onError={() => setImgError(true)} />
            ) : (
              <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                <Rss className="h-2 w-2 text-muted-foreground/30" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-semibold", feedTypeColor)}>
            Flöde
          </span>
          <span className="text-[10px] font-medium text-muted-foreground/40 truncate">
            {source?.name || "Okänd"}
          </span>
          <span className="text-[9px] text-muted-foreground/25 ml-auto shrink-0">
            {timeAgo(item.published_at || item.fetched_at)}
          </span>
          {!item.is_read && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
          )}
        </div>

        <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 text-foreground/85 group-hover:text-foreground transition-colors">
          {item.title}
        </h3>

        {item.summary && (
          <p className="text-[11px] text-muted-foreground/45 leading-relaxed line-clamp-2 mt-1">
            {item.summary}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {item.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[8px] font-medium text-muted-foreground/30 bg-muted/40">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border/10">
          {item.relevance_score > 0.3 && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold text-amber-500/50 mr-1">
              <Sparkles className="h-2 w-2" />
              {Math.round(item.relevance_score * 100)}%
            </span>
          )}
          {!item.is_saved ? (
            <button onClick={(e) => { e.stopPropagation(); handleSave(); }} disabled={saving}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40">
              <BookmarkPlus className="h-2.5 w-2.5" strokeWidth={1.5} /> Spara
            </button>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold text-emerald-600 bg-emerald-500/5">
              <Check className="h-2.5 w-2.5" strokeWidth={2} /> Sparad
            </span>
          )}
          {item.link_url && (
            <a href={item.link_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold text-muted-foreground/30 hover:text-foreground hover:bg-accent transition-all ml-auto">
              <ExternalLink className="h-2 w-2" strokeWidth={1.5} /> Öppna
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── YouTube Carousel Card (for horizontal scroll) ──────────

function YouTubeCarouselCard({
  item,
  onSave,
  onClick,
}: {
  item: FeedItem;
  onSave: (id: string) => Promise<void>;
  onClick: (item: FeedItem) => void;
}) {
  const [saving, setSaving] = useState(false);
  const videoId = item.link_url ? extractVideoId(item.link_url) : null;
  const thumbnail = item.image_url || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);
  const source = item.source;

  return (
    <div
      className={cn(
        "group shrink-0 w-[280px] sm:w-[300px] rounded-2xl border border-border/40 bg-card overflow-hidden transition-all duration-200",
        "hover:border-red-500/30 hover:shadow-lg cursor-pointer",
        item.is_read && "opacity-55"
      )}
      onClick={() => onClick(item)}
    >
      {thumbnail && (
        <div className="relative aspect-video bg-muted">
          <img src={thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/15 transition-colors">
            <div className="w-12 h-9 bg-black/70 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            </div>
          </div>
          {/* Duration-like overlay */}
          {!item.is_read && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-sm" />
          )}
        </div>
      )}
      <div className="p-3">
        <h3 className="text-[12px] font-semibold leading-snug line-clamp-2 text-foreground/85 group-hover:text-foreground transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground/40 truncate">
            {source?.name || "YouTube"}
          </span>
          <span className="text-[9px] text-muted-foreground/25 shrink-0">
            {timeAgo(item.published_at || item.fetched_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── YouTube Carousel Section ────────────────────────────────

function YouTubeCarousel({
  items,
  onSave,
  onClick,
}: {
  items: FeedItem[];
  onSave: (id: string) => Promise<void>;
  onClick: (item: FeedItem) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="h-4 w-4 text-red-500/50" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
          <path d="M9.545 15.568V8.432L15.818 12z" fill="white" />
        </svg>
        <span className="text-[12px] font-semibold text-foreground/60">YouTube</span>
        <span className="text-[10px] text-muted-foreground/30">{items.length} klipp</span>

        {/* Scroll arrows */}
        {items.length > 2 && (
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => scroll("left")}
              className="w-7 h-7 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:border-border transition-all">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => scroll("right")}
              className="w-7 h-7 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:border-border transition-all">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1 snap-x snap-mandatory"
      >
        {items.map((item) => (
          <div key={item.id} className="snap-start">
            <YouTubeCarouselCard item={item} onSave={onSave} onClick={onClick} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section Divider ─────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="flex items-center gap-4 py-1">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/30 to-transparent" />
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
      unified.push({ kind: "memory", sortDate: new Date(m.created_at), memory: m });
    }
  }

  if (activeTab !== "memories") {
    for (const fi of feedItems) {
      unified.push({ kind: "feed", sortDate: new Date(fi.published_at || fi.fetched_at), feedItem: fi });
    }
  }

  unified.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  const isLoading = feedLoading || memoriesLoading;
  const memoryCount = memories.length;
  const feedCount = feedItems.filter((f) => !f.is_read).length;

  const tabs: { key: FeedTab; label: string; count?: number }[] = [
    { key: "all", label: "Allt" },
    { key: "memories", label: "Dina minnen", count: memoryCount },
    { key: "suggestions", label: "Från flödet", count: feedCount },
  ];

  // Separate YouTube feed items for carousel
  const ytFeedItems = feedItems.filter((fi) => fi.source?.feed_type === "youtube");

  // Non-YouTube items for the grid
  const gridItems = unified.filter(
    (u) => !(u.kind === "feed" && u.feedItem?.source?.feed_type === "youtube")
  );

  // Hero: first non-YouTube item with good content (has thumbnail or long summary)
  const heroIdx = gridItems.findIndex((u) => {
    if (u.kind === "memory" && u.memory) {
      const m = u.memory;
      return m.image_url || m.link_metadata?.og_image || (m.summary && m.summary.length > 80);
    }
    if (u.kind === "feed" && u.feedItem) {
      return u.feedItem.image_url || (u.feedItem.summary && u.feedItem.summary.length > 80);
    }
    return false;
  });

  const heroItem = heroIdx >= 0 ? gridItems[heroIdx] : null;
  const remainingItems = heroItem ? gridItems.filter((_, i) => i !== heroIdx) : gridItems;

  return (
    <div className="space-y-6">
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
              <span className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                activeTab === tab.key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground/50"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}

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
        <div className="space-y-5">
          {/* Hero skeleton */}
          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="skeleton h-48" />
            <div className="p-5 space-y-2">
              <div className="flex gap-2"><div className="skeleton w-6 h-6 rounded-lg" /><div className="skeleton h-3 w-20 rounded-md" /></div>
              <div className="skeleton h-5 w-3/4 rounded-md" />
              <div className="skeleton h-3 w-full rounded-md" />
              <div className="skeleton h-3 w-2/3 rounded-md" />
            </div>
          </div>
          {/* Grid skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card overflow-hidden">
                <div className="skeleton h-28" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-3 w-20 rounded-md" />
                  <div className="skeleton h-4 w-3/4 rounded-md" />
                  <div className="skeleton h-3 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
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
            {activeTab === "memories" ? "Inga minnen ännu" : activeTab === "suggestions" ? "Inga förslag just nu" : "Inget att visa ännu"}
          </h3>
          <p className="text-[13px] text-muted-foreground/40 max-w-xs">
            {activeTab === "suggestions"
              ? "Lägg till RSS-källor, YouTube-kanaler eller poddar i ditt flöde."
              : "Använd + knappen för att spara din första länk eller tanke!"}
          </p>
          {activeTab === "suggestions" && (
            <Link href="/flode/kallor"
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-all">
              <Rss className="h-3.5 w-3.5" /> Lägg till källa
            </Link>
          )}
        </div>
      )}

      {/* ─── Magazine Layout ─── */}
      {!isLoading && unified.length > 0 && (
        <div className="space-y-7">
          {/* Hero card — first rich item */}
          {heroItem && (
            heroItem.kind === "memory" && heroItem.memory ? (
              <HeroMemoryCard memory={heroItem.memory} onArchive={onArchiveMemory} />
            ) : heroItem.kind === "feed" && heroItem.feedItem ? (
              <div onClick={() => onFeedItemClick(heroItem.feedItem!)} className="cursor-pointer">
                <HeroFeedCard item={heroItem.feedItem} onSave={onSaveFeedItem} />
              </div>
            ) : null
          )}

          {/* YouTube horizontal carousel */}
          {activeTab !== "memories" && ytFeedItems.length > 0 && (
            <>
              <SectionDivider />
              <YouTubeCarousel items={ytFeedItems} onSave={onSaveFeedItem} onClick={onFeedItemClick} />
            </>
          )}

          {/* Grid of remaining items — 2 columns on desktop */}
          {remainingItems.length > 0 && (
            <>
              <SectionDivider />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {remainingItems.map((u) => {
                  if (u.kind === "memory" && u.memory) {
                    return <MemoryCard key={`mem-${u.memory.id}`} memory={u.memory} onArchive={onArchiveMemory} />;
                  }
                  if (u.kind === "feed" && u.feedItem) {
                    return <SuggestionCard key={`feed-${u.feedItem.id}`} item={u.feedItem} onSave={onSaveFeedItem} onMarkRead={onMarkRead} onClick={onFeedItemClick} />;
                  }
                  return null;
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer link */}
      {unified.length > 0 && (
        <div className="flex items-center justify-center pt-3 pb-6">
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

// ─── Hero Feed Card (large, for featured feed item) ──────────

function HeroFeedCard({
  item,
  onSave,
}: {
  item: FeedItem;
  onSave: (id: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const source = item.source;
  const favicon = getSourceFavicon(source);

  const feedTypeColor =
    source?.feed_type === "podcast" ? "text-emerald-500/60 bg-emerald-500/6" :
    source?.feed_type === "newsletter" ? "text-indigo-500/60 bg-indigo-500/6" :
    "text-amber-500/60 bg-amber-500/6";

  return (
    <div className="group relative rounded-2xl border border-border/40 bg-card/80 overflow-hidden transition-all duration-300 hover:border-border/80 hover:shadow-xl">
      {item.image_url && (
        <div className="h-48 sm:h-56 bg-muted relative">
          <img src={item.image_url} alt="" className="w-full h-full object-cover" loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        </div>
      )}

      <div className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          {favicon && <img src={favicon} alt="" className="w-5 h-5 rounded-md object-contain" />}
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-semibold", feedTypeColor)}>
            <Rss className="h-2 w-2 inline mr-0.5 -mt-px" /> Flöde
          </span>
          <span className="text-[11px] font-medium text-muted-foreground/50">
            {source?.name || "Okänd"}
          </span>
          <span className="text-[11px] text-muted-foreground/30 ml-auto">
            {timeAgo(item.published_at || item.fetched_at)}
          </span>
          {!item.is_read && <span className="w-2 h-2 rounded-full bg-primary/70 shrink-0" />}
        </div>

        <h3 className="text-[17px] md:text-[19px] font-semibold leading-snug line-clamp-2 text-foreground/90 group-hover:text-foreground transition-colors">
          {item.title}
        </h3>

        {item.summary && (
          <p className="text-[13px] md:text-[14px] text-muted-foreground/50 leading-relaxed line-clamp-3 mt-2">
            {item.summary}
          </p>
        )}

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/15">
          {item.relevance_score > 0.3 && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500/50">
              <Sparkles className="h-2.5 w-2.5" /> {Math.round(item.relevance_score * 100)}% match
            </span>
          )}
          {!item.is_saved ? (
            <button onClick={(e) => { e.stopPropagation(); setSaving(true); onSave(item.id).finally(() => setSaving(false)); }} disabled={saving}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all">
              <BookmarkPlus className="h-3 w-3" strokeWidth={1.5} /> Spara till minne
            </button>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold text-emerald-600 bg-emerald-500/5">
              <Check className="h-3 w-3" strokeWidth={2} /> Sparad
            </span>
          )}
          {item.link_url && (
            <a href={item.link_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold text-muted-foreground/35 hover:text-foreground hover:bg-accent transition-all ml-auto">
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} /> Öppna
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
