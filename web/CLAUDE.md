# web/ — Frontend (React + Vite + Polaris)

Context for working in this directory. Vite (with the Cloudflare plugin) builds the SPA into `dist/client/`, which is served by the Worker via the `ASSETS` binding (configured in `wrangler.jsonc`). A single `npm run dev` runs the Worker and the frontend together on one port.

---

## Commands

```bash
npm run dev             # Whole app (Vite + Worker) on http://localhost:5173
npm run build           # Production build → dist/client/ (+ Worker bundle)
npm run lint            # ESLint on web/
```

---

## Architecture

- `main.tsx` — entry, mounts `<App />` with `AppProvider` (Polaris), `QueryClientProvider`, `BrowserRouter`
- `App.tsx` — `NavMenu` + routing shell wrapped in the Bugsnag error boundary
- `Pages/Home.tsx` — example page; replace/extend as you build your app
- `api.ts` — `apiFetch<T>` helper; pass it an `authenticatedFetch` created via `useAppBridge()` + `@shopify/app-bridge/utilities`
- `bugsnag.tsx` — env-driven, no-op if `VITE_BUGSNAG_API_KEY` is unset

App Bridge is initialized via the `<script>` tag in `index.html` (`data-api-key="%VITE_SHOPIFY_CLIENT_ID%"`) — no React Provider needed.

---

## Conventions

- **Always use Polaris components** for UI — don't reach for raw HTML/CSS unless Polaris cannot express what you need.
- **Use `apiFetch` for backend calls** — it adds the session-token header so the Worker's `requireShop` middleware succeeds.
- **Loading and error states** — every async UI must show a spinner/skeleton on load and a Polaris `Banner` on error. No blank pages.
