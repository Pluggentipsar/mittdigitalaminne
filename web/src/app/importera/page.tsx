"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { ImportWizard } from "@/components/import/ImportWizard";

export default function ImporteraPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <p className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.18em] mb-3">
          Import
        </p>
        <h1 className="heading-serif text-[36px] md:text-[44px] text-foreground leading-[1.05]">
          Importera minnen
        </h1>
        <p className="text-[14px] text-muted-foreground/70 mt-2.5 max-w-lg leading-relaxed">
          Ladda upp en CSV- eller JSON-fil f&ouml;r att importera flera minnen p&aring; en g&aring;ng.
        </p>

        <div className="divider-ornament mt-7 max-w-xs">
          <span className="text-primary/30 text-[8px]">&#9670;</span>
        </div>
      </div>

      <ImportWizard />
    </div>
  );
}
