"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Library,
  PlusCircle,
  Tags,
  FolderKanban,
  Inbox,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Image,
  Link2,
  FileText,
  MessageSquare,
  Youtube,
  Linkedin,
  Instagram,
  Twitter,
  Hash,
  Folder,
  Command,
} from "lucide-react";
import { cn, contentTypeConfig } from "@/lib/utils";
import type { Memory, Tag, Project, ContentType } from "@/lib/types";

/* ── Content-type icon map ─────────────────────────────────── */
const contentTypeIcons: Record<ContentType, React.ElementType> = {
  image: Image,
  link: Link2,
  article: FileText,
  thought: MessageSquare,
  youtube: Youtube,
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
};

/* ── Navigation items ──────────────────────────────────────── */
const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inkorg", label: "Inkorg", icon: Inbox },
  { href: "/minnen", label: "Minnen", icon: Library },
  { href: "/lagg-till", label: "Lägg till", icon: PlusCircle },
  { href: "/taggar", label: "Taggar", icon: Tags },
  { href: "/projekt", label: "Projekt", icon: FolderKanban },
];

/* ── Result item type ──────────────────────────────────────── */
interface ResultItem {
  id: string;
  category: "navigation" | "memories" | "projects" | "tags";
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ElementType;
  iconColor?: string;
  tagColor?: string;
}

/* ── Highlight matching text ───────────────────────────────── */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-400/20 text-amber-700 rounded-sm px-0.5 font-semibold"
            style={{ textDecoration: "none" }}
          >
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

