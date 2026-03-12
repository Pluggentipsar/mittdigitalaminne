"use client";

import useSWR from "swr";
import type { MemoryNote } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useNotes(memoryId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ data: MemoryNote[] }>(
    `/api/memories/${memoryId}/notes`,
    fetcher
  );

  const addNote = async (content: string) => {
    await fetch(`/api/memories/${memoryId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    mutate();
  };

  const deleteNote = async (noteId: string) => {
    await fetch(`/api/memories/${memoryId}/notes/${noteId}`, {
      method: "DELETE",
    });
    mutate();
  };

  return {
    notes: data?.data || [],
    isLoading,
    error,
    mutate,
    addNote,
    deleteNote,
  };
}
