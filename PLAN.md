# Mitt Digitala Minne — SaaS Deployment Plan

## Mål
Driftsätta appen som SaaS (åtkomlig från Mac, mobil, surfplatta) med:
- **Webb:** Vercel (Next.js)
- **Databas:** Supabase (PostgreSQL, gratis nivå)
- **MCP-server:** Cloudflare Workers (för Claude.ai-integration)
- **Lokal dev:** Testbar på Mac innan deploy

---

## Fas 1: Förberedelser i repot (gör jag nu)

### 1.1 Skapa `web/.env.example`
Tydlig mall med alla nödvändiga env-variabler för webappen.

### 1.2 Förbättra `mcp-server/.env.example`
Säkerställ att den täcker alla variabler inklusive `MCP_AUTH_TOKEN`.

### 1.3 Skapa `LOCAL_SETUP.md`
Steg-för-steg-guide för att:
- Klona repot till `/Users/parlevander/Desktop/ClaUDE CODE PROJECTS/mittdigitalaminne`
- Installera beroenden
- Skapa Supabase-projekt
- Köra migrationer
- Konfigurera env-filer
- Starta lokalt

### 1.4 Skapa `DEPLOY.md`
Detaljerad SaaS-deploy-guide:
- Vercel-deploy med env-vars
- Cloudflare Workers-deploy med secrets
- Claude Desktop + Claude.ai konfiguration
- Mobilåtkomst via Vercel-URL

### 1.5 Säkerställ `.gitignore`
Kontrollera att alla secrets-filer exkluderas korrekt.

---

## Fas 2: Lokal setup (du gör på din Mac)

### 2.1 Klona repot
```bash
mkdir -p "/Users/parlevander/Desktop/ClaUDE CODE PROJECTS"
cd "/Users/parlevander/Desktop/ClaUDE CODE PROJECTS"
git clone https://github.com/Criterio-inc/mittdigitalaminne.git
cd mittdigitalaminne
```

### 2.2 Installera beroenden
```bash
cd web && npm install && cd ..
cd mcp-server && npm install && cd ..
```

### 2.3 Skapa Supabase-projekt
1. Gå till https://supabase.com → New Project
2. Välj region **EU West (Stockholm)** för bäst latens
3. Notera: `Project URL`, `anon key`, `service_role key`

### 2.4 Kör databasmigrationer
I Supabase Dashboard → SQL Editor, kör i ordning:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_improved_search.sql`
3. `supabase/migrations/003_memory_notes.sql`
4. `supabase/migrations/004_new_content_types.sql`
5. `supabase/migrations/005_smart_spaces.sql`

### 2.5 Skapa storage bucket
Supabase Dashboard → Storage → New Bucket:
- Namn: `memory-images`
- Public: ✅

### 2.6 Konfigurera secrets lokalt
```bash
# Kopiera env-mallar
cp web/.env.example web/.env.local
cp mcp-server/.env.example mcp-server/.env

# Redigera med dina Supabase-nycklar
```

### 2.7 Testa lokalt
```bash
# Terminal 1: Webbapp
cd web && npm run dev
# → http://localhost:3000

# Terminal 2: MCP-server
cd mcp-server && npm run dev
```

---

## Fas 3: SaaS-deploy

### 3.1 Vercel (webbapp)
```bash
cd web
npx vercel login
npx vercel --prod
```
Sätt env-vars i Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

→ Du får en URL typ `mittdigitalaminne.vercel.app` — funkar direkt på mobilen!

### 3.2 Cloudflare Workers (MCP-server)
```bash
cd mcp-server
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put MCP_AUTH_TOKEN    # generera: openssl rand -hex 32
npm run worker:deploy
```

### 3.3 Claude Desktop (lokal MCP)
Lägg till i `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "mitt-digitala-minne": {
      "command": "node",
      "args": ["/Users/parlevander/Desktop/ClaUDE CODE PROJECTS/mittdigitalaminne/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "din-supabase-url",
        "SUPABASE_SERVICE_ROLE_KEY": "din-service-role-key"
      }
    }
  }
}
```

### 3.4 Claude.ai (remote MCP via Cloudflare)
Koppla via Claude.ai → Settings → MCP Servers → Lägg till din Workers-URL.

---

## Fas 4: Mobilåtkomst

När Vercel-deployen är klar:
1. Öppna `https://ditt-projekt.vercel.app` i Safari/Chrome på mobilen
2. Lägg till på hemskärmen (PWA-liknande)
3. Appen är responsiv och fungerar direkt

---

## Secrets-hantering (sammanfattning)

| Secret | Var | Hur |
|--------|-----|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel env vars | Vercel Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env vars | Vercel Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + Cloudflare | Vercel Dashboard + `wrangler secret put` |
| `SUPABASE_URL` | Cloudflare Workers | `wrangler secret put` |
| `MCP_AUTH_TOKEN` | Cloudflare Workers | `wrangler secret put` (generera med `openssl rand -hex 32`) |

**Aldrig i git!** Alla `.env*`-filer är i `.gitignore`. Enbart `.env.example`-mallar (utan riktiga nycklar) committas.

---

## Ordning att genomföra

1. ✅ Jag förbereder repot (fas 1) och pushar till GitHub
2. 🔲 Du klonar till din Mac (fas 2.1-2.2)
3. 🔲 Du skapar Supabase-projekt (fas 2.3-2.5)
4. 🔲 Du konfigurerar env-filer och testar lokalt (fas 2.6-2.7)
5. 🔲 Du deployar till Vercel + Cloudflare (fas 3)
6. 🔲 Du kopplar Claude Desktop + Claude.ai (fas 3.3-3.4)
7. 🔲 Mobilåtkomst klar! (fas 4)
