"use client";

import { useState, useEffect } from "react";
import { X, Check, Folder } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

interface AddToProjectDialogProps {
  memoryId: string;
  open: boolean;
  onClose: () => void;
}

export function AddToProjectDialog({
  memoryId,
  open,
  onClose,
}: AddToProjectDialogProps) {
  const { projects } = useProjects();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [originalIds, setOriginalIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeProjects = projects.filter((p) => p.status === "active");

  // Fetch current memberships
  useEffect(() => {
    if (!open || !memoryId) return;
    setLoading(true);

    const fetchMemberships = async () => {
      try {
        const results = await Promise.all(
          activeProjects.map(async (project) => {
            const res = await fetch(`/api/projects/${project.id}/memories`);
            const json = await res.json();
            const memories = json.data || [];
            const isMember = memories.some((m: any) => m.id === memoryId);
            return { projectId: project.id, isMember };
          })
        );

        const memberIds = new Set(
          results.filter((r) => r.isMember).map((r) => r.projectId)
        );
        setCheckedIds(new Set(memberIds));
        setOriginalIds(new Set(memberIds));
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
  }, [open, memoryId, activeProjects.length]);

  const toggleProject = (projectId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find projects to add
      const toAdd = [...checkedIds].filter((id) => !originalIds.has(id));
      // Find projects to remove
      const toRemove = [...originalIds].filter((id) => !checkedIds.has(id));

      await Promise.all([
        ...toAdd.map((projectId) =>
          fetch(`/api/projects/${projectId}/memories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memory_id: memoryId }),
          })
        ),
        ...toRemove.map((projectId) =>
          fetch(`/api/projects/${projectId}/memories?memory_id=${memoryId}`, {
            method: "DELETE",
          })
        ),
      ]);

      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border/50 bg-card shadow-xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <h2 className="heading-serif text-[18px] text-foreground">
            Lägg till i projekt
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Project list */}
        <div className="p-3 max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Folder className="h-8 w-8 text-muted-foreground/30 mb-2" strokeWidth={1.5} />
              <p className="text-[13px] text-muted-foreground/60">
                Inga projekt skapade
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {activeProjects.map((project) => {
                const isChecked = checkedIds.has(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                      isChecked
                        ? "bg-amber-500/10"
                        : "hover:bg-accent/60"
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all shrink-0",
                        isChecked
                          ? "border-amber-500 bg-amber-500"
                          : "border-border/80"
                      )}
                    >
                      {isChecked && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </div>

                    {/* Color dot */}
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />

                    {/* Name */}
                    <span className="text-[13px] font-medium text-foreground truncate">
                      {project.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-accent transition-all"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
