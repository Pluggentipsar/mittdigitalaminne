"use client";

import { MemoryForm } from "@/components/memories/MemoryForm";

export default function LaggTillPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <p className="text-[11px] font-semibold text-primary/60 uppercase tracking-[0.15em] mb-2">
          Nytt minne
        </p>
        <h1 className="heading-serif text-[32px] md:text-[38px] text-foreground leading-[1.1]">
          Lägg till
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Spara en tanke, länk, artikel eller bild
        </p>
      </div>
      <MemoryForm mode="create" />
    </div>
  );
}
