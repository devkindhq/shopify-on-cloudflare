import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../types/env';

vi.mock('../shopify', () => ({ createShopify: vi.fn() }));

import { createShopify } from '../shopify';
import { currentUser } from './currentUser';

const payload = { dest: 'https://my-shop.myshopify.com', sub: '84213' };
const associated = { id: 84213, first_name: 'Jane', last_name: 'Smith', email: 'jane@x.com' };

let decodeSessionToken: ReturnType<typeof vi.fn>;
let tokenExchange: ReturnType<typeof vi.fn>;
let kv: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

const env = () => ({ SESSION_KV: kv } as unknown as Env);

beforeEach(() => {
  vi.clearAllMocks();
  decodeSessionToken = vi.fn().mockResolvedValue(payload);
  tokenExchange = vi.fn().mockResolvedValue({ session: { onlineAccessInfo: { associated_user: associated } } });
  vi.mocked(createShopify).mockReturnValue({
    session: { decodeSessionToken },
    auth: { tokenExchange },
  } as never);
  kv = { get: vi.fn().mockResolvedValue(null), put: vi.fn().mockResolvedValue(undefined) };
});

describe('currentUser', () => {
  it('returns null without a session token (local-dev header fallback)', async () => {
    expect(await currentUser(env(), undefined)).toBeNull();
    expect(decodeSessionToken).not.toHaveBeenCalled();
  });

  it('exchanges for an online token once and caches the name, not the email', async () => {
    const user = await currentUser(env(), 'Bearer jwt');

    expect(user).toEqual({ id: '84213', name: 'Jane Smith' });
    expect(tokenExchange).toHaveBeenCalledWith(expect.objectContaining({
      shop: 'my-shop.myshopify.com', sessionToken: 'jwt', requestedTokenType: 'urn:shopify:params:oauth:token-type:online-access-token',
    }));
    const [key, value, opts] = kv.put.mock.calls[0];
    expect(key).toBe('staff:my-shop.myshopify.com:84213');
    expect(JSON.parse(value)).toEqual(user);
    expect(opts.expirationTtl).toBeGreaterThan(0);
  });

  it('reads a cached user without calling Shopify', async () => {
    const cached = { id: '84213', name: 'Jane Smith' };
    kv.get.mockResolvedValue(cached);

    expect(await currentUser(env(), 'Bearer jwt')).toEqual(cached);
    expect(tokenExchange).not.toHaveBeenCalled();
  });

  it('uses whichever name parts Shopify has, and null when it has none', async () => {
    tokenExchange.mockResolvedValueOnce({ session: { onlineAccessInfo: { associated_user: { ...associated, last_name: '' } } } });
    expect((await currentUser(env(), 'Bearer jwt'))?.name).toBe('Jane');

    tokenExchange.mockResolvedValueOnce({ session: { onlineAccessInfo: { associated_user: { ...associated, first_name: '', last_name: '' } } } });
    expect((await currentUser(env(), 'Bearer jwt'))?.name).toBeNull();
  });

  it('throws when the exchange returns no user, so nothing wrong is cached', async () => {
    tokenExchange.mockResolvedValue({ session: {} });

    await expect(currentUser(env(), 'Bearer jwt')).rejects.toThrow(/no associated user/);
    expect(kv.put).not.toHaveBeenCalled();
  });
});
