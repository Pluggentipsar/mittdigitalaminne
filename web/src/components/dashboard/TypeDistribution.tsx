"use client";

import type { ContentType, MemoryStats } from "@/lib/types";
import { contentTypeConfig } from "@/lib/utils";
import { PieChart } from "lucide-react";

interface TypeDistributionProps {
  by_type: MemoryStats["by_type"];
  total: number;
}

export function TypeDistribution({ by_type, total }: TypeDistributionProps) {
  const allTypes = ["thought", "link", "article", "image", "youtube", "linkedin", "instagram"] as ContentType[];
  const types = allTypes.filter((t) => (by_type?.[t] || 0) > 0 || ["thought", "link", "article", "image"].includes(t));

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-7 animate-fade-in stagger-6">
      <h2 className="heading-serif text-[20px] mb-6">Fördelning</h2>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <PieChart className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] font-medium text-muted-foreground">Ingen data ännu</p>
        </div>
      ) : (
        <>
          {/* Horizontal stacked bar */}
          <div className="flex rounded-full overflow-hidden h-2 mb-7 bg-muted/80">
            {types.map((type) => {
              const count = by_type?.[type] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={type}
                  className="transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: contentTypeConfig[type].hex,
                  }}
                  title={`${contentTypeConfig[type].label}: ${count}`}
                />
              );
            })}
          </div>

          {/* Type list */}
          <div className="space-y-3.5">
            {types.map((type) => {
              const count = by_type?.[type] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const config = contentTypeConfig[type];
              return (
                <div key={type} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: config.hex }}
                  />
                  <span className="text-[13px] font-medium flex-1">
                    {config.label}
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums">
                    {count}
                  </span>
                  <span className="text-[11px] text-muted-foreground/50 w-10 text-right tabular-nums">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
