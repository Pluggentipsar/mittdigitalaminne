"use client";

import { Inbox } from "lucide-react";
import { useInbox } from "@/hooks/useInbox";
import { QuickCapture } from "@/components/inbox/QuickCapture";
import { InboxCard } from "@/components/inbox/InboxCard";

export default function InkorgPage() {
  const { memories, count, isLoading, mutate, archiveMemory, deleteMemory } = useInbox();

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="animate-fade-in">
        <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.18em] mb-3">
          Inkorg
        </p>
        <h1 className="heading-serif text-[36px] md:text-[44px] text-foreground leading-[1.05]">
          Snabbf&aring;nga
        </h1>
        <p className="text-[14px] text-muted-foreground/70 mt-2.5">
          Spara snabbt, bearbeta senare. Klistra in en l&auml;nk eller skriv en tanke.
        </p>

        <div className="divider-ornament mt-7 max-w-md">
          <span className="text-primary/30 text-[8px]">&#9670;</span>
        </div>
      </div>

      {/* Quick capture widget */}
      <QuickCapture onSaved={() => mutate()} />

      {/* Inbox items */}
      <div className="space-y-3">
        {count > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-[0.12em]">
              {count} {count === 1 ? "objekt" : "objekt"} i inkorg
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-card p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-16 rounded-md" />
                    <div className="skeleton h-4 w-3/4 rounded-md" />
                    <div className="skeleton h-3 w-24 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/8 flex items-center justify-center mb-4">
              <Inbox className="h-6 w-6 text-amber-400/60" strokeWidth={1.5} />
            </div>
            <h3 className="heading-serif text-[18px] text-foreground/80 mb-1.5">
              Inkorgen &auml;r tom
            </h3>
            <p className="text-[13px] text-muted-foreground/50 max-w-xs">
              Klistra in en URL eller skriv en tanke ovan f&ouml;r att snabbspara till inkorgen.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map((memory) => (
              <InboxCard
                key={memory.id}
                memory={memory}
                onArchive={archiveMemory}
                onDelete={deleteMemory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
