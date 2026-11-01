// Run: node --import ./tests/loader.mjs tests/functions.test.mjs
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
const ENV = {}; globalThis.Netlify = { env: { get: (k) => ENV[k] } };
const realFetch = globalThis.fetch; let rzCalls = [];
globalThis.fetch = async (url, opt) => {
  if (String(url).startsWith('https://api.razorpay.com/v1/orders')) { const body = JSON.parse(opt.body); rzCalls.push({ body, auth: opt.headers.Authorization }); return new Response(JSON.stringify({ id: 'order_TEST' + rzCalls.length, amount: body.amount }), { status: 200 }); }
  return realFetch(url, opt);
};
const order = (await import('../netlify/functions/pay-order.mjs')).default;
const verify = (await import('../netlify/functions/pay-verify.mjs')).default;
const hook = (await import('../netlify/functions/pay-webhook.mjs')).default;
const shop = (await import('../netlify/functions/shop.mjs')).default;
const H = { 'content-type': 'application/json', origin: 'https://smartbite-pro.netlify.app' };
const post = (fn, path, body, headers = H) => fn(new Request('https://smartbite-pro.netlify.app' + path, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) }), { ip: '1.2.3.4' });
let n = 0; const ok = (name) => { n++; console.log('✓', name); };

let r = await post(order, '/api/pay/order', { kind: 'plan', plan: 'pro' }); assert.equal(r.status, 503); ok('without keys: payments stay off (503)');
let s = await (await shop()).json(); assert.equal(s.payments, false); ok('shop says payments off without keys');

ENV.RAZORPAY_KEY_ID = 'rzp_test_ABC123'; ENV.RAZORPAY_KEY_SECRET = 'sekret'; ENV.RAZORPAY_WEBHOOK_SECRET = 'whsec';
s = await (await shop()).json(); assert.equal(s.payments, true); assert.equal(s.test, true); ok('shop says payments on (test mode) once keys are set');

r = await post(order, '/api/pay/order', { kind: 'plan', plan: 'pro' }, { 'content-type': 'application/json', origin: 'https://evil.example' }); assert.equal(r.status, 403); ok('other websites are blocked (403)');

r = await post(order, '/api/pay/order', { kind: 'plan', plan: 'gold' }); assert.equal(r.status, 400); ok('unknown plan refused');
r = await post(order, '/api/pay/order', { kind: 'plan', plan: 'pro', amount: 1 }); let j = await r.json();
assert.equal(j.ok, true); assert.equal(j.amount, 9900); assert.equal(rzCalls.at(-1).body.amount, 9900); assert.equal(j.keyId, 'rzp_test_ABC123'); assert.ok(!JSON.stringify(j).includes('sekret'));
assert.equal(rzCalls.at(-1).auth, 'Basic ' + Buffer.from('rzp_test_ABC123:sekret').toString('base64')); ok('Pro plan order: ₹99 from server (browser amount ignored), secret never sent to app');

r = await post(order, '/api/pay/order', { kind: 'shop', items: [{ id: 'makhana-peri', qty: 1 }], ship: { name: 'A B', phone: '9820123456', address: 'Flat 4 Sector 5', pin: '400705', city: 'Navi Mumbai' } });
assert.equal(r.status, 400); ok('sample shop product cannot be ordered');

const sig = (o, p, k = 'sekret') => createHmac('sha256', k).update(`${o}|${p}`).digest('hex');
r = await post(verify, '/api/pay/verify', { orderId: j.orderId, paymentId: 'pay_1', signature: 'forged' }); assert.equal(r.status, 400); ok('forged payment signature rejected');
r = await post(verify, '/api/pay/verify', { orderId: j.orderId, paymentId: 'pay_1', signature: sig(j.orderId, 'pay_1', 'wrongkey') }); assert.equal(r.status, 400); ok('signature made with another key rejected');
r = await post(verify, '/api/pay/verify', { orderId: j.orderId, paymentId: 'pay_1', signature: sig(j.orderId, 'pay_1') }); let v = await r.json();
assert.equal(v.ok, true); assert.equal(v.plan, 'pro'); assert.ok(v.until > Date.now() + 29 * 86400000); assert.match(v.token, /^pro\.\d+\.order_TEST\d+\.[0-9a-f]{32}$/); ok('real payment verified → Pro for 30 days with signed receipt');
const again = await (await post(verify, '/api/pay/verify', { orderId: j.orderId, paymentId: 'pay_1', signature: sig(j.orderId, 'pay_1') })).json();
assert.equal(again.until, v.until); ok('verifying twice does not extend the plan');

r = await post(verify, '/api/pay/verify', { orderId: 'order_UNKNOWN', paymentId: 'pay_9', signature: sig('order_UNKNOWN', 'pay_9') }); assert.equal(r.status, 404); ok('unknown order → 404');

// webhook
const j2 = await (await post(order, '/api/pay/order', { kind: 'plan', plan: 'family' })).json(); assert.equal(j2.amount, 14900);
const body = JSON.stringify({ event: 'order.paid', payload: { order: { entity: { id: j2.orderId } }, payment: { entity: { id: 'pay_W', order_id: j2.orderId } } } });
r = await post(hook, '/api/pay/webhook', body, { 'x-razorpay-signature': 'nope' }); assert.equal(r.status, 400); ok('webhook with bad signature rejected');
r = await post(hook, '/api/pay/webhook', body, { 'x-razorpay-signature': createHmac('sha256', 'whsec').update(body).digest('hex') }); assert.equal(r.status, 200);
const saved = JSON.parse(globalThis.__stores.get('orders').get(j2.orderId)); assert.equal(saved.status, 'paid'); assert.equal(saved.via, 'webhook'); ok('webhook marks a Family order paid (safety net)');

// live keys flag
ENV.RAZORPAY_KEY_ID = 'rzp_live_XYZ'; s = await (await shop()).json(); assert.equal(s.test, false); ok('live keys → live mode');
ENV.RAZORPAY_KEY_ID = 'not_a_key'; s = await (await shop()).json(); assert.equal(s.payments, false); ok('a wrongly pasted key keeps payments off');
console.log(`\nAll ${n} server tests passed.`);
