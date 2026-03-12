"use client";

import Link from "next/link";
import { Star, Trash2, ExternalLink } from "lucide-react";
import type { Memory } from "@/lib/types";
import { cn, relativeDate, contentTypeConfig } from "@/lib/utils";
import { ContentTypeIcon } from "./ContentTypeIcon";

interface MemoryCardProps {
  memory: Memory;
  onToggleFavorite?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
}

export function MemoryCard({ memory, onToggleFavorite, onDelete }: MemoryCardProps) {
  const config = contentTypeConfig[memory.content_type];

  return (
    <div className="group relative animate-fade-in">
      <Link
        href={`/minnen/${memory.id}`}
        className={cn(
          "block rounded-2xl border border-border/60 bg-card overflow-hidden",
          `accent-line-top accent-line-${memory.content_type}`,
          `card-glow-${memory.content_type}`
        )}
      >
        {/* Image preview */}
        {memory.content_type === "image" && memory.image_url && (
          <div className="aspect-[16/10] bg-muted overflow-hidden">
            <img
              src={memory.image_url}
              alt={memory.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          </div>
        )}

        {/* Link OG image */}
        {memory.content_type !== "image" && memory.link_metadata?.og_image && (
          <div className="aspect-[2.2/1] bg-muted overflow-hidden relative">
            <img
              src={memory.link_metadata.og_image}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        <div className="p-5">
          {/* Type badge + actions */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide",
                config.badgeClass
              )}
            >
              <ContentTypeIcon type={memory.content_type} className="h-2.5 w-2.5" />
              {config.label}
            </span>

            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite?.(memory.id, memory.is_favorite);
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  memory.is_favorite
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
                title={memory.is_favorite ? "Ta bort favorit" : "Favorit"}
              >
                <Star
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    memory.is_favorite
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/50 hover:text-amber-400"
                  )}
                />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete?.(memory.id);
                }}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                title="Ta bort"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-destructive transition-colors" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[14px] leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {memory.title}
          </h3>

          {/* Summary */}
          {memory.summary && (
            <p className="text-[12px] text-muted-foreground/70 leading-relaxed line-clamp-2 mb-3">
              {memory.summary}
            </p>
          )}

          {/* Link */}
          {memory.link_url && (
            <div className="flex items-center gap-1.5 mb-3 text-[11px] text-muted-foreground/50 font-medium">
              <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.5} />
              <span className="truncate">
                {(() => { try { return new URL(memory.link_url).hostname.replace('www.', ''); } catch { return memory.link_url; } })()}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
            <div className="flex flex-wrap gap-1">
              {(memory.tags || []).slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-accent/80 text-muted-foreground"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </span>
              ))}
              {(memory.tags || []).length > 3 && (
                <span className="text-[9px] text-muted-foreground/40 font-medium px-1">
                  +{(memory.tags || []).length - 3}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground/40 whitespace-nowrap font-medium tabular-nums">
              {relativeDate(memory.created_at)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
