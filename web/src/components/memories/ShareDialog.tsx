"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Link2,
  Copy,
  Check,
  Trash2,
  Loader2,
  X,
  Globe,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareDialogProps {
  memoryId: string;
  open: boolean;
  onClose: () => void;
}

interface ShareData {
  id: string;
  memory_id: string;
  share_token: string;
  expires_at: string | null;
  created_at: string;
}

export function ShareDialog({ memoryId, open, onClose }: ShareDialogProps) {
  const [share, setShare] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch existing share on open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/memories/${memoryId}/share`)
      .then((r) => r.json())
      .then((json) => setShare(json.data || null))
      .catch(() => setShare(null))
      .finally(() => setLoading(false));
  }, [open, memoryId]);

  const shareUrl = share
    ? `${window.location.origin}/delad/${share.share_token}`
    : "";

  const handleCreate = useCallback(
    async (expiresInDays?: number) => {
      setCreating(true);
      try {
        const res = await fetch(`/api/memories/${memoryId}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(expiresInDays ? { expires_in_days: expiresInDays } : {}),
        });
        const json = await res.json();
        setShare(json.data);
      } catch {
        // Silently fail
      }
      setCreating(false);
    },
    [memoryId]
  );

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await fetch(`/api/memories/${memoryId}/share`, { method: "DELETE" });
      setShare(null);
    } catch {
      // Silently fail
    }
    setDeleting(false);
  }, [memoryId]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative flex items-start justify-center pt-[20vh] px-4">
        <div
          className="w-full max-w-[420px] bg-card rounded-2xl border border-border/60 overflow-hidden animate-scale-in"
          style={{
            boxShadow: "0 24px 64px rgba(28, 25, 23, 0.14), 0 8px 20px rgba(28, 25, 23, 0.08)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Dela minne</h2>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                  Skapa en publik l\u00e4nk
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground/40 hover:text-foreground transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
              </div>
            ) : share ? (
              /* Share exists — show URL */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <Globe className="h-3.5 w-3.5" />
                  L\u00e4nken \u00e4r aktiv
                </div>

                {/* URL display */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-accent/80 dark:bg-accent border border-border/50 text-[13px] font-mono text-foreground/80 truncate">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "shrink-0 p-2.5 rounded-xl border border-border/50 transition-all",
                      copied
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-card hover:bg-accent text-muted-foreground/50 hover:text-foreground"
                    )}
                    title="Kopiera l\u00e4nk"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Expiry info */}
                {share.expires_at && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50 font-medium">
                    <Clock className="h-3 w-3" />
                    G\u00e5r ut: {new Date(share.expires_at).toLocaleDateString("sv-SE")}
                  </div>
                )}

                {/* Delete share */}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 text-[12px] font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Ta bort delningsl\u00e4nk
                </button>
              </div>
            ) : (
              /* No share — create options */
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground/60 leading-relaxed">
                  Skapa en publik l\u00e4nk som vem som helst kan \u00f6ppna f\u00f6r att se detta minne.
                </p>

                <button
                  onClick={() => handleCreate()}
                  disabled={creating}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Skapa delningsl\u00e4nk
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCreate(7)}
                    disabled={creating}
                    className="flex-1 px-3 py-2 rounded-xl bg-accent hover:bg-accent/80 dark:hover:bg-accent/60 text-[12px] font-medium text-muted-foreground/60 border border-border/40 transition-all disabled:opacity-60"
                  >
                    7 dagar
                  </button>
                  <button
                    onClick={() => handleCreate(30)}
                    disabled={creating}
                    className="flex-1 px-3 py-2 rounded-xl bg-accent hover:bg-accent/80 dark:hover:bg-accent/60 text-[12px] font-medium text-muted-foreground/60 border border-border/40 transition-all disabled:opacity-60"
                  >
                    30 dagar
                  </button>
                  <button
                    onClick={() => handleCreate(90)}
                    disabled={creating}
                    className="flex-1 px-3 py-2 rounded-xl bg-accent hover:bg-accent/80 dark:hover:bg-accent/60 text-[12px] font-medium text-muted-foreground/60 border border-border/40 transition-all disabled:opacity-60"
                  >
                    90 dagar
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground/30 text-center">
                  Utan utgångsdatum \u00b7 Knapparna skapar en tidsbegränsad l\u00e4nk
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
