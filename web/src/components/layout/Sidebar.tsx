"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  PlusCircle,
  Tags,
  Brain,
  Sparkles,
  Menu,
  X,
  Folder,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpaces } from "@/hooks/useSpaces";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/minnen", label: "Minnen", icon: Library },
  { href: "/lagg-till", label: "Lägg till", icon: PlusCircle },
  { href: "/taggar", label: "Taggar", icon: Tags },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { spaces, deleteSpace } = useSpaces();

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/20">
          <Brain className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
            Mitt Minne
          </h1>
          <p className="text-[11px] text-sidebar-foreground/40 font-medium">
            Digitalt kunskapsbibliotek
          </p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto p-2 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 transition-colors md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-sidebar-foreground/8" />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-active text-purple-400"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-muted"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  isActive
                    ? "text-purple-400"
                    : "text-sidebar-foreground/35 group-hover:text-sidebar-foreground/60"
                )}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spaces */}
      {spaces.length > 0 && (
        <>
          <div className="mx-5 h-px bg-sidebar-foreground/8" />
          <div className="px-4 py-3">
            <p className="px-3 mb-1.5 text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-widest">
              Spaces
            </p>
            <div className="space-y-0.5">
              {spaces.map((space) => {
                const spaceHref = `/minnen?space=${space.id}`;
                const isActive = pathname === "/minnen" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("space") === space.id;
                return (
                  <Link
                    key={space.id}
                    href={spaceHref}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-active text-purple-400"
                        : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-muted"
                    )}
                  >
                    <Folder
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-purple-400"
                          : "text-sidebar-foreground/35 group-hover:text-sidebar-foreground/60"
                      )}
                    />
                    <span className="flex-1 truncate">{space.name}</span>
                    {typeof space.memory_count === "number" && (
                      <span className="text-[10px] font-semibold text-sidebar-foreground/25 tabular-nums">
                        {space.memory_count}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`Ta bort "${space.name}"?`)) {
                          deleteSpace(space.id);
                        }
                      }}
                      className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded-md hover:bg-red-500/20 text-sidebar-foreground/25 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom section */}
      <div className="px-5 py-5">
        <div className="rounded-xl bg-sidebar-foreground/[0.04] px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-purple-400/60" />
            <span className="text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
              MCP Ansluten
            </span>
          </div>
          <p className="text-[11px] text-sidebar-foreground/25 leading-relaxed">
            Spara minnen via Claude AI
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-sidebar md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/20">
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <span className="text-[14px] font-bold text-sidebar-foreground">
            Mitt Minne
          </span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-[280px] bg-sidebar flex flex-col transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-[260px] bg-sidebar hidden md:flex flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
