"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemory } from "@/hooks/useMemories";
import { MemoryForm } from "@/components/memories/MemoryForm";

export default function RedigeraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { memory, isLoading } = useMemory(id);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton h-8 w-2/3" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-[15px] font-semibold text-foreground/70 mb-1">
          Minnet hittades inte
        </p>
        <Link
          href="/minnen"
          className="text-[13px] text-primary font-medium mt-2 hover:underline"
        >
          Tillbaka till minnen
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Link
          href={`/minnen/${id}`}
          className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Redigera minne
        </h1>
      </div>
      <MemoryForm
        mode="edit"
        memory={memory}
        onSuccess={() => router.push(`/minnen/${id}`)}
      />
    </div>
  );
}
