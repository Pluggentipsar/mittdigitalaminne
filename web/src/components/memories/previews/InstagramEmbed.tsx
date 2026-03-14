"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ExternalLink, Instagram, Loader2 } from "lucide-react";

interface InstagramEmbedProps {
  linkUrl: string;
  title?: string;
}

/**
 * Extract Instagram embed URL from a post/reel URL.
 * Supports:
 *  - https://www.instagram.com/p/{shortcode}/
 *  - https://www.instagram.com/reel/{shortcode}/
 *  - https://instagram.com/p/{shortcode}/
 */
function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("instagram.com")) return null;

    const match = u.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (!match) return null;

    const [, type, shortcode] = match;
    return `https://www.instagram.com/${type}/${shortcode}/embed/captioned/`;
  } catch {
    return null;
  }
}

export function InstagramEmbed({ linkUrl, title }: InstagramEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [height, setHeight] = useState(580);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const embedUrl = getEmbedUrl(linkUrl);

  // Listen for Instagram embed resize messages
  const handleMessage = useCallback((event: MessageEvent) => {
    if (typeof event.data === "string") {
      try {
        const data = JSON.parse(event.data);
        // Instagram embeds send height via postMessage
        if (data.type === "MEASURE" && data.details?.height) {
          setHeight(Math.min(data.details.height, 1200));
        }
      } catch {
        // Not JSON or not from Instagram — ignore
      }
    }
    // Some embeds send { height: N } directly
    if (event.data?.height && typeof event.data.height === "number") {
      setHeight(Math.min(event.data.height, 1200));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  if (!embedUrl) {
    // Fallback: just a link
    return (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3.5 px-5 py-4 rounded-2xl border border-border/50 bg-card hover:bg-accent/50 transition-all group shadow-xs"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]">
          <Instagram className="h-5 w-5 text-white" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate group-hover:underline">
            {title || "Instagram-inlägg"}
          </p>
          <p className="text-[11px] text-muted-foreground/50">
            instagram.com
          </p>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground/30 shrink-0" />
      </a>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm bg-white">
      {/* Loading state */}
      {!loaded && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
          <p className="text-[12px] text-muted-foreground/50 font-medium">
            Laddar Instagram-inlägg...
          </p>
        </div>
      )}

      {/* Embedded Instagram post — dynamic height */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className={`w-full border-0 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
        style={{
          height: loaded ? height : 0,
          colorScheme: "light",
        }}
        onLoad={() => setLoaded(true)}
        allowTransparency
        title={title || "Instagram-inlägg"}
      />

      {/* Footer with link to original */}
      {loaded && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#833AB4]/5 via-[#FD1D1D]/5 to-[#F77737]/5 border-t border-border/30">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center shrink-0">
            <Instagram className="h-2.5 w-2.5 text-white" strokeWidth={2} />
          </div>
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            Visa på Instagram
          </a>
          <ExternalLink className="h-3 w-3 text-muted-foreground/30 ml-auto" />
        </div>
      )}
    </div>
  );
}
