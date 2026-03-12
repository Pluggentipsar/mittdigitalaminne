#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createSupabaseClient } from "./db/supabase.js";
import { createServer } from "./server.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  process.exit(1);
}

const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
const server = createServer(supabase);
const transport = new StdioServerTransport();
await server.connect(transport);
