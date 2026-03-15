"use client";

import { useState } from "react";
import { X, Search, Loader2, Rss, Youtube, Headphones, Mail, Plus, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddFeedModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  existingCategories?: string[];
}

interface DiscoveredFeed {
  feed_url: string;
  title: string | null;
  feed_type: string;
  site_url: string | null;
  icon_url: string | null;
}

function feedTypeIcon(type: string) {
  switch (type) {
    case "youtube": return Youtube;
    case "podcast": return Headphones;
    case "newsletter": return Mail;
    default: return Rss;
  }
}

export function AddFeedModal({ open, onClose, onAdded, existingCategories = [] }: AddFeedModalProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [adding, setAdding] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredFeed[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<DiscoveredFeed | null>(null);

  const handleDiscover = async () => {
    if (!url.trim()) return;
    setDiscovering(true);
    setError(null);
    setDiscovered(null);
    setSelectedFeed(null);

    try {
      const res = await fetch("/api/feeds/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Kunde inte hitta flöde");
        return;
      }

      const feeds = json.data as DiscoveredFeed[];
      setDiscovered(feeds);
      if (feeds.length === 1) {
        setSelectedFeed(feeds[0]);
        setName(feeds[0].title || "");
      }
    } catch {
      setError("Något gick fel");
    } finally {
      setDiscovering(false);
    }
  };

  const handleAdd = async () => {
    const feedUrl = selectedFeed?.feed_url || url.trim();
    if (!feedUrl) return;

    setAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: feedUrl,
          name: name.trim() || undefined,
          feed_type: selectedFeed?.feed_type,
          category: category.trim() || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Kunde inte lägga till flödet");
        return;
      }

      onAdded();
      handleReset();
      onClose();
    } catch {
      setError("Något gick fel");
    } finally {
      setAdding(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setName("");
    setCategory("");
    setDiscovered(null);
    setSelectedFeed(null);
    setError(null);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg bg-card rounded-2xl border border-border/60 shadow-xl animate-scale-in"
          style={{ transformOrigin: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
            <div>
              <h2 className="text-[16px] font-semibold text-foreground">Lägg till källa</h2>
              <p className="text-[12px] text-muted-foreground/50 mt-0.5">
                Klistra in en URL till en blogg, YouTube-kanal eller podcast
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground/40 hover:text-foreground transition-all"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* URL input */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.1em] mb-1.5 block">
                URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDiscover()}
                  placeholder="https://youtube.com/@kanal eller blogg-url..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border/60 bg-background text-[14px] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  autoFocus
                />
                <button
                  onClick={handleDiscover}
                  disabled={discovering || !url.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {discovering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" strokeWidth={1.5} />
                  )}
                  Sök
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-[13px] text-destructive bg-destructive/8 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Discovered feeds */}
            {discovered && discovered.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.1em]">
                  Hittade flöden
                </p>
                {discovered.map((feed, i) => {
                  const Icon = feedTypeIcon(feed.feed_type);
                  const isSelected = selectedFeed?.feed_url === feed.feed_url;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedFeed(feed);
                        setName(feed.title || "");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                        isSelected
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/50 hover:border-border/80 hover:bg-accent/50"
                      )}
                    >
                      <Icon
                        className="h-5 w-5 shrink-0"
                        style={{ color: feed.feed_type === "youtube" ? "#ff0000" : feed.feed_type === "podcast" ? "#1db954" : "#b45309" }}
                        strokeWidth={1.5}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">
                          {feed.title || feed.feed_url}
                        </p>
                        <p className="text-[11px] text-muted-foreground/40 truncate">
                          {feed.feed_url}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Name override */}
            {(selectedFeed || discovered) && (
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.1em] mb-1.5 block">
                  Namn (valfritt)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Eget namn för källan..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-[14px] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                />
              </div>
            )}

            {/* Category */}
            {(selectedFeed || discovered) && (
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.1em] mb-1.5 block">
                  Ämne / Kategori (valfritt)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="t.ex. AI, Skola, Löpning..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-[14px] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />
                  {existingCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {existingCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all capitalize",
                            category === cat
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/50 text-muted-foreground/40 hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <Hash className="h-2.5 w-2.5" strokeWidth={2} />
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-accent transition-all"
            >
              Avbryt
            </button>
            <button
              onClick={handleAdd}
              disabled={adding || (!selectedFeed && !url.trim())}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" strokeWidth={2} />
              )}
              Lägg till
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
