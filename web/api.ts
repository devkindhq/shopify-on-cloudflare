/**
 * Minimal API helper for the starter.
 *
 * Usage (App Bridge 4 — do NOT use the v3 `authenticatedFetch` utility, it
 * calls app.subscribe() which doesn't exist on the v4 useAppBridge() object):
 *   import { useAppBridge } from '@shopify/app-bridge-react';
 *   import { apiFetch, type AuthenticatedFetch } from './api';
 *
 *   const shopify = useAppBridge();
 *   const fetcher: AuthenticatedFetch = async (uri, options) => {
 *     const token = await shopify.idToken();
 *     return fetch(uri, {
 *       ...options,
 *       headers: { ...(options?.headers ?? {}), Authorization: `Bearer ${token}` },
 *     });
 *   };
 *   const data = await apiFetch<ExampleResponse>(fetcher, '/api/example');
 *
 * The session token (JWT) is verified by the Worker's `requireShop` middleware.
 */
export type AuthenticatedFetch = (
  uri: string,
  options?: RequestInit,
) => Promise<Response>;

export async function apiFetch<T = unknown>(
  authenticatedFetch: AuthenticatedFetch,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...(init.headers ?? {}) };
  const res = await authenticatedFetch(path, { ...init, headers });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
