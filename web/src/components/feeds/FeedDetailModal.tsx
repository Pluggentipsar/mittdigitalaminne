"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  BookmarkPlus,
  Check,
  ExternalLink,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Play,
  Headphones,
  Rss,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FeedDetailModalProps {
  open: boolean;
  item: FeedItem | null;
  onClose: () => void;
  onSave: (id: string) => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
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

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
  } catch {}
  return null;
}

function extractSpotifyEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("spotify.com")) return null;
    const match = u.pathname.match(
      /\/(episode|track|show|album|playlist)\/([a-zA-Z0-9]+)/
    );
    if (match)
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  } catch {}
  return null;
}

function feedTypeIcon(feedType: string | undefined) {
  switch (feedType) {
    case "youtube":
      return <Play className="h-3.5 w-3.5" strokeWidth={2} />;
    case "podcast":
      return <Headphones className="h-3.5 w-3.5" strokeWidth={1.5} />;
    default:
      return <Rss className="h-3.5 w-3.5" strokeWidth={1.5} />;
  }
}

function feedTypeColor(feedType: string | undefined): string {
  switch (feedType) {
    case "youtube":
      return "text-red-500";
    case "podcast":
      return "text-emerald-500";
    case "newsletter":
      return "text-indigo-500";
    default:
      return "text-amber-500";
  }
}

function feedTypeBg(feedType: string | undefined): string {
  switch (feedType) {
    case "youtube":
      return "bg-red-500/8";
    case "podcast":
      return "bg-emerald-500/8";
    case "newsletter":
      return "bg-indigo-500/8";
    default:
      return "bg-amber-500/8";
  }
}

