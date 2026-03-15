"use client";

import { useState } from "react";
import {
  BookmarkPlus,
  Check,
  ExternalLink,
  Eye,
  Sparkles,
  Play,
  Headphones,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/types";

interface FeedItemCardProps {
  item: FeedItem;
  onSave: (id: string) => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
  onClick: (item: FeedItem) => void;
}

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

function feedTypeBadgeStyle(feedType: string | undefined): string {
  switch (feedType) {
    case "youtube":
      return "bg-red-500/8 text-red-500";
    case "podcast":
      return "bg-emerald-500/8 text-emerald-500";
    case "newsletter":
      return "bg-indigo-500/8 text-indigo-500";
    default:
      return "bg-amber-500/8 text-amber-500";
  }
}

/** Get a favicon URL for a source, with fallback to Google's favicon service */
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

/** Get the initial letter(s) for a source name */
function getSourceInitial(name: string | undefined): string {
  if (!name) return "?";
  // Use first letter of each word, max 2
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
  } catch {}
  return null;
}

/** YouTube card — large 16:9 thumbnail with play overlay */
function YouTubeCard({
  item,
  onSave,
  onClick,
  saving,
}: {
  item: FeedItem;
  onSave: () => void;
  onClick: () => void;
  saving: boolean;
}) {
  const source = item.source;
  const videoId = item.link_url ? extractVideoId(item.link_url) : null;
  const thumbnail =
    item.image_url ||
    (videoId
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : null);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-200 hover:border-border/80 hover:shadow-md cursor-pointer",
        item.is_read && "opacity-65"
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative aspect-video bg-muted">
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.classList.add(
                "hidden"
              );
            }}
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-10 bg-black/70 group-hover:bg-red-600 rounded-xl flex items-center justify-center transition-colors shadow-lg backdrop-blur-sm">
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            </div>
          </div>
          {/* Gradient bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 md:p-5">
        {/* Source + time */}
        <div className="flex items-center gap-2 mb-2">
          <SourceBadge source={source} />
          <span className="text-[12px] font-semibold text-muted-foreground/60 truncate">
            {source?.name || "YouTube"}
          </span>
          <span className="text-[11px] text-muted-foreground/30 shrink-0">
            {timeAgo(item.published_at || item.fetched_at)}
          </span>
          {item.relevance_score > 0.3 && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500/70 shrink-0 ml-auto">
              <Sparkles className="h-2.5 w-2.5" />
              {Math.round(item.relevance_score * 100)}%
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[15px] md:text-[16px] font-semibold text-foreground leading-snug mb-2 line-clamp-2">
          {item.title}
        </h3>

        {/* Summary */}
        {item.summary && (
          <p className="text-[13px] text-muted-foreground/55 leading-relaxed line-clamp-2 mb-3">
            {item.summary}
          </p>
        )}

        {/* Actions — always visible */}
        <div className="flex items-center gap-1.5 pt-1">
          {!item.is_saved ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40"
            >
              <BookmarkPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Spara
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-600 bg-emerald-500/5">
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Sparad
            </span>
          )}
          {item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all ml-auto"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              Öppna
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/** Podcast card — episode artwork with Spotify branding */
function PodcastCard({
  item,
  onSave,
  onClick,
  saving,
}: {
  item: FeedItem;
  onSave: () => void;
  onClick: () => void;
  saving: boolean;
}) {
  const source = item.source;

  return (
    <div
      className={cn(
        "group relative flex gap-4 md:gap-5 rounded-2xl border border-border/50 bg-card p-4 md:p-5 transition-all duration-200 hover:border-border/80 hover:shadow-md border-l-[3px] border-l-emerald-500/70 cursor-pointer",
        item.is_read && "opacity-65"
      )}
      onClick={onClick}
    >
      {/* Artwork */}
      <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-muted shadow-sm self-start">
        {item.image_url || source?.icon_url ? (
          <img
            src={item.image_url || source?.icon_url || ""}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.parentElement!.innerHTML =
                '<div class="w-full h-full bg-emerald-500/8 flex items-center justify-center"><svg class="h-8 w-8 text-emerald-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 18V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><circle cx="12" cy="12" r="4"></circle></svg></div>';
            }}
          />
        ) : (
          <div className="w-full h-full bg-emerald-500/8 flex items-center justify-center">
            <Headphones className="h-8 w-8 text-emerald-500/40" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Source + time */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500/70">
            <Headphones className="h-3 w-3" strokeWidth={2} />
            {source?.name || "Podcast"}
          </span>
          <span className="text-[10px] text-muted-foreground/30 shrink-0">
            {timeAgo(item.published_at || item.fetched_at)}
          </span>
          {item.relevance_score > 0.3 && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500/70 shrink-0 ml-auto">
              <Sparkles className="h-2.5 w-2.5" />
              {Math.round(item.relevance_score * 100)}%
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[14px] md:text-[15px] font-semibold text-foreground leading-snug mb-1.5 line-clamp-2">
          {item.title}
        </h3>

        {/* Summary */}
        {item.summary && (
          <p className="text-[13px] text-muted-foreground/55 leading-relaxed line-clamp-2 mb-auto">
            {item.summary}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-2 mt-1">
          {!item.is_saved ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40"
            >
              <BookmarkPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Spara
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-600 bg-emerald-500/5">
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Sparad
            </span>
          )}
          {item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all ml-auto"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              Öppna
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/** Source brand badge — favicon with colored initial fallback */
function SourceBadge({ source }: { source: FeedItem["source"] }) {
  const [imgError, setImgError] = useState(false);
  const favicon = getSourceFavicon(source);
  const initial = getSourceInitial(source?.name);
  const color = source?.color || "#b45309";

  if (favicon && !imgError) {
    return (
      <img
        src={favicon}
        alt=""
        className="w-5 h-5 rounded-md object-contain"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span
      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {initial.charAt(0)}
    </span>
  );
}

/** Article/RSS card — featured image, source branding, mobile-friendly */
function ArticleCard({
  item,
  onSave,
  onMarkRead,
  onClick,
  saving,
}: {
  item: FeedItem;
  onSave: () => void;
  onMarkRead: () => void;
  onClick: () => void;
  saving: boolean;
}) {
  const source = item.source;
  const hasImage = !!item.image_url;
  const sourceColor = source?.color || "#b45309";

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-200 hover:border-border/80 hover:shadow-md border-l-[3px] cursor-pointer",
        item.is_read && "opacity-65"
      )}
      style={{ borderLeftColor: sourceColor }}
      onClick={onClick}
    >
      <div className="flex gap-0">
        {/* Main content */}
        <div className="flex-1 min-w-0 p-4 md:p-5">
          {/* Source badge + name + time */}
          <div className="flex items-center gap-2 mb-2.5">
            <SourceBadge source={source} />
            <span className="text-[12px] font-semibold text-muted-foreground/60 truncate">
              {source?.name || "Okänd källa"}
            </span>
            <span className="text-[11px] text-muted-foreground/30 shrink-0">
              {timeAgo(item.published_at || item.fetched_at)}
            </span>
            {!item.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary/70 shrink-0" />
            )}
            {item.relevance_score > 0.3 && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500/70 shrink-0 ml-auto">
                <Sparkles className="h-2.5 w-2.5" />
                {Math.round(item.relevance_score * 100)}%
              </span>
            )}
          </div>

          {/* Mobile: title + inline thumbnail */}
          <div className="flex gap-3 sm:block">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="text-[15px] md:text-[16px] font-semibold text-foreground leading-snug mb-2 line-clamp-2">
                {item.title}
              </h3>

              {/* Summary — hidden on mobile when image present to save space */}
              {item.summary && (
                <p className={cn(
                  "text-[13px] text-muted-foreground/55 leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3",
                  hasImage && "hidden sm:block"
                )}>
                  {item.summary}
                </p>
              )}
            </div>

            {/* Mobile thumbnail — small square */}
            {hasImage && (
              <div className="sm:hidden shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted">
                <img
                  src={item.image_url!}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).parentElement!.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Author */}
          {item.author && (
            <p className="text-[11px] text-muted-foreground/35 font-medium mb-3">
              av {item.author}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-primary/6 text-primary/70 text-[10px] font-semibold capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {!item.is_saved ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40"
              >
                <BookmarkPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                Spara
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-600 bg-emerald-500/5">
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                Sparad
              </span>
            )}
            {!item.is_read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all"
              >
                <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                Läst
              </button>
            )}
            {item.link_url && (
              <a
                href={item.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all ml-auto"
              >
                <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                Öppna
              </a>
            )}
          </div>
        </div>

        {/* Desktop thumbnail — tall rectangle */}
        {hasImage && (
          <div className="hidden sm:block shrink-0 w-36 md:w-44 self-stretch">
            <img
              src={item.image_url!}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = "none";
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function FeedItemCard({
  item,
  onSave,
  onMarkRead,
  onClick,
}: FeedItemCardProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(item.id);
    } finally {
      setSaving(false);
    }
  };

  const feedType = item.source?.feed_type;

  // Render type-specific card
  if (feedType === "youtube") {
    return (
      <YouTubeCard
        item={item}
        onSave={handleSave}
        onClick={() => onClick(item)}
        saving={saving}
      />
    );
  }

  if (feedType === "podcast") {
    return (
      <PodcastCard
        item={item}
        onSave={handleSave}
        onClick={() => onClick(item)}
        saving={saving}
      />
    );
  }

  return (
    <ArticleCard
      item={item}
      onSave={handleSave}
      onMarkRead={() => onMarkRead(item.id)}
      onClick={() => onClick(item)}
      saving={saving}
    />
  );
}
