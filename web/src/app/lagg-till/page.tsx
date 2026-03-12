"use client";

import { MemoryForm } from "@/components/memories/MemoryForm";

export default function LaggTillPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.18em] mb-3">
          Nytt minne
        </p>
        <h1 className="heading-serif text-[36px] md:text-[44px] text-foreground leading-[1.05]">
          Lägg till
        </h1>
        <p className="text-[14px] text-muted-foreground/70 mt-2.5">
          Spara en tanke, länk, artikel eller bild
        </p>

        <div className="divider-ornament mt-7 max-w-xs">
          <span className="text-primary/30 text-[8px]">&#9670;</span>
        </div>
      </div>
      <MemoryForm mode="create" />
    </div>
  );
}
