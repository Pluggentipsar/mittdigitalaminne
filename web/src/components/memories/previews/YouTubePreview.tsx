"use client";

import type { LinkMetadata } from "@/lib/types";

interface YouTubePreviewProps {
  linkUrl: string;
  metadata: LinkMetadata | null;
  embed?: boolean;
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1);
    }
  } catch {}
  return null;
}

export function YouTubePreview({ linkUrl, metadata, embed }: YouTubePreviewProps) {
  const videoId = metadata?.video_id || extractVideoId(linkUrl);

  if (embed && videoId) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={metadata?.og_title || "YouTube video"}
        />
      </div>
    );
  }

  const thumbnail =
    metadata?.thumbnail_url ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null);

  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden border border-border hover:shadow-md transition-shadow group"
    >
      {thumbnail && (
        <div className="relative aspect-video bg-muted">
          <img
            src={thumbnail}
            alt={metadata?.og_title || "YouTube thumbnail"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-11 bg-[#cc181e] rounded-xl flex items-center justify-center group-hover:bg-[#ff0000] transition-colors shadow-lg">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      {(metadata?.og_title || metadata?.channel_name) && (
        <div className="p-4 bg-card">
          {metadata?.og_title && (
            <p className="text-[13px] font-semibold line-clamp-2 group-hover:text-type-youtube transition-colors">
              {metadata.og_title}
            </p>
          )}
          {metadata?.channel_name && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {metadata.channel_name}
            </p>
          )}
        </div>
      )}
    </a>
  );
}
