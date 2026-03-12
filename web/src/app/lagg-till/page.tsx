"use client";

import { MemoryForm } from "@/components/memories/MemoryForm";

export default function LaggTillPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Lägg till minne
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Spara en tanke, länk, artikel eller bild
        </p>
      </div>
      <MemoryForm mode="create" />
    </div>
  );
}
