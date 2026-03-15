import type { ContentType } from "./types";

export interface ImportRow {
  title: string;
  content_type: ContentType;
  original_content?: string | null;
  summary?: string | null;
  link_url?: string | null;
  image_url?: string | null;
  tags?: string[];
  is_inbox?: boolean;
}

export interface ParseResult {
  rows: ImportRow[];
  errors: { row: number; message: string }[];
  headers?: string[];
}

const VALID_TYPES = new Set<string>([
  "image", "link", "article", "thought", "youtube", "linkedin", "instagram", "twitter",
]);

function detectContentType(row: Record<string, string>): ContentType {
  const url = row.link_url || row.url || "";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url) return "link";
  if (row.image_url) return "image";
  return "thought";
}

// --- CSV Parser ---

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === "," || ch === ";") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCSV(text: string): { headers: string[]; rawRows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rawRows: [] };

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rawRows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] || "";
    });
    rawRows.push(row);
  }

  return { headers, rawRows };
}

// --- JSON Parser ---

export function parseJSON(text: string): Record<string, unknown>[] {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    // Support { memories: [...] } or { data: [...] } wrapper
    if (Array.isArray(parsed.memories)) return parsed.memories;
    if (Array.isArray(parsed.data)) return parsed.data;
    // Single object
    return [parsed];
  }
  throw new Error("Ogiltig JSON-struktur. Förväntar en array eller { memories: [...] }");
}

// --- Column Mapping ---

export interface ColumnMapping {
  title: string;
  content_type?: string;
  original_content?: string;
  summary?: string;
  link_url?: string;
  image_url?: string;
  tags?: string;
}

const DEFAULT_MAPPINGS: Record<string, keyof ColumnMapping> = {
  title: "title",
  titel: "title",
  name: "title",
  namn: "title",
  rubrik: "title",
  content_type: "content_type",
  typ: "content_type",
  type: "content_type",
  content: "original_content",
  original_content: "original_content",
  text: "original_content",
  innehåll: "original_content",
  summary: "summary",
  sammanfattning: "summary",
  description: "summary",
  beskrivning: "summary",
  url: "link_url",
  link: "link_url",
  link_url: "link_url",
  länk: "link_url",
  image_url: "image_url",
  image: "image_url",
  bild: "image_url",
  tags: "tags",
  taggar: "tags",
  tag: "tags",
  etiketter: "tags",
};

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: Partial<ColumnMapping> = {};
  for (const header of headers) {
    const key = header.toLowerCase().trim();
    if (DEFAULT_MAPPINGS[key] && !mapping[DEFAULT_MAPPINGS[key]]) {
      (mapping as any)[DEFAULT_MAPPINGS[key]] = header;
    }
  }
  return { title: mapping.title || headers[0] || "", ...mapping };
}

// --- Transform ---

export function transformRows(
  rawRows: Record<string, any>[],
  mapping: ColumnMapping
): ParseResult {
  const rows: ImportRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const title = String(raw[mapping.title] || "").trim();

    if (!title) {
      errors.push({ row: i + 1, message: "Titel saknas" });
      continue;
    }

    let contentType: ContentType = "thought";
    if (mapping.content_type && raw[mapping.content_type]) {
      const ct = String(raw[mapping.content_type]).toLowerCase().trim();
      if (VALID_TYPES.has(ct)) {
        contentType = ct as ContentType;
      }
    } else {
      contentType = detectContentType(raw);
    }

    let tags: string[] = [];
    if (mapping.tags && raw[mapping.tags]) {
      const tagVal = raw[mapping.tags];
      if (Array.isArray(tagVal)) {
        tags = tagVal.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean);
      } else {
        tags = String(tagVal).split(/[,;]/).map((t) => t.trim().toLowerCase()).filter(Boolean);
      }
    }

    rows.push({
      title,
      content_type: contentType,
      original_content: mapping.original_content ? String(raw[mapping.original_content] || "").trim() || null : null,
      summary: mapping.summary ? String(raw[mapping.summary] || "").trim() || null : null,
      link_url: mapping.link_url ? String(raw[mapping.link_url] || "").trim() || null : null,
      image_url: mapping.image_url ? String(raw[mapping.image_url] || "").trim() || null : null,
      tags,
      is_inbox: false,
    });
  }

  return { rows, errors };
}
