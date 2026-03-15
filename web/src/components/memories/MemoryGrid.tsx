"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import Link from "next/link";
import type { Memory, Project } from "@/lib/types";
import { MemoryCard } from "./MemoryCard";
import { CardContextMenu } from "./CardContextMenu";
import { BulkActionBar } from "./BulkActionBar";

interface MemoryGridProps {
  memories: Memory[];
  projects?: Project[];
  selectionMode?: boolean;
  onToggleFavorite?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
  onAddToProject?: (memoryId: string, projectId: string) => Promise<void>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onBulkComplete?: () => void;
}

interface ContextMenuState {
  memory: Memory;
  x: number;
  y: number;
}

export function MemoryGrid({
  memories,
  projects = [],
  selectionMode = false,
  onToggleFavorite,
  onDelete,
  onAddToProject,
  onSelectionChange,
  onBulkComplete,
}: MemoryGridProps) {
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleContextMenu = (e: React.MouseEvent, memory: Memory) => {
    e.preventDefault();
    setContextMenu({ memory, x: e.clientX, y: e.clientY });
  };

  // Reset focus when memories change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [memories]);

  // Reset selection when exiting selection mode
  useEffect(() => {
    if (!selectionMode) {
      setSelectedIds(new Set());
    }
  }, [selectionMode]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  // Scroll focused card into view
  useEffect(() => {
    if (focusedIndex < 0 || !gridRef.current) return;
    const card = gridRef.current.querySelector(
      `[data-card-index="${focusedIndex}"]`
    );
    card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedIndex]);

  // Toggle selection of a single memory
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(memories.map((m) => m.id)));
  }, [memories]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Bulk operations
  const handleBulkFavorite = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await fetch("/api/memories/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action: "favorite" }),
    });
    onBulkComplete?.();
  }, [selectedIds, onBulkComplete]);

  const handleBulkUnfavorite = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await fetch("/api/memories/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action: "unfavorite" }),
    });
    onBulkComplete?.();
  }, [selectedIds, onBulkComplete]);

  const handleBulkDelete = useCallback(async () => {
    const count = selectedIds.size;
    if (!confirm(`Vill du verkligen ta bort ${count} ${count === 1 ? "minne" : "minnen"}?`)) return;
    const ids = Array.from(selectedIds);
    await fetch("/api/memories/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action: "delete" }),
    });
    setSelectedIds(new Set());
    onBulkComplete?.();
  }, [selectedIds, onBulkComplete]);

  const handleBulkAddToProject = useCallback(async (projectId: string) => {
    const ids = Array.from(selectedIds);
    await fetch("/api/memories/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action: "add_to_project", project_id: projectId }),
    });
    onBulkComplete?.();
  }, [selectedIds, onBulkComplete]);

  // Keyboard navigation: J/K/Enter/Escape + Space for selection
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea or command palette is open
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        target.closest("[role='dialog']")
      ) {
        return;
      }

      // Don't intercept if modifier keys are held (except for focus)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "j":
        case "ArrowDown": {
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev < memories.length - 1) return prev + 1;
            return prev;
          });
          break;
        }
        case "k":
        case "ArrowUp": {
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev < 0) return 0;
            if (prev > 0) return prev - 1;
            return prev;
          });
          break;
        }
        case "Enter": {
          if (focusedIndex >= 0 && focusedIndex < memories.length) {
            e.preventDefault();
            if (selectionMode) {
              toggleSelection(memories[focusedIndex].id);
            } else {
              router.push(`/minnen/${memories[focusedIndex].id}`);
            }
          }
          break;
        }
        case " ": {
          // Space toggles selection in selection mode
          if (selectionMode && focusedIndex >= 0 && focusedIndex < memories.length) {
            e.preventDefault();
            toggleSelection(memories[focusedIndex].id);
          }
          break;
        }
        case "Escape": {
          if (focusedIndex >= 0) {
            e.preventDefault();
            setFocusedIndex(-1);
          }
          break;
        }
      }
    },
    [memories, focusedIndex, router, selectionMode, toggleSelection]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
    <>
      {/* Keyboard hint — shows only when grid has focus and not in selection mode */}
      {focusedIndex >= 0 && !selectionMode && (
        <div className="flex items-center gap-3 mb-2 animate-fade">
          <div className="flex items-center gap-1.5 text-muted-foreground/40 text-[10px] font-medium">
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-muted/80 border border-border/50 text-[10px] font-mono">J</kbd>
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-muted/80 border border-border/50 text-[10px] font-mono">K</kbd>
            <span className="ml-0.5">navigera</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground/40 text-[10px] font-medium">
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded bg-muted/80 border border-border/50 text-[10px] font-mono">↵</kbd>
            <span className="ml-0.5">öppna</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground/40 text-[10px] font-medium">
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded bg-muted/80 border border-border/50 text-[10px] font-mono">Esc</kbd>
            <span className="ml-0.5">avmarkera</span>
          </div>
        </div>
      )}

      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {memories.map((memory, index) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            index={index}
            isFocused={focusedIndex === index}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(memory.id)}
            onToggleSelect={() => toggleSelection(memory.id)}
            onToggleFavorite={onToggleFavorite}
            onDelete={onDelete}
            onContextMenu={(e) => handleContextMenu(e, memory)}
            onLongPress={(x, y) => setContextMenu({ memory, x, y })}
          />
        ))}
      </div>

      {/* Bulk action bar */}
      {selectionMode && selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={memories.length}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onBulkFavorite={handleBulkFavorite}
          onBulkUnfavorite={handleBulkUnfavorite}
          onBulkDelete={handleBulkDelete}
          onBulkAddToProject={handleBulkAddToProject}
          projects={projects}
        />
      )}

      {contextMenu && onToggleFavorite && onDelete && onAddToProject && (
        <CardContextMenu
          memory={contextMenu.memory}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onToggleFavorite={onToggleFavorite}
          onDelete={(id) => {
            if (confirm("Vill du verkligen ta bort detta minne?")) {
              onDelete(id);
            }
          }}
          onAddToProject={onAddToProject}
          projects={projects}
        />
      )}
    </>
  );
}
