"use client";

import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import type { MemoryStats } from "@/lib/types";
import { ContentTypeIcon } from "../memories/ContentTypeIcon";
import { relativeDate, contentTypeConfig } from "@/lib/utils";
import type { ContentType } from "@/lib/types";

interface RecentMemoriesProps {
  recent: MemoryStats["recent"];
}

export function RecentMemories({ recent }: RecentMemoriesProps) {
  if (!recent || recent.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 animate-fade-in stagger-5">
        <h2 className="text-[15px] font-bold mb-6">Senaste minnen</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Inbox className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">
            Inga minnen ännu
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Börja med att lägga till ditt första!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 animate-fade-in stagger-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-bold">Senaste minnen</h2>
        <Link
          href="/minnen"
          className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Visa alla
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-1">
        {recent.map((item, i) => {
          const config = contentTypeConfig[item.content_type as ContentType];
          return (
            <Link
              href={`/minnen/${item.id}`}
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors -mx-1"
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${config.bgColor}`}>
                <ContentTypeIcon type={item.content_type as ContentType} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate">
                  {item.title}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {config.label}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap font-medium">
                {relativeDate(item.created_at)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
