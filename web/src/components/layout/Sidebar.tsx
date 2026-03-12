"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  PlusCircle,
  Tags,
  Menu,
  X,
  Folder,
  Trash2,
  Zap,
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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
      <div className="flex items-center gap-3.5 px-7 pt-7 pb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/15">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-amber-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.6"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <h1 className="heading-serif text-[18px] text-sidebar-foreground leading-none">
            Mitt Minne
          </h1>
          <p className="text-[10px] text-sidebar-foreground/30 font-medium mt-0.5 tracking-wide">
            Kunskapsarkiv
          </p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto p-2 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 transition-colors md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-1 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-foreground/25 uppercase tracking-[0.12em]">
          Meny
        </p>
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
                  ? "bg-sidebar-active text-amber-400"
                  : "text-sidebar-foreground/45 hover:text-sidebar-foreground/80 hover:bg-sidebar-muted"
              )}
            >
              <item.icon
                className={cn(
                  "h-[17px] w-[17px] transition-colors",
                  isActive
                    ? "text-amber-400"
                    : "text-sidebar-foreground/30 group-hover:text-sidebar-foreground/55"
                )}
                strokeWidth={isActive ? 2 : 1.5}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1 h-4 rounded-full bg-amber-400/60" />
              )}
            </Link>
          );
        })}

        {/* Spaces */}
        {spaces.length > 0 && (
          <div className="pt-5">
            <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-foreground/25 uppercase tracking-[0.12em]">
              Spaces
            </p>
            <div className="space-y-0.5">
              {spaces.map((space) => {
                const spaceHref = `/minnen?space=${space.id}`;
                const isActive =
                  pathname === "/minnen" &&
                  typeof window !== "undefined" &&
                  new URLSearchParams(window.location.search).get("space") ===
                    space.id;
                return (
                  <Link
                    key={space.id}
                    href={spaceHref}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-active text-amber-400"
                        : "text-sidebar-foreground/45 hover:text-sidebar-foreground/80 hover:bg-sidebar-muted"
                    )}
                  >
                    <Folder
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-amber-400"
                          : "text-sidebar-foreground/30 group-hover:text-sidebar-foreground/55"
                      )}
                      strokeWidth={1.5}
                    />
                    <span className="flex-1 truncate">{space.name}</span>
                    {typeof space.memory_count === "number" && (
                      <span className="text-[10px] font-medium text-sidebar-foreground/20 tabular-nums">
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
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-5 py-5">
        <div className="rounded-xl bg-gradient-to-br from-amber-500/[0.06] to-transparent px-4 py-3 border border-sidebar-foreground/[0.04]">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-3 w-3 text-amber-400/70" />
            <span className="text-[10px] font-semibold text-sidebar-foreground/35 uppercase tracking-wider">
              MCP Ansluten
            </span>
          </div>
          <p className="text-[10px] text-sidebar-foreground/20 leading-relaxed">
            Spara minnen via Claude AI
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-sidebar md:hidden border-b border-white/[0.04]">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-amber-400">
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
          </div>
          <span className="heading-serif text-[16px] text-sidebar-foreground">
            Mitt Minne
          </span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-[280px] bg-sidebar flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-[272px] bg-sidebar hidden md:flex flex-col border-r border-white/[0.03]">
        {sidebarContent}
      </aside>
    </>
  );
}
