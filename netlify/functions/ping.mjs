import { getStore } from '@netlify/blobs';
import { sameSite, limit } from '../lib/guard.mjs';

// POST /api/ping { e: 'open' | 'view' | 'chat' | 'time', page?, first?, mins? }
// Anonymous usage counts for the owner's admin panel. Nothing here identifies a person:
// no IP, no device id, no name. We only add 1 to a counter for today (India time).
//  - open  : the app was opened today on a phone (sent once per phone per day), first = brand-new phone
//  - view  : a screen was opened (page name only)
//  - chat  : a message was sent to Bitu
//  - time  : how many minutes a visit lasted (capped at 120)
const PAGES = new Set(['add', 'home', 'scan', 'result', 'plate', 'label', 'swaps', 'explore', 'shop', 'cart', 'checkout', 'tracker', 'profile', 'plans', 'partner', 'play', 'quiz', 'sugar', 'game', 'compare', 'dish', 'coins', 'reviews']);
const day = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);

export default async (req, context) => {
  if (!sameSite(req)) return new Response(null, { status: 204 });
  if (!(await limit(context, req, 'ping', 300, 3600))) return new Response(null, { status: 204 });
  let b = {};
  try { b = JSON.parse(await req.text()); } catch {}
  const e = String(b.e || '');
  if (!['open', 'view', 'chat', 'time'].includes(e)) return new Response(null, { status: 204 });
  const st = getStore({ name: 'usage', consistency: 'strong' });
  const k = day();
  const d = (await st.get(k, { type: 'json' })) || { opens: 0, newPhones: 0, chats: 0, sessions: 0, minutes: 0, views: {} };
  if (e === 'open') { d.opens++; if (b.first) d.newPhones++; }
  else if (e === 'chat') d.chats++;
  else if (e === 'view' && PAGES.has(b.page)) d.views[b.page] = (d.views[b.page] || 0) + 1;
  else if (e === 'time') { const m = Math.max(0, Math.min(120, Math.round(Number(b.mins) || 0))); if (m) { d.sessions++; d.minutes += m; } }
  await st.setJSON(k, d);
  return new Response(null, { status: 204 });
};

export const config = { path: '/api/ping', method: ['POST'] };
