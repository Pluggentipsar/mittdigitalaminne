"use client";

import { useTags } from "@/hooks/useTags";
import { Tags, Hash } from "lucide-react";

export default function TaggarPage() {
  const { tags, isLoading } = useTags();

  const maxCount = Math.max(...tags.map((t) => t.memory_count || 0), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Taggar</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Hantera dina taggar och se fördelningen
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Hash className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-[15px] font-semibold text-foreground/70 mb-1">
            Inga taggar ännu
          </p>
          <p className="text-[13px] text-muted-foreground">
            Taggar skapas automatiskt när du lägger till minnen
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags
            .sort((a, b) => (b.memory_count || 0) - (a.memory_count || 0))
            .map((tag, i) => {
              const count = tag.memory_count || 0;
              const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div
                  key={tag.id}
                  className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-[0_4px_12px_rgba(26,24,20,0.06)] hover:-translate-y-0.5 animate-fade-in stagger-${Math.min(i + 1, 6)}`}
                >
                  {/* Background bar */}
                  <div
                    className="absolute inset-0 opacity-[0.04] transition-all duration-500"
                    style={{
                      background: `linear-gradient(90deg, ${tag.color} ${barWidth}%, transparent ${barWidth}%)`,
                    }}
                  />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: tag.color,
                          boxShadow: `0 0 0 2px var(--card), 0 0 0 4px ${tag.color}30`,
                        }}
                      />
                      <span className="font-bold text-[14px]">{tag.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold tabular-nums">
                        {count}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium">
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