/** Strips HTML tags for plain-text display */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function FeedDetailModal({
  open,
  item,
  onClose,
  onSave,
  onMarkRead,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: FeedDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      document.body.style.overflow = "";
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Mark as read when opening
  useEffect(() => {
    if (open && item && !item.is_read) {
      onMarkRead(item.id);
    }
  }, [open, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mobile back button: push a history entry so pressing back closes the modal
  useEffect(() => {
    if (!open) return;
    const hasState = window.history.state?.feedModal;
    if (!hasState) {
      window.history.pushState({ feedModal: true }, "");
    }
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Clean up the extra history entry if modal is closed programmatically
      if (window.history.state?.feedModal) {
        window.history.back();
      }
    };
  }, [open, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" || e.key === "j") {
        e.preventDefault();
        onPrev();
      }
      if (e.key === "ArrowRight" || e.key === "k") {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, onPrev, onNext]);

  const handleSave = useCallback(async () => {
    if (!item) return;
    setSaving(true);
    try {
      await onSave(item.id);
    } finally {
      setSaving(false);
    }
  }, [item, onSave]);

  if (!mounted || !item) return null;

  const source = item.source;
  const feedType = source?.feed_type;

  // Determine content to render
  const videoId = item.link_url ? extractVideoId(item.link_url) : null;
  const spotifyEmbed =
    feedType === "podcast" && item.link_url
      ? extractSpotifyEmbed(item.link_url)
      : null;
  // Also try the source feed_url for Spotify embed if item link doesn't have one
  const spotifyShowEmbed =
    !spotifyEmbed && feedType === "podcast" && source?.feed_url
      ? extractSpotifyEmbed(source.feed_url)
      : null;
  const finalSpotifyEmbed = spotifyEmbed || spotifyShowEmbed;

  const contentText = item.content_html
    ? stripHtml(item.content_html)
    : item.summary || null;

  const overlay = (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{ height: "100dvh" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/95 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div
        className={cn(
          "relative z-10 flex flex-col h-full max-w-4xl w-full mx-auto transition-all duration-300",
          visible ? "translate-y-0 scale-100" : "translate-y-4 scale-[0.98]"
        )}
      >
        {/* Top bar */}
        <div className="flex-none bg-background/80 backdrop-blur-lg border-b border-border/30">
          <div className="px-4 md:px-8 py-3 flex items-center justify-between">
            {/* Source info */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-xl shrink-0",
                  feedTypeBg(feedType),
                  feedTypeColor(feedType)
                )}
              >
                {source?.icon_url ? (
                  <img
                    src={source.icon_url}
                    alt=""
                    className="w-4 h-4 rounded-sm object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  feedTypeIcon(feedType)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground/80 truncate">
                  {source?.name || "Okänd källa"}
                </p>
                <p className="text-[11px] text-muted-foreground/40">
                  {timeAgo(item.published_at || item.fetched_at)}
                  {item.author && ` \u00b7 ${item.author}`}
                </p>
              </div>
            </div>

            {/* Nav + close */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Nav arrows */}
              <div className="hidden sm:flex items-center gap-0.5 mr-2">
                <button
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Föregående (←)"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Nästa (→)"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-accent text-muted-foreground/50 hover:text-foreground transition-all"
                title="Stäng (Esc)"
              >
                <X className="h-4.5 w-4.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto w-full">
            {/* Title */}
            <h1 className="heading-serif text-[24px] md:text-[32px] text-foreground leading-[1.15] mb-4">
              {item.title}
            </h1>

            {/* Relevance badge */}
            {item.relevance_score > 0.3 && (
              <div className="flex items-center gap-1.5 mb-5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/8 text-amber-600 text-[11px] font-semibold">
                  <Sparkles className="h-3 w-3" />
                  {Math.round(item.relevance_score * 100)}% relevans
                </span>
              </div>
            )}

            {/* Type-specific content embed */}
            <div className="mb-6">
              {/* YouTube embed */}
              {feedType === "youtube" && videoId && (
                <div className="rounded-2xl overflow-hidden border border-border/50 aspect-video mb-6 shadow-sm">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={item.title}
                  />
                </div>
              )}

              {/* Spotify embed */}
              {feedType === "podcast" && finalSpotifyEmbed && (
                <div className="rounded-2xl overflow-hidden border border-border/50 mb-6 shadow-sm">
                  <iframe
                    src={finalSpotifyEmbed}
                    width="100%"
                    height="352"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="border-0"
                    title={item.title}
                    style={{ borderRadius: "16px" }}
                  />
                </div>
              )}

              {/* Article image */}
              {feedType !== "youtube" &&
                feedType !== "podcast" &&
                item.image_url && (
                  <div className="rounded-2xl overflow-hidden border border-border/30 mb-6">
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-full max-h-[400px] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).parentElement!.style.display = "none";
                      }}
                    />
                  </div>
                )}
            </div>

            {/* Content body */}
            {contentText && (
              <div className="prose-content">
                <div
                  className="text-[15px] md:text-[16px] leading-[1.8] text-foreground/85 space-y-4"
                  style={{ letterSpacing: "0.01em" }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-4 last:mb-0">{children}</p>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-medium underline underline-offset-3 decoration-primary/30 hover:decoration-primary/60 transition-colors"
                        >
                          {children}
                        </a>
                      ),
                      h1: ({ children }) => (
                        <h2 className="text-[20px] font-bold text-foreground mt-8 mb-3">
                          {children}
                        </h2>
                      ),
                      h2: ({ children }) => (
                        <h3 className="text-[18px] font-bold text-foreground mt-6 mb-2">
                          {children}
                        </h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 space-y-1.5 text-foreground/80">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-6 space-y-1.5 text-foreground/80">
                          {children}
                        </ol>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-3 border-primary/30 pl-5 my-4 text-foreground/60 italic">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">
                          {children}
                        </strong>
                      ),
                    }}
                  >
                    {contentText}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Empty content fallback */}
            {!contentText &&
              feedType !== "youtube" &&
              feedType !== "podcast" && (
                <div className="text-center py-8">
                  <p className="text-[14px] text-muted-foreground/50 mb-4">
                    Inget innehåll tillgängligt att visa i appen.
                  </p>
                  {item.link_url && (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all"
                    >
                      <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                      Öppna original
                    </a>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex-none bg-background/80 backdrop-blur-lg border-t border-border/30">
          <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-3">
            {/* Left: Save + Project */}
            <div className="flex items-center gap-2">
              {!item.is_saved ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50"
                >
                  <BookmarkPlus className="h-4 w-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Spara till minnen</span>
                  <span className="sm:hidden">Spara</span>
                </button>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[13px] font-semibold">
                  <Check className="h-4 w-4" strokeWidth={2} />
                  Sparad
                </span>
              )}
            </div>

            {/* Right: Open original + nav (mobile) */}
            <div className="flex items-center gap-2">
              {/* Mobile nav */}
              <div className="flex sm:hidden items-center gap-0.5">
                <button
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="p-2 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-all disabled:opacity-20"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="p-2 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-all disabled:opacity-20"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              {item.link_url && (
                <a
                  href={item.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-[13px] font-medium text-muted-foreground/60 hover:text-foreground hover:border-border transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Öppna original</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
