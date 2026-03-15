"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  PlusCircle,
  Tags,
  FolderKanban,
  Menu,
  X,
  Folder,
  Trash2,
  Zap,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Search,
  Command,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpaces } from "@/hooks/useSpaces";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import useSWR from "swr";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inkorg", label: "Inkorg", icon: Inbox, hasBadge: true },
  { href: "/minnen", label: "Minnen", icon: Library },
  { href: "/lagg-till", label: "Lägg till", icon: PlusCircle },
  { href: "/taggar", label: "Taggar", icon: Tags },
  { href: "/projekt", label: "Projekt", icon: FolderKanban },
];

const statsFetcher = (url: string) => fetch(url).then((r) => r.json());

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { spaces, deleteSpace } = useSpaces();
  const { collapsed, toggle } = useSidebar();
  const { resolved: currentTheme, toggle: toggleTheme } = useTheme();
  const { data: statsData } = useSWR<{ data: { inbox_count: number } }>("/api/statistics", statsFetcher, { refreshInterval: 30000 });
  const inboxCount = statsData?.data?.inbox_count || 0;

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

  /* ── Mobile sidebar content (always expanded) ───────────────── */
  const mobileSidebarContent = (
    <>
      {/* Logo area */}
      <div className="flex items-center gap-3.5 px-7 pt-7 pb-6">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/15">
          <div className="absolute inset-0 rounded-xl bg-amber-400/10 blur-[6px]" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative text-amber-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.6"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <h1 className="heading-serif text-[18px] text-sidebar-foreground leading-none">
            Mitt Minne
          </h1>
          <p className="text-[10px] text-sidebar-foreground/25 font-medium mt-0.5 tracking-wide">
            Kunskapsarkiv
          </p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto p-2 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-1 space-y-0.5">
        <p className="px-3 mb-2.5 text-[9px] font-bold text-sidebar-foreground/20 uppercase tracking-[0.15em]">
          Meny
        </p>
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-active text-amber-400"
                  : "text-sidebar-foreground/40 hover:text-sidebar-foreground/75 hover:bg-sidebar-muted"
              )}
            >
              {isActive && <div className="absolute inset-0 rounded-xl bg-amber-500/8 blur-[4px]" />}
              <item.icon
                className={cn("relative h-[17px] w-[17px] transition-colors", isActive ? "text-amber-400" : "text-sidebar-foreground/25 group-hover:text-sidebar-foreground/50")}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className="relative">{item.label}</span>
              {item.hasBadge && inboxCount > 0 && (
                <span className="relative ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold tabular-nums px-1">
                  {inboxCount}
                </span>
              )}
              {isActive && !item.hasBadge && <div className="relative ml-auto w-1 h-4 rounded-full bg-amber-400/60" />}
              {isActive && item.hasBadge && inboxCount === 0 && <div className="relative ml-auto w-1 h-4 rounded-full bg-amber-400/60" />}
            </Link>
          );
        })}

        {spaces.length > 0 && (
          <div className="pt-5">
            <p className="px-3 mb-2.5 text-[9px] font-bold text-sidebar-foreground/20 uppercase tracking-[0.15em]">
              Spaces
            </p>
            <div className="space-y-0.5">
              {spaces.map((space) => {
                const spaceHref = `/minnen?space=${space.id}`;
                const isActive = pathname === "/minnen" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("space") === space.id;
                return (
                  <Link key={space.id} href={spaceHref} className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium transition-all duration-200", isActive ? "bg-sidebar-active text-amber-400" : "text-sidebar-foreground/40 hover:text-sidebar-foreground/75 hover:bg-sidebar-muted")}>
                    {isActive && <div className="absolute inset-0 rounded-xl bg-amber-500/8 blur-[4px]" />}
                    <Folder className={cn("relative h-4 w-4 shrink-0 transition-colors", isActive ? "text-amber-400" : "text-sidebar-foreground/25 group-hover:text-sidebar-foreground/50")} strokeWidth={1.5} />
                    <span className="relative flex-1 truncate">{space.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="px-5 py-5 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-[12px] font-medium text-sidebar-foreground/35 hover:text-sidebar-foreground/60 hover:bg-sidebar-muted transition-all duration-200"
        >
          {currentTheme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400/70" strokeWidth={1.5} />
          ) : (
            <Moon className="h-4 w-4 text-sidebar-foreground/30" strokeWidth={1.5} />
          )}
          {currentTheme === "dark" ? "Ljust l\u00e4ge" : "M\u00f6rkt l\u00e4ge"}
        </button>

        <div className="relative rounded-xl overflow-hidden px-4 py-3.5 border border-sidebar-foreground/[0.04]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-amber-500/[0.02]" />
          <div className="relative flex items-center gap-2 mb-1">
            <div className="relative">
              <Zap className="h-3 w-3 text-amber-400/80" />
              <div className="absolute inset-0 bg-amber-400/30 blur-[3px]" />
            </div>
            <span className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-wider">
              MCP Ansluten
            </span>
          </div>
          <p className="relative text-[10px] text-sidebar-foreground/18 leading-relaxed">
            Spara minnen via Claude AI
          </p>
        </div>
      </div>
    </>
  );

  /* ── Desktop sidebar content (collapsed-aware) ──────────────── */
  const desktopSidebarContent = (
    <>
      {/* Logo area */}
      <div className={cn("flex items-center pt-7 pb-6 transition-all duration-300", collapsed ? "justify-center px-0" : "gap-3.5 px-7")}>
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/15 shrink-0">
          <div className="absolute inset-0 rounded-xl bg-amber-400/10 blur-[6px]" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative text-amber-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.6"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="animate-fade min-w-0">
            <h1 className="heading-serif text-[18px] text-sidebar-foreground leading-none">
              Mitt Minne
            </h1>
            <p className="text-[10px] text-sidebar-foreground/25 font-medium mt-0.5 tracking-wide">
              Kunskapsarkiv
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-1 space-y-0.5 transition-all duration-300", collapsed ? "px-2" : "px-4")}>
        {/* Command palette trigger */}
        {!collapsed ? (
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 mb-3 text-[12px] font-medium text-sidebar-foreground/30 hover:text-sidebar-foreground/50 bg-sidebar-muted/50 hover:bg-sidebar-muted transition-all duration-200 border border-sidebar-foreground/[0.04]"
          >
            <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 text-left">Sök...</span>
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sidebar-foreground/[0.06] text-sidebar-foreground/20 text-[10px] font-medium">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="flex items-center justify-center w-full rounded-xl py-2.5 mb-2 text-sidebar-foreground/25 hover:text-sidebar-foreground/50 hover:bg-sidebar-muted transition-all duration-200"
            title="Sök (⌘K)"
          >
            <Search className="h-[17px] w-[17px]" strokeWidth={1.5} />
          </button>
        )}

        {!collapsed && (
          <p className="px-3 mb-2.5 text-[9px] font-bold text-sidebar-foreground/20 uppercase tracking-[0.15em]">
            Meny
          </p>
        )}
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-200",
                collapsed
                  ? "justify-center px-0 py-2.5"
                  : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-sidebar-active text-amber-400"
                  : "text-sidebar-foreground/40 hover:text-sidebar-foreground/75 hover:bg-sidebar-muted"
              )}
            >
              {isActive && <div className="absolute inset-0 rounded-xl bg-amber-500/8 blur-[4px]" />}
              <div className="relative">
                <item.icon
                  className={cn(
                    "h-[17px] w-[17px] transition-colors shrink-0",
                    isActive ? "text-amber-400" : "text-sidebar-foreground/25 group-hover:text-sidebar-foreground/50"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                {collapsed && item.hasBadge && inboxCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white px-0.5">
                    {inboxCount > 9 ? "9+" : inboxCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="relative">{item.label}</span>
                  {item.hasBadge && inboxCount > 0 && (
                    <span className="relative ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold tabular-nums px-1">
                      {inboxCount}
                    </span>
                  )}
                  {isActive && !(item.hasBadge && inboxCount > 0) && <div className="relative ml-auto w-1 h-4 rounded-full bg-amber-400/60" />}
                </>
              )}
            </Link>
          );
        })}

        {/* Spaces — hidden in collapsed mode */}
        {!collapsed && spaces.length > 0 && (
          <div className="pt-5 animate-fade">
            <p className="px-3 mb-2.5 text-[9px] font-bold text-sidebar-foreground/20 uppercase tracking-[0.15em]">
              Spaces
            </p>
            <div className="space-y-0.5">
              {spaces.map((space) => {
                const spaceHref = `/minnen?space=${space.id}`;
                const isActive =
                  pathname === "/minnen" &&
                  typeof window !== "undefined" &&
                  new URLSearchParams(window.location.search).get("space") === space.id;
                return (
                  <Link
                    key={space.id}
                    href={spaceHref}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-active text-amber-400"
                        : "text-sidebar-foreground/40 hover:text-sidebar-foreground/75 hover:bg-sidebar-muted"
                    )}
                  >
                    {isActive && <div className="absolute inset-0 rounded-xl bg-amber-500/8 blur-[4px]" />}
                    <Folder
                      className={cn("relative h-4 w-4 shrink-0 transition-colors", isActive ? "text-amber-400" : "text-sidebar-foreground/25 group-hover:text-sidebar-foreground/50")}
                      strokeWidth={1.5}
                    />
                    <span className="relative flex-1 truncate">{space.name}</span>
                    {typeof space.memory_count === "number" && (
                      <span className="relative text-[10px] font-medium text-sidebar-foreground/18 tabular-nums">
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
                      className="relative hidden group-hover:flex items-center justify-center w-5 h-5 rounded-md hover:bg-red-500/20 text-sidebar-foreground/25 hover:text-red-400 transition-colors"
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
      {!collapsed ? (
        <div className="px-5 py-5 animate-fade">
          <div className="relative rounded-xl overflow-hidden px-4 py-3.5 border border-sidebar-foreground/[0.04]">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-amber-500/[0.02]" />
            <div className="relative flex items-center gap-2 mb-1">
              <div className="relative">
                <Zap className="h-3 w-3 text-amber-400/80" />
                <div className="absolute inset-0 bg-amber-400/30 blur-[3px]" />
              </div>
              <span className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-wider">
                MCP Ansluten
              </span>
            </div>
            <p className="relative text-[10px] text-sidebar-foreground/18 leading-relaxed">
              Spara minnen via Claude AI
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-5">
          <div className="relative" title="MCP Ansluten">
            <Zap className="h-3.5 w-3.5 text-amber-400/60" />
            <div className="absolute inset-0 bg-amber-400/20 blur-[3px]" />
          </div>
        </div>
      )}

      {/* Theme toggle + Collapse toggle */}
      <div className={cn("border-t border-sidebar-foreground/[0.04] transition-all duration-300", collapsed ? "px-2 py-3 space-y-1" : "px-5 py-3 space-y-1")}>
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center rounded-lg text-sidebar-foreground/25 hover:text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 transition-all duration-200",
            collapsed
              ? "justify-center w-full py-2"
              : "gap-2.5 px-3 py-2 w-full"
          )}
          title={currentTheme === "dark" ? "Ljust läge" : "Mörkt läge"}
        >
          {currentTheme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400/70" strokeWidth={1.5} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.5} />
          )}
          {!collapsed && (
            <span className="text-[11px] font-medium">
              {currentTheme === "dark" ? "Ljust" : "Mörkt"}
            </span>
          )}
        </button>
        <button
          onClick={toggle}
          className={cn(
            "flex items-center rounded-lg text-sidebar-foreground/25 hover:text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 transition-all duration-200",
            collapsed
              ? "justify-center w-full py-2"
              : "gap-2.5 px-3 py-2 w-full"
          )}
          title={collapsed ? "Expandera sidebar" : "Kollapsa sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-[11px] font-medium">Kollapsa</span>
            </>
          )}
        </button>
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
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 transition-colors"
          title={currentTheme === "dark" ? "Ljust läge" : "Mörkt läge"}
        >
          {currentTheme === "dark" ? (
            <Sun className="h-4.5 w-4.5 text-amber-400/70" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="p-2 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 transition-colors"
          title="Sök"
        >
          <Search className="h-4.5 w-4.5" />
        </button>
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
        {mobileSidebarContent}
      </aside>

      {/* Desktop sidebar — width animates between 272px and 72px */}
      <aside
        className="fixed left-0 top-0 z-40 h-screen bg-sidebar hidden md:flex flex-col border-r border-white/[0.03] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden"
        style={{ width: collapsed ? 72 : 272 }}
      >
        {/* Subtle amber accent at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        {desktopSidebarContent}
      </aside>
    </>
  );
}
