"use client";

import { ExternalLink, Linkedin } from "lucide-react";
import type { LinkMetadata } from "@/lib/types";
import { contentTypeConfig } from "@/lib/utils";

interface SocialPreviewProps {
  type: "linkedin" | "instagram";
  linkUrl: string;
  metadata: LinkMetadata | null;
}

export function SocialPreview({ type, linkUrl, metadata }: SocialPreviewProps) {
  const config = contentTypeConfig[type];

  if (type === "linkedin") {
    return <LinkedInPreview linkUrl={linkUrl} metadata={metadata} />;
  }

  // Fallback for instagram without embed (shouldn't happen normally)
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

/* ─── LinkedIn-specific rich preview ─── */

function LinkedInPreview({ linkUrl, metadata }: { linkUrl: string; metadata: LinkMetadata | null }) {
  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden border border-border/50 bg-card shadow-xs hover:shadow-md transition-all group"
    >
      {/* Header bar with LinkedIn branding */}
      <div className="flex items-center gap-2.5 px-5 py-3 bg-[#0a66c2]/[0.04] border-b border-border/30">
        <div className="w-6 h-6 rounded bg-[#0a66c2] flex items-center justify-center shrink-0">
          <Linkedin className="h-3.5 w-3.5 text-white" strokeWidth={2} />
        </div>
        <span className="text-[11px] font-semibold text-[#0a66c2]/70 tracking-wide">
          LINKEDIN
        </span>
        <ExternalLink className="h-3 w-3 text-muted-foreground/30 ml-auto group-hover:text-[#0a66c2] transition-colors" />
      </div>

      {/* OG image */}
      {metadata?.og_image && (
        <div className="aspect-[1.91/1] bg-muted overflow-hidden">
          <img
            src={metadata.og_image}
            alt={metadata.og_title || "LinkedIn preview"}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {metadata?.og_title && (
          <p className="text-[14px] font-semibold leading-snug line-clamp-2 group-hover:text-[#0a66c2] transition-colors">
            {metadata.og_title}
          </p>
        )}
        {metadata?.author_name && (
          <p className="text-[12px] text-muted-foreground/70 mt-1.5 font-medium">
            {metadata.author_name}
          </p>
        )}
        {metadata?.og_description && (
          <p className="text-[12px] text-muted-foreground/60 mt-2 line-clamp-3 leading-relaxed">
            {metadata.og_description}
          </p>
        )}

        {/* Domain */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/30">
          {metadata?.favicon && (
            <img src={metadata.favicon} alt="" className="w-3.5 h-3.5 rounded" />
          )}
          <span className="text-[11px] text-muted-foreground/45 font-medium">
            {metadata?.domain || "linkedin.com"}
          </span>
        </div>
      </div>
    </a>
  );
}
