"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ResurfaceGroup {
  label: string;
  memories: {
    id: string;
    content_type: string;
    title: string;
    summary: string | null;
    link_url: string | null;
    link_metadata: any;
    created_at: string;
  }[];
}

export function useResurface() {
  const { data, isLoading } = useSWR<{ data: ResurfaceGroup[] }>(
    "/api/resurface",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
  return { groups: data?.data || [], isLoading };
}
