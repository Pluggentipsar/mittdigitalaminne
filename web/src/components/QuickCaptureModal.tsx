"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus,
  X,
  Loader2,
  Check,
  Link2,
  Lightbulb,
  Youtube,
  Music,
  FileText,
  Globe,
  ArrowRight,
  Clipboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const URL_REGEX = /^https?:\/\/[^\s]+$/i;

interface SavedItem {
  title: string;
  type: string;
  domain?: string;
  image?: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Link2; label: string; color: string; bg: string }> = {
  youtube: { icon: Youtube, label: "YouTube", color: "text-red-500", bg: "bg-red-500/8" },
  audio: { icon: Music, label: "Ljud/Podd", color: "text-emerald-500", bg: "bg-emerald-500/8" },
  article: { icon: FileText, label: "Artikel", color: "text-blue-500", bg: "bg-blue-500/8" },
  linkedin: { icon: Globe, label: "LinkedIn", color: "text-sky-600", bg: "bg-sky-500/8" },
  instagram: { icon: Globe, label: "Instagram", color: "text-pink-500", bg: "bg-pink-500/8" },
  twitter: { icon: Globe, label: "X/Twitter", color: "text-foreground", bg: "bg-muted" },
  link: { icon: Link2, label: "Länk", color: "text-sky-500", bg: "bg-sky-500/8" },
  thought: { icon: Lightbulb, label: "Tanke", color: "text-violet-500", bg: "bg-violet-500/8" },
};

export function QuickCaptureModal() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [clipboardChecked, setClipboardChecked] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Check clipboard when opening
  useEffect(() => {
    if (open) {
      setClipboardChecked(false);
      setClipboardUrl(null);
      setSavedItems([]);

      // Try reading clipboard
      if (navigator.clipboard?.readText) {
        navigator.clipboard.readText().then((text) => {
          const trimmed = text?.trim();
          if (trimmed && URL_REGEX.test(trimmed)) {
            setClipboardUrl(trimmed);
          }
          setClipboardChecked(true);
        }).catch(() => {
          setClipboardChecked(true);
        });
      } else {
        setClipboardChecked(true);
      }

      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setValue("");
      setClipboardUrl(null);
      setClipboardChecked(false);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
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

      try {
        const isUrl = URL_REGEX.test(trimmed);

        if (isUrl) {
          let title = trimmed;
          let summary: string | null = null;
          let linkMetadata: Record<string, unknown> | null = null;
          let contentType = "link";
          let domain: string | undefined;
          let image: string | undefined;

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
                domain = data.domain;
                image = data.image;
                linkMetadata = {
                  og_title: data.title || undefined,
                  og_description: data.description || undefined,
                  og_image: data.image || undefined,
                  favicon: data.favicon || undefined,
                  domain: data.domain || undefined,
                  video_id: data.video_id || undefined,
                  channel_name: data.channel_name || undefined,
                  thumbnail_url: data.image || undefined,
                  author_name: data.author || undefined,
                  spotify_uri: data.spotify_uri || undefined,
                  podcast_name: data.podcast_name || undefined,
                  episode_name: data.episode_name || undefined,
                };
                if (data.content_type_hint) {
                  contentType = data.content_type_hint;
                }
              }
            }
          } catch {
            // Continue with basic save
          }

          // Detect article type from unfurl result
          const memoryBody: Record<string, unknown> = {
            content_type: contentType,
            title,
            summary,
            link_url: trimmed,
            link_metadata: linkMetadata,
            is_inbox: true,
            source: "web",
          };

          await fetch("/api/memories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(memoryBody),
          });

          setSavedItems((prev) => [{ title, type: contentType, domain, image }, ...prev]);
        } else {
          const memTitle = trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed;
          await fetch("/api/memories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content_type: "thought",
              title: memTitle,
              original_content: trimmed,
              is_inbox: true,
              source: "web",
            }),
          });

          setSavedItems((prev) => [{ title: memTitle, type: "thought" }, ...prev]);
        }

        // Clear input and clipboard suggestion, ready for next save
        setValue("");
        setClipboardUrl(null);
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

  const handleClipboardSave = () => {
    if (clipboardUrl) {
      setValue(clipboardUrl);
      saveMemory(clipboardUrl);
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
        title="Snabbfånga (⌘+skift+K)"
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
          <div className="relative flex items-start justify-center pt-[12vh] md:pt-[18vh] px-4">
            <div
              className="w-full max-w-[520px] bg-card rounded-2xl border border-border/60 overflow-hidden animate-scale-in"
              style={{
                boxShadow: "0 24px 64px rgba(28, 25, 23, 0.14), 0 8px 20px rgba(28, 25, 23, 0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-1">
                <div>
                  <h2 className="text-[16px] font-bold text-foreground">Spara innehåll</h2>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                    Klistra in en länk, eller skriv en tanke
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl hover:bg-accent text-muted-foreground/40 hover:text-foreground transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Clipboard suggestion */}
              {clipboardChecked && clipboardUrl && !saving && savedItems.length === 0 && !value && (
                <div className="mx-5 mt-3 animate-fade-in">
                  <button
                    onClick={handleClipboardSave}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group text-left"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
                      <Clipboard className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-primary/70 mb-0.5">
                        Från urklipp
                      </p>
                      <p className="text-[12px] text-muted-foreground/60 truncate">
                        {clipboardUrl}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="px-5 pt-3 pb-2">
                <div className={cn(
                  "relative rounded-xl border bg-background overflow-hidden transition-all duration-300",
                  "border-border/60 focus-within:border-primary/30 focus-within:shadow-[0_0_16px_rgba(245,158,11,0.06)]"
                )}>
                  {/* Type indicator */}
                  {value.trim() && !saving && (
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
                    placeholder="https://... eller skriv en tanke"
                    disabled={saving}
                    rows={2}
                    className={cn(
                      "w-full px-3.5 py-3.5 bg-transparent text-[14px] leading-relaxed placeholder:text-muted-foreground/30 focus:outline-none resize-none",
                      value.trim() && !saving ? "pt-9" : ""
                    )}
                  />

                  {/* Saving indicator inside input */}
                  {saving && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px]">
                      <div className="flex items-center gap-2 text-[12px] text-primary font-medium">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Hämtar info &amp; sparar...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved items feed */}
              {savedItems.length > 0 && (
                <div className="px-5 pb-2">
                  <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-none">
                    {savedItems.map((item, i) => {
                      const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.link;
                      const Icon = config.icon;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 animate-fade-in"
                        >
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                            config.bg
                          )}>
                            <Icon className={cn("h-3.5 w-3.5", config.color)} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-foreground truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn("text-[9px] font-semibold uppercase tracking-wider", config.color)}>
                                {config.label}
                              </span>
                              {item.domain && (
                                <span className="text-[10px] text-muted-foreground/40">
                                  {item.domain}
                                </span>
                              )}
                            </div>
                          </div>
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={2} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between px-5 pb-4 pt-1">
                <p className="text-[10px] text-muted-foreground/30 font-medium">
                  {savedItems.length > 0
                    ? `${savedItems.length} sparad${savedItems.length > 1 ? "e" : ""} · Lägg till fler eller stäng`
                    : "Enter för att spara · Sparas i inkorgen"
                  }
                </p>
                <div className="flex items-center gap-2">
                  {!saving && value.trim() && (
                    <button
                      onClick={() => saveMemory(value)}
                      className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-all"
                    >
                      Spara
                    </button>
                  )}
                  {savedItems.length > 0 && !saving && !value.trim() && (
                    <button
                      onClick={() => setOpen(false)}
                      className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-all"
                    >
                      Klar
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
