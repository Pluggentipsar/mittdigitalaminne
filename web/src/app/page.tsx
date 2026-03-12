"use client";

import useSWR from "swr";
import type { MemoryStats } from "@/lib/types";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentMemories } from "@/components/dashboard/RecentMemories";
import { TypeDistribution } from "@/components/dashboard/TypeDistribution";
import { Brain } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data } = useSWR<{ data: MemoryStats }>("/api/statistics", fetcher);
  const stats = data?.data ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        </div>
        <p className="text-[14px] text-muted-foreground">
          Översikt över ditt digitala minne
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentMemories recent={stats?.recent || []} />
        <TypeDistribution
          by_type={stats?.by_type || { image: 0, link: 0, article: 0, thought: 0, youtube: 0, linkedin: 0, instagram: 0 }}
          total={stats?.total || 0}
        />
      </div>
    </div>
  );
}
