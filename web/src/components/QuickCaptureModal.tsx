"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, X, Loader2, Check, Link2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const URL_REGEX = /^https?:\/\/[^\s]+$/i;

export function QuickCaptureModal() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setValue("");
      setSuccess(false);
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const saveMemory = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || saving) return;

      setSaving(true);
      setSuccess(false);

      try {
        const isUrl = URL_REGEX.test(trimmed);

        if (isUrl) {
          let title = trimmed;
          let summary: string | null = null;
          let linkMetadata: Record<string, unknown> | null = null;
          let contentType = "link";

          try {
            const unfurlRes = await fetch("/api/unfurl", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: trimmed }),
            });
            if (unfurlRes.ok) {
              const { data } = await unfurlRes.json();
              if (data) {
                title = data.title || trimmed;
                summary = data.description || null;
                linkMetadata = {
                  og_title: data.title || undefined,
                  og_description: data.description || undefined,
                  og_image: data.image || undefined,
                  favicon: data.favicon || undefined,
                  domain: data.domain || undefined,
                  video_id: data.video_id || undefined,
                  channel_name: data.channel_name || undefined,
                  thumbnail_url: data.image || undefined,
                };
                if (data.content_type_hint) {
                  contentType = data.content_type_hint;
                }
              }
            }
          } catch {
            // Continue with basic save
          }

          await fetch("/api/memories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content_type: contentType,
              title,
              summary,
              link_url: trimmed,
              link_metadata: linkMetadata,
              is_inbox: true,
              source: "web",
            }),
          });

          setSuccessMessage("Sparad till Läs senare!");
        } else {
          await fetch("/api/memories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content_type: "thought",
              title: trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed,
              original_content: trimmed,
              is_inbox: true,
              source: "web",
            }),
          });

          setSuccessMessage("Tanke sparad!");
        }

        setValue("");
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setOpen(false);
        }, 1200);
      } catch {
        // Silently fail
      } finally {
        setSaving(false);
      }
    },
    [saving]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveMemory(value);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (URL_REGEX.test(pasted)) {
      e.preventDefault();
      setValue(pasted);
      setTimeout(() => saveMemory(pasted), 100);
    }
  };

  const isUrl = URL_REGEX.test(value.trim());

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl",
          "bg-primary text-primary-foreground shadow-lg",
          "flex items-center justify-center",
          "hover:bg-primary/90 hover:shadow-xl hover:scale-105",
          "active:scale-95 transition-all duration-200",
          "md:bottom-8 md:right-8"
        )}
        style={{
          boxShadow: "0 8px 24px rgba(180, 83, 9, 0.3), 0 2px 8px rgba(180, 83, 9, 0.15)",
        }}
        title="Läs senare (snabbfånga)"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade"
            onClick={() => setOpen(false)}
          />

          {/* Content */}
          <div className="relative flex items-start justify-center pt-[18vh] px-4">
            <div
              className="w-full max-w-[480px] bg-card rounded-2xl border border-border/60 overflow-hidden animate-scale-in"
              style={{
                boxShadow: "0 24px 64px rgba(28, 25, 23, 0.14), 0 8px 20px rgba(28, 25, 23, 0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">Läs senare</h2>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                    Klistra in en URL eller skriv en tanke
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl hover:bg-accent text-muted-foreground/40 hover:text-foreground transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Input */}
              <div className="px-5 pb-2">
                <div className={cn(
                  "relative rounded-xl border bg-background overflow-hidden transition-all duration-300",
                  success
                    ? "border-emerald-500/30"
                    : "border-border/60 focus-within:border-amber-500/30 focus-within:shadow-[0_0_16px_rgba(245,158,11,0.06)]"
                )}>
                  {/* Type indicator */}
                  {value.trim() && !saving && !success && (
                    <div className="absolute top-3 left-3.5 z-10">
                      {isUrl ? (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/8 text-sky-600 text-[9px] font-semibold">
                          <Link2 className="h-2.5 w-2.5" />
                          Länk
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/8 text-violet-500 text-[9px] font-semibold">
                          <Lightbulb className="h-2.5 w-2.5" />
                          Tanke
                        </div>
                      )}
                    </div>
                  )}

                  <textarea
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="https://... eller en tanke"
                    disabled={saving}
                    rows={3}
                    className={cn(
                      "w-full px-3.5 py-3.5 bg-transparent text-[14px] leading-relaxed placeholder:text-muted-foreground/30 focus:outline-none resize-none",
                      value.trim() && !saving && !success ? "pt-9" : ""
                    )}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 pb-4 pt-1">
                <p className="text-[10px] text-muted-foreground/30 font-medium">
                  Enter f&ouml;r att spara &middot; Sparas i inkorgen
                </p>
                <div className="flex items-center gap-2">
                  {saving && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-500/70 font-medium">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Sparar...
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium animate-fade-in">
                      <Check className="h-3.5 w-3.5" />
                      {successMessage}
                    </div>
                  )}
                  {!saving && !success && value.trim() && (
                    <button
                      onClick={() => saveMemory(value)}
                      className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-all"
                    >
                      Spara
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
