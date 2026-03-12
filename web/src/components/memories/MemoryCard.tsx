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
          "block rounded-2xl border border-border bg-card p-5 transition-all duration-300",
          "hover:shadow-[0_4px_12px_rgba(26,24,20,0.06)] hover:-translate-y-0.5",
          "border-l-[3px]",
          config.borderColor
        )}
      >
        {/* Top row: type badge + actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold",
              config.badgeClass
            )}
          >
            <ContentTypeIcon type={memory.content_type} className="h-3 w-3" />
            {config.label}
          </span>

          <div className="flex items-center gap-0.5">
            {/* Favorite */}
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
                    : "text-muted-foreground hover:text-amber-400"
                )}
              />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(memory.id);
              }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
              title="Ta bort"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
            </button>
          </div>
        </div>

        {/* Image preview */}
        {memory.content_type === "image" && memory.image_url && (
          <div className="mb-3 rounded-xl overflow-hidden bg-muted aspect-video">
            <img
              src={memory.image_url}
              alt={memory.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        )}

        {/* Title */}
        <h3 className="font-bold text-[14px] leading-snug mb-1.5 line-clamp-2">
          {memory.title}
        </h3>

        {/* Summary */}
        {memory.summary && (
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {memory.summary}
          </p>
        )}

        {/* Link preview */}
        {memory.link_url && (
          <div className="flex items-center gap-1.5 mb-3 text-[11px] text-type-link font-medium">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">
              {(() => { try { return new URL(memory.link_url).hostname; } catch { return memory.link_url; } })()}
            </span>
          </div>
        )}

        {/* Footer: tags + date */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex flex-wrap gap-1">
            {(memory.tags || []).slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
            {(memory.tags || []).length > 3 && (
              <span className="text-[10px] text-muted-foreground/60 font-medium">
                +{(memory.tags || []).length - 3}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap font-medium">
            {relativeDate(memory.created_at)}
          </span>
        </div>
      </Link>
    </div>
  );
}
