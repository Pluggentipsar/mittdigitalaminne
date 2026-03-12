import useSWR from "swr";
import type { RelatedMemory } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useRelatedMemories(memoryId: string | null) {
  const { data, error, isLoading } = useSWR<{ data: RelatedMemory[] }>(
    memoryId ? `/api/memories/${memoryId}/related` : null,
    fetcher
  );

  return {
    relatedMemories: data?.data || [],
    isLoading,
    error,
  };
}
