# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository. Subdirectory CLAUDE.md files (`src/CLAUDE.md`, `web/CLAUDE.md`) contain context scoped to those trees.

---

## Project Overview

**cloudflare-shopify-starter** — Shopify embedded app starter on Cloudflare Workers + Hono + D1 + KV + R2 + React + Polaris. Built on production-tested patterns; ships with session-token auth, KV-backed Shopify session storage, Drizzle ORM, and a minimal one-page React + Polaris frontend.

See `README.md` for setup. See `wrangler.jsonc` for which Cloudflare bindings are wired in (D1, KV, R2) and which are commented out as opt-in examples (Queues, Durable Objects, Cron).

---

## Architecture

| Layer | Technology |
|---|---|
| Worker runtime | Cloudflare Workers (Hono) |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Sessions | Cloudflare KV (`SESSION_KV`) |
| File storage | Cloudflare R2 (`R2` binding) |
| Frontend | React 18 + Vite + Shopify Polaris (SPA, `dist/` via `[assets]`) |
| Auth | Shopify session tokens (JWT) via App Bridge |

---

## Key Design Decisions

- **All IDs are `crypto.randomUUID()`** — not auto-increment.
- **Timestamps are ISO 8601 strings** stored as `text()` (no SQLite `datetime` type).
- **One table to start (`shopify_shop`)** — every additional table you add should reference it via a non-null `shopId` text FK with `onDelete: 'cascade'` (GDPR `SHOP_REDACT` pattern).

---

## Code Quality Rules

- **Secure routes by default** — all `/api/*` routes are protected by `requireShop` middleware. Making a route public is an exception and requires an explicit entry in `PUBLIC_API_PATHS` with a comment justifying it.
- **Never use raw `KV.get()` + `JSON.parse()` for sessions** — always use `KVSessionStorage.loadSession()`.
- **Fail loudly on data integrity issues** — never use `?? ''` or fallbacks to mask a missing domain, ID, or required field.
- **Never pass secrets through queue messages** — fetch tokens from KV at processing time.
