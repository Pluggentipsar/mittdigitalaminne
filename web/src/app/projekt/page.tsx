"use client";

import { useState } from "react";
import { Plus, FolderKanban, ChevronDown, ChevronRight } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import type { Project } from "@/lib/types";

export default function ProjektPage() {
  const { projects, isLoading, createProject } = useProjects();
  const [formOpen, setFormOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const activeProjects = projects.filter((p) => p.status === "active");
  const archivedProjects = projects.filter((p) => p.status === "archived");

  const handleCreate = async (data: Partial<Project>) => {
    await createProject(data);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.18em] mb-3">
              Projekt
            </p>
            <h1 className="heading-serif text-[36px] md:text-[44px] text-foreground leading-[1.05]">
              Dina projekt
            </h1>
            <p className="text-[14px] text-muted-foreground/70 mt-2.5">
              Organisera minnen i samlingar med syfte och deadline.
            </p>
          </div>

          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md shrink-0 mt-2"
          >
            <Plus className="h-4 w-4" />
            Nytt projekt
          </button>
        </div>

        <div className="divider-ornament mt-7 max-w-xs">
          <span className="text-primary/30 text-[8px]">&#9670;</span>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[180px] rounded-2xl" />
          ))}
        </div>
      ) : activeProjects.length === 0 && archivedProjects.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-5">
            <FolderKanban className="h-7 w-7 text-muted-foreground/35" strokeWidth={1.5} />
          </div>
          <p className="heading-serif text-[20px] text-foreground/70 mb-1">
            Inga projekt ännu
          </p>
          <p className="text-[13px] text-muted-foreground mb-6">
            Skapa ditt första projekt för att organisera dina minnen
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Nytt projekt
          </button>
        </div>
      ) : (
        <>
          {/* Active projects grid */}
          {activeProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeProjects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          )}

          {/* Archived section */}
          {archivedProjects.length > 0 && (
            <div className="pt-4">
              <button
                onClick={() => setArchivedOpen(!archivedOpen)}
                className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground/60 hover:text-muted-foreground transition-colors mb-4"
              >
                {archivedOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Arkiverade projekt ({archivedProjects.length})
              </button>

              {archivedOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in">
                  {archivedProjects.map((project, i) => (
                    <ProjectCard key={project.id} project={project} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Project form modal */}
      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
      />
    </div>
  );
}
