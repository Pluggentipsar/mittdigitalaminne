"use client";

import useSWR from "swr";
import type { FeedSource, FeedItem } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFeeds() {
  const { data, error, isLoading, mutate } = useSWR<{ data: FeedSource[] }>(
    "/api/feeds",
    fetcher
  );

  const sources = data?.data || [];

  // Extract unique categories from sources (supports comma-separated)
  const categories = Array.from(
    new Set(
      sources
        .flatMap((s) =>
          s.category
            ? s.category.split(",").map((c) => c.trim().toLowerCase())
            : []
        )
        .filter(Boolean)
    )
  ).sort() as string[];

  return {
    sources,
    categories,
    isLoading,
    error,
    mutate,
  };
}

export function useFeedItems(filters: {
  source_id?: string;
  feed_type?: string;
  category?: string;
  tag?: string;
  unread_only?: boolean;
  sort?: "newest" | "oldest" | "relevance" | "smart";
  limit?: number;
  offset?: number;
} = {}) {
  const params = new URLSearchParams();
  if (filters.source_id) params.set("source_id", filters.source_id);
  if (filters.feed_type) params.set("feed_type", filters.feed_type);
  if (filters.category) params.set("category", filters.category);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.unread_only) params.set("unread_only", "true");
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  const qs = params.toString();

  const { data, error, isLoading, mutate } = useSWR<{
    data: FeedItem[];
    count: number;
    available_tags?: string[];
  }>(`/api/feeds/items?${qs}`, fetcher);

  return {
    items: data?.data || [],
    count: data?.count || 0,
    availableTags: data?.available_tags || [],
    isLoading,
    error,
    mutate,
  };
}
