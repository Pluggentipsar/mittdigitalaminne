"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { CommandPalette } from "@/components/CommandPalette";
import { QuickCaptureModal } from "@/components/QuickCaptureModal";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = pathname.startsWith("/delad");

  if (isPublicPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <MainContent>{children}</MainContent>
      <CommandPalette />
      <QuickCaptureModal />
    </>
  );
}
