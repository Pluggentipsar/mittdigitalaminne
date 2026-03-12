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
    iconColor: "text-type-link",
    iconBg: "bg-type-link/8",
  },
  {
    key: "week",
    label: "Denna vecka",
    getValue: (s: MemoryStats) => s.this_week,
    icon: CalendarDays,
    iconColor: "text-type-article",
    iconBg: "bg-type-article/8",
  },
  {
    key: "favorites",
    label: "Favoriter",
    getValue: (s: MemoryStats) => s.favorites,
    icon: Star,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
  },
  {
    key: "tags",
    label: "Taggar",
    getValue: (s: MemoryStats) => s.top_tags?.length ?? 0,
    icon: Tags,
    iconColor: "text-type-thought",
    iconBg: "bg-type-thought/8",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.key}
          className={cn(
            "group relative rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-[0_4px_12px_rgba(26,24,20,0.06)] hover:-translate-y-0.5 animate-fade-in overflow-hidden",
            `stagger-${i + 1}`
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-medium text-muted-foreground">
              {card.label}
            </span>
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl transition-transform duration-300 group-hover:scale-110",
                card.iconBg
              )}
            >
              <card.icon className={cn("h-[18px] w-[18px]", card.iconColor)} />
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">
            {stats ? card.getValue(stats) : <span className="skeleton inline-block w-10 h-8" />}
          </p>
        </div>
      ))}
    </div>
  );
}
