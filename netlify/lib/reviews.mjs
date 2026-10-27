import { getStore } from '@netlify/blobs';

// Reviews live in Netlify Blobs. Each review is one blob; its key carries
// time, star rating and a hashed visitor id, so lists, averages and the daily
// limit can be worked out from key names alone:  [productKey/]<time>-<stars>-<visitor>-<random>
export const store = (name) => getStore({ name, consistency: 'strong' });

export const stamp = () => Date.now().toString(36).padStart(9, '0');
export const rand = () => Math.random().toString(36).slice(2, 8);

export async function visitorId(context, req) {
  const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'anon';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('smartbite:' + ip));
  return [...new Uint8Array(buf)].slice(0, 5).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// "abc/lz3k9q0a1-4-1f2e3d4c5b-x9y8z7" -> { prefix, at, rating, visitor }
export function parseKey(key) {
  const slash = key.lastIndexOf('/');
  const prefix = slash >= 0 ? key.slice(0, slash) : '';
  const [t, r, v] = key.slice(slash + 1).split('-');
  return { key, prefix, at: parseInt(t, 36) || 0, rating: +r || 0, visitor: v || '' };
}

export async function allKeys(st, prefix) {
  const { blobs } = await st.list(prefix ? { prefix } : {});
  return blobs.map((b) => parseKey(b.key)).sort((a, b) => b.at - a.at);
}

export const postedToday = (keys, visitor) => keys.filter((k) => k.visitor === visitor && k.at > Date.now() - 86400000).length;

export async function readMany(st, keys) {
  const vals = await Promise.all(keys.map((k) => st.get(k.key, { type: 'json' }).catch(() => null)));
  return vals.map((v, i) => (v ? { id: keys[i].key, ...v } : null)).filter(Boolean);
}

export const average = (keys) => (keys.length ? Math.round((keys.reduce((s, k) => s + k.rating, 0) / keys.length) * 10) / 10 : 0);
