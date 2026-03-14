import useSWR from "swr";
import type { Memory } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProjectMemories(projectId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: Memory[] }>(
    projectId ? `/api/projects/${projectId}/memories` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const addMemory = async (memoryId: string) => {
    if (!projectId) return;
    await fetch(`/api/projects/${projectId}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory_id: memoryId }),
    });
    mutate();
  };

  const removeMemory = async (memoryId: string) => {
    if (!projectId) return;
    await fetch(`/api/projects/${projectId}/memories?memory_id=${memoryId}`, {
      method: "DELETE",
    });
    mutate();
  };

  return {
    memories: data?.data || [],
    isLoading,
    error,
    mutate,
    addMemory,
    removeMemory,
  };
}
