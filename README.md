# cloudflare-shopify-starter

A working Shopify embedded app starter on Cloudflare Workers.

**Stack:** Cloudflare Workers (Hono) · D1 + Drizzle · KV (sessions) · R2 (files) · React 18 + Vite · Shopify Polaris + App Bridge.

What's wired up out of the box:
- Shopify OAuth + session-token auth (all `/api/*` routes are protected by middleware)
- KV-backed Shopify session storage
- D1 + Drizzle with a single `shopify_shop` table to extend
- Install / uninstall lifecycle, including `app/uninstalled` webhook
- One example protected API route (`GET /api/example`) and one Polaris page that fetches it

What's commented out as opt-in (in `wrangler.toml`): Cloudflare Queues, Durable Objects, Cron triggers.

---

## Prerequisites

- Node 20+
- A Cloudflare account (free tier is fine)
- A Shopify Partner account + a development app

---

## One-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Cloudflare resources

```bash
# Database
wrangler d1 create cloudflare-shopify-starter-db
# → copy the returned database_id into wrangler.toml

# KV namespace for Shopify sessions
wrangler kv:namespace create SESSION_KV
# → copy the returned id into wrangler.toml

# R2 bucket for file storage
wrangler r2 bucket create cloudflare-shopify-starter-files

# Account id (also goes into wrangler.toml)
wrangler whoami
```

Open `wrangler.toml` and replace every `<replace-me-*>` placeholder with the values above.

### 3. Set Shopify secrets

In the Shopify Partner dashboard, create an app and copy its client ID and secret.

```bash
npx wrangler secret put SHOPIFY_CLIENT_ID
npx wrangler secret put SHOPIFY_API_SECRET
npx wrangler secret put HOST           # bare hostname, no protocol, e.g. cloudflare-shopify-starter.<you>.workers.dev
```

Copy `.env.example` to `.env` and fill in `VITE_SHOPIFY_CLIENT_ID` (the public client ID).

### 4. Apply migrations

```bash
npm run d1:migrate            # remote
npm run d1:migrate:local      # local (for `wrangler dev`)
```

---

## Run locally

```bash
npm run dev
```

The Worker runs at http://localhost:8787 with D1, KV, R2 bound locally.

Seed a test shop and hit the example endpoint:

```bash
wrangler d1 execute cloudflare-shopify-starter-db --local --command "
  INSERT OR IGNORE INTO shopify_shop (id, myshopify_domain, domain, name, status, install_date)
  VALUES ('test-shop-id', 'mystore.myshopify.com', 'mystore.myshopify.com', 'Test Store', 'installed', datetime('now'));
"

curl http://localhost:8787/api/example -H "x-shop-domain: mystore.myshopify.com"
# → {"shopId":"test-shop-id","now":"2026-..."}
```

---

## Deploy

```bash
npm run build:frontend && npm run deploy
```

---

## What's next

- Add tables: edit `src/db/schema.ts`, run `npm run d1:generate`, then `npm run d1:migrate`. New tables should have a non-null `shopId` FK to `shopify_shop` with `onDelete: 'cascade'` (GDPR `SHOP_REDACT` pattern).
- Add routes: drop a new file in `src/routes/`, export a Hono router, wire it in `src/index.ts`. `/api/*` paths are auth-guarded automatically.
- Add background jobs: uncomment the queues / durable-objects / cron blocks in `wrangler.toml` and add the matching `queue` / `scheduled` export to `src/index.ts`.
- Add a webhook topic: extend `TOPICS` in `src/lifecycle/webhooks.ts` and dispatch it in the handler.
