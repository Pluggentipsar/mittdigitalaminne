"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Memory } from "@/lib/types";
import { MemoryCard } from "@/components/memories/MemoryCard";
import { cn } from "@/lib/utils";

interface SortableMemoryCardProps {
  memory: Memory;
  onToggleFavorite?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
}

export function SortableMemoryCard({
  memory,
  onToggleFavorite,
  onDelete,
}: SortableMemoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: memory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/sortable",
        isDragging && "z-50 opacity-90"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "absolute top-3 left-3 z-10 flex items-center justify-center w-7 h-7 rounded-lg",
          "bg-white/90 backdrop-blur-sm border border-border/60 shadow-xs",
          "text-muted-foreground/30 hover:text-muted-foreground/70 hover:bg-white",
          "cursor-grab active:cursor-grabbing transition-all duration-200",
          "opacity-0 group-hover/sortable:opacity-100 focus:opacity-100",
          isDragging && "opacity-100 cursor-grabbing"
        )}
        title="Dra för att ändra ordning"
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.5} />
      </button>

      <MemoryCard
        memory={memory}
        onToggleFavorite={onToggleFavorite}
        onDelete={onDelete}
      />
    </div>
  );
}
