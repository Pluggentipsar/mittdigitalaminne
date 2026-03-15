"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileUp,
  Check,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ArrowRight,
  Inbox,
  FileText,
  FileJson,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  parseCSV,
  parseJSON,
  autoMapColumns,
  transformRows,
  type ImportRow,
  type ColumnMapping,
  type ParseResult,
} from "@/lib/import-parser";

type Step = "upload" | "map" | "import";
type FileFormat = "csv" | "json";

const MEMORY_FIELDS: { key: keyof ColumnMapping; label: string; required?: boolean }[] = [
  { key: "title", label: "Titel", required: true },
  { key: "content_type", label: "Typ" },
  { key: "original_content", label: "Inneh\u00e5ll" },
  { key: "summary", label: "Sammanfattning" },
  { key: "link_url", label: "URL / L\u00e4nk" },
  { key: "image_url", label: "Bild-URL" },
  { key: "tags", label: "Taggar" },
];

const BATCH_SIZE = 100;

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [format, setFormat] = useState<FileFormat | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ title: "" });
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [saveToInbox, setSaveToInbox] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ imported: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    const fmt = ext === "json" ? "json" : "csv";
    setFormat(fmt);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (fmt === "csv") {
          const { headers: h, rawRows: r } = parseCSV(text);
          setHeaders(h);
          setRawRows(r);
          setMapping(autoMapColumns(h));
        } else {
          const jsonRows = parseJSON(text);
          // Extract headers from first row keys
          const h = jsonRows.length > 0 ? Object.keys(jsonRows[0]) : [];
          setHeaders(h);
          setRawRows(jsonRows as Record<string, any>[]);
          setMapping(autoMapColumns(h));
        }
        setStep("map");
      } catch (err: any) {
        alert(`Kunde inte l\u00e4sa filen: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }, []);

  // Handle paste
  const [pasteText, setPasteText] = useState("");

  const handlePaste = useCallback(() => {
    const text = pasteText.trim();
    if (!text) return;

    try {
      // Try JSON first
      if (text.startsWith("[") || text.startsWith("{")) {
        const jsonRows = parseJSON(text);
        const h = jsonRows.length > 0 ? Object.keys(jsonRows[0]) : [];
        setHeaders(h);
        setRawRows(jsonRows as Record<string, any>[]);
        setMapping(autoMapColumns(h));
        setFormat("json");
        setFileName("inklistrad-data.json");
      } else {
        const { headers: h, rawRows: r } = parseCSV(text);
        setHeaders(h);
        setRawRows(r);
        setMapping(autoMapColumns(h));
        setFormat("csv");
        setFileName("inklistrad-data.csv");
      }
      setStep("map");
    } catch (err: any) {
      alert(`Kunde inte tolka data: ${err.message}`);
    }
  }, [pasteText]);

  // Column mapping update
  const updateMapping = useCallback((field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value || undefined }));
  }, []);

  // Preview the import
  const preview = useCallback(() => {
    const result = transformRows(rawRows, mapping);
    setParseResult(result);
  }, [rawRows, mapping]);

  // Run the import
  const runImport = useCallback(async () => {
    if (!parseResult || parseResult.rows.length === 0) return;

    setImporting(true);
    setImportProgress(0);

    const rows = parseResult.rows.map((r) => ({
      ...r,
      is_inbox: saveToInbox,
    }));

    let totalImported = 0;
    let totalErrors = 0;

    // Send in batches
    const batches = [];
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      batches.push(rows.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i++) {
      try {
        const res = await fetch("/api/memories/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memories: batches[i] }),
        });
        const json = await res.json();
        if (json.imported) totalImported += json.imported;
        if (json.errors?.length) totalErrors += json.errors.length;
      } catch {
        totalErrors += batches[i].length;
      }
      setImportProgress(((i + 1) / batches.length) * 100);
    }

    setImportResult({ imported: totalImported, errors: totalErrors });
    setImporting(false);
    setStep("import");
  }, [parseResult, saveToInbox]);

  // Preview count
  const previewCount = parseResult?.rows.length || 0;

  // --- Step 1: Upload ---
  if (step === "upload") {
    return (
      <div className="space-y-6">
        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className="relative rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/30 bg-card hover:bg-accent/30 dark:hover:bg-accent/50 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/8 dark:bg-primary/12 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
              <Upload className="h-6 w-6 text-primary/70" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">
              Dra &amp; sl&auml;pp en fil h&auml;r
            </p>
            <p className="text-[12px] text-muted-foreground/50 mb-4">
              eller klicka f&ouml;r att v&auml;lja
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-[11px] font-medium text-muted-foreground/60 border border-border/30">
                <FileText className="h-3 w-3" />
                .csv
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-[11px] font-medium text-muted-foreground/60 border border-border/30">
                <FileJson className="h-3 w-3" />
                .json
              </span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {/* Or paste */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-[0.1em]">
            Eller klistra in data
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder='CSV (med header-rad) eller JSON (array av objekt)'
            rows={5}
            className="w-full px-4 py-3.5 rounded-xl border border-border/60 bg-card text-[13px] leading-relaxed placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 focus:shadow-[0_0_16px_rgba(245,158,11,0.06)] resize-none font-mono"
          />
          {pasteText.trim() && (
            <button
              onClick={handlePaste}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all"
            >
              <ArrowRight className="h-4 w-4" />
              Tolka data
            </button>
          )}
        </div>

        {/* Help */}
        <div className="rounded-xl border border-border/40 bg-accent/30 dark:bg-accent/50 p-5">
          <h3 className="text-[12px] font-semibold text-foreground/80 mb-2">Format som st&ouml;ds</h3>
          <div className="space-y-2 text-[12px] text-muted-foreground/60 leading-relaxed">
            <p>
              <strong>CSV:</strong> Komma- eller semikolonseparerad fil med header-rad.
              Kolumner mappas till f&auml;lt som titel, typ, inneh&aring;ll, URL, taggar.
            </p>
            <p>
              <strong>JSON:</strong> En array av objekt, t.ex.{" "}
              <code className="px-1.5 py-0.5 rounded bg-accent text-[11px] font-mono">[{`{"title": "...", "url": "..."}`}]</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 2: Map columns ---
  if (step === "map") {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => { setStep("upload"); setParseResult(null); }}
          className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Tillbaka
        </button>

        {/* File info */}
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-border/50 bg-card">
          {format === "json" ? (
            <FileJson className="h-5 w-5 text-amber-500" />
          ) : (
            <FileText className="h-5 w-5 text-emerald-500" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{fileName}</p>
            <p className="text-[11px] text-muted-foreground/50">{rawRows.length} rader hittade</p>
          </div>
          <button
            onClick={() => { setStep("upload"); setParseResult(null); }}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground/40 hover:text-foreground transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Column mapping */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/30">
            <h3 className="text-[13px] font-semibold text-foreground">Kolumnmappning</h3>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
              Mappa kolumnerna i filen till minnets f&auml;lt
            </p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {MEMORY_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-4">
                <div className="w-[140px] shrink-0">
                  <label className="text-[12px] font-medium text-foreground/70">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                </div>
                <select
                  value={(mapping[field.key] as string) || ""}
                  onChange={(e) => updateMapping(field.key, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-background text-[12px] font-medium text-foreground focus:outline-none focus:border-primary/30 transition-colors"
                >
                  <option value="">— Hoppa &ouml;ver —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Preview table */}
        {rawRows.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30">
              <h3 className="text-[13px] font-semibold text-foreground">F&ouml;rhandsvisning</h3>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                Visar de f&ouml;rsta 5 raderna
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-accent/50 dark:bg-accent/80">
                    {headers.slice(0, 6).map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border/20">
                      {headers.slice(0, 6).map((h) => (
                        <td key={h} className="px-3 py-2 text-foreground/70 max-w-[200px] truncate whitespace-nowrap">
                          {String(row[h] || "").slice(0, 60)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inbox toggle */}
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-border/50 bg-card">
          <button
            onClick={() => setSaveToInbox(!saveToInbox)}
            className={cn(
              "relative w-10 h-6 rounded-full transition-colors duration-200",
              saveToInbox ? "bg-primary" : "bg-border"
            )}
          >
            <div className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
              saveToInbox ? "left-5" : "left-1"
            )} />
          </button>
          <div>
            <p className="text-[13px] font-medium text-foreground">Spara till inkorg</p>
            <p className="text-[11px] text-muted-foreground/50">Markera alla som &quot;l&auml;s senare&quot;</p>
          </div>
        </div>

        {/* Parse results */}
        {parseResult && (
          <div className="rounded-xl border border-border/50 bg-card px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              {parseResult.errors.length > 0 ? (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              ) : (
                <Check className="h-4 w-4 text-emerald-500" />
              )}
              <p className="text-[13px] font-semibold text-foreground">
                {previewCount} minnen redo att importera
              </p>
            </div>
            {parseResult.errors.length > 0 && (
              <div className="space-y-1 mt-3">
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  {parseResult.errors.length} rader hoppades &ouml;ver:
                </p>
                {parseResult.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground/50">
                    Rad {e.row}: {e.message}
                  </p>
                ))}
                {parseResult.errors.length > 5 && (
                  <p className="text-[11px] text-muted-foreground/40">
                    ...och {parseResult.errors.length - 5} till
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              preview();
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-accent/80 dark:hover:bg-accent/60 text-[13px] font-semibold text-foreground/80 border border-border/40 transition-all"
          >
            F&ouml;rhandsgranska
          </button>
          {parseResult && previewCount > 0 && (
            <button
              onClick={runImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              Importera {previewCount} minnen
            </button>
          )}
        </div>

        {/* Progress */}
        {importing && (
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-border/40 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground/50 text-center">
              Importerar... {Math.round(importProgress)}%
            </p>
          </div>
        )}
      </div>
    );
  }

  // --- Step 3: Import result ---
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card p-8 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
          <Check className="h-7 w-7 text-emerald-500" strokeWidth={1.5} />
        </div>
        <h2 className="heading-serif text-[24px] text-foreground mb-2">
          Import klar!
        </h2>
        <p className="text-[14px] text-muted-foreground/60 leading-relaxed mb-6">
          {importResult?.imported || 0} minnen importerades framg&aring;ngsrikt
          {importResult?.errors ? `, ${importResult.errors} fel` : ""}.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/minnen"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-all"
          >
            Visa minnen
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={() => {
              setStep("upload");
              setParseResult(null);
              setImportResult(null);
              setRawRows([]);
              setHeaders([]);
              setFileName("");
              setPasteText("");
            }}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/80 dark:hover:bg-accent/60 text-[13px] font-semibold text-foreground/70 border border-border/40 transition-all"
          >
            Importera fler
          </button>
        </div>
      </div>
    </div>
  );
}
