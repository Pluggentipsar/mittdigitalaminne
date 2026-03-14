"use client";

import useSWR from "swr";
import type { Memory } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useInbox() {
  const { data, error, isLoading, mutate } = useSWR<{
    data: Memory[];
    count: number;
  }>("/api/memories?is_inbox=true&sort=newest", fetcher);

  const archiveMemory = async (id: string) => {
    await fetch(`/api/memories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_inbox: false }),
    });
    mutate();
  };

  return {
    memories: data?.data || [],
    count: data?.count || 0,
    isLoading,
    error,
    mutate,
    archiveMemory,
  };
}
