import useSWR from "swr";
import type { Project } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Project[] }>(
    "/api/projects",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const createProject = async (projectData: Partial<Project>) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    });
    const json = await res.json();
    mutate();
    return json.data;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    mutate();
  };

  const deleteProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    mutate();
  };

  return {
    projects: data?.data || [],
    isLoading,
    error,
    mutate,
    createProject,
    updateProject,
    deleteProject,
  };
}
