# src/ — Backend (Cloudflare Worker)

Context for working in this directory. The Worker is a single Hono application exposed via the default `fetch` export. See root `CLAUDE.md` for project-wide rules.

---

## Commands

```bash
npm run dev                                         # Whole app (Vite + Worker) on http://localhost:5173
npm test                                            # Vitest
npm run test:e2e                                    # Playwright e2e smoke tests
npm run d1:generate                                 # Regenerate migration from schema changes
npm run d1:migrate                                  # Apply migrations to D1 (remote)
npm run d1:migrate:local                            # Apply migrations to D1 (local)
npm run deploy                                      # Build frontend + Worker, then deploy
```

### Secrets

```bash
npx wrangler secret put SHOPIFY_CLIENT_ID
npx wrangler secret put SHOPIFY_API_SECRET
npx wrangler secret put HOST
```

---

## Worker Entry (`src/index.ts`)

Single `fetch` export — all Hono routes. To add Queues, Durable Objects, or cron triggers, uncomment the matching block in `wrangler.jsonc` and add the corresponding export to `src/index.ts` (`queue`, `scheduled`).

---

## Request Auth

All `/api/*` routes are guarded by `src/middleware/requireShop.ts`. Route handlers access the shop via `c.get('shopId')`. Never call `getCurrentShopId()` directly.

To make a route public, add it to `PUBLIC_API_PATHS` in `requireShop.ts` with a comment.

---

## Database

- `src/db/schema.ts` — Drizzle tables (starter ships only `shopify_shop`)
- `src/db/db.ts` — `createDb(d1)` factory; `setDb()` called per-request in middleware
- Use Drizzle ORM — never raw SQL strings outside migrations

---

## Local Testing

```bash
# Apply migrations
wrangler d1 migrations apply cloudflare-shopify-starter-db --local

# Insert a test shop
wrangler d1 execute cloudflare-shopify-starter-db --local --command "
  INSERT OR IGNORE INTO shopify_shop (id, myshopify_domain, domain, name, status, install_date)
  VALUES ('test-shop-id', 'mystore.myshopify.com', 'mystore.myshopify.com', 'Test Store', 'installed', datetime('now'));
"

# Hit the example endpoint (header-fallback auth in local dev)
curl http://localhost:8787/api/example -H "x-shop-domain: mystore.myshopify.com"
```
