"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Bookmark,
  Calendar,
  FolderOpen,
  Tag,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import type { MemoryStats, FeedItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DashboardFeed } from "@/components/dashboard/DashboardFeed";
import { RemindersSection } from "@/components/dashboard/RemindersSection";
import { TimeCapsule } from "@/components/dashboard/TimeCapsule";
import { useInbox } from "@/hooks/useInbox";
import { useFeedItems } from "@/hooks/useFeeds";
import { FeedDetailModal } from "@/components/feeds/FeedDetailModal";

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

  // Recent memories (inbox + regular)
  const { memories: inboxMemories, isLoading: inboxLoading, archiveMemory, mutate: mutateInbox } = useInbox();

  // Feed suggestions
  const {
    items: feedItems,
    isLoading: feedLoading,
    mutate: mutateFeed,
  } = useFeedItems({ sort: "smart", limit: 20, unread_only: false });

  // Feed detail modal state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedIndex = selectedItemId !== null
    ? feedItems.findIndex((i) => i.id === selectedItemId)
    : -1;
  const selectedItem = selectedIndex >= 0 ? feedItems[selectedIndex] : null;

  // Stats collapsed state
  const [statsOpen, setStatsOpen] = useState(false);

  const handleSaveFeedItem = useCallback(
    async (itemId: string) => {
      const res = await fetch(`/api/feeds/items/${itemId}/save`, {
        method: "POST",
      });
      if (res.ok) {
        mutateFeed();
      }
    },
    [mutateFeed]
  );

  const handleMarkRead = useCallback(
    async (itemId: string) => {
      await fetch(`/api/feeds/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });
    },
    []
  );

  const handleFeedItemClick = useCallback((item: FeedItem) => {
    setSelectedItemId(item.id);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedItemId(null);
    mutateFeed();
  }, [mutateFeed]);

  const handlePrev = useCallback(() => {
    if (selectedIndex <= 0) return;
    setSelectedItemId(feedItems[selectedIndex - 1]?.id || null);
  }, [selectedIndex, feedItems]);

  const handleNext = useCallback(() => {
    if (selectedIndex < 0 || selectedIndex >= feedItems.length - 1) return;
    setSelectedItemId(feedItems[selectedIndex + 1]?.id || null);
  }, [selectedIndex, feedItems]);

  return (
    <div className="space-y-8">
      {/* Hero greeting + compact stats */}
      <div className="animate-fade-in">
        <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.18em] mb-3">
          {getGreeting()}
        </p>
        <h1 className="heading-serif text-[32px] md:text-[40px] text-foreground leading-[1.05]">
          Ditt kunskapsarkiv
        </h1>

        {/* Compact stat chips */}
        {stats && (
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <Link
              href="/minnen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/50 text-[12px] text-muted-foreground/60 hover:text-foreground hover:border-border transition-all group"
            >
              <Bookmark className="h-3 w-3 text-primary/50" strokeWidth={1.5} />
              <span className="font-bold text-foreground/80">{stats.total}</span>
              <span>minnen</span>
            </Link>
            {stats.this_week > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[12px] text-emerald-600/70">
                <Calendar className="h-3 w-3" strokeWidth={1.5} />
                <span className="font-bold">{stats.this_week}</span>
                <span>denna vecka</span>
              </div>
            )}
            {stats.favorites > 0 && (
              <Link
                href="/minnen?favorites=true"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/50 text-[12px] text-muted-foreground/60 hover:text-foreground hover:border-border transition-all"
              >
                <span className="font-bold text-foreground/80">{stats.favorites}</span>
                <span>favoriter</span>
              </Link>
            )}
            {(stats.top_tags?.length ?? 0) > 0 && (
              <Link
                href="/taggar"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/50 text-[12px] text-muted-foreground/60 hover:text-foreground hover:border-border transition-all"
              >
                <Tag className="h-3 w-3 text-violet-400/60" strokeWidth={1.5} />
                <span className="font-bold text-foreground/80">{stats.top_tags?.length ?? 0}</span>
                <span>taggar</span>
              </Link>
            )}

            {stats.inbox_count > 0 && (
              <Link
                href="/inkorg"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/15 text-[12px] text-primary/70 hover:bg-primary/10 transition-all"
              >
                <FolderOpen className="h-3 w-3" strokeWidth={1.5} />
                <span className="font-bold">{stats.inbox_count}</span>
                <span>i inkorgen</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Reminders — prominent if due */}
      {stats && stats.reminders && stats.reminders.length > 0 && (
        <RemindersSection reminders={stats.reminders} />
      )}

      {/* ─── Unified Feed ─── */}
      <DashboardFeed
        memories={inboxMemories.slice(0, 15)}
        feedItems={feedItems}
        feedLoading={feedLoading}
        memoriesLoading={inboxLoading}
        onSaveFeedItem={handleSaveFeedItem}
        onMarkRead={handleMarkRead}
        onArchiveMemory={archiveMemory}
        onFeedItemClick={handleFeedItemClick}
      />

      {/* Time Capsule */}
      <TimeCapsule />

      {/* Feed Detail Modal */}
      <FeedDetailModal
        open={selectedItemId !== null}
        item={selectedItem}
        onClose={handleModalClose}
        onSave={handleSaveFeedItem}
        onMarkRead={handleMarkRead}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex >= 0 && selectedIndex < feedItems.length - 1}
      />
    </div>
  );
}
