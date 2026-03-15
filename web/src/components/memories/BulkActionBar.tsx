"use client";

import { useState } from "react";
import {
  Star,
  StarOff,
  Trash2,
  FolderPlus,
  X,
  Check,
  Loader2,
  CheckSquare,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkFavorite: () => Promise<void>;
  onBulkUnfavorite: () => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkAddToProject: (projectId: string) => Promise<void>;
  projects: Project[];
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkFavorite,
  onBulkUnfavorite,
  onBulkDelete,
  onBulkAddToProject,
  projects,
}: BulkActionBarProps) {
  const [showProjects, setShowProjects] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [addedProject, setAddedProject] = useState<string | null>(null);

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setLoading(action);
    try {
      await fn();
    } finally {
      setLoading(null);
    }
  };

  const handleAddToProject = async (projectId: string) => {
    setLoading(`project-${projectId}`);
    try {
      await onBulkAddToProject(projectId);
      setAddedProject(projectId);
      setTimeout(() => setAddedProject(null), 1500);
    } finally {
      setLoading(null);
    }
  };

  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up-sm">
      <div
        className="flex items-center gap-1 px-2 py-1.5 bg-sidebar text-sidebar-foreground rounded-2xl shadow-lg border border-sidebar-foreground/10"
        style={{
          boxShadow:
            "0 20px 48px rgba(0,0,0,0.25), 0 8px 16px rgba(0,0,0,0.15)",
        }}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-r border-sidebar-foreground/10">
          <CheckSquare className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
          <span className="text-[13px] font-semibold tabular-nums whitespace-nowrap">
            {selectedCount} valda
          </span>
        </div>

        {/* Select all / deselect */}
        <button
          onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
          className="px-3 py-2 rounded-xl text-[12px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 transition-all whitespace-nowrap"
        >
          {selectedCount === totalCount ? "Avmarkera alla" : "Markera alla"}
        </button>

        <div className="w-px h-6 bg-sidebar-foreground/10" />

        {/* Favorite */}
        <button
          onClick={() => handleAction("fav", onBulkFavorite)}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium text-sidebar-foreground/60 hover:text-amber-400 hover:bg-sidebar-foreground/10 transition-all disabled:opacity-40 whitespace-nowrap"
          title="Favorit"
        >
          {loading === "fav" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Star className="h-4 w-4" strokeWidth={1.5} />
          )}
          <span className="hidden sm:inline">Favorit</span>
        </button>

        {/* Unfavorite */}
        <button
          onClick={() => handleAction("unfav", onBulkUnfavorite)}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 transition-all disabled:opacity-40 whitespace-nowrap"
          title="Ta bort favorit"
        >
          {loading === "unfav" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <StarOff className="h-4 w-4" strokeWidth={1.5} />
          )}
          <span className="hidden sm:inline">Ej favorit</span>
        </button>

        {/* Add to project */}
        <div className="relative">
          <button
            onClick={() => setShowProjects(!showProjects)}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 transition-all disabled:opacity-40 whitespace-nowrap"
            title="Lägg till i projekt"
          >
            <FolderPlus className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Projekt</span>
          </button>

          {showProjects && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-card rounded-xl border border-border/60 shadow-lg py-1.5 animate-scale-in">
              {activeProjects.length === 0 ? (
                <p className="px-4 py-3 text-[12px] text-muted-foreground/50">
                  Inga projekt
                </p>
              ) : (
                activeProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleAddToProject(project.id)}
                    disabled={loading?.startsWith("project-")}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[12px] font-medium hover:bg-accent/70 transition-colors disabled:opacity-50"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="flex-1 truncate text-foreground">
                      {project.name}
                    </span>
                    {loading === `project-${project.id}` && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/50" />
                    )}
                    {addedProject === project.id && (
                      <Check className="h-3 w-3 text-emerald-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-sidebar-foreground/10" />

        {/* Delete */}
        <button
          onClick={() => handleAction("del", onBulkDelete)}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 whitespace-nowrap"
          title="Ta bort"
        >
          {loading === "del" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          )}
          <span className="hidden sm:inline">Ta bort</span>
        </button>

        <div className="w-px h-6 bg-sidebar-foreground/10" />

        {/* Close selection mode */}
        <button
          onClick={onDeselectAll}
          className="p-2 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 transition-all"
          title="Avsluta markering"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
