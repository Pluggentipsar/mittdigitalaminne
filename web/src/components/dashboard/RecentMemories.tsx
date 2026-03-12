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
      <div className="rounded-2xl border border-border/70 bg-card p-7 animate-fade-in stagger-5">
        <h2 className="heading-serif text-[20px] mb-6">Senaste minnen</h2>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Inbox className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] font-medium text-muted-foreground">
            Inga minnen ännu
          </p>
          <p className="text-[12px] text-muted-foreground/60 mt-1">
            Börja med att lägga till ditt första!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card overflow-hidden animate-fade-in stagger-5">
      <div className="flex items-center justify-between px-7 pt-7 pb-5">
        <h2 className="heading-serif text-[20px]">Senaste minnen</h2>
        <Link
          href="/minnen"
          className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors group"
        >
          Visa alla
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="px-4 pb-4">
        {recent.map((item, i) => {
          const config = contentTypeConfig[item.content_type as ContentType];
          return (
            <Link
              href={`/minnen/${item.id}`}
              key={item.id}
              className="flex items-center gap-3.5 px-3 py-3.5 rounded-xl hover:bg-accent/70 transition-all duration-200 group"
              style={{ animationDelay: `${0.4 + i * 0.06}s` }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: `${config.hex}0D` }}
              >
                <ContentTypeIcon type={item.content_type as ContentType} className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors duration-200">
                  {item.title}
                </p>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5 font-medium">
                  {config.label}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground/40 whitespace-nowrap font-medium tabular-nums">
                {relativeDate(item.created_at)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
