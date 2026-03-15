"use client";

import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { ContentTypeIcon } from "../memories/ContentTypeIcon";
import { contentTypeConfig } from "@/lib/utils";
import type { ContentType, MemoryStats } from "@/lib/types";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface RemindersSectionProps {
  reminders: MemoryStats["reminders"];
}

export function RemindersSection({ reminders }: RemindersSectionProps) {
  if (!reminders || reminders.length === 0) {
    return null; // Don't show empty section
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5 overflow-hidden animate-fade-in">
      <div className="flex items-center gap-3 px-7 pt-6 pb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-500/12 flex items-center justify-center">
          <Bell className="h-4.5 w-4.5 text-amber-600" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="heading-serif text-[18px]">Påminnelser</h2>
          <p className="text-[11px] text-amber-700/50 dark:text-amber-400/50 mt-0.5">
            {reminders.length} {reminders.length === 1 ? "minne väntar" : "minnen väntar"} på dig
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        {reminders.map((item) => {
          const config = contentTypeConfig[item.content_type as ContentType];
          return (
            <Link
              href={`/minnen/${item.id}`}
              key={item.id}
              className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-amber-100/40 dark:hover:bg-amber-500/10 transition-all duration-200 group"
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: `${config.hex}0D` }}
              >
                <ContentTypeIcon type={item.content_type as ContentType} className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors duration-200">
                  {item.title}
                </p>
                <p className="text-[11px] text-amber-700/40 dark:text-amber-400/40 mt-0.5 font-medium">
                  Påminnelse: {format(new Date(item.remind_at), "d MMM, HH:mm", { locale: sv })}
                </p>
              </div>
              <div className="shrink-0 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
