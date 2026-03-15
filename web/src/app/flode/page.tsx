"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Rss, Settings2, Plus, RefreshCw, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useFeedItems, useFeeds } from "@/hooks/useFeeds";
import { FeedItemCard } from "@/components/feeds/FeedItemCard";
import { FeedFilterBar } from "@/components/feeds/FeedFilterBar";
import { FeedDetailModal } from "@/components/feeds/FeedDetailModal";
import { AddFeedModal } from "@/components/feeds/AddFeedModal";
import type { FeedItem } from "@/lib/types";

export default function FlodePage() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sort, setSort] = useState<"newest" | "oldest" | "relevance" | "smart">("smart");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchInput]);

  const { items, count, availableTags, isLoading, mutate } = useFeedItems({
    feed_type: activeType || undefined,
    category: activeCategory || undefined,
    tag: activeTag || undefined,
    q: searchQuery || undefined,
    unread_only: unreadOnly,
    sort,
    limit: 50,
  });

  const { sources, categories, mutate: mutateSources } = useFeeds();

  // Find selected item and its current index by ID (stable across re-fetches)
  const selectedIndex = selectedItemId !== null
    ? items.findIndex((i) => i.id === selectedItemId)
    : -1;
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null;

  const handleSave = useCallback(
    async (itemId: string) => {
      const res = await fetch(`/api/feeds/items/${itemId}/save`, {
        method: "POST",
      });
      if (res.ok) {
        mutate();
      }
    },
    [mutate]
  );

  const handleMarkRead = useCallback(
    async (itemId: string) => {
      await fetch(`/api/feeds/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });
      // Don't mutate here — avoids re-sorting which causes carousel bug.
      // The list will refresh when the modal is closed or on next user action.
    },
    []
  );

  const handleModalClose = useCallback(() => {
    setSelectedItemId(null);
    // Refresh the list when closing to reflect read status changes
    mutate();
  }, [mutate]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch("/api/feeds/fetch");
      mutate();
      mutateSources();
    } finally {
      setRefreshing(false);
    }
  }, [mutate, mutateSources]);

  const handleFeedAdded = () => {
    mutateSources();
    mutate();
  };

  const handleItemClick = useCallback(
    (item: FeedItem) => {
      setSelectedItemId(item.id);
    },
    []
  );

  const handlePrev = useCallback(() => {
    if (selectedIndex <= 0) return;
    setSelectedItemId(items[selectedIndex - 1]?.id || null);
  }, [selectedIndex, items]);

  const handleNext = useCallback(() => {
    if (selectedIndex < 0 || selectedIndex >= items.length - 1) return;
    setSelectedItemId(items[selectedIndex + 1]?.id || null);
  }, [selectedIndex, items]);

  const hasSources = sources.length > 0;

  // Group YouTube items in a grid, others in a list
  const youtubeItems = items.filter((i) => i.source?.feed_type === "youtube");
  const otherItems = items.filter((i) => i.source?.feed_type !== "youtube");

  // When filtering by type, don't split
  const showMixed = !activeType;

  return (
    <div className="space-y-5 md:space-y-8">
      {/* Hero header — compact on mobile */}
      <div className="animate-fade-in">
        <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.18em] mb-2">
          Flöde
        </p>
        <h1 className="heading-serif text-[28px] md:text-[44px] text-foreground leading-[1.05]">
          Ditt flöde
        </h1>
        <p className="text-[13px] md:text-[14px] text-muted-foreground/70 mt-1.5 hidden sm:block">
          Nytt innehåll från dina källor, kurerat efter dina intressen.
        </p>
      </div>

      {/* Toolbar */}
      <div
        className="animate-fade-in"
        style={{ animationDelay: "0.05s" }}
      >
        <FeedFilterBar
          activeType={activeType}
          onTypeChange={setActiveType}
          unreadOnly={unreadOnly}
          onUnreadChange={setUnreadOnly}
          sort={sort}
          onSortChange={setSort}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={categories}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          availableTags={availableTags}
        />
      </div>

      {/* Search + action buttons */}
      <div
        className="flex items-center gap-1.5 animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/35" strokeWidth={2} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Sök i flödet..."
            className="w-full h-7 pl-7 pr-7 rounded-full border border-border/40 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:border-primary/40 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Action buttons — compact row */}
      <div
        className="flex items-center gap-1.5 animate-fade-in"
      >
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-1 h-7 px-2.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-all shadow-xs whitespace-nowrap"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          <span>Ny källa</span>
        </button>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 h-7 px-2.5 rounded-full border border-border/40 text-[11px] font-medium text-muted-foreground/50 hover:text-foreground hover:border-border transition-all disabled:opacity-50 whitespace-nowrap"
          title="Hämta nytt innehåll"
        >
          <RefreshCw
            className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
            strokeWidth={1.5}
          />
          <span>{refreshing ? "..." : "Uppdatera"}</span>
        </button>

        <Link
          href="/flode/kallor"
          className="flex items-center gap-1 h-7 px-2.5 rounded-full border border-border/40 text-[11px] font-medium text-muted-foreground/50 hover:text-foreground hover:border-border transition-all whitespace-nowrap"
          title="Hantera källor"
        >
          <Settings2 className="h-3 w-3" strokeWidth={1.5} />
          <span>Källor ({sources.length})</span>
        </Link>
      </div>

      {/* Feed items */}
      {isLoading ? (
        <div className="space-y-4">
          {/* YouTube skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={`yt-${i}`}
                className="rounded-2xl border border-border/60 bg-card overflow-hidden"
              >
                <div className="skeleton aspect-video" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-3 w-24 rounded-md" />
                  <div className="skeleton h-4 w-3/4 rounded-md" />
                </div>
              </div>
            ))}
          </div>
          {/* Article skeletons */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`art-${i}`}
              className="rounded-2xl border border-border/60 bg-card p-5"
            >
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-24 rounded-md" />
                  <div className="skeleton h-4 w-3/4 rounded-md" />
                  <div className="skeleton h-3 w-full rounded-md" />
                  <div className="skeleton h-3 w-2/3 rounded-md" />
                </div>
                <div className="skeleton w-36 h-24 rounded-xl shrink-0 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasSources ? (
        /* Empty state — no sources */
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/8 flex items-center justify-center mb-5">
            <Rss
              className="h-7 w-7 text-amber-400/60"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="heading-serif text-[20px] text-foreground/80 mb-2">
            Inga källor ännu
          </h3>
          <p className="text-[13px] text-muted-foreground/50 max-w-sm mb-6">
            Lägg till YouTube-kanaler, bloggar, poddar eller nyhetsbrev
            för att få ett kurerat flöde av innehåll.
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Lägg till din första källa
          </button>
        </div>
      ) : items.length === 0 ? (
        /* Empty state — no items matching filter */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Rss
              className="h-6 w-6 text-muted-foreground/30"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="heading-serif text-[18px] text-foreground/70 mb-1.5">
            {unreadOnly ? "Inga olästa objekt" : "Inga objekt att visa"}
          </h3>
          <p className="text-[13px] text-muted-foreground/40 max-w-xs">
            {unreadOnly
              ? "Du har läst allt! Prova att visa alla objekt."
              : "Nytt innehåll dyker upp här när dina källor uppdateras."}
          </p>
        </div>
      ) : (
        <div
          className="space-y-6 animate-fade-in"
          style={{ animationDelay: "0.15s" }}
        >
          {/* Count */}
          <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-[0.12em]">
            {count} {count === 1 ? "objekt" : "objekt"}
            {unreadOnly ? " (olästa)" : ""}
            {activeCategory ? ` i "${activeCategory}"` : ""}
          </p>

          {/* Mixed view: YouTube grid + other items list */}
          {showMixed && youtubeItems.length > 0 && (
            <>
              {/* YouTube section */}
              <div>
                <p className="text-[11px] font-semibold text-red-500/50 uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                    <path d="M9.545 15.568V8.432L15.818 12z" fill="white" />
                  </svg>
                  YouTube
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {youtubeItems.map((item) => (
                    <FeedItemCard
                      key={item.id}
                      item={item}
                      onSave={handleSave}
                      onMarkRead={handleMarkRead}
                      onClick={handleItemClick}
                    />
                  ))}
                </div>
              </div>

              {/* Divider if there are also other items */}
              {otherItems.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border/40" />
                  <span className="text-primary/20 text-[8px]">&#9670;</span>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border/40" />
                </div>
              )}
            </>
          )}

          {/* Other items list (non-YouTube in mixed, or everything when type-filtered) */}
          {showMixed && otherItems.length > 0 && (
            <div className="space-y-3">
              {otherItems.map((item) => (
                <FeedItemCard
                  key={item.id}
                  item={item}
                  onSave={handleSave}
                  onMarkRead={handleMarkRead}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          )}

          {/* Type-filtered view: YouTube gets grid, others get list */}
          {activeType === "youtube" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <FeedItemCard
                  key={item.id}
                  item={item}
                  onSave={handleSave}
                  onMarkRead={handleMarkRead}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          )}

          {activeType && activeType !== "youtube" && (
            <div className="space-y-3">
              {items.map((item) => (
                <FeedItemCard
                  key={item.id}
                  item={item}
                  onSave={handleSave}
                  onMarkRead={handleMarkRead}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feed Detail Modal */}
      <FeedDetailModal
        open={selectedItemId !== null}
        item={selectedItem}
        onClose={handleModalClose}
        onSave={handleSave}
        onMarkRead={handleMarkRead}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex >= 0 && selectedIndex < items.length - 1}
      />

      {/* Add Feed Modal */}
      <AddFeedModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdded={handleFeedAdded}
        existingCategories={categories}
      />
    </div>
  );
}
