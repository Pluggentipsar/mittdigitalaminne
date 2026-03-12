"use client";

import { ExternalLink } from "lucide-react";
import type { LinkMetadata } from "@/lib/types";

interface LinkPreviewProps {
  linkUrl: string;
  metadata: LinkMetadata | null;
}

export function LinkPreview({ linkUrl, metadata }: LinkPreviewProps) {
  if (!metadata || (!metadata.og_image && !metadata.og_title)) return null;

  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden border border-border hover:shadow-md transition-shadow group"
    >
      {metadata.og_image && (
        <div className="aspect-[2/1] bg-muted">
          <img
            src={metadata.og_image}
            alt={metadata.og_title || "Preview"}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 bg-card">
        {metadata.og_title && (
          <p className="text-[13px] font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {metadata.og_title}
          </p>
        )}
        {metadata.og_description && (
          <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">
            {metadata.og_description}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground/60">
          {metadata.favicon && (
            <img src={metadata.favicon} alt="" className="w-3.5 h-3.5 rounded" />
          )}
          <span>{metadata.domain || new URL(linkUrl).hostname}</span>
          <ExternalLink className="h-3 w-3 ml-auto" />
        </div>
      </div>
    </a>
  );
}
