"use client";

import { useSidebar } from "@/contexts/SidebarContext";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <main
      className="relative z-[1] pt-14 md:pt-0 min-h-screen sidebar-main"
      style={{ "--sidebar-w": collapsed ? "72px" : "272px" } as React.CSSProperties}
    >
      <div className="max-w-6xl mx-auto px-5 py-8 md:px-10 md:py-10">
        {children}
      </div>
    </main>
  );
}
