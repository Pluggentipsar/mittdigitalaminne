"use client";

import Link from "next/link";
import {
  Folder,
  Book,
  Lightbulb,
  Target,
  Star,
  Bookmark,
  Briefcase,
  GraduationCap,
  Calendar,
  Archive,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<any>> = {
  folder: Folder,
  book: Book,
  lightbulb: Lightbulb,
  target: Target,
  star: Star,
  bookmark: Bookmark,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
};

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const IconComponent = iconMap[project.icon] || Folder;

  const deadlineDate = project.deadline ? new Date(project.deadline) : null;
  const isOverdue = deadlineDate ? deadlineDate < new Date() : false;

  return (
    <div className={`group relative animate-scale-in stagger-${Math.min(index + 1, 8)}`}>
      <Link
        href={`/projekt/${project.id}`}
        className={cn(
          "block rounded-2xl border border-border/50 bg-card shadow-xs overflow-hidden transition-all duration-300",
          "hover:shadow-md hover:border-border/80"
        )}
      >
        {/* Colored accent line at top */}
        <div
          className="h-[3px] w-full transition-all duration-300 group-hover:h-[4px]"
          style={{ backgroundColor: project.color }}
        />

        <div className="p-5">
          {/* Icon + Status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundColor: `${project.color}15`,
              }}
            >
              <IconComponent
                className="h-[18px] w-[18px]"
                style={{ color: project.color }}
                strokeWidth={1.5}
              />
            </div>

            {project.status === "archived" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground/60">
                <Archive className="h-2.5 w-2.5" />
                Arkiverad
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="font-semibold text-[14px] leading-snug mb-1.5 line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {project.name}
          </h3>

          {/* Description */}
          {project.description && (
            <p className="text-[12px] text-muted-foreground/70 leading-relaxed line-clamp-2 mb-3">
              {project.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
            <span className="text-[11px] text-muted-foreground/50 font-medium tabular-nums">
              {project.memory_count || 0} {(project.memory_count || 0) === 1 ? "minne" : "minnen"}
            </span>

            {deadlineDate && (
              <div
                className={cn(
                  "flex items-center gap-1 text-[11px] font-medium",
                  isOverdue && project.status === "active"
                    ? "text-red-500"
                    : "text-muted-foreground/50"
                )}
              >
                <Calendar className="h-3 w-3" strokeWidth={1.5} />
                {deadlineDate.toLocaleDateString("sv-SE", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
