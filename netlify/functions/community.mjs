import { getStore } from '@netlify/blobs';

// GET /api/community : products the owner approved from user photos. Public, cached briefly.
export default async () => {
  const s = getStore({ name: 'community-products', consistency: 'strong' });
  const { blobs } = await s.list();
  const items = (await Promise.all(blobs.slice(0, 2000).map((b) => s.get(b.key, { type: 'json' }).catch(() => null)))).filter(Boolean);
  return Response.json({ ok: true, items }, { headers: { 'Cache-Control': 'public, max-age=300' } });
};

export const config = { path: '/api/community', method: ['GET'] };
