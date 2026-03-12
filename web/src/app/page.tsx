"use client";

import useSWR from "swr";
import type { MemoryStats } from "@/lib/types";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentMemories } from "@/components/dashboard/RecentMemories";
import { TypeDistribution } from "@/components/dashboard/TypeDistribution";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data } = useSWR<{ data: MemoryStats }>("/api/statistics", fetcher);
  const stats = data?.data ?? null;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="animate-fade-in">
        <p className="text-[11px] font-semibold text-primary/60 uppercase tracking-[0.15em] mb-2">
          Översikt
        </p>
        <h1 className="heading-serif text-[32px] md:text-[38px] text-foreground leading-[1.1]">
          Dashboard
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2 max-w-md">
          Ditt digitala kunskapsarkiv samlat på ett ställe.
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentMemories recent={stats?.recent || []} />
        </div>
        <div className="lg:col-span-2">
          <TypeDistribution
            by_type={stats?.by_type || { image: 0, link: 0, article: 0, thought: 0, youtube: 0, linkedin: 0, instagram: 0 }}
            total={stats?.total || 0}
          />
        </div>
      </div>
    </div>
  );
}
