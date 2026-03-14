"use client";

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Packer,
  type IRunOptions,
} from "docx";
import type { Memory } from "@/lib/types";

// ─── Shared helpers ───

function sanitizeFilename(title: string): string {
  return title
    .slice(0, 60)
    .replace(/[^a-zA-ZåäöÅÄÖéèêëÉÈÊË0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Text export (.txt) ───

export function buildTextContent(memory: Memory): string {
  const parts: string[] = [];

  parts.push(memory.title);
  parts.push("═".repeat(Math.min(memory.title.length, 60)));
  parts.push("");

  if (memory.link_url) {
    parts.push(`Länk: ${memory.link_url}`);
    parts.push("");
  }

  if (memory.summary) {
    parts.push("── Sammanfattning ──");
    parts.push("");
    parts.push(memory.summary);
    parts.push("");
  }

  if (memory.original_content) {
    parts.push("── Innehåll ──");
    parts.push("");
    parts.push(memory.original_content);
    parts.push("");
  }

  parts.push("─".repeat(40));
  parts.push(`Sparad: ${formatDate(memory.created_at)}`);
  parts.push(`Typ: ${memory.content_type}`);
  parts.push(`Källa: ${memory.source}`);

  if (memory.tags?.length) {
    parts.push(`Taggar: ${memory.tags.map((t) => t.name).join(", ")}`);
  }

  return parts.join("\n");
}

export function downloadAsText(memory: Memory): void {
  const text = buildTextContent(memory);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${sanitizeFilename(memory.title)}.txt`);
}

// ─── DOCX export ───

export async function downloadAsDocx(memory: Memory): Promise<void> {
  const sections: Paragraph[] = [];

  // Title
  sections.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: memory.title,
          bold: true,
          size: 48,
          font: "Georgia",
        }),
      ],
    })
  );

  // Metadata line
  const metaParts: string[] = [];
  metaParts.push(formatDate(memory.created_at));
  metaParts.push(`Typ: ${memory.content_type}`);
  metaParts.push(`Källa: ${memory.source}`);
  if (memory.tags?.length) {
    metaParts.push(`Taggar: ${memory.tags.map((t) => t.name).join(", ")}`);
  }

  sections.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: metaParts.join("  ·  "),
          size: 18,
          color: "888888",
          font: "Calibri",
        }),
      ],
    })
  );

  // Link
  if (memory.link_url) {
    sections.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: "Länk: ",
            bold: true,
            size: 20,
            font: "Calibri",
          }),
          new TextRun({
            text: memory.link_url,
            size: 20,
            color: "2563EB",
            font: "Calibri",
          }),
        ],
      })
    );
  }

  // Divider
  sections.push(
    new Paragraph({
      spacing: { before: 100, after: 100 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "DDDDDD",
          space: 1,
        },
      },
      children: [],
    })
  );

  // Summary section
  if (memory.summary) {
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: "Sammanfattning",
            bold: true,
            size: 26,
            font: "Georgia",
            color: "374151",
          }),
        ],
      })
    );

    // Split summary into paragraphs
    for (const para of memory.summary.split(/\n\n+/)) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      sections.push(
        new Paragraph({
          spacing: { after: 160 },
          children: parseMarkdownRuns(trimmed),
        })
      );
    }
  }

  // Original content section
  if (memory.original_content) {
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
        children: [
          new TextRun({
            text: "Innehåll",
            bold: true,
            size: 26,
            font: "Georgia",
            color: "374151",
          }),
        ],
      })
    );

    for (const para of memory.original_content.split(/\n\n+/)) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Check if it's a markdown heading
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        sections.push(
          new Paragraph({
            heading:
              level === 1
                ? HeadingLevel.HEADING_2
                : level === 2
                ? HeadingLevel.HEADING_3
                : HeadingLevel.HEADING_4,
            spacing: { before: 240, after: 80 },
            children: [
              new TextRun({
                text: headingMatch[2],
                bold: true,
                size: level === 1 ? 28 : level === 2 ? 24 : 22,
                font: "Georgia",
              }),
            ],
          })
        );
        continue;
      }

      // Check if it's a bullet list item
      const bulletMatch = trimmed.match(/^[-•*]\s+(.*)/);
      if (bulletMatch) {
        sections.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: parseMarkdownRuns(bulletMatch[1]),
          })
        );
        continue;
      }

      sections.push(
        new Paragraph({
          spacing: { after: 160 },
          children: parseMarkdownRuns(trimmed),
        })
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: 22,
            font: "Calibri",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${sanitizeFilename(memory.title)}.docx`);
}

// ─── Markdown → TextRun parser (basic bold/italic) ───

function parseMarkdownRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Handle **bold**, *italic*, and plain text
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // **bold**
      runs.push(
        new TextRun({
          text: match[2],
          bold: true,
          size: 22,
          font: "Calibri",
        })
      );
    } else if (match[3]) {
      // *italic*
      runs.push(
        new TextRun({
          text: match[3],
          italics: true,
          size: 22,
          font: "Calibri",
        })
      );
    } else if (match[4]) {
      // plain
      runs.push(
        new TextRun({
          text: match[4],
          size: 22,
          font: "Calibri",
        })
      );
    }
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text, size: 22, font: "Calibri" }));
  }

  return runs;
}

// ─── Download trigger ───

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
