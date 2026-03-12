"use client";

import useSWR from "swr";
import type { Tag } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Tag[] }>(
    "/api/tags",
    fetcher
  );

  return {
    tags: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}
