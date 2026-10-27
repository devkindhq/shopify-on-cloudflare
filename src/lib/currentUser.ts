import { RequestedTokenType } from '@shopify/shopify-api';
import { createShopify } from '../shopify';
import type { Env } from '../types/env';

/** The staff member who has the app open. Full name only — no email is kept. */
export type CurrentUser = {
  id: string;
  name: string | null;
};

// Long enough that the online-token exchange runs about once a month per person,
// short enough that a renamed staff member, or an uninstalled shop, ages out.
const TTL_SECONDS = 30 * 24 * 60 * 60;

// `:` keeps these keys apart from KVSessionStorage's `offline_…` / `{shop}_{user}` ids.
// If you add a GDPR `shop/redact` handler, delete every key under `staff:{shop}:` there.
const kvKey = (shopDomain: string, userId: string) =>
  `staff:${shopDomain}:${userId}`;

/**
 * Who is using the app, from the session token's `sub` claim.
 *
 * `sub` is only a user ID, so the name comes from an online-token exchange,
 * which returns the user alongside the token. That runs once per person per
 * shop; the name is then cached in KV and the online token itself is dropped —
 * the app keeps using its offline token for every Admin call.
 *
 * Returns null when there's no session token (the local-dev header fallback).
 * Throws on a Shopify failure; the caller decides whether that matters.
 */
export async function currentUser(
  env: Env,
  authorization: string | undefined,
): Promise<CurrentUser | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);

  const shopify = createShopify(env);
  const payload = await shopify.session.decodeSessionToken(token);
  if (!payload.sub) return null;
  const shopDomain = new URL(payload.dest).hostname;

  // Not a session, so KVSessionStorage doesn't apply — this is a plain cached profile.
  const key = kvKey(shopDomain, payload.sub);
  const cached = await env.SESSION_KV.get<CurrentUser>(key, 'json');
  if (cached) return cached;

  const { session } = await shopify.auth.tokenExchange({
    shop: shopDomain,
    sessionToken: token,
    requestedTokenType: RequestedTokenType.OnlineAccessToken,
  });
  const associated = session.onlineAccessInfo?.associated_user;
  if (!associated)
    throw new Error(
      `Online token exchange for ${shopDomain} returned no associated user`,
    );

  const user: CurrentUser = {
    id: payload.sub,
    name: [associated.first_name, associated.last_name].filter(Boolean).join(' ') || null,
  };
  await env.SESSION_KV.put(key, JSON.stringify(user), {
    expirationTtl: TTL_SECONDS,
  });
  return user;
}
