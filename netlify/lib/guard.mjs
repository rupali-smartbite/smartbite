import { getStore } from '@netlify/blobs';

// Shared protection for the API.
//  - sameSite(req): POST calls must come from the SmartBite website itself, so other
//    websites cannot use our AI (and our credits) through visitors' browsers.
//  - limit(...): per-visitor rate limits. Visitors are identified only by a salted,
//    one-way hash of their IP address; the IP itself is never stored.

export function sameSite(req) {
  const host = new URL(req.url).host;
  const src = req.headers.get('origin') || req.headers.get('referer') || '';
  if (!src) return false;
  try { return new URL(src).host === host; } catch { return false; }
}

export async function visitorHash(context, req) {
  const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'anon';
  const salt = (globalThis.Netlify && Netlify.env.get('VISITOR_SALT')) || 'smartbite';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + ip));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Allows `max` calls per `windowSec` seconds for one visitor. Returns true when allowed.
// Best effort: if the counter store is unavailable we let the call through rather than break the app.
export async function limit(context, req, name, max, windowSec) {
  try {
    const who = await visitorHash(context, req);
    const slot = Math.floor(Date.now() / 1000 / windowSec);
    const st = getStore({ name: 'ratelimit', consistency: 'strong' });
    const key = `${name}/${slot}/${who}`;
    const n = ((await st.get(key, { type: 'json' })) || { n: 0 }).n + 1;
    if (n > max) return false;
    await st.setJSON(key, { n, at: Date.now() });
    return true;
  } catch (e) {
    console.log('rate limit store unavailable', String(e).slice(0, 200));
    return true;
  }
}

export const deny = (status, error) => Response.json({ ok: false, error }, { status, headers: { 'Cache-Control': 'no-store' } });

// Constant-time string compare for secrets
export function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
