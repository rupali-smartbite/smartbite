import { json, clean } from '../lib/off.mjs';
import { sameSite, deny } from '../lib/guard.mjs';
import { store, stamp, rand, visitorId, allKeys, postedToday, readMany, average } from '../lib/reviews.mjs';

// Reviews of food products.
// GET  /api/product-reviews?key=bc:8901491502030 -> { count, avg, reviews }
// GET  /api/product-reviews?feed=1               -> { reviews (latest 40), top (most reviewed) }
// POST /api/product-reviews { key, product_name, brand, img, name, rating, comment }
const safeKey = (k) => clean(k, 80).replace(/[^A-Za-z0-9:._-]/g, '');

export default async (req, context) => {
  const st = store('product-reviews');
  const url = new URL(req.url);

  if (req.method === 'GET') {
    if (url.searchParams.get('feed')) {
      const keys = await allKeys(st);
      const reviews = (await readMany(st, keys.slice(0, 40))).map((r) => ({ ...r, product_key: r.product_key }));
      const groups = new Map();
      for (const k of keys) { const g = groups.get(k.prefix) || []; g.push(k); groups.set(k.prefix, g); }
      const ranked = [...groups.values()].sort((a, b) => b.length - a.length || average(b) - average(a)).slice(0, 10);
      const top = (await Promise.all(ranked.map(async (g) => {
        const [first] = await readMany(st, [g[0]]);
        return first ? { product_key: g[0].prefix, product_name: first.product_name, brand: first.brand, img: first.img, n: g.length, avg: average(g) } : null;
      }))).filter(Boolean);
      return json({ ok: true, reviews, top });
    }
    const key = safeKey(url.searchParams.get('key'));
    if (!key) return json({ ok: false, error: 'key required' }, 400);
    const keys = await allKeys(st, key + '/');
    const reviews = await readMany(st, keys.slice(0, 30));
    return json({ ok: true, count: keys.length, avg: average(keys), reviews });
  }

  if (!sameSite(req)) return deny(403, 'Please use the SmartBite app.');
  let b = {};
  try { b = await req.json(); } catch {}
  const key = safeKey(b.key), name = clean(b.name, 40), comment = clean(b.comment, 500);
  const rating = Math.round(Number(b.rating));
  if (!key || !name || comment.length < 3 || !(rating >= 1 && rating <= 5)) return json({ ok: false, error: 'Add your name, a star rating and a short review.' }, 400);
  const imgIn = String(b.img || '');
  const img = /^https:\/\/images\.openfoodfacts\.org\//.test(imgIn) || /^https:\/\/images\.unsplash\.com\//.test(imgIn) ? imgIn.slice(0, 300) : null;

  const visitor = await visitorId(context, req);
  if (postedToday(await allKeys(st), visitor) >= 10) return json({ ok: false, error: 'You have posted 10 reviews today. Try again tomorrow.' }, 429);

  await st.setJSON(`${key}/${stamp()}-${rating}-${visitor}-${rand()}`, {
    product_key: key, product_name: clean(b.product_name, 160), brand: clean(b.brand, 80), img,
    name, rating, comment, created_at: new Date().toISOString(),
  });
  return json({ ok: true });
};

export const config = { path: '/api/product-reviews', method: ['GET', 'POST'] };
