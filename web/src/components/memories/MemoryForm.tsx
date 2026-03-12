"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Image, Link2, FileText, Lightbulb, Youtube, Upload, X, Check, Loader2, Sparkles } from "lucide-react";
import type { ContentType, Memory } from "@/lib/types";
import { cn, contentTypeConfig } from "@/lib/utils";
import { useTagSuggestions } from "@/hooks/useTagSuggestions";
import { useDebounce } from "@/hooks/useDebounce";

const typeOptions: { type: ContentType; icon: any; desc: string }[] = [
  { type: "thought", icon: Lightbulb, desc: "En idé eller reflektion" },
  { type: "link", icon: Link2, desc: "Spara en webblänk" },
  { type: "article", icon: FileText, desc: "En artikel att komma ihåg" },
  { type: "image", icon: Image, desc: "Ladda upp en bild" },
  { type: "youtube", icon: Youtube, desc: "YouTube-video" },
  { type: "linkedin", icon: Link2, desc: "LinkedIn-inlägg" },
  { type: "instagram", icon: Image, desc: "Instagram-inlägg" },
];

interface MemoryFormProps {
  mode: "create" | "edit";
  memory?: Memory;
  onSuccess?: () => void;
}

export function MemoryForm({ mode, memory, onSuccess }: MemoryFormProps) {
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>(
    memory?.content_type || "thought"
  );
  const [title, setTitle] = useState(memory?.title || "");
  const [content, setContent] = useState(memory?.original_content || "");
  const [summary, setSummary] = useState(memory?.summary || "");
  const [linkUrl, setLinkUrl] = useState(memory?.link_url || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    memory?.tags?.map((t) => t.name) || []
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    memory?.image_url || null
  );
  const [saving, setSaving] = useState(false);
  const [unfurling, setUnfurling] = useState(false);
  const [unfurlData, setUnfurlData] = useState<{
    title?: string | null;
    description?: string | null;
    image?: string | null;
    favicon?: string | null;
    domain?: string;
    content_type_hint?: string | null;
    video_id?: string;
    channel_name?: string;
  } | null>(null);
  const lastUnfurledUrl = useRef("");
  const { suggestions, loading: suggestionsLoading, fetchSuggestions } = useTagSuggestions();
  const debouncedTitle = useDebounce(title, 1000);
  const debouncedSummary = useDebounce(summary, 1000);

  // Trigger tag suggestions when title/summary changes
  useEffect(() => {
    if (mode === "create" && (debouncedTitle || debouncedSummary)) {
      fetchSuggestions(debouncedTitle, debouncedSummary, content);
    }
  }, [debouncedTitle, debouncedSummary, mode]);

  const unfurlUrl = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed || trimmed === lastUnfurledUrl.current) return;

    try {
      new URL(trimmed);
    } catch {
      return;
    }

    lastUnfurledUrl.current = trimmed;
    setUnfurling(true);

    try {
      const res = await fetch("/api/unfurl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) return;
      const { data } = await res.json();
      if (!data) return;

      setUnfurlData(data);

      // Auto-fill empty fields
      if (!title && data.title) setTitle(data.title);
      if (!summary && data.description) setSummary(data.description);
      if (!content && data.article_text) setContent(data.article_text);

      // Trigger tag suggestions with unfurled data
      fetchSuggestions(
        data.title || title,
        data.description || summary,
        data.article_text || content
      );

      // Auto-switch content type if detected
      if (data.content_type_hint && contentType === "link") {
        setContentType(data.content_type_hint as ContentType);
      }
    } catch {
      // Silently fail
    } finally {
      setUnfurling(false);
    }
  }, [title, summary, contentType]);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);

    try {
      let imageUrl = memory?.image_url || null;
      let imageStoragePath = memory?.image_storage_path || null;

      if (contentType === "image" && imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.data) {
          imageUrl = uploadData.data.public_url;
          imageStoragePath = uploadData.data.storage_path;
        }
      }

      const body: Record<string, unknown> = {
        content_type: contentType,
        title: title.trim(),
        summary: summary.trim() || null,
        original_content: content.trim() || null,
        tags,
      };

      if (["link", "article", "youtube", "linkedin", "instagram"].includes(contentType)) {
        body.link_url = linkUrl.trim() || null;

        // Include unfurled metadata for rich previews
        if (unfurlData && mode === "create") {
          body.link_metadata = {
            og_title: unfurlData.title || undefined,
            og_description: unfurlData.description || undefined,
            og_image: unfurlData.image || undefined,
            favicon: unfurlData.favicon || undefined,
            domain: unfurlData.domain || undefined,
            video_id: unfurlData.video_id || undefined,
            channel_name: unfurlData.channel_name || undefined,
            thumbnail_url: unfurlData.image || undefined,
          };
        }
      }

      if (imageUrl) {
        body.image_url = imageUrl;
        body.image_storage_path = imageStoragePath;
      }

      if (mode === "create") {
        const res = await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          router.push("/minnen");
        }
      } else {
        const res = await fetch(`/api/memories/${memory!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          onSuccess?.();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const config = contentTypeConfig[contentType];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type selector */}
      <div>
        <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Typ
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {typeOptions.map(({ type, icon: Icon, desc }) => {
            const typeConfig = contentTypeConfig[type];
            const isSelected = contentType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setContentType(type)}
                className={cn(
                  "relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200",
                  isSelected
                    ? "border-current shadow-sm"
                    : "border-border hover:border-border/70 hover:-translate-y-0.5"
                )}
                style={
                  isSelected
                    ? { borderColor: typeConfig.hex, color: typeConfig.hex }
                    : undefined
                }
              >
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: typeConfig.hex }}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    isSelected ? "bg-current/10" : "bg-muted"
                  )}
                  style={
                    isSelected
                      ? { backgroundColor: `${typeConfig.hex}12` }
                      : undefined
                  }
                >
                  <Icon
                    className="h-5 w-5"
                    style={
                      isSelected
                        ? { color: typeConfig.hex }
                        : { color: "var(--muted-foreground)" }
                    }
                  />
                </div>
                <div className="text-center">
                  <span
                    className={cn(
                      "text-[13px] font-bold block",
                      !isSelected && "text-foreground"
                    )}
                  >
                    {typeConfig.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                    {desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Titel
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ge ditt minne en titel..."
          required
          className="w-full px-4 py-3 rounded-xl border border-border bg-card text-[14px] font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
        />
      </div>

      {/* URL field for link/article/social */}
      {["link", "article", "youtube", "linkedin", "instagram"].includes(contentType) && (
        <div className="animate-fade-in">
          <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            URL
          </label>
          <div className="relative">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onBlur={() => unfurlUrl(linkUrl)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                setTimeout(() => unfurlUrl(pasted), 100);
              }}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-[14px] font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
            />
            {unfurling && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          {unfurlData && (unfurlData.image || unfurlData.title) && (
            <div className="mt-3 rounded-xl border border-border overflow-hidden bg-card animate-fade-in">
              {unfurlData.image && (
                <div className="aspect-[2.5/1] bg-muted">
                  <img
                    src={unfurlData.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3 space-y-1">
                {unfurlData.title && (
                  <p className="text-[12px] font-semibold line-clamp-2">{unfurlData.title}</p>
                )}
                {unfurlData.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{unfurlData.description}</p>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                  {unfurlData.favicon && (
                    <img src={unfurlData.favicon} alt="" className="w-3 h-3 rounded" />
                  )}
                  <span>{unfurlData.domain}</span>
                  {unfurlData.channel_name && (
                    <span className="ml-1">· {unfurlData.channel_name}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image upload */}
      {contentType === "image" && (
        <div className="animate-fade-in">
          <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Bild
          </label>
          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-border">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-80 object-contain bg-muted"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-3 py-12 rounded-2xl border-2 border-dashed border-border hover:border-primary/30 cursor-pointer transition-all hover:bg-muted/30 group">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/8 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <span className="text-[13px] font-semibold text-foreground/70 block">
                  Klicka eller dra en bild hit
                </span>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  JPG, PNG, WebP eller GIF
                </span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      {/* Content */}
      {(contentType === "thought" || contentType === "article") && (
        <div className="animate-fade-in">
          <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Innehåll
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              contentType === "thought"
                ? "Skriv din tanke..."
                : "Klistra in artikeltext..."
            }
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-[14px] leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all resize-y"
          />
        </div>
      )}

      {/* Summary */}
      <div>
        <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Sammanfattning
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="En kort sammanfattning..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-card text-[14px] leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all resize-y"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Taggar
        </label>
        {tags.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-primary/8 text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Lägg till tagg..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-[13px] font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!tagInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-[13px] font-semibold hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Lägg till
          </button>
        </div>

        {/* Tag suggestions */}
        {mode === "create" && suggestions && (
          <div className="mt-3 space-y-2 animate-fade-in">
            {suggestions.existing.filter((t) => !tags.includes(t)).length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                  Befintliga taggar
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {suggestions.existing
                    .filter((t) => !tags.includes(t))
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTags([...tags, tag])}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-primary/20 text-primary/70 hover:bg-primary/5 cursor-pointer transition-all"
                      >
                        <span>+</span> {tag}
                      </button>
                    ))}
                </div>
              </div>
            )}
            {suggestions.suggested.filter((t) => !tags.includes(t)).length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Föreslagna
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {suggestions.suggested
                    .filter((t) => !tags.includes(t))
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTags([...tags, tag])}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-dashed border-muted-foreground/20 text-muted-foreground/60 hover:bg-muted hover:text-foreground cursor-pointer transition-all"
                      >
                        <span>+</span> {tag}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-[14px] font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.99]"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sparar...
          </span>
        ) : mode === "create" ? (
          "Spara minne"
        ) : (
          "Uppdatera minne"
        )}
      </button>
    </form>
  );
}
