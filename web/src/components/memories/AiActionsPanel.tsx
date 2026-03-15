"use client";

import { useEffect, useRef } from "react";
import {
  X,
  FileText,
  List,
  GraduationCap,
  Quote,
  Share2,
  Loader2,
  Copy,
  Save,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useAiAction } from "@/hooks/useAiAction";
import { cn } from "@/lib/utils";

interface AiActionsPanelProps {
  memoryId: string;
  open: boolean;
  onClose: () => void;
}

const actions = [
  {
    key: "summarize_short",
    label: "Kort sammanfattning",
    description: "2-3 meningar som fångar kärnan",
    icon: FileText,
  },
  {
    key: "summarize_detailed",
    label: "Detaljerad sammanfattning",
    description: "Huvudpunkter med bullet points",
    icon: List,
  },
  {
    key: "lesson_plan",
    label: "Lektionsidé",
    description: "Mål, aktiviteter och reflektionsfrågor",
    icon: GraduationCap,
  },
  {
    key: "key_quotes",
    label: "Nyckelcitat",
    description: "Viktiga citat och insikter",
    icon: Quote,
  },
  {
    key: "linkedin_draft",
    label: "LinkedIn-utkast",
    description: "Engagerande inlägg baserat på innehållet",
    icon: Share2,
  },
];

export function AiActionsPanel({
  memoryId,
  open,
  onClose,
}: AiActionsPanelProps) {
  const { loading, result, actionLabel, error, runAction, saveAsNote, clear } =
    useAiAction(memoryId);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(clear, 300);
      return () => clearTimeout(timer);
    }
  }, [open, clear]);

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
    }
  };

  const handleSave = async () => {
    await saveAsNote();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border/50 shadow-2xl z-50 flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Sparkles
                className="h-4.5 w-4.5 text-amber-600"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <h2 className="heading-serif text-[18px]">
                Bearbeta med AI
              </h2>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                Välj en åtgärd nedan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent text-muted-foreground/50 hover:text-foreground transition-all"
          >
            <X className="h-4.5 w-4.5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 animate-pulse">
                <Loader2
                  className="h-6 w-6 text-amber-600 animate-spin"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-[14px] font-medium text-foreground">
                Bearbetar...
              </p>
              <p className="text-[12px] text-muted-foreground/50 mt-1">
                Claude analyserar ditt innehåll
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="px-6 py-6">
              <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4">
                <p className="text-[13px] text-red-700 font-medium">
                  Något gick fel
                </p>
                <p className="text-[12px] text-red-600/70 mt-1">{error}</p>
              </div>
              <button
                onClick={clear}
                className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground mt-4 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Försök igen
              </button>
            </div>
          )}

          {/* Result state */}
          {result && !loading && (
            <div className="px-6 py-6 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.12em] mb-3">
                  {actionLabel}
                </p>
                <div className="rounded-xl border border-border/50 bg-accent/30 p-5">
                  <p className="text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {result}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  Spara som anteckning
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Kopiera
                </button>
              </div>

              <button
                onClick={clear}
                className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Tillbaka till åtgärder
              </button>
            </div>
          )}

          {/* Action buttons */}
          {!loading && !result && !error && (
            <div className="px-4 py-4 space-y-1">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    onClick={() => runAction(action.key)}
                    className="w-full flex items-center gap-3.5 px-4 py-4 rounded-xl hover:bg-accent/70 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/8 group-hover:bg-amber-500/15 transition-colors shrink-0">
                      <Icon
                        className="h-4.5 w-4.5 text-amber-600"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold group-hover:text-primary transition-colors">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
