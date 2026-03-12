"use client";

import { ExternalLink } from "lucide-react";
import type { ContentType, LinkMetadata } from "@/lib/types";
import { contentTypeConfig } from "@/lib/utils";

interface SocialPreviewProps {
  type: "linkedin" | "instagram";
  linkUrl: string;
  metadata: LinkMetadata | null;
}

export function SocialPreview({ type, linkUrl, metadata }: SocialPreviewProps) {
  const config = contentTypeConfig[type];

  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden border border-border hover:shadow-md transition-shadow group"
    >
      {metadata?.og_image && (
        <div className="aspect-[2/1] bg-muted">
          <img
            src={metadata.og_image}
            alt={metadata.og_title || "Preview"}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 bg-card">
        {metadata?.og_title && (
          <p className="text-[13px] font-semibold line-clamp-2 group-hover:opacity-80 transition-opacity">
            {metadata.og_title}
          </p>
        )}
        {metadata?.author_name && (
          <p className="text-[12px] text-muted-foreground mt-1">
            {metadata.author_name}
          </p>
        )}
        {metadata?.og_description && (
          <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">
            {metadata.og_description}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium" style={{ color: config.hex }}>
          <span>{config.label}</span>
          <ExternalLink className="h-3 w-3 ml-auto" />
        </div>
      </div>
    </a>
  );
}
