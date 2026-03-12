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
    accent: "text-amber-700",
    accentBg: "bg-amber-50",
  },
  {
    key: "week",
    label: "Denna vecka",
    getValue: (s: MemoryStats) => s.this_week,
    icon: CalendarDays,
    accent: "text-emerald-700",
    accentBg: "bg-emerald-50",
  },
  {
    key: "favorites",
    label: "Favoriter",
    getValue: (s: MemoryStats) => s.favorites,
    icon: Star,
    accent: "text-orange-600",
    accentBg: "bg-orange-50",
  },
  {
    key: "tags",
    label: "Taggar",
    getValue: (s: MemoryStats) => s.top_tags?.length ?? 0,
    icon: Tags,
    accent: "text-violet-600",
    accentBg: "bg-violet-50",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.key}
          className={cn(
            "group relative rounded-2xl border border-border/80 bg-card p-5 card-hover animate-fade-in overflow-hidden",
            `stagger-${i + 1}`
          )}
        >
          <div className="flex items-center justify-between mb-5">
            <span className="text-[12px] font-medium text-muted-foreground tracking-wide">
              {card.label}
            </span>
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-transform duration-300 group-hover:scale-110",
                card.accentBg
              )}
            >
              <card.icon className={cn("h-4 w-4", card.accent)} strokeWidth={1.5} />
            </div>
          </div>
          <p className="heading-serif text-[36px] leading-none tracking-tight">
            {stats ? card.getValue(stats) : <span className="skeleton inline-block w-10 h-9" />}
          </p>
        </div>
      ))}
    </div>
  );
}
