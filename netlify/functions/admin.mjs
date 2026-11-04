import { getStore } from '@netlify/blobs';
import { limit, deny, safeEqual } from '../lib/guard.mjs';

// Owner-only admin API. Every call must send the secret ADMIN_KEY (set in Netlify →
// Site configuration → Environment variables) in the "x-admin-key" header.
// Wrong keys are rate-limited (8 tries an hour), and nothing works if ADMIN_KEY is not set.
//
// GET  /api/admin?view=overview | reviews | enquiries | orders | usage
// POST /api/admin { action: 'delete-review', store: 'app-reviews' | 'product-reviews', id }

const json = (b, status = 200) => Response.json(b, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
const env = (k) => (globalThis.Netlify && Netlify.env.get(k)) || process.env[k] || '';
const st = (name) => getStore({ name, consistency: 'strong' });

async function readAll(name, max = 300) {
  const s = st(name);
  const { blobs } = await s.list();
  const keys = blobs.map((b) => b.key).sort().reverse().slice(0, max);
  const vals = await Promise.all(keys.map((k) => s.get(k, { type: 'json' }).catch(() => null)));
  return vals.map((v, i) => (v ? { id: keys[i], ...v } : null)).filter(Boolean);
}
const reviewTime = (id) => parseInt(String(id).split('/').pop().split('-')[0], 36) || 0;

async function usage(days = 30) {
  const s = st('usage');
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = new Date(Date.now() + 5.5 * 3600000 - i * 86400000).toISOString().slice(0, 10);
    const d = (await s.get(k, { type: 'json' }).catch(() => null)) || { opens: 0, newPhones: 0, chats: 0, sessions: 0, minutes: 0, views: {} };
    out.push({ day: k, ...d });
  }
  return out;
}

export default async (req, context) => {
  const key = env('ADMIN_KEY');
  if (!key || key.length < 12) return deny(503, 'Admin is not set up. Add ADMIN_KEY (at least 12 characters) in Netlify environment variables.');
  if (!safeEqual(req.headers.get('x-admin-key'), key)) {
    if (!(await limit(context, req, 'adminbad', 8, 3600))) return deny(429, 'Too many wrong tries. Wait an hour.');
    return deny(401, 'Wrong admin key.');
  }
  const url = new URL(req.url);

  if (req.method === 'POST') {
    let b = {};
    try { b = await req.json(); } catch {}
    if (b.action === 'delete-review' && ['app-reviews', 'product-reviews'].includes(b.store) && b.id) {
      await st(b.store).delete(String(b.id));
      return json({ ok: true });
    }
    return json({ ok: false, error: 'Unknown action.' }, 400);
  }

  const view = url.searchParams.get('view') || 'overview';
  if (view === 'reviews') {
    const [app, prod] = await Promise.all([readAll('app-reviews'), readAll('product-reviews')]);
    return json({ ok: true, app: app.map((r) => ({ ...r, at: reviewTime(r.id) })), products: prod.map((r) => ({ ...r, at: reviewTime(r.id) })) });
  }
  if (view === 'enquiries') return json({ ok: true, enquiries: await readAll('enquiries') });
  if (view === 'orders') return json({ ok: true, orders: (await readAll('orders')).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))) });
  if (view === 'usage') return json({ ok: true, days: await usage(30) });

  // overview
  const [app, prod, enq, orders, days] = await Promise.all([readAll('app-reviews'), readAll('product-reviews'), readAll('enquiries'), readAll('orders'), usage(30)]);
  const paid = orders.filter((o) => o.status === 'paid');
  const sum = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);
  const last7 = days.slice(-7);
  return json({
    ok: true,
    reviews: { app: app.length, products: prod.length, avg: app.length ? Math.round((sum(app, (r) => r.rating) / app.length) * 10) / 10 : 0 },
    enquiries: enq.length,
    orders: { total: orders.length, paid: paid.length, live: sum(paid.filter((o) => !o.test), (o) => o.totalPaise) / 100, test: sum(paid.filter((o) => o.test), (o) => o.totalPaise) / 100 },
    usage: {
      opens7: sum(last7, (d) => d.opens), new7: sum(last7, (d) => d.newPhones), chats7: sum(last7, (d) => d.chats),
      avgMins7: sum(last7, (d) => d.sessions) ? Math.round((sum(last7, (d) => d.minutes) / sum(last7, (d) => d.sessions)) * 10) / 10 : 0,
      opens30: sum(days, (d) => d.opens), new30: sum(days, (d) => d.newPhones),
    },
    payments: !!(env('RAZORPAY_KEY_ID') && env('RAZORPAY_KEY_SECRET')),
  });
};

export const config = { path: '/api/admin', method: ['GET', 'POST'] };
