"use client";

import { useEffect, useRef, useState } from "react";
import {
  Star,
  FolderPlus,
  FileDown,
  FileText,
  ExternalLink,
  Trash2,
  ChevronRight,
  Check,
  Loader2,
  Bell,
  Share2,
  Copy,
} from "lucide-react";
import type { Memory, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { downloadAsText, downloadAsDocx } from "@/lib/export";

interface CardContextMenuProps {
  memory: Memory;
  x: number;
  y: number;
  onClose: () => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onAddToProject: (memoryId: string, projectId: string) => Promise<void>;
  projects: Project[];
}

export function CardContextMenu({
  memory,
  x,
  y,
  onClose,
  onToggleFavorite,
  onDelete,
  onAddToProject,
  projects,
}: CardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showProjects, setShowProjects] = useState(false);
  const [addingToProject, setAddingToProject] = useState<string | null>(null);
  const [addedToProject, setAddedToProject] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  // Position the menu within viewport
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let nx = x;
      let ny = y;
      if (x + rect.width > vw - 8) nx = vw - rect.width - 8;
      if (y + rect.height > vh - 8) ny = vh - rect.height - 8;
      if (nx < 8) nx = 8;
      if (ny < 8) ny = 8;
      setPosition({ x: nx, y: ny });
    }
  }, [x, y]);

  // Close on click/touch outside or Escape
  // Delay adding touch listener to avoid immediate close from the same
  // touch event that triggered the long-press opening
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleTouch(e: TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    // Small delay before listening for touch events — prevents the
    // opening long-press touchend from immediately closing the menu
    const touchTimer = setTimeout(() => {
      document.addEventListener("touchstart", handleTouch);
    }, 100);

    return () => {
      clearTimeout(touchTimer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleTouch);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleExportText = () => {
    downloadAsText(memory);
    onClose();
  };

  const handleExportDocx = async () => {
    await downloadAsDocx(memory);
    onClose();
  };

  const handleAddToProject = async (projectId: string) => {
    setAddingToProject(projectId);
    try {
      await onAddToProject(memory.id, projectId);
      setAddedToProject((prev) => new Set(prev).add(projectId));
    } catch {
      // ignore
    }
    setAddingToProject(null);
  };

  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[200px] bg-card rounded-xl border border-border/60 shadow-lg py-1.5 animate-scale-in"
      style={{
        left: position.x,
        top: position.y,
        transformOrigin: "top left",
      }}
    >
      {/* Favorit */}
      <button
        onClick={() => {
          onToggleFavorite(memory.id, memory.is_favorite);
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium hover:bg-accent/70 transition-colors"
      >
        <Star
          className={cn(
            "h-4 w-4",
            memory.is_favorite
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/50"
          )}
          strokeWidth={1.5}
        />
        {memory.is_favorite ? "Ta bort favorit" : "Markera som favorit"}
      </button>

      {/* Lägg till i projekt */}
      <div>
        <button
          onClick={() => setShowProjects(!showProjects)}
          className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium hover:bg-accent/70 transition-colors"
        >
          <FolderPlus className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
          Lägg till i projekt
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground/30 ml-auto transition-transform duration-200",
              showProjects && "rotate-90"
            )}
          />
        </button>

        {/* Inline project list */}
        {showProjects && activeProjects.length > 0 && (
          <div className="py-1 animate-fade">
            {activeProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleAddToProject(project.id)}
                disabled={addingToProject === project.id}
                className="w-full flex items-center gap-2.5 pl-10 pr-3.5 py-2 text-left text-[12px] font-medium hover:bg-accent/70 transition-colors disabled:opacity-50"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="flex-1 truncate">{project.name}</span>
                {addingToProject === project.id && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/50" />
                )}
                {addedToProject.has(project.id) && addingToProject !== project.id && (
                  <Check className="h-3 w-3 text-emerald-500" />
                )}
              </button>
            ))}
          </div>
        )}

        {showProjects && activeProjects.length === 0 && (
          <div className="py-2 pl-10 pr-3.5 animate-fade">
            <p className="text-[11px] text-muted-foreground/50">Inga projekt ännu</p>
          </div>
        )}
      </div>

      {/* Påminn mig — quick options */}
      <div>
        <button
          onClick={async () => {
            const remindAt = new Date();
            remindAt.setHours(remindAt.getHours() + 24);
            await fetch(`/api/memories/${memory.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ remind_at: remindAt.toISOString() }),
            });
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium hover:bg-accent/70 transition-colors"
        >
          <Bell className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
          Påminn mig imorgon
        </button>
      </div>

      {/* Dela — quick share & copy */}
      <button
        onClick={async () => {
          setSharing(true);
          try {
            const res = await fetch(`/api/memories/${memory.id}/share`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            const json = await res.json();
            if (json.data?.share_token) {
              const url = `${window.location.origin}/delad/${json.data.share_token}`;
              await navigator.clipboard.writeText(url);
              setShared(true);
              setTimeout(() => onClose(), 1200);
            }
          } catch {
            // ignore
          }
          setSharing(false);
        }}
        disabled={sharing}
        className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium hover:bg-accent/70 transition-colors disabled:opacity-50"
      >
        {shared ? (
          <Check className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
        ) : sharing ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
        ) : (
          <Share2 className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
        )}
        {shared ? "L\u00e4nk kopierad!" : "Dela & kopiera l\u00e4nk"}
      </button>

      <div className="h-px bg-border/40 mx-2 my-1" />

      {/* Export options */}
      {(memory.original_content || memory.summary) && (
        <>
          <button
            onClick={handleExportText}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium hover:bg-accent/70 transition-colors"
          >
            <FileDown className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
            Ladda ned som .txt
          </button>
          <button
            onClick={handleExportDocx}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium hover:bg-accent/70 transition-colors"
          >
            <FileText className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
            Ladda ned som .docx
          </button>
        </>
      )}

      {/* Öppna original */}
      {memory.link_url && (
        <a
          href={memory.link_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium hover:bg-accent/70 transition-colors"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
          Öppna original
        </a>
      )}

      <div className="h-px bg-border/40 mx-2 my-1" />

      {/* Ta bort */}
      <button
        onClick={() => {
          onDelete(memory.id);
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium text-destructive hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        Ta bort
      </button>
    </div>
  );
}
