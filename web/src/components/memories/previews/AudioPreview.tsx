"use client";

import { Headphones, ExternalLink } from "lucide-react";
import type { LinkMetadata } from "@/lib/types";

interface AudioPreviewProps {
  linkUrl: string;
  metadata: LinkMetadata | null;
  embed?: boolean;
}

function extractSpotifyEmbed(url: string): { type: string; id: string } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("spotify.com")) return null;
    const match = u.pathname.match(/\/(episode|track|show|album|playlist)\/([a-zA-Z0-9]+)/);
    if (match) return { type: match[1], id: match[2] };
  } catch {}
  return null;
}

function getSpotifyEmbedUrl(url: string): string | null {
  const info = extractSpotifyEmbed(url);
  if (!info) return null;
  return `https://open.spotify.com/embed/${info.type}/${info.id}?utm_source=generator&theme=0`;
}

export function AudioPreview({ linkUrl, metadata, embed }: AudioPreviewProps) {
  const spotifyEmbedUrl = getSpotifyEmbedUrl(linkUrl);

  // Spotify embed player
  if (embed && spotifyEmbedUrl) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
        <iframe
          src={spotifyEmbedUrl}
          width="100%"
          height="352"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="border-0"
          title={metadata?.og_title || metadata?.episode_name || "Spotify"}
          style={{ borderRadius: "16px" }}
        />
      </div>
    );
  }

  // Compact Spotify embed (for cards / non-embed view)
  if (spotifyEmbedUrl) {
    return (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl overflow-hidden border border-border hover:shadow-md transition-shadow group"
      >
        <div className="flex items-center gap-4 p-4 bg-card">
          {metadata?.og_image || metadata?.thumbnail_url ? (
            <img
              src={metadata.og_image || metadata.thumbnail_url}
              alt=""
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#1db954]/10 flex items-center justify-center shrink-0">
              <Headphones className="h-7 w-7 text-[#1db954]" strokeWidth={1.5} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {(metadata?.og_title || metadata?.episode_name) && (
              <p className="text-[13px] font-semibold line-clamp-2 group-hover:text-[#1db954] transition-colors">
                {metadata?.og_title || metadata?.episode_name}
              </p>
            )}
            {metadata?.podcast_name && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {metadata.podcast_name}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground/50">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="#1db954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span>Spotify</span>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors shrink-0" />
        </div>
      </a>
    );
  }

  // Generic audio link (non-Spotify)
  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3.5 px-5 py-4 rounded-2xl border border-border/50 bg-card hover:bg-accent/50 transition-all group shadow-xs"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-type-audio/8">
        <Headphones className="h-4 w-4 text-type-audio" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-type-audio truncate group-hover:underline">
          {metadata?.og_title || linkUrl}
        </p>
        <p className="text-[11px] text-muted-foreground/50">
          {metadata?.domain || (() => { try { return new URL(linkUrl).hostname.replace("www.", ""); } catch { return "ljud"; } })()}
        </p>
      </div>
    </a>
  );
}
