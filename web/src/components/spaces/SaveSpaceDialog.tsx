"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface SaveSpaceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function SaveSpaceDialog({ open, onClose, onSave }: SaveSpaceDialogProps) {
  const [name, setName] = useState("");

  if (!open) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border/60 rounded-2xl p-7 w-full max-w-sm shadow-lg animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-accent text-muted-foreground/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="heading-serif text-[20px] mb-1">Spara som Space</h3>
        <p className="text-[12px] text-muted-foreground mb-5">
          Dina nuvarande filter sparas och visas i sidebaren.
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Namn på space..."
          autoFocus
          className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background text-[14px] font-medium placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/25 transition-all mb-5"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-accent text-foreground text-[13px] font-semibold hover:bg-muted transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Spara
          </button>
        </div>
      </div>
    </div>
  );
}
