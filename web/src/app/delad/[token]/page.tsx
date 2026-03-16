"use client";

import { use, useState, useEffect } from "react";
import {
  ExternalLink,
  Calendar,
  Clock,
  Hash,
  BookOpen,
  Share2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { ContentTypeIcon } from "@/components/memories/ContentTypeIcon";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { YouTubePreview } from "@/components/memories/previews/YouTubePreview";
import { LinkPreview } from "@/components/memories/previews/LinkPreview";
import { SocialPreview } from "@/components/memories/previews/SocialPreview";
import { AudioPreview } from "@/components/memories/previews/AudioPreview";
import { contentTypeConfig, cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import type { Memory } from "@/lib/types";

interface SharedData {
  memory: Memory;
  shared_at: string;
  expires_at: string | null;
}

export default function SharedMemoryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/shared/${token}`);
        if (!res.ok) {
          const json = await res.json();
          setError(json.error || "Kunde inte ladda det delade minnet");
          return;
        }
        const json = await res.json();
        setData(json.data);
      } catch {
        setError("N\u00e5got gick fel");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground/50">Laddar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto">
            {error.includes("expired") ? (
              <Clock className="h-7 w-7 text-muted-foreground/40" strokeWidth={1.5} />
            ) : (
              <AlertCircle className="h-7 w-7 text-muted-foreground/40" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <h1 className="heading-serif text-[24px] text-foreground mb-2">
              {error.includes("expired") ? "L\u00e4nken har g\u00e5tt ut" : "Kunde inte hittas"}
            </h1>
            <p className="text-[14px] text-muted-foreground/60 leading-relaxed">
              {error}
            </p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all"
          >
            Till startsidan
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { memory } = data;
  const config = contentTypeConfig[memory.content_type];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-foreground/80">Mitt Digitala Minne</p>
              <p className="text-[10px] text-muted-foreground/40">Delat minne</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-muted-foreground/50 text-[11px] font-medium">
            <Share2 className="h-3 w-3" />
            Delad l\u00e4nk
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-10 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold mb-4",
              config.badgeClass
            )}
          >
            <ContentTypeIcon type={memory.content_type} className="h-3 w-3" />
            {config.label}
          </span>
          <h1 className="heading-serif text-[28px] md:text-[36px] leading-[1.12] text-foreground">
            {memory.title}
          </h1>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
              {format(new Date(memory.created_at), "d MMMM yyyy", { locale: sv })}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
              {format(new Date(memory.created_at), "HH:mm")}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
              <Hash className="h-3.5 w-3.5" strokeWidth={1.5} />
              {memory.content_type}
            </div>
            {memory.original_content && memory.original_content.length > 200 && (
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
                <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
                {Math.max(1, Math.round(memory.original_content.split(/\s+/).length / 200))} min l\u00e4stid
              </div>
            )}
          </div>
        </div>

        {/* Decorative divider */}
        <div className="divider-ornament">
          <span className="text-primary/30 text-[8px]">&#9670;</span>
        </div>

        {/* Image */}
        {memory.content_type === "image" && memory.image_url && (
          <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm">
            <img
              src={memory.image_url}
              alt={memory.title}
              className="w-full max-h-[600px] object-contain bg-muted"
            />
          </div>
        )}

        {/* YouTube embed */}
        {memory.content_type === "youtube" && memory.link_url && (
          <YouTubePreview linkUrl={memory.link_url} metadata={memory.link_metadata} embed />
        )}

        {/* LinkedIn preview */}
        {memory.content_type === "linkedin" && memory.link_url && (
          <SocialPreview type="linkedin" linkUrl={memory.link_url} metadata={memory.link_metadata} />
        )}

        {/* Twitter/X preview */}
        {memory.content_type === "twitter" && memory.link_url && (
          <SocialPreview type="twitter" linkUrl={memory.link_url} metadata={memory.link_metadata} />
        )}

        {/* Audio/Podcast embed */}
        {memory.content_type === "audio" && memory.link_url && (
          <AudioPreview linkUrl={memory.link_url} metadata={memory.link_metadata} embed />
        )}

        {/* Link preview */}
        {memory.content_type === "link" && memory.link_url && memory.link_metadata?.og_image && (
          <LinkPreview linkUrl={memory.link_url} metadata={memory.link_metadata} />
        )}

        {/* Fallback link */}
        {memory.link_url && !["youtube", "linkedin", "instagram", "twitter", "audio"].includes(memory.content_type) && !(memory.content_type === "link" && memory.link_metadata?.og_image) && (
          <a
            href={memory.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 px-5 py-4 rounded-2xl border border-border/50 bg-card hover:bg-accent/50 transition-all group shadow-xs"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-type-link/8">
              <ExternalLink className="h-4 w-4 text-type-link" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-type-link truncate group-hover:underline">
                {memory.link_url}
              </p>
              <p className="text-[11px] text-muted-foreground/50">
                {(() => { try { return new URL(memory.link_url).hostname.replace("www.", ""); } catch { return "extern l\u00e4nk"; } })()}
              </p>
            </div>
          </a>
        )}

        {/* Summary */}
        {memory.summary && (
          <div className="rounded-2xl border border-border/50 bg-card p-7 shadow-xs">
            <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em] mb-4">
              Sammanfattning
            </h2>
            <MarkdownContent content={memory.summary} />
          </div>
        )}

        {/* Original content */}
        {memory.original_content && (
          <div className="rounded-2xl border border-border/50 bg-card p-7 shadow-xs">
            <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em] mb-4">
              Inneh\u00e5ll
            </h2>
            <MarkdownContent content={memory.original_content} />
          </div>
        )}

        {/* Tags */}
        {memory.tags && memory.tags.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em] mb-3">
              Taggar
            </h2>
            <div className="flex flex-wrap gap-2">
              {memory.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-accent/80 text-muted-foreground border border-border/30"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-border/30">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/30 font-medium">
            <Lock className="h-3 w-3" />
            Delat fr\u00e5n Mitt Digitala Minne
          </div>
          {data.expires_at && (
            <p className="text-[11px] text-muted-foreground/30 font-medium">
              G\u00e5r ut: {format(new Date(data.expires_at), "d MMM yyyy", { locale: sv })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
