"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { MemoryForm } from "@/components/memories/MemoryForm";

export default function LaggTillPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.18em] mb-3">
              Nytt minne
            </p>
            <h1 className="heading-serif text-[36px] md:text-[44px] text-foreground leading-[1.05]">
              L&auml;gg till
            </h1>
            <p className="text-[14px] text-muted-foreground/70 mt-2.5">
              Spara en tanke, l&auml;nk, artikel eller bild
            </p>
          </div>
          <Link
            href="/importera"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/80 dark:hover:bg-accent/60 text-[12px] font-semibold text-foreground/70 border border-border/40 transition-all shrink-0"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
            Importera
          </Link>
        </div>

        <div className="divider-ornament mt-7 max-w-xs">
          <span className="text-primary/30 text-[8px]">&#9670;</span>
        </div>
      </div>
      <MemoryForm mode="create" />
    </div>
  );
}
