"use client";

import { useState } from "react";
import { Archive, ChevronDown, ExternalLink, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface SnapshotViewerProps {
  snapshotHtml: string | null;
  snapshotTakenAt: string | null;
  linkUrl: string | null;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just nu";
  if (diffMins < 60) return `${diffMins} min sedan`;
  if (diffHours < 24) return `${diffHours} tim sedan`;
  if (diffDays < 7) return `${diffDays} dagar sedan`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} veckor sedan`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} månader sedan`;
  return `${Math.floor(diffDays / 365)} år sedan`;
}

export function SnapshotViewer({ snapshotHtml, snapshotTakenAt, linkUrl }: SnapshotViewerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!snapshotHtml) return null;

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-xs overflow-hidden">
      {/* Header — always visible, acts as toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left group transition-colors hover:bg-accent/30"
      >
        {/* Icon with subtle amber shield effect */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/[0.06] shrink-0">
          <Shield className="h-4 w-4 text-primary/60" strokeWidth={1.5} />
          <div className="absolute inset-0 rounded-lg bg-primary/[0.04] blur-[3px]" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[12px] font-semibold text-foreground/70 leading-none">
            Sparad kopia
          </h3>
          {snapshotTakenAt && (
            <p className="text-[10px] text-muted-foreground/45 mt-1 font-medium">
              Arkiverad {formatRelativeDate(snapshotTakenAt)}
            </p>
          )}
        </div>

        {/* Original link */}
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium text-muted-foreground/40 hover:text-primary hover:bg-primary/[0.06] transition-all"
          >
            <ExternalLink className="h-3 w-3" />
            Öppna original
          </a>
        )}

        {/* Expand chevron */}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground/30 transition-transform duration-300 shrink-0",
            expanded && "rotate-180"
          )}
          strokeWidth={1.5}
        />
      </button>

      {/* Expanded content — sandboxed iframe */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {/* Top border with amber gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

        {/* Info bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-accent/30">
          <Archive className="h-3 w-3 text-muted-foreground/35" strokeWidth={1.5} />
          <span className="text-[10px] text-muted-foreground/40 font-medium">
            Skyddad kopia av originalinnehållet — länkar och skript är inaktiverade
          </span>
        </div>

        {/* Sandboxed iframe */}
        <div className="relative bg-white">
          {expanded && (
            <iframe
              srcDoc={snapshotHtml}
              sandbox=""
              title="Sparad kopia av sidan"
              className="w-full h-[500px] border-0"
              style={{
                colorScheme: "light",
              }}
            />
          )}

          {/* Bottom fade overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        </div>

        {/* Mobile original link */}
        {linkUrl && (
          <div className="sm:hidden px-6 py-3 border-t border-border/30">
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Öppna originalsidan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
