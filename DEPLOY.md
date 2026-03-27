# SaaS Deploy — Vercel + Supabase + Cloudflare Workers

Guide för att driftsätta Mitt Digitala Minne som en fullständig SaaS-tjänst,
åtkomlig från dator, mobil och surfplatta.

---

## Arkitektur

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Mobil /    │────▶│   Vercel         │────▶│  Supabase    │
│   Desktop    │     │   (Next.js)      │     │  (PostgreSQL)│
│   Browser    │     └──────────────────┘     └──────────────┘
└─────────────┘                                      ▲
                                                     │
┌─────────────┐     ┌──────────────────┐             │
│  Claude.ai  │────▶│  Cloudflare      │─────────────┘
│  Claude     │     │  Workers (MCP)   │
│  Desktop    │     └──────────────────┘
└─────────────┘
```

---

## Förutsättningar

- ✅ Supabase-projekt redan skapat (se `LOCAL_SETUP.md`)
- ✅ Migrationer körda och bucket skapad
- ✅ Lokal test fungerar
- Konton på:
  - [Vercel](https://vercel.com) (gratis)
  - [Cloudflare](https://cloudflare.com) (gratis Workers-plan)

---

## Steg 1: Deploy webbappen till Vercel

### 1a. Via CLI (snabbast)

```bash
cd web

# Logga in (öppnar webbläsaren)
npx vercel login

# Första deploy — följ guidens frågor:
# - Set up and deploy? → Y
# - Which scope? → ditt konto
# - Link to existing project? → N
# - Project name? → mitt-digitala-minne (eller valfritt)
# - Directory? → ./
npx vercel

# Om allt fungerar — deploya till produktion:
npx vercel --prod
```

### 1b. Sätt miljövariabler

I [Vercel Dashboard](https://vercel.com/dashboard) → ditt projekt → **Settings** → **Environment Variables**:

| Variabel | Värde | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Production (⚠️ bara Production!) |

> **Viktigt:** `SUPABASE_SERVICE_ROLE_KEY` ska **enbart** sättas för Production-miljön.

### 1c. Redeploy med env-vars

```bash
cd web && npx vercel --prod
```

Din app är nu live på t.ex. `https://mitt-digitala-minne.vercel.app` 🎉

---

## Steg 2: Deploy MCP-servern till Cloudflare Workers

### 2a. Logga in på Cloudflare

```bash
cd mcp-server
npx wrangler login
```

### 2b. Sätt secrets

```bash
# Generera en stark auth-token
export MCP_TOKEN=$(openssl rand -hex 32)
echo "Spara denna token: $MCP_TOKEN"

# Sätt secrets i Cloudflare
npx wrangler secret put SUPABASE_URL
# → Klistra in: https://xxx.supabase.co

npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# → Klistra in: din service_role key

npx wrangler secret put MCP_AUTH_TOKEN
# → Klistra in: token från ovan
```

### 2c. Deploy

```bash
npm run worker:deploy
```

Du får en URL typ: `https://mitt-digitala-minne-mcp.ditt-konto.workers.dev`

### 2d. Testa

```bash
curl -H "Authorization: Bearer DIN_MCP_TOKEN" \
  https://mitt-digitala-minne-mcp.ditt-konto.workers.dev/health
```

---

## Steg 3: Koppla Claude Desktop (lokal MCP)

Redigera `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mitt-digitala-minne": {
      "command": "node",
      "args": [
        "/Users/parlevander/Desktop/ClaUDE CODE PROJECTS/mittdigitalaminne/mcp-server/dist/index.js"
      ],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "din-service-role-key"
      }
    }
  }
}
```

Starta om Claude Desktop.

---

## Steg 4: Koppla Claude.ai (remote MCP)

1. Gå till [claude.ai](https://claude.ai) → **Settings** → **MCP Servers**
2. Lägg till ny server:
   - URL: `https://mitt-digitala-minne-mcp.ditt-konto.workers.dev`
   - Authentication: Bearer token → din `MCP_AUTH_TOKEN`

---

## Steg 5: Mobilåtkomst

1. Öppna `https://mitt-digitala-minne.vercel.app` i Safari/Chrome på mobilen
2. **Safari (iOS):** Tryck dela-knappen → "Lägg till på hemskärmen"
3. **Chrome (Android):** Meny → "Lägg till på startskärmen"
4. Appen öppnas nu som en fristående webbapp!

> Appen är redan responsiv — fungerar på alla skärmstorlekar.

---

## Secrets-referens

| Secret | Tjänst | Hur det sätts |
|--------|--------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Dashboard → Environment Variables |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Dashboard → Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + Cloudflare | Vercel Dashboard + `wrangler secret put` |
| `SUPABASE_URL` | Cloudflare | `wrangler secret put` |
| `MCP_AUTH_TOKEN` | Cloudflare | `wrangler secret put` |

**Inga secrets i git!** Enbart `.env.example`-mallar (utan riktiga nycklar) versionshanteras.

---

## Kostnadsöversikt (gratis nivåer)

| Tjänst | Gratis inkluderar | Räcker för |
|--------|-------------------|------------|
| **Supabase** | 500 MB databas, 1 GB storage, 50k auth-användare | Tusentals minnen |
| **Vercel** | 100 GB bandwidth, serverless functions | Normal personlig användning |
| **Cloudflare Workers** | 100k requests/dag | All MCP-användning |

> Allt ovan ryms bekvämt inom gratisnivåerna för personligt bruk.

---

## Uppgradering & Underhåll

### Ny deploy efter kodändringar
```bash
# Webb
cd web && npx vercel --prod

# MCP
cd mcp-server && npm run worker:deploy
```

### Nya databasmigrationer
Kör nya SQL-filer i Supabase SQL Editor i nummerordning.

### Backup
Supabase Dashboard → **Database** → **Backups** (automatiska dagliga backups på betalplan).
