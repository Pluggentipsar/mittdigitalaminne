"use client";

import { useTags } from "@/hooks/useTags";
import { Hash } from "lucide-react";

export default function TaggarPage() {
  const { tags, isLoading } = useTags();

  const maxCount = Math.max(...tags.map((t) => t.memory_count || 0), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <p className="text-[11px] font-semibold text-primary/60 uppercase tracking-[0.15em] mb-2">
          Organisering
        </p>
        <h1 className="heading-serif text-[32px] md:text-[38px] text-foreground leading-[1.1]">
          Taggar
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Hantera dina taggar och se fördelningen
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[72px] rounded-2xl" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-5">
            <Hash className="h-7 w-7 text-muted-foreground/35" strokeWidth={1.5} />
          </div>
          <p className="heading-serif text-[20px] text-foreground/70 mb-1">
            Inga taggar ännu
          </p>
          <p className="text-[13px] text-muted-foreground">
            Taggar skapas automatiskt när du lägger till minnen
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags
            .sort((a, b) => (b.memory_count || 0) - (a.memory_count || 0))
            .map((tag, i) => {
              const count = tag.memory_count || 0;
              const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div
                  key={tag.id}
                  className={`group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 card-hover animate-fade-in stagger-${Math.min(i + 1, 6)}`}
                >
                  {/* Background bar */}
                  <div
                    className="absolute inset-0 opacity-[0.035] transition-all duration-500"
                    style={{
                      background: `linear-gradient(90deg, ${tag.color} ${barWidth}%, transparent ${barWidth}%)`,
                    }}
                  />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: tag.color,
                          boxShadow: `0 0 0 2px var(--card), 0 0 0 3.5px ${tag.color}25`,
                        }}
                      />
                      <span className="font-semibold text-[14px]">{tag.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold tabular-nums">
                        {count}
                      </span>
                      <span className="text-[11px] text-muted-foreground/60 font-medium">
                        {count === 1 ? "minne" : "minnen"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
