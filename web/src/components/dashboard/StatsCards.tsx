"use client";

import { Library, CalendarDays, Star, Tags } from "lucide-react";
import type { MemoryStats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: MemoryStats | null;
}

const cards = [
  {
    key: "total",
    label: "Totalt",
    getValue: (s: MemoryStats) => s.total,
    icon: Library,
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    accent: "text-amber-700",
    accentBg: "bg-amber-500/8",
    lineColor: "bg-gradient-to-r from-amber-400 to-amber-600",
  },
  {
    key: "week",
    label: "Denna vecka",
    getValue: (s: MemoryStats) => s.this_week,
    icon: CalendarDays,
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    accent: "text-emerald-700",
    accentBg: "bg-emerald-500/8",
    lineColor: "bg-gradient-to-r from-emerald-400 to-emerald-600",
  },
  {
    key: "favorites",
    label: "Favoriter",
    getValue: (s: MemoryStats) => s.favorites,
    icon: Star,
    gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
    accent: "text-orange-600",
    accentBg: "bg-orange-500/8",
    lineColor: "bg-gradient-to-r from-orange-400 to-orange-500",
  },
  {
    key: "tags",
    label: "Taggar",
    getValue: (s: MemoryStats) => s.top_tags?.length ?? 0,
    icon: Tags,
    gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
    accent: "text-violet-600",
    accentBg: "bg-violet-500/8",
    lineColor: "bg-gradient-to-r from-violet-400 to-violet-600",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.key}
          className={cn(
            "group relative rounded-2xl border border-border/70 bg-card overflow-hidden card-hover animate-scale-in",
            `stagger-${i + 1}`
          )}
        >
          {/* Top accent gradient line */}
          <div className={cn("h-[2px] w-full opacity-50 group-hover:opacity-100 transition-opacity duration-300", card.lineColor)} />

          {/* Hover gradient background */}
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", card.gradient)} />

          <div className="relative p-5 pt-4">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] font-semibold text-muted-foreground/55 uppercase tracking-[0.06em]">
                {card.label}
              </span>
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 group-hover:scale-110",
                  card.accentBg
                )}
              >
                <card.icon className={cn("h-4 w-4", card.accent)} strokeWidth={1.5} />
              </div>
            </div>
            <p className="heading-serif text-[38px] leading-none tracking-tight">
              {stats ? (
                <span className="number-reveal inline-block" style={{ animationDelay: `${0.3 + i * 0.12}s` }}>
                  {card.getValue(stats)}
                </span>
              ) : (
                <span className="skeleton inline-block w-10 h-9" />
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
