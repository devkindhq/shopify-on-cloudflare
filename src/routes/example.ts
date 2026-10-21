import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb } from '../db/db';
import { shopifyShop } from '../db/schema';
import { currentUser } from '../lib/currentUser';
import type { AppEnv } from '../types/env.d';

export const exampleRoutes = new Hono<AppEnv>();

// GET /api/example
// The protected-route pattern end to end: `requireShop` verifies the session
// token and sets `shopId`; here we return that shop's profile. The column
// projection is deliberate: the response never exposes internal columns.
//
// `user` is whoever has the app open, beside the shop rather than inside it:
// the shop is the same for every staff member, the user is not. A failed name
// lookup returns `user: null` instead of failing the shop — it's a greeting.
exampleRoutes.get('/api/example', async (c) => {
  const db = createDb(c.env.DB);
  const shop = await db
    .select({
      name: shopifyShop.name,
      domain: shopifyShop.domain,
      myshopifyDomain: shopifyShop.myshopifyDomain,
      plan: shopifyShop.plan,
      owner: shopifyShop.shopOwner,
      email: shopifyShop.email,
      country: shopifyShop.countryName,
      currency: shopifyShop.currency,
      installedAt: shopifyShop.installDate,
      status: shopifyShop.status,
    })
    .from(shopifyShop)
    .where(eq(shopifyShop.id, c.get('shopId')))
    .get();

  if (!shop) {
    return c.json({ error: 'Shop not found' }, 404);
  }

  const user = await currentUser(c.env, c.req.header('authorization')).catch((err) => {
    console.error('[example] current user lookup failed:', err);
    return null;
  });

  return c.json({ shop, user });
});
