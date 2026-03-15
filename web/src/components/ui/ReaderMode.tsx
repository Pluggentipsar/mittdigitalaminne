"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Minus, Plus, Type, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ReaderModeProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  author?: string;
  domain?: string;
  readTime?: number;
}

const FONT_SIZES = [
  { label: "S", value: 15, leading: "1.8", spacing: "0.01em" },
  { label: "M", value: 17, leading: "1.85", spacing: "0.01em" },
  { label: "L", value: 19, leading: "1.9", spacing: "0.005em" },
  { label: "XL", value: 22, leading: "1.95", spacing: "0em" },
];

const LS_KEY = "reader-font-size";

export function ReaderMode({ open, onClose, title, content, author, domain, readTime }: ReaderModeProps) {
  const [fontIdx, setFontIdx] = useState(1); // Default: M
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Load saved preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < FONT_SIZES.length) setFontIdx(idx);
      }
    } catch {}
  }, []);

  // Animate in/out
  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      document.body.style.overflow = "";
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const changeFontSize = useCallback((delta: number) => {
    setFontIdx((prev) => {
      const next = Math.max(0, Math.min(FONT_SIZES.length - 1, prev + delta));
      try { localStorage.setItem(LS_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  if (!mounted) return null;

  const font = FONT_SIZES[fontIdx];

  const overlay = (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col bg-background transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{ height: "100dvh" }}
    >
      {/* Top bar — sticky, not absolute */}
      <div
        className={cn(
          "flex-none bg-background/80 backdrop-blur-lg border-b border-border/30 transition-transform duration-300",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="max-w-[720px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-primary/60" strokeWidth={1.5} />
            <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">
              Läsläge
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Font size controls */}
            <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5 mr-2">
              <button
                onClick={() => changeFontSize(-1)}
                disabled={fontIdx === 0}
                className="p-1.5 rounded-md hover:bg-card text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                title="Mindre text"
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <div className="flex items-center gap-0.5 px-1.5">
                <Type className="h-3 w-3 text-muted-foreground/40" strokeWidth={2} />
                <span className="text-[10px] font-bold text-muted-foreground/60 w-5 text-center tabular-nums">
                  {font.label}
                </span>
              </div>
              <button
                onClick={() => changeFontSize(1)}
                disabled={fontIdx === FONT_SIZES.length - 1}
                className="p-1.5 rounded-md hover:bg-card text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                title="Större text"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground/50 hover:text-foreground transition-all"
              title="Stäng läsläge (Esc)"
            >
              <X className="h-4.5 w-4.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content — takes remaining space */}
      <div
        className={cn(
          "flex-1 overflow-y-auto overscroll-contain transition-transform duration-300",
          visible ? "translate-y-0" : "translate-y-4"
        )}
      >
        <article className="max-w-[720px] mx-auto px-6 md:px-10 pb-24">
          {/* Article header */}
          <header className="mb-10 pt-8">
            <h1
              className="heading-serif text-foreground leading-[1.15] mb-4"
              style={{ fontSize: `${Math.round(font.value * 1.8)}px` }}
            >
              {title}
            </h1>
            {(author || domain || readTime) && (
              <div className="flex items-center gap-3 flex-wrap text-muted-foreground/50">
                {author && (
                  <span style={{ fontSize: `${Math.round(font.value * 0.75)}px` }} className="font-medium">
                    {author}
                  </span>
                )}
                {domain && (
                  <span style={{ fontSize: `${Math.round(font.value * 0.7)}px` }} className="font-medium">
                    {domain}
                  </span>
                )}
                {readTime && readTime > 0 && (
                  <span style={{ fontSize: `${Math.round(font.value * 0.7)}px` }} className="font-medium">
                    {readTime} min lästid
                  </span>
                )}
              </div>
            )}
            <div className="mt-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </header>

          {/* Article body */}
          <div
            className="reader-body"
            style={{
              fontSize: `${font.value}px`,
              lineHeight: font.leading,
              letterSpacing: font.spacing,
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1
                    className="font-extrabold tracking-tight mt-10 mb-4 first:mt-0 text-foreground"
                    style={{ fontSize: `${Math.round(font.value * 1.55)}px`, lineHeight: "1.2" }}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2
                    className="font-bold tracking-tight mt-9 mb-3 first:mt-0 text-foreground"
                    style={{ fontSize: `${Math.round(font.value * 1.35)}px`, lineHeight: "1.25" }}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3
                    className="font-bold mt-7 mb-3 first:mt-0 text-foreground"
                    style={{ fontSize: `${Math.round(font.value * 1.15)}px`, lineHeight: "1.3" }}
                  >
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-5 last:mb-0 text-foreground/90">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mb-5 space-y-2 text-foreground/90">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mb-5 space-y-2 text-foreground/90">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="pl-1">{children}</li>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium underline underline-offset-3 decoration-primary/30 hover:decoration-primary/60 transition-colors"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    className="border-l-3 border-primary/30 pl-5 my-6 text-foreground/60 italic"
                    style={{ fontSize: `${Math.round(font.value * 0.95)}px` }}
                  >
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    return (
                      <code className="block bg-muted rounded-xl p-5 text-[13px] font-mono overflow-x-auto my-5">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="bg-muted px-1.5 py-0.5 rounded-md text-[0.88em] font-mono">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <pre className="my-0">{children}</pre>,
                hr: () => (
                  <div className="my-8 flex items-center justify-center gap-3">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border/50" />
                    <span className="text-primary/20 text-[8px]">&#9670;</span>
                    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border/50" />
                  </div>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-foreground/80">{children}</em>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-5">
                    <table className="w-full border-collapse" style={{ fontSize: `${Math.round(font.value * 0.85)}px` }}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border bg-muted px-3 py-2.5 text-left font-bold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-3 py-2.5">{children}</td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* End ornament */}
          <div className="mt-14 mb-8 flex items-center justify-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border/40" />
            <span className="text-primary/25 text-[10px]">&#9670; &#9670; &#9670;</span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border/40" />
          </div>
        </article>
      </div>
    </div>
  );

  // Render via portal to escape any parent stacking context / layout constraints
  return createPortal(overlay, document.body);
}
