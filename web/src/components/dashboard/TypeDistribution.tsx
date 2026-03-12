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
  const maxCount = Math.max(...types.map((t) => by_type?.[t] || 0), 1);

  return (
    <div className="rounded-2xl border border-border/70 bg-card overflow-hidden animate-fade-in stagger-6">
      <div className="px-7 pt-7 pb-5">
        <h2 className="heading-serif text-[20px]">Fördelning</h2>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-7 pb-7">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <PieChart className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] font-medium text-muted-foreground">Ingen data ännu</p>
        </div>
      ) : (
        <div className="px-7 pb-7">
          {/* Stacked bar */}
          <div className="flex rounded-full overflow-hidden h-2.5 mb-7 bg-muted/60">
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

          {/* Type rows with micro-bars */}
          <div className="space-y-3">
            {types.map((type) => {
              const count = by_type?.[type] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const config = contentTypeConfig[type];
              return (
                <div key={type} className="group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
                      style={{ backgroundColor: config.hex }}
                    />
                    <span className="text-[13px] font-medium flex-1">
                      {config.label}
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums">
                      {count}
                    </span>
                    <span className="text-[11px] text-muted-foreground/40 w-10 text-right tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="ml-[22px] h-[3px] bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${barPct}%`,
                        backgroundColor: config.hex,
                        opacity: 0.45,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
