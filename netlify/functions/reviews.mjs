import { json, clean } from '../lib/off.mjs';
import { sameSite, deny } from '../lib/guard.mjs';
import { store, stamp, rand, visitorId, allKeys, postedToday, readMany, average } from '../lib/reviews.mjs';

// Reviews of the SmartBite app itself.
// GET  /api/reviews -> { count, avg, dist: [1★..5★ counts], reviews (latest 60) }
// POST /api/reviews  { name, rating, comment, scanned?, tags? }
const TAGS = ['Easy to use', 'Accurate verdicts', 'Helps my kids', 'Great swaps', 'Fast scanning', 'Looks good', 'Needs work'];
export default async (req, context) => {
  const st = store('app-reviews');

  if (req.method === 'GET') {
    const keys = await allKeys(st);
    const reviews = await readMany(st, keys.slice(0, 60));
    const dist = [1, 2, 3, 4, 5].map((n) => keys.filter((k) => k.rating === n).length);
    return json({ ok: true, count: keys.length, avg: average(keys), dist, reviews });
  }

  if (!sameSite(req)) return deny(403, 'Please use the SmartBite app.');
  let b = {};
  try { b = await req.json(); } catch {}
  const name = clean(b.name, 40), comment = clean(b.comment, 500), scanned = clean(b.scanned, 60);
  const rating = Math.round(Number(b.rating));
  const tags = Array.isArray(b.tags) ? [...new Set(b.tags.filter((x) => TAGS.includes(x)))].slice(0, 4) : [];
  if (!name || comment.length < 3 || !(rating >= 1 && rating <= 5)) return json({ ok: false, error: 'Add your name, a star rating and a short review.' }, 400);

  const visitor = await visitorId(context, req);
  if (postedToday(await allKeys(st), visitor) >= 3) return json({ ok: false, error: 'You have posted 3 reviews today. Try again tomorrow.' }, 429);

  await st.setJSON(`${stamp()}-${rating}-${visitor}-${rand()}`, { name, rating, comment, scanned: scanned || null, tags, created_at: new Date().toISOString() });
  return json({ ok: true });
};

export const config = { path: '/api/reviews', method: ['GET', 'POST'] };
