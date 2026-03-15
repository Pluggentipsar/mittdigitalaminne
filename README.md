# Mitt Digitala Minne

A personal knowledge management app where you save, organize, and search memories — thoughts, links, articles, images, YouTube videos, and social media posts. Features a web UI and an MCP server for saving memories directly via Claude AI.

**Swedish UI** · **Full-text search** · **AI-powered via MCP** · **Self-hosted**

---

## Architecture

```
mittdigitalaminne/
├── web/                    # Next.js web app (frontend + API)
├── mcp-server/             # MCP server (Claude AI integration)
├── supabase/
│   └── migrations/         # Database schema (run in order)
└── README.md
```

| Component | Tech | Deploys to |
|-----------|------|------------|
| **Web app** | Next.js 16, React 19, TailwindCSS 4, Supabase SSR | Vercel |
| **MCP server** | Node.js, @modelcontextprotocol/sdk, dual transport | Cloudflare Workers (HTTP) + local (stdio) |
| **Database** | PostgreSQL via Supabase, Swedish FTS, trigram search | Supabase |

### How it works

- **Web UI** — Browse, search, filter, create, and edit memories at `your-app.vercel.app`
- **MCP server** — Claude AI can save/search/manage memories via tool calls
  - **stdio transport** — for Claude Desktop (local)
  - **HTTP transport** — for Claude.ai via Cloudflare Workers (remote)

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Supabase](https://supabase.com/) account (free tier works)
- [Vercel](https://vercel.com/) account (free tier works) — for web deployment
- [Cloudflare](https://cloudflare.com/) account (free tier works) — for MCP deployment
- [Claude Desktop](https://claude.ai/download) or [Claude.ai](https://claude.ai) Pro — for MCP usage

---

## Setup Guide

### 1. Clone and install

```bash
git clone https://github.com/Pluggentipsar/mittdigitalaminne.git
cd mittdigitalaminne

# Install dependencies for both packages
cd web && npm install && cd ..
cd mcp-server && npm install && cd ..
```

### 2. Create Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Note your **Project URL** and **API keys** from Settings > API
3. Run the database migrations in order via the **SQL Editor**:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_improved_search.sql
supabase/migrations/003_memory_notes.sql
supabase/migrations/004_new_content_types.sql
supabase/migrations/005_smart_spaces.sql
supabase/migrations/006_inbox.sql
supabase/migrations/007_projects.sql
supabase/migrations/008_snapshots.sql
```

4. Create a **storage bucket** for images:
   - Go to Storage in the Supabase dashboard
   - Create a new bucket called `memory-images`
   - Set it to **Public**

### 3. Configure environment variables

**Web app** — create `web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_key_here           # For AI features (summarize, tags, etc.)
```

**MCP server** — create `mcp-server/.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

> You'll find these values in your Supabase project under **Settings > API**.

### 4. Run locally

```bash
# Terminal 1: Web app
cd web
npm run dev
# Opens at http://localhost:3000

# Terminal 2: MCP server (for testing)
cd mcp-server
npm run dev
```

---

## Deployment

### Deploy web app to Vercel

```bash
cd web
npx vercel --prod
```

Set these environment variables in your Vercel project settings:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `OPENAI_API_KEY` | Your OpenAI API key |

### Deploy MCP server to Cloudflare Workers

```bash
cd mcp-server
npm run build

# Set secrets (you'll be prompted for values)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put MCP_AUTH_TOKEN       # Choose a strong random token

# Deploy
npm run worker:deploy
```

Your MCP server will be available at `https://your-worker.your-subdomain.workers.dev`.

---

## Connect Claude AI

### Option A: Claude Desktop (local, stdio)

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mitt-digitala-minne": {
      "command": "node",
      "args": ["C:/path/to/mittdigitalaminne/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://YOUR_PROJECT.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
      }
    }
  }
}
```

> Build first with `cd mcp-server && npm run build`.

### Option B: Claude.ai (remote, HTTP via Cloudflare Workers)

1. Go to [claude.ai/settings/integrations](https://claude.ai/settings/integrations)
2. Add a new MCP integration:
   - **URL**: `https://your-worker.your-subdomain.workers.dev/mcp`
   - **Authentication**: Bearer token (the `MCP_AUTH_TOKEN` you set)
3. Claude.ai can now save memories, search, add notes, etc.

---

## MCP Tools

The MCP server exposes 10 tools that Claude can use:

| Tool | Description |
|------|-------------|
| `add_memory` | Save a new memory (auto-detects YouTube/LinkedIn/Instagram from URL) |
| `search_memories` | Full-text search with filters (type, tags, dates, favorites) |
| `get_memory` | Get a specific memory by ID |
| `update_memory` | Update title, summary, content, tags, favorite status |
| `delete_memory` | Delete a memory |
| `list_tags` | List all tags with usage counts |
| `get_statistics` | Dashboard statistics (counts by type, recent activity) |
| `upload_image` | Upload a base64-encoded image |
| `add_note` | Add a comment/note to a memory |
| `get_notes` | List all notes for a memory |

---

## Features

### Content Types
- **7 content types**: Thought, Link, Article, Image, YouTube, LinkedIn, Instagram
- Auto-detection of platform from pasted URLs

### Rich Previews
- **YouTube** — embedded video player with thumbnail and play button overlay
- **Instagram** — full embed of posts/reels with dynamic height via `postMessage`
- **LinkedIn** — branded text preview with platform colors
- **Articles & Links** — OG image previews with favicon and domain
- **Smart title handling** — auto-truncation of long social media titles at ~120 chars

### Search & Filtering
- **Swedish full-text search** with relevance ranking (weighted: title > summary > content)
- **Filters** — by content type, tags, project, date range, favorites, inbox status
- **Smart Spaces** — save any active filter combination as a named space in the sidebar

### Organization
- **Tags** with colors for categorization
- **Projects & collections** — group related memories with name, color, icon, deadline, and status (active/archived)
- **Inbox** — new memories land in inbox until organized
- **Favorites** — star important memories for quick access

### AI Features
- **AI summarization** — automatic summary of articles and posts
- **AI tag suggestions** — keyword extraction matched against existing tags
- **AI actions panel** — process memories with AI directly in the detail view (summarize, extract key points, translate, etc.)
- **Related memories** — automatic connections between similar memories based on shared tags

### Web Snapshots
- Save HTML snapshots of web pages for offline reading
- View snapshots in a sandboxed iframe within the app

### Export & Download
- **Download as .txt** — clean text file with title, summary, content, metadata, and tags
- **Download as .docx** — formatted Word document with typography, headings, bullet lists, and metadata
- Available from both the context menu (right-click on cards) and the detail view toolbar
- Works on mobile via long-press

### Context Menu (Desktop & Mobile)
- **Right-click** (desktop) or **long-press** (mobile, 500ms) on memory cards:
  - Toggle favorite
  - Add to project (submenu with active projects)
  - Download as .txt
  - Download as .docx
  - Open original link
  - Delete memory
- Haptic feedback on mobile (vibration API)
- Viewport-aware positioning (menu stays on screen)

### Dashboard
- Statistics overview with type distribution chart
- Recent memories list
- Resurfacing — rediscover old memories that may be relevant again

### Comment Threads
- Add notes/comments to any memory
- Threaded discussion per memory

### Design
- **"Amber Glow" theme** — warm amber accents with content-type colored card glows
- **Fonts**: Instrument Serif (headings) + DM Sans (body text)
- **Collapsible sidebar** (72px collapsed, 272px expanded) with localStorage persistence
- **Responsive** — works on desktop and mobile
- **Ambient gradient orbs** and decorative dividers
- Swedish UI throughout

---

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── api/                # API routes
│   │   │   ├── memories/       # CRUD + notes + related
│   │   │   ├── projects/       # Projects CRUD + member management
│   │   │   ├── spaces/         # Smart Spaces CRUD
│   │   │   ├── suggest-tags/   # AI tag suggestions
│   │   │   ├── resurface/      # Memory resurfacing
│   │   │   ├── unfurl/         # URL metadata + article extraction
│   │   │   ├── statistics/     # Dashboard stats
│   │   │   ├── tags/           # Tag management
│   │   │   └── upload/         # Image upload
│   │   ├── dashboard/          # Dashboard page
│   │   ├── inkorg/             # Inbox page
│   │   ├── lagg-till/          # Create memory page
│   │   ├── minnen/             # Memory list + detail + edit pages
│   │   ├── projekt/            # Project list + detail pages
│   │   └── taggar/             # Tag management page
│   ├── components/
│   │   ├── memories/           # MemoryCard, MemoryGrid, CardContextMenu, AiActionsPanel
│   │   │   └── previews/       # YouTubePreview, InstagramEmbed, SocialPreview, LinkPreview
│   │   ├── projects/           # AddToProjectDialog, ProjectCard
│   │   ├── spaces/             # SaveSpaceDialog
│   │   ├── dashboard/          # Stats, charts, recent list, resurfacing
│   │   ├── filters/            # FilterBar (type, tags, project, search, save space)
│   │   ├── layout/             # Sidebar navigation + spaces
│   │   ├── contexts/           # SidebarContext
│   │   └── ui/                 # MarkdownContent, SnapshotViewer
│   ├── hooks/                  # SWR data hooks (memories, tags, spaces, projects, suggestions)
│   └── lib/                    # Supabase clients, types, utils, export utilities, stopwords

mcp-server/
├── src/
│   ├── server.ts               # MCP server factory (shared logic)
│   ├── index.ts                # stdio entry point (Claude Desktop)
│   ├── worker.ts               # Cloudflare Workers entry (Claude.ai)
│   ├── tools/                  # Individual tool handlers
│   ├── utils/                  # URL detection, tag helpers
│   └── db/                     # Supabase client factory
├── wrangler.toml               # Cloudflare Workers config
└── tsconfig.json

supabase/
└── migrations/
    ├── 001_initial_schema.sql          # Core tables, FTS, RLS
    ├── 002_improved_search.sql         # Enhanced search with tags in FTS
    ├── 003_memory_notes.sql            # Comment/notes table
    ├── 004_new_content_types.sql       # YouTube, LinkedIn, Instagram types
    ├── 005_smart_spaces.sql            # Smart Spaces (saved filters)
    ├── 006_inbox.sql                   # Inbox flag for memories
    ├── 007_projects.sql                # Projects & memory_projects tables
    └── 008_snapshots.sql               # Snapshot HTML storage
```

---

## License

MIT
