"use client";

import Link from "next/link";
import { useRelatedMemories } from "@/hooks/useRelatedMemories";
import { ContentTypeIcon } from "./ContentTypeIcon";
import { contentTypeConfig, relativeDate, cn } from "@/lib/utils";
import { Tag } from "lucide-react";

export function RelatedMemories({ memoryId }: { memoryId: string }) {
  const { relatedMemories, isLoading } = useRelatedMemories(memoryId);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Relaterade minnen
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (relatedMemories.length === 0) return null;

  return (
    <div>
      <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
        Relaterade minnen
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {relatedMemories.map((related) => {
          const config = contentTypeConfig[related.content_type];
          return (
            <Link
              key={related.id}
              href={`/minnen/${related.id}`}
              className="group rounded-xl border border-border bg-card p-4 hover:shadow-sm hover:border-border/80 transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                    config.bgColor
                  )}
                >
                  <ContentTypeIcon
                    type={related.content_type}
                    className="h-3.5 w-3.5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {related.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60">
                      <Tag className="h-2.5 w-2.5" />
                      {related.shared_tag_count} gemensamma
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">
                      {relativeDate(related.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
