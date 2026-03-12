"use client";

import useSWR from "swr";
import type { Memory, MemoryFilters } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildQueryString(filters: MemoryFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("query", filters.query);
  if (filters.content_type) params.set("content_type", filters.content_type);
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.favorites_only) params.set("favorites_only", "true");
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));
  return params.toString();
}

export function useMemories(filters: MemoryFilters = {}) {
  const qs = buildQueryString(filters);
  const { data, error, isLoading, mutate } = useSWR<{
    data: Memory[];
    count: number;
  }>(`/api/memories?${qs}`, fetcher);

  return {
    memories: data?.data || [],
    count: data?.count || 0,
    isLoading,
    error,
    mutate,
  };
}

export function useMemory(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: Memory }>(
    id ? `/api/memories/${id}` : null,
    fetcher
  );

  return {
    memory: data?.data,
    isLoading,
    error,
    mutate,
  };
}
