"use client";

import { ExternalLink, Linkedin, Instagram } from "lucide-react";
import type { LinkMetadata } from "@/lib/types";
import { contentTypeConfig } from "@/lib/utils";

interface SocialPreviewProps {
  type: "linkedin" | "instagram";
  linkUrl: string;
  metadata: LinkMetadata | null;
}

export function SocialPreview({ type, linkUrl, metadata }: SocialPreviewProps) {
  if (type === "linkedin") {
    return <LinkedInPreview linkUrl={linkUrl} metadata={metadata} />;
  }

  // Fallback for instagram without embed (shouldn't happen normally)
  return <InstagramFallback linkUrl={linkUrl} metadata={metadata} />;
}

/* ─── LinkedIn-specific rich preview (no OG image — blocked by LinkedIn) ─── */

function LinkedInPreview({ linkUrl, metadata }: { linkUrl: string; metadata: LinkMetadata | null }) {
  const hasContent = metadata?.og_title || metadata?.og_description;

  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden border border-border/50 bg-card shadow-xs hover:shadow-md transition-all group"
    >
      {/* Header bar with LinkedIn branding */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[#0a66c2]/[0.04] border-b border-border/30">
        <div className="w-7 h-7 rounded-lg bg-[#0a66c2] flex items-center justify-center shrink-0">
          <Linkedin className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-[#0a66c2]/70 tracking-wide">
            LINKEDIN
          </span>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/25 group-hover:text-[#0a66c2] transition-colors shrink-0" />
      </div>

      {/* Content */}
      <div className="p-5">
        {metadata?.og_title && (
          <p className="text-[15px] font-semibold leading-snug line-clamp-3 group-hover:text-[#0a66c2] transition-colors">
            {metadata.og_title}
          </p>
        )}
        {metadata?.author_name && (
          <p className="text-[12px] text-muted-foreground/70 mt-2 font-medium">
            {metadata.author_name}
          </p>
        )}
        {metadata?.og_description && (
          <p className="text-[13px] text-muted-foreground/60 mt-2.5 line-clamp-4 leading-relaxed">
            {metadata.og_description}
          </p>
        )}

        {!hasContent && (
          <p className="text-[13px] text-muted-foreground/40 italic">
            LinkedIn-inlägg
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/30">
          <div className="w-4 h-4 rounded bg-[#0a66c2]/10 flex items-center justify-center shrink-0">
            <Linkedin className="h-2.5 w-2.5 text-[#0a66c2]/50" strokeWidth={2} />
          </div>
          <span className="text-[11px] text-muted-foreground/40 font-medium">
            {metadata?.domain || "linkedin.com"}
          </span>
        </div>
      </div>
    </a>
  );
}

/* ─── Instagram fallback (when embed can't be used) ─── */

function InstagramFallback({ linkUrl, metadata }: { linkUrl: string; metadata: LinkMetadata | null }) {
  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden border border-border/50 bg-card shadow-xs hover:shadow-md transition-all group"
    >
      {/* Header with Instagram gradient */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#833AB4]/[0.04] via-[#FD1D1D]/[0.04] to-[#F77737]/[0.04] border-b border-border/30">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center shrink-0">
          <Instagram className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        <span className="text-[11px] font-semibold text-[#c13584]/60 tracking-wide">
          INSTAGRAM
        </span>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/25 group-hover:text-[#c13584] transition-colors ml-auto shrink-0" />
      </div>

      <div className="p-5">
        {metadata?.og_title && (
          <p className="text-[15px] font-semibold leading-snug line-clamp-3 group-hover:text-[#c13584] transition-colors">
            {metadata.og_title}
          </p>
        )}
        {metadata?.author_name && (
          <p className="text-[12px] text-muted-foreground/70 mt-2 font-medium">
            {metadata.author_name}
          </p>
        )}
        {metadata?.og_description && (
          <p className="text-[13px] text-muted-foreground/60 mt-2.5 line-clamp-4 leading-relaxed">
            {metadata.og_description}
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/30">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10 flex items-center justify-center shrink-0">
            <Instagram className="h-2.5 w-2.5 text-[#c13584]/50" strokeWidth={2} />
          </div>
          <span className="text-[11px] text-muted-foreground/40 font-medium">
            instagram.com
          </span>
        </div>
      </div>
    </a>
  );
}
