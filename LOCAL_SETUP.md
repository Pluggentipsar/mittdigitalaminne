# Lokal Setup — macOS

Steg-för-steg för att komma igång lokalt på din Mac.

## Förutsättningar

- **Node.js 20+** — installera via [nvm](https://github.com/nvm-sh/nvm) eller [Homebrew](https://brew.sh):
  ```bash
  brew install node@20
  ```
- **Git** — redan installerat på macOS
- **Supabase-konto** — gratis på https://supabase.com

---

## 1. Klona repot

```bash
mkdir -p "/Users/parlevander/Desktop/ClaUDE CODE PROJECTS"
cd "/Users/parlevander/Desktop/ClaUDE CODE PROJECTS"
git clone https://github.com/Criterio-inc/mittdigitalaminne.git
cd mittdigitalaminne
```

## 2. Installera beroenden

```bash
cd web && npm install && cd ..
cd mcp-server && npm install && cd ..
```

## 3. Skapa Supabase-projekt

1. Gå till https://supabase.com/dashboard → **New Project**
2. Välj organisation (eller skapa en ny)
3. Projektnamn: t.ex. `mitt-digitala-minne`
4. Databaslösenord: välj ett starkt lösenord (spara det!)
5. Region: **EU West (Stockholm)** ← bäst för Sverige
6. Klicka **Create new project**

### Hämta dina nycklar

Gå till **Settings → API** i Supabase Dashboard:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## 4. Kör databasmigrationer

I Supabase Dashboard → **SQL Editor** → **New Query**, kör varje fil i ordning:

1. Öppna `supabase/migrations/001_initial_schema.sql` → klistra in → **Run**
2. Öppna `supabase/migrations/002_improved_search.sql` → klistra in → **Run**
3. Öppna `supabase/migrations/003_memory_notes.sql` → klistra in → **Run**
4. Öppna `supabase/migrations/004_new_content_types.sql` → klistra in → **Run**
5. Öppna `supabase/migrations/005_smart_spaces.sql` → klistra in → **Run**

> **Tips:** Du kan också använda Supabase CLI:
> ```bash
> npx supabase db push --db-url "postgresql://postgres:LÖSENORD@db.DITT_PROJEKT.supabase.co:5432/postgres"
> ```

## 5. Skapa storage bucket

1. Supabase Dashboard → **Storage** → **New Bucket**
2. Namn: `memory-images`
3. Public bucket: **✅ Ja**
4. Klicka **Create bucket**

## 6. Konfigurera miljövariabler

```bash
# Webb-appen
cp web/.env.example web/.env.local

# MCP-servern
cp mcp-server/.env.example mcp-server/.env
```

Redigera filerna med dina Supabase-nycklar:

```bash
# Använd din favorit-editor
code web/.env.local
code mcp-server/.env
```

## 7. Starta lokalt

```bash
# Terminal 1: Webbapp
cd web && npm run dev
# → Öppna http://localhost:3000

# Terminal 2: MCP-server (valfritt, för Claude Desktop)
cd mcp-server && npm run build && npm run dev
```

## 8. Claude Desktop-integration (valfritt)

Bygg MCP-servern:
```bash
cd mcp-server && npm run build
```

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
        "SUPABASE_URL": "https://DITT_PROJEKT.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "din-service-role-key"
      }
    }
  }
}
```

Starta om Claude Desktop — MCP-servern dyker upp under 🔧-ikonen.

---

## Felsökning

| Problem | Lösning |
|---------|---------|
| `npm run dev` kraschar | Kontrollera att `.env.local` finns och har rätt nycklar |
| Sökning hittar inget | Kontrollera att alla migrationer körts i rätt ordning |
| Bilder laddas inte | Kontrollera att `memory-images`-bucketen är public |
| Claude Desktop ser inte MCP | Kontrollera sökvägen i config och att `npm run build` körts |
| `SUPABASE_SERVICE_ROLE_KEY` error | Dubbelkolla att du kopierat **service_role** (inte anon) nyckeln |
