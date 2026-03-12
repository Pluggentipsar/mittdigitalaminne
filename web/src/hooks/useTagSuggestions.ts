"use client";

import { useState, useCallback } from "react";

interface TagSuggestions {
  existing: string[];
  suggested: string[];
}

export function useTagSuggestions() {
  const [suggestions, setSuggestions] = useState<TagSuggestions | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(
    async (title: string, summary: string, content: string) => {
      if (!title && !summary && !content) return;

      setLoading(true);
      try {
        const res = await fetch("/api/suggest-tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, summary, content }),
        });
        if (!res.ok) return;
        const { data } = await res.json();
        setSuggestions(data);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearSuggestions = useCallback(() => setSuggestions(null), []);

  return { suggestions, loading, fetchSuggestions, clearSuggestions };
}
