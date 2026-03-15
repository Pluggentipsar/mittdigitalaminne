"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ActivityCalendarProps {
  activity: { date: string; count: number }[];
}

const WEEKS = 17; // ~4 months
const DAYS = 7;
const DAY_LABELS = ["", "Mån", "", "Ons", "", "Fre", ""];

function getIntensity(count: number, max: number): string {
  if (count === 0) return "bg-muted/50";
  const ratio = count / max;
  if (ratio <= 0.25) return "bg-amber-300/40";
  if (ratio <= 0.5) return "bg-amber-400/60";
  if (ratio <= 0.75) return "bg-amber-500/80";
  return "bg-amber-500";
}

export function ActivityCalendar({ activity }: ActivityCalendarProps) {
  const { grid, max, totalInPeriod, monthLabels } = useMemo(() => {
    // Build a map of date → count
    const map: Record<string, number> = {};
    activity.forEach((a) => {
      map[a.date] = a.count;
    });

    // Generate grid: WEEKS columns × 7 rows
    const today = new Date();
    const endDate = new Date(today);
    // Start from (WEEKS * 7 - 1) days ago, aligned to start of week (Monday)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (WEEKS * 7 - 1));
    // Align to Monday
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    const cells: { date: string; count: number; isToday: boolean; isFuture: boolean }[][] = [];
    let maxCount = 1;
    let total = 0;
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    for (let week = 0; week < WEEKS; week++) {
      const column: { date: string; count: number; isToday: boolean; isFuture: boolean }[] = [];
      for (let day = 0; day < DAYS; day++) {
        const dateStr = cursor.toISOString().slice(0, 10);
        const count = map[dateStr] || 0;
        const isToday = dateStr === today.toISOString().slice(0, 10);
        const isFuture = cursor > endDate;

        if (count > maxCount) maxCount = count;
        total += count;

        // Track month labels
        const month = cursor.getMonth();
        if (month !== lastMonth && day === 0) {
          const monthName = cursor.toLocaleDateString("sv-SE", { month: "short" });
          months.push({ label: monthName, col: week });
          lastMonth = month;
        }

        column.push({ date: dateStr, count, isToday, isFuture });
        cursor.setDate(cursor.getDate() + 1);
      }
      cells.push(column);
    }

    return { grid: cells, max: maxCount, totalInPeriod: total, monthLabels: months };
  }, [activity]);

  return (
    <div className="rounded-2xl border border-border/70 bg-card overflow-hidden animate-fade-in stagger-5">
      <div className="flex items-center justify-between px-7 pt-7 pb-4">
        <div>
          <h2 className="heading-serif text-[20px]">Aktivitet</h2>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            {totalInPeriod} minnen de senaste {WEEKS} veckorna
          </p>
        </div>
      </div>

      <div className="px-7 pb-6 overflow-x-auto scrollbar-none">
        {/* Month labels */}
        <div className="flex ml-[28px] mb-1.5">
          {monthLabels.map((m, i) => (
            <span
              key={`${m.label}-${i}`}
              className="text-[9px] text-muted-foreground/40 font-medium capitalize"
              style={{
                position: "relative",
                left: `${m.col * 16}px`,
                width: 0,
                whiteSpace: "nowrap",
              }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1.5 shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="h-[13px] flex items-center"
              >
                <span className="text-[8px] text-muted-foreground/30 font-medium w-[22px] text-right">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Grid */}
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  className={cn(
                    "w-[13px] h-[13px] rounded-[3px] transition-colors duration-200",
                    cell.isFuture ? "bg-transparent" : getIntensity(cell.count, max),
                    cell.isToday && "ring-1 ring-amber-600/40 ring-offset-1 ring-offset-card",
                    !cell.isFuture && "hover:ring-1 hover:ring-foreground/20"
                  )}
                  title={cell.isFuture ? "" : `${cell.date}: ${cell.count} ${cell.count === 1 ? "minne" : "minnen"}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[9px] text-muted-foreground/30 font-medium mr-1">Färre</span>
          <div className="w-[11px] h-[11px] rounded-[2px] bg-muted/50" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-amber-300/40" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-amber-400/60" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-amber-500/80" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-amber-500" />
          <span className="text-[9px] text-muted-foreground/30 font-medium ml-1">Fler</span>
        </div>
      </div>
    </div>
  );
}