/* ── Main component ────────────────────────────────────────── */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Open/close ──────────────────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* Focus input when opening */
  useEffect(() => {
    if (open) {
      // Tiny delay to let the animation start
      requestAnimationFrame(() => inputRef.current?.focus());
      // Pre-fetch projects and tags on open
      fetchProjectsAndTags();
    } else {
      // Reset state on close
      setQuery("");
      setSelectedIndex(0);
      setMemories([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Lock body scroll when open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* ── Data fetching ───────────────────────────────────────── */
  const fetchProjectsAndTags = useCallback(async () => {
    try {
      const [projRes, tagRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tags"),
      ]);
      const projData = await projRes.json();
      const tagData = await tagRes.json();
      setProjects(projData.data || []);
      setTags(tagData.data || []);
    } catch {
      // Silently fail — results just won't include projects/tags
    }
  }, []);

  const searchMemories = useCallback(async (q: string) => {
    if (!q.trim()) {
      setMemories([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/memories?query=${encodeURIComponent(q)}&limit=5`
      );
      const data = await res.json();
      setMemories(data.data || []);
    } catch {
      setMemories([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  /* Debounced search */
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchMemories(query);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, searchMemories]);

  /* ── Build result list ───────────────────────────────────── */
  const results = useMemo((): ResultItem[] => {
    const items: ResultItem[] = [];
    const q = query.toLowerCase().trim();

    // Navigation items (always show if no query, or filter by query)
    const filteredNav = q
      ? navItems.filter((item) => item.label.toLowerCase().includes(q))
      : navItems;

    filteredNav.forEach((item) => {
      items.push({
        id: `nav-${item.href}`,
        category: "navigation",
        label: item.label,
        href: item.href,
        icon: item.icon,
      });
    });

    // Memories (from API search)
    memories.forEach((m) => {
      const config = contentTypeConfig[m.content_type];
      items.push({
        id: `mem-${m.id}`,
        category: "memories",
        label: m.title,
        sublabel: m.summary?.slice(0, 80) || config.label,
        href: `/minnen/${m.id}`,
        icon: contentTypeIcons[m.content_type],
        iconColor: config.hex,
      });
    });

    // Projects (client-side filter)
    const filteredProjects = q
      ? projects.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        )
      : [];

    filteredProjects.slice(0, 5).forEach((p) => {
      items.push({
        id: `proj-${p.id}`,
        category: "projects",
        label: p.name,
        sublabel: p.description || undefined,
        href: `/projekt/${p.id}`,
        icon: Folder,
        iconColor: p.color,
      });
    });

    // Tags (client-side filter)
    const filteredTags = q
      ? tags.filter((t) => t.name.toLowerCase().includes(q))
      : [];

    filteredTags.slice(0, 5).forEach((t) => {
      items.push({
        id: `tag-${t.id}`,
        category: "tags",
        label: t.name,
        sublabel:
          t.memory_count !== undefined
            ? `${t.memory_count} minnen`
            : undefined,
        href: `/minnen?tags=${t.id}`,
        icon: Hash,
        tagColor: t.color,
      });
    });

    return items;
  }, [query, memories, projects, tags]);

  /* Reset selected index when results change */
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  /* ── Navigate to selected item ───────────────────────────── */
  const navigateTo = useCallback(
    (item: ResultItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  /* ── Keyboard navigation ─────────────────────────────────── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            navigateTo(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [results, selectedIndex, navigateTo]
  );

  /* Scroll selected item into view */
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  /* ── Category labels (Swedish) ───────────────────────────── */
  const categoryLabels: Record<ResultItem["category"], string> = {
    navigation: "Navigering",
    memories: "Minnen",
    projects: "Projekt",
    tags: "Taggar",
  };

  /* ── Group results by category ───────────────────────────── */
  const groupedResults = useMemo(() => {
    const groups: { category: ResultItem["category"]; items: ResultItem[] }[] =
      [];
    let currentCategory: ResultItem["category"] | null = null;

    results.forEach((item) => {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        groups.push({ category: item.category, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    });

    return groups;
  }, [results]);

  if (!open) return null;

  /* ── Flat index counter for keyboard nav ─────────────────── */
  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade"
        onClick={() => setOpen(false)}
      />

      {/* Palette container */}
      <div className="relative flex items-start justify-center pt-[15vh] px-4">
        <div
          className="w-full max-w-[560px] bg-card rounded-2xl shadow-lg overflow-hidden animate-scale-in"
          style={{
            boxShadow:
              "0 24px 64px rgba(28, 25, 23, 0.14), 0 8px 20px rgba(28, 25, 23, 0.08), 0 0 0 1px rgba(180, 83, 9, 0.06)",
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground/60 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök minnen, projekt, taggar..."
              className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/50 outline-none font-medium"
              aria-label="Sök"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground/50 text-[10px] font-medium border border-border/50">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-[360px] overflow-y-auto scrollbar-none py-2"
            role="listbox"
          >
            {isSearching && query.trim() && (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
              </div>
            )}

            {!isSearching && results.length === 0 && query.trim() && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground/60">
                  Inga resultat för &ldquo;{query}&rdquo;
                </p>
              </div>
            )}

            {!isSearching &&
              groupedResults.map((group) => (
                <div key={group.category} className="mb-1">
                  {/* Category header */}
                  <div className="px-5 py-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.12em]">
                      {categoryLabels[group.category]}
                    </span>
                  </div>

                  {/* Items */}
                  {group.items.map((item) => {
                    const currentFlatIndex = flatIndex++;
                    const isSelected = currentFlatIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        data-index={currentFlatIndex}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => navigateTo(item)}
                        onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                        className={cn(
                          "flex items-center gap-3 w-full px-5 py-2.5 text-left transition-colors duration-100",
                          isSelected
                            ? "bg-amber-50/80 dark:bg-amber-500/10"
                            : "hover:bg-muted/40"
                        )}
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors",
                            isSelected
                              ? "bg-amber-100/80"
                              : "bg-muted/50"
                          )}
                        >
                          {item.tagColor ? (
                            <div className="flex items-center justify-center w-full h-full">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.tagColor }}
                              />
                            </div>
                          ) : (
                            <Icon
                              className="h-4 w-4"
                              style={
                                item.iconColor
                                  ? { color: item.iconColor }
                                  : undefined
                              }
                              strokeWidth={1.5}
                            />
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-[13px] font-medium truncate",
                              isSelected
                                ? "text-amber-900"
                                : "text-foreground"
                            )}
                          >
                            <HighlightedText
                              text={item.label}
                              query={query}
                            />
                          </p>
                          {item.sublabel && (
                            <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5">
                              <HighlightedText
                                text={item.sublabel}
                                query={query}
                              />
                            </p>
                          )}
                        </div>

                        {/* Category badge for memories */}
                        {item.category === "memories" && item.iconColor && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0"
                            style={{
                              backgroundColor: `${item.iconColor}12`,
                              color: item.iconColor,
                            }}
                          >
                            {contentTypeConfig[
                              Object.keys(contentTypeConfig).find(
                                (k) =>
                                  contentTypeConfig[k as ContentType].hex ===
                                  item.iconColor
                              ) as ContentType
                            ]?.label || ""}
                          </span>
                        )}

                        {/* Enter hint on selected */}
                        {isSelected && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-amber-400/60 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-muted-foreground/40">
                <kbd className="flex items-center justify-center w-5 h-5 rounded bg-muted/80 border border-border/40">
                  <ArrowUp className="h-2.5 w-2.5" />
                </kbd>
                <kbd className="flex items-center justify-center w-5 h-5 rounded bg-muted/80 border border-border/40">
                  <ArrowDown className="h-2.5 w-2.5" />
                </kbd>
                <span className="text-[10px] ml-0.5">navigera</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground/40">
                <kbd className="flex items-center justify-center h-5 px-1.5 rounded bg-muted/80 border border-border/40 text-[10px]">
                  <CornerDownLeft className="h-2.5 w-2.5" />
                </kbd>
                <span className="text-[10px] ml-0.5">öppna</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground/30">
              <Command className="h-3 w-3" />
              <span className="text-[10px] font-medium">K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
