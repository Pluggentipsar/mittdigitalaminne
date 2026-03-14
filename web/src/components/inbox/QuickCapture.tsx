"use client";

import { useState, useRef, useCallback } from "react";
import { Loader2, Check, Link2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const URL_REGEX = /^https?:\/\/[^\s]+$/i;

interface QuickCaptureProps {
  onSaved?: () => void;
}

export function QuickCapture({ onSaved }: QuickCaptureProps) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const saveMemory = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || saving) return;

      setSaving(true);
      setSuccess(false);

      try {
        const isUrl = URL_REGEX.test(trimmed);

        if (isUrl) {
          // Unfurl the URL first
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
            // Continue with basic save if unfurl fails
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

          setSuccessMessage("Sparad!");
        } else {
          // Save as thought
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
        onSaved?.();

        setTimeout(() => setSuccess(false), 2000);
      } catch {
        // Silently fail for now
      } finally {
        setSaving(false);
      }
    },
    [saving, onSaved]
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
      // Auto-save URLs on paste
      setTimeout(() => saveMemory(pasted), 100);
    }
  };

  const isUrl = URL_REGEX.test(value.trim());

  return (
    <div className="relative">
      <div
        className={cn(
          "relative rounded-2xl border bg-card overflow-hidden transition-all duration-300",
          success
            ? "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
            : "border-border/60 hover:border-amber-500/20 focus-within:border-amber-500/30 focus-within:shadow-[0_0_20px_rgba(245,158,11,0.06)]"
        )}
      >
        {/* Type indicator */}
        {value.trim() && !saving && !success && (
          <div className="absolute top-3.5 left-4 z-10">
            {isUrl ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/8 text-sky-600 text-[10px] font-semibold">
                <Link2 className="h-2.5 w-2.5" />
                Länk
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet-500/8 text-violet-500 text-[10px] font-semibold">
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
          placeholder="Klistra in en URL eller skriv en tanke..."
          disabled={saving}
          rows={2}
          className={cn(
            "w-full px-4 py-4 bg-transparent text-[14px] leading-relaxed placeholder:text-muted-foreground/35 focus:outline-none resize-none transition-colors",
            value.trim() && !saving && !success ? "pt-10" : ""
          )}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 pb-3 pt-0">
          <p className="text-[10px] text-muted-foreground/30 font-medium">
            Enter f&ouml;r att spara &middot; Shift+Enter f&ouml;r ny rad
          </p>
          {saving && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-500/70 font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sparar...
            </div>
          )}
          {success && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium animate-fade-in">
              <Check className="h-3 w-3" />
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
