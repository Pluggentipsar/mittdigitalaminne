"use client";

import Link from "next/link";
import { History, Clock3 } from "lucide-react";
import { useResurface } from "@/hooks/useResurface";
import { ContentTypeIcon } from "../memories/ContentTypeIcon";
import { contentTypeConfig } from "@/lib/utils";
import type { ContentType } from "@/lib/types";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export function TimeCapsule() {
  const { groups, isLoading } = useResurface();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-7 shadow-xs animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <History className="h-4.5 w-4.5 text-amber-600" strokeWidth={1.5} />
          </div>
          <h2 className="heading-serif text-[20px]">Tidskapsel</h2>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-12 w-full rounded-xl" />
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-7 shadow-xs animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <History className="h-4.5 w-4.5 text-amber-600" strokeWidth={1.5} />
          </div>
          <h2 className="heading-serif text-[20px]">Tidskapsel</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/8 flex items-center justify-center mb-3">
            <Clock3
              className="h-6 w-6 text-amber-500/40"
              strokeWidth={1.5}
            />
          </div>
          <p className="text-[14px] font-medium text-muted-foreground">
            Dina minnen kommer dyka upp här snart!
          </p>
          <p className="text-[12px] text-muted-foreground/60 mt-1">
            Återupptäck vad du sparade för en månad, tre månader eller ett år
            sedan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-xs animate-fade-in">
      <div className="flex items-center gap-3 px-7 pt-7 pb-5">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <History className="h-4.5 w-4.5 text-amber-600" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="heading-serif text-[20px]">Tidskapsel</h2>
          <p className="text-[12px] text-muted-foreground/50 mt-0.5">
            Återupptäck dina sparade minnen
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.12em] px-3 mb-2">
              {group.label}
            </p>
            <div>
              {group.memories.map((memory) => {
                const config =
                  contentTypeConfig[memory.content_type as ContentType];
                return (
                  <Link
                    href={`/minnen/${memory.id}`}
                    key={memory.id}
                    className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-accent/70 transition-all duration-200 group"
                  >
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: config
                          ? `${config.hex}0D`
                          : undefined,
                      }}
                    >
                      <ContentTypeIcon
                        type={memory.content_type as ContentType}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors duration-200">
                        {memory.title}
                      </p>
                      {memory.summary && (
                        <p className="text-[11px] text-muted-foreground/50 mt-0.5 truncate">
                          {memory.summary}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/40 whitespace-nowrap font-medium tabular-nums">
                      {format(new Date(memory.created_at), "d MMM yyyy", {
                        locale: sv,
                      })}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
