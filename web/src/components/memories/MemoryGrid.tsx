"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import type { Memory } from "@/lib/types";
import { MemoryCard } from "./MemoryCard";

interface MemoryGridProps {
  memories: Memory[];
  onToggleFavorite?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
}

export function MemoryGrid({ memories, onToggleFavorite, onDelete }: MemoryGridProps) {
  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-5">
          <Inbox className="h-7 w-7 text-muted-foreground/35" strokeWidth={1.5} />
        </div>
        <p className="heading-serif text-[20px] text-foreground/70 mb-1">
          Inga minnen hittades
        </p>
        <p className="text-[13px] text-muted-foreground mb-6">
          Lägg till ditt första minne via formuläret eller Claude
        </p>
        <Link
          href="/lagg-till"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
        >
          Lägg till minne
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {memories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
