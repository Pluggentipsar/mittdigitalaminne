import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SupabaseClient } from "./db/supabase.js";

import { handleAddMemory } from "./tools/add-memory.js";
import { handleSearchMemories } from "./tools/search-memories.js";
import { handleGetMemory } from "./tools/get-memory.js";
import { handleUpdateMemory } from "./tools/update-memory.js";
import { handleDeleteMemory } from "./tools/delete-memory.js";
import { handleListTags } from "./tools/list-tags.js";
import { handleUploadImage } from "./tools/upload-image.js";
import { handleGetStatistics } from "./tools/get-statistics.js";
import { handleAddNote } from "./tools/add-note.js";
import { handleGetNotes } from "./tools/get-notes.js";

export function createServer(supabase: SupabaseClient): McpServer {
  const server = new McpServer({
    name: "mitt-digitala-minne",
    version: "1.0.0",
  });

  server.tool(
    "add_memory",
    "Add a new memory to the digital memory bank. Use markdown formatting in the summary for better readability (headings, bullet points, bold). Always provide a summary. YouTube/LinkedIn/Instagram/Twitter URLs are auto-detected from link_url — use content_type 'youtube' for YouTube videos, 'linkedin' for LinkedIn posts, 'instagram' for Instagram posts, 'twitter' for X/Twitter posts. YouTube metadata (title, channel, thumbnail) is fetched automatically.",
    {
      content_type: z.enum(["image", "link", "article", "thought", "youtube", "linkedin", "instagram", "twitter"]).describe("Use 'youtube' for YouTube links, 'linkedin' for LinkedIn, 'instagram' for Instagram, 'twitter' for X/Twitter. Auto-detected from URL if set to 'link'."),
      title: z.string().describe("A concise, descriptive title for the memory"),
      original_content: z.string().optional().describe("The raw content: full text for thoughts/articles"),
      summary: z.string().describe("A summary of the content (2-4 sentences). Use markdown for formatting."),
      link_url: z.string().optional().describe("URL — required for link, youtube, linkedin, instagram types"),
      image_url: z.string().optional().describe("Public URL of an uploaded image"),
      tags: z.array(z.string()).optional().describe("Tags to associate with this memory"),
    },
    async (args) => handleAddMemory(supabase, args)
  );

  server.tool(
    "search_memories",
    "Search through saved memories using full-text search, filters by content type, tags, date range, or favorites.",
    {
      query: z.string().optional().describe("Free-text search query"),
      content_type: z.enum(["image", "link", "article", "thought", "youtube", "linkedin", "instagram", "twitter"]).optional().describe("Filter by content type"),
      tags: z.array(z.string()).optional().describe("Filter by tags (AND logic)"),
      date_from: z.string().optional().describe("ISO 8601 date for start of range"),
      date_to: z.string().optional().describe("ISO 8601 date for end of range"),
      favorites_only: z.boolean().optional().describe("Only return favorited memories"),
      inbox: z.boolean().optional().describe("Filter by inbox status: true = only inbox items, false = only processed items, omit = all"),
      limit: z.number().optional().describe("Max results (default 20)"),
      offset: z.number().optional().describe("Offset for pagination"),
    },
    async (args) => handleSearchMemories(supabase, args)
  );

  server.tool(
    "get_memory",
    "Get full details of a specific memory by its ID, including all tags.",
    {
      id: z.string().describe("UUID of the memory to retrieve"),
    },
    async (args) => handleGetMemory(supabase, args)
  );

  server.tool(
    "update_memory",
    "Update an existing memory. Only provided fields are changed.",
    {
      id: z.string().describe("UUID of the memory to update"),
      title: z.string().optional(),
      summary: z.string().optional(),
      original_content: z.string().optional(),
      tags: z.array(z.string()).optional().describe("Replaces all existing tags"),
      is_favorite: z.boolean().optional(),
    },
    async (args) => handleUpdateMemory(supabase, args)
  );

  server.tool(
    "delete_memory",
    "Permanently delete a memory and its associated image from storage.",
    {
      id: z.string().describe("UUID of the memory to delete"),
    },
    async (args) => handleDeleteMemory(supabase, args)
  );

  server.tool(
    "list_tags",
    "List all tags with the count of memories associated with each tag.",
    {},
    async () => handleListTags(supabase)
  );

  server.tool(
    "upload_image",
    "Upload a base64-encoded image to storage. Returns the public URL for use with add_memory.",
    {
      filename: z.string().describe("Desired filename (e.g. 'photo.jpg')"),
      base64_data: z.string().describe("Base64-encoded image data (without data URI prefix)"),
      content_type_mime: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]).describe("MIME type"),
    },
    async (args) => handleUploadImage(supabase, args)
  );

  server.tool(
    "get_statistics",
    "Get statistics about the memory bank: total count, count per type, most used tags, recent activity.",
    {},
    async () => handleGetStatistics(supabase)
  );

  server.tool(
    "add_note",
    "Add a note/comment to a specific memory. Use this for annotations, follow-up thoughts, or additional context.",
    {
      memory_id: z.string().describe("UUID of the memory to add a note to"),
      content: z.string().describe("The note content (supports markdown)"),
    },
    async (args) => handleAddNote(supabase, args)
  );

  server.tool(
    "get_notes",
    "Get all notes/comments for a specific memory, ordered chronologically.",
    {
      memory_id: z.string().describe("UUID of the memory to get notes for"),
    },
    async (args) => handleGetNotes(supabase, args)
  );

  return server;
}
