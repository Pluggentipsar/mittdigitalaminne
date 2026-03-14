"use client";

import { useState, useEffect } from "react";
import {
  X,
  Folder,
  Book,
  Lightbulb,
  Target,
  Star,
  Bookmark,
  Briefcase,
  GraduationCap,
  Check,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#b45309",
  "#d97706",
  "#92400e",
  "#78716c",
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#dc2626",
];

const PRESET_ICONS = [
  { key: "folder", icon: Folder, label: "Mapp" },
  { key: "book", icon: Book, label: "Bok" },
  { key: "lightbulb", icon: Lightbulb, label: "Ide" },
  { key: "target", icon: Target, label: "Mal" },
  { key: "star", icon: Star, label: "Stjarna" },
  { key: "bookmark", icon: Bookmark, label: "Bokmärke" },
  { key: "briefcase", icon: Briefcase, label: "Portfölj" },
  { key: "graduation-cap", icon: GraduationCap, label: "Utbildning" },
];

interface ProjectFormProps {
  project?: Project | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
}

export function ProjectForm({ project, open, onClose, onSave }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState("folder");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setColor(project.color);
      setIcon(project.icon);
      setDeadline(project.deadline || "");
      setStatus(project.status);
    } else {
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[0]);
      setIcon("folder");
      setDeadline("");
      setStatus("active");
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        color,
        icon,
        deadline: deadline || null,
        status,
      });
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

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border/50 bg-card shadow-xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
          <h2 className="heading-serif text-[20px] text-foreground">
            {project ? "Redigera projekt" : "Nytt projekt"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[12px] font-semibold text-muted-foreground/70 mb-1.5">
              Namn *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Projektnamn..."
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-[14px] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-semibold text-muted-foreground/70 mb-1.5">
              Beskrivning
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivning av projektet..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-[14px] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all resize-none"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[12px] font-semibold text-muted-foreground/70 mb-2">
              Färg
            </label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center",
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-card scale-110"
                      : "hover:scale-110"
                  )}
                  style={{
                    backgroundColor: c,
                    // @ts-expect-error ringColor is a Tailwind CSS custom property
                    "--tw-ring-color": c,
                  }}
                >
                  {color === c && (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon selector */}
          <div>
            <label className="block text-[12px] font-semibold text-muted-foreground/70 mb-2">
              Ikon
            </label>
            <div className="flex gap-2">
              {PRESET_ICONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setIcon(item.key)}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                    icon === item.key
                      ? "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30"
                      : "bg-accent/60 text-muted-foreground/50 hover:bg-accent hover:text-muted-foreground/80"
                  )}
                  title={item.label}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-[12px] font-semibold text-muted-foreground/70 mb-1.5">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
            />
          </div>

          {/* Status toggle (only when editing) */}
          {project && (
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-muted-foreground/70">
                Status
              </label>
              <button
                type="button"
                onClick={() => setStatus(status === "active" ? "archived" : "active")}
                className={cn(
                  "relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200",
                  status === "active" ? "bg-amber-500" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
                    status === "active" ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
              <span className="text-[12px] text-muted-foreground/60">
                {status === "active" ? "Aktiv" : "Arkiverad"}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-accent transition-all"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Sparar..." : project ? "Spara" : "Skapa projekt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
