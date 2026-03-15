"use client";

import useSWR from "swr";
import type { MemoryStats } from "@/lib/types";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentMemories } from "@/components/dashboard/RecentMemories";
import { TypeDistribution } from "@/components/dashboard/TypeDistribution";
import { TimeCapsule } from "@/components/dashboard/TimeCapsule";
import { ActivityCalendar } from "@/components/dashboard/ActivityCalendar";
import { RemindersSection } from "@/components/dashboard/RemindersSection";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "God natt";
  if (hour < 12) return "God morgon";
  if (hour < 17) return "God eftermiddag";
  return "God kväll";
}

export default function DashboardPage() {
  const { data } = useSWR<{ data: MemoryStats }>("/api/statistics", fetcher);
  const stats = data?.data ?? null;

  return (
    <div className="space-y-10">
      {/* Hero greeting */}
      <div className="animate-fade-in">
        <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.18em] mb-3">
          {getGreeting()}
        </p>
        <h1 className="heading-serif text-[36px] md:text-[44px] text-foreground leading-[1.05]">
          Ditt kunskapsarkiv
        </h1>
        <p className="text-[14px] text-muted-foreground/70 mt-2.5 max-w-lg leading-relaxed">
          Allt du sparat, organiserat och redo att utforska.
        </p>

        {/* Decorative divider */}
        <div className="divider-ornament mt-7 max-w-md">
          <span className="text-primary/40">&#9670;</span>
        </div>
      </div>

      {/* Reminders — show prominently at top if any are due */}
      {stats && stats.reminders && stats.reminders.length > 0 && (
        <RemindersSection reminders={stats.reminders} />
      )}

      <StatsCards stats={stats} />

      {/* Activity calendar — full width */}
      <ActivityCalendar activity={stats?.activity || []} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentMemories recent={stats?.recent || []} />
        </div>
        <div className="lg:col-span-2">
          <TypeDistribution
            by_type={stats?.by_type || { image: 0, link: 0, article: 0, thought: 0, youtube: 0, linkedin: 0, instagram: 0, twitter: 0, audio: 0 }}
            total={stats?.total || 0}
          />
        </div>
      </div>

      <TimeCapsule />
    </div>
  );
}
