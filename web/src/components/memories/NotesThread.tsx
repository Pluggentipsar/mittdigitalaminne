"use client";

import { useState } from "react";
import { Trash2, Send, MessageSquare } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { relativeDate } from "@/lib/utils";

interface NotesThreadProps {
  memoryId: string;
}

export function NotesThread({ memoryId }: NotesThreadProps) {
  const { notes, isLoading, addNote, deleteNote } = useNotes(memoryId);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addNote(content.trim());
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
        <MessageSquare className="h-3.5 w-3.5" />
        Anteckningar
        {notes.length > 0 && (
          <span className="text-[11px] font-semibold bg-muted px-2 py-0.5 rounded-full normal-case tracking-normal">
            {notes.length}
          </span>
        )}
      </h2>

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="space-y-3 mb-5">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative rounded-xl bg-muted/40 px-4 py-3"
            >
              <MarkdownContent content={note.content} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-muted-foreground/60 font-medium">
                  {relativeDate(note.created_at)}
                </span>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                  title="Ta bort"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add note form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Skriv en anteckning..."
          rows={2}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-[13px] leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all resize-y"
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="self-end p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
