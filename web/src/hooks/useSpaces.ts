import useSWR from "swr";
import type { SmartSpace, MemoryFilters } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useSpaces() {
  const { data, error, isLoading, mutate } = useSWR<{ data: SmartSpace[] }>(
    "/api/spaces",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const createSpace = async (name: string, filters: MemoryFilters) => {
    const { limit, offset, ...cleanFilters } = filters;
    await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, filters: cleanFilters }),
    });
    mutate();
  };

  const deleteSpace = async (id: string) => {
    await fetch(`/api/spaces/${id}`, { method: "DELETE" });
    mutate();
  };

  const updateSpace = async (id: string, updates: Partial<SmartSpace>) => {
    await fetch(`/api/spaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    mutate();
  };

  return {
    spaces: data?.data || [],
    isLoading,
    error,
    mutate,
    createSpace,
    deleteSpace,
    updateSpace,
  };
}
