"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Pencil, ExternalLink, Trash2 } from "lucide-react";
import type { Memory } from "@/lib/types";
import { cn, relativeDate, contentTypeConfig } from "@/lib/utils";
import { ContentTypeIcon } from "@/components/memories/ContentTypeIcon";

interface InboxCardProps {
  memory: Memory;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InboxCard({ memory, onArchive, onDelete }: InboxCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card overflow-hidden transition-all duration-200 hover:border-border/80",
        "border-border/60 border-l-2",
        config.borderColor
      )}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Type icon */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5"
          style={{ backgroundColor: `${config.hex}10` }}
        >
          <ContentTypeIcon
            type={memory.content_type}
            className="h-4 w-4"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide",
                config.badgeClass
              )}
            >
              {config.label}
            </span>
            {domain && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-medium truncate">
                <ExternalLink className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
                {domain}
              </span>
            )}
          </div>

          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 text-foreground/90">
            {memory.title}
          </h3>

          {memory.summary && (
            <p className="text-[11px] text-muted-foreground/50 leading-relaxed line-clamp-1 mt-0.5">
              {memory.summary}
            </p>
          )}

          <span className="text-[10px] text-muted-foreground/30 font-medium mt-1.5 block tabular-nums">
            {relativeDate(memory.created_at)}
          </span>

          {/* Actions — always visible on mobile, hover on desktop */}
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/15 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <Link
              href={`/minnen/${memory.id}/redigera`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-accent transition-all"
              title="Bearbeta"
            >
              <Pencil className="h-3 w-3" />
              Bearbeta
            </Link>
            <button
              onClick={() => onArchive(memory.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground/60 hover:text-amber-600 hover:bg-amber-500/8 transition-all"
              title="Arkivera"
            >
              <Archive className="h-3 w-3" />
              Arkivera
            </button>

            {/* Delete */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/8 transition-all ml-auto"
                title="Ta bort"
              >
                <Trash2 className="h-3 w-3" />
                Ta bort
              </button>
            ) : (
              <div className="flex items-center gap-1 ml-auto animate-fade-in">
                <span className="text-[10px] text-red-500/70 font-medium mr-1">Radera?</span>
                <button
                  onClick={() => onDelete(memory.id)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-all"
                >
                  Ja
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground/50 hover:bg-accent transition-all"
                >
                  Nej
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
