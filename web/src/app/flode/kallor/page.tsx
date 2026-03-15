"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Rss } from "lucide-react";
import Link from "next/link";
import { useFeeds } from "@/hooks/useFeeds";
import { FeedSourceCard } from "@/components/feeds/FeedSourceCard";
import { AddFeedModal } from "@/components/feeds/AddFeedModal";

export default function KallorPage() {
  const { sources, categories, isLoading, mutate } = useFeeds();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    await fetch(`/api/feeds/${id}`, { method: "DELETE" });
    mutate();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/feeds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    });
    mutate();
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    await fetch(`/api/feeds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    mutate();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <Link
          href="/flode"
          className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors group mb-6"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Tillbaka till flödet
        </Link>

        <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.18em] mb-3">
          Källor
        </p>
        <h1 className="heading-serif text-[36px] md:text-[44px] text-foreground leading-[1.05]">
          Dina källor
        </h1>
        <p className="text-[14px] text-muted-foreground/70 mt-2.5">
          Hantera bloggar, YouTube-kanaler, poddar och nyhetsbrev.
        </p>

        <div className="divider-ornament mt-7 max-w-md">
          <span className="text-primary/30 text-[8px]">&#9670;</span>
        </div>
      </div>

      {/* Add button */}
      <div
        className="flex items-center gap-3 animate-fade-in"
        style={{ animationDelay: "0.05s" }}
      >
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all shadow-xs"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Lägg till källa
        </button>
        <span className="text-[12px] text-muted-foreground/40 font-medium">
          {sources.length} {sources.length === 1 ? "källa" : "källor"} totalt
        </span>
      </div>

      {/* Sources grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-2/3 rounded-md" />
                  <div className="skeleton h-3 w-16 rounded-md" />
                </div>
              </div>
              <div className="skeleton h-3 w-1/2 rounded-md" />
            </div>
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
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
            Lägg till din första källa för att börja bygga ditt flöde.
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Lägg till källa
          </button>
        </div>
      ) : (
        <div
          className="grid gap-4 md:grid-cols-2 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          {sources.map((source) => (
            <FeedSourceCard
              key={source.id}
              source={source}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onUpdate={handleUpdate}
              existingCategories={categories}
            />
          ))}
        </div>
      )}

      {/* Add Feed Modal */}
      <AddFeedModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdded={() => mutate()}
        existingCategories={categories}
      />
    </div>
  );
}
