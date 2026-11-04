// Run: node --import ./tests/loader.mjs tests/admin.test.mjs
import assert from 'node:assert/strict';
const ENV = {}; globalThis.Netlify = { env: { get: (k) => ENV[k] } };
const admin = (await import('../netlify/functions/admin.mjs')).default;
const ping = (await import('../netlify/functions/ping.mjs')).default;
const { getStore } = await import('@netlify/blobs');
const O = 'https://smartbite-pro.netlify.app';
const call = (fn, path, { method = 'GET', headers = {}, body } = {}) => fn(new Request(O + path, { method, headers, body }), { ip: '9.9.9.9' });
let n = 0; const ok = (m) => { n++; console.log('✓', m); };

let r = await call(admin, '/api/admin'); assert.equal(r.status, 503); ok('no ADMIN_KEY set → admin is closed (503)');
ENV.ADMIN_KEY = 'short'; r = await call(admin, '/api/admin', { headers: { 'x-admin-key': 'short' } }); assert.equal(r.status, 503); ok('too-short key is refused');
ENV.ADMIN_KEY = 'my-very-secret-admin-key-2026';
r = await call(admin, '/api/admin'); assert.equal(r.status, 401); ok('no key → 401');
r = await call(admin, '/api/admin', { headers: { 'x-admin-key': 'wrong-key-wrong-key-123' } }); assert.equal(r.status, 401); ok('wrong key → 401');
for (let i = 0; i < 8; i++) await call(admin, '/api/admin', { headers: { 'x-admin-key': 'guess' + i } });
r = await call(admin, '/api/admin', { headers: { 'x-admin-key': 'guess-again' } }); assert.equal(r.status, 429); ok('after 8 wrong tries → locked for an hour (429)');

// pings (anonymous counters)
const P = (body, origin = O) => call(ping, '/api/ping', { method: 'POST', headers: { origin, 'content-type': 'text/plain' }, body: JSON.stringify(body) });
await P({ e: 'open', first: true }); await P({ e: 'open' }); await P({ e: 'view', page: 'swaps' }); await P({ e: 'view', page: 'swaps' }); await P({ e: 'view', page: 'evil<script>' });
await P({ e: 'chat' }); await P({ e: 'time', mins: 5 }); await P({ e: 'time', mins: 9999 }); await P({ e: 'hack' }); await P({ e: 'open' }, 'https://evil.example');
const day = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
const u = await getStore({ name: 'usage' }).get(day, { type: 'json' });
assert.deepEqual(u, { opens: 2, newPhones: 1, chats: 1, sessions: 2, minutes: 125, views: { swaps: 2 } }); ok('usage counters: opens, new phones, screens, chats, time (capped at 120 min); junk and other websites ignored');
assert.ok(!JSON.stringify(u).match(/9\.9\.9\.9|ip/i)); ok('no IP or id stored in usage');

// data for overview
await getStore({ name: 'app-reviews' }).setJSON('0000001-5-abc-x1', { name: 'Asha', rating: 5, comment: 'Love it' });
await getStore({ name: 'app-reviews' }).setJSON('0000002-2-def-x2', { name: 'Spam', rating: 2, comment: 'buy cheap stuff' });
await getStore({ name: 'enquiries' }).setJSON('2026-11-01-a', { company: 'Good Foods', contact_name: 'R K', email: 'r@good.in' });
await getStore({ name: 'orders' }).setJSON('order_1', { no: 'SB-AAAAAA', kind: 'plan', status: 'paid', totalPaise: 9900, test: false, created_at: '2026-11-02' });
await getStore({ name: 'orders' }).setJSON('order_2', { no: 'SB-BBBBBB', kind: 'shop', status: 'paid', totalPaise: 27100, test: true, created_at: '2026-11-03' });
ENV.ADMIN_KEY = 'my-very-secret-admin-key-2026';
const H = { 'x-admin-key': ENV.ADMIN_KEY };
// the right key still works even though wrong tries hit the limit
let j = await (await call(admin, '/api/admin?view=overview', { headers: H })).json();
assert.equal(j.ok, true); assert.equal(j.reviews.app, 2); assert.equal(j.reviews.avg, 3.5); assert.equal(j.enquiries, 1); assert.equal(j.orders.paid, 2); assert.equal(j.orders.live, 99); assert.equal(j.orders.test, 271); assert.equal(j.usage.opens7, 2); ok('overview: reviews, average, enquiries, real vs test money, usage');
j = await (await call(admin, '/api/admin?view=reviews', { headers: H })).json(); assert.equal(j.app.length, 2); ok('reviews list');
r = await call(admin, '/api/admin', { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'delete-review', store: 'app-reviews', id: '0000002-2-def-x2' }) }); assert.equal((await r.json()).ok, true);
j = await (await call(admin, '/api/admin?view=reviews', { headers: H })).json(); assert.equal(j.app.length, 1); assert.equal(j.app[0].name, 'Asha'); ok('delete a spam review');
r = await call(admin, '/api/admin', { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'delete-review', store: 'orders', id: 'order_1' }) }); assert.equal(r.status, 400); ok('cannot delete orders or other stores through the panel');
j = await (await call(admin, '/api/admin?view=usage', { headers: H })).json(); assert.equal(j.days.length, 30); assert.equal(j.days.at(-1).opens, 2); ok('30-day usage series');
j = await (await call(admin, '/api/admin?view=orders', { headers: H })).json(); assert.equal(j.orders[0].no, 'SB-BBBBBB'); ok('orders newest first');
console.log(`\nAll ${n} admin tests passed.`);
