import { getStore } from '@netlify/blobs';
import { sameSite, limit, deny } from '../lib/guard.mjs';
import { PLANS, keys, paymentsOn, testMode, priceShopOrder, checkShip, orderNumber } from '../lib/pay.mjs';

// POST /api/pay/order
//   { kind: 'shop', items: [{id, qty}], coins, ship: {name, phone, address, pin, city} }
//   { kind: 'plan', plan: 'pro' | 'family' }
// Prices the order on the server, creates a Razorpay order and saves it (store "orders").
// The browser then opens Razorpay Checkout with the returned order id.

const json = (b, status = 200) => Response.json(b, { status, headers: { 'Cache-Control': 'no-store' } });

export default async (req, context) => {
  if (!sameSite(req)) return deny(403, 'Please use the SmartBite app.');
  if (!paymentsOn()) return deny(503, 'Online payment is not switched on yet.');
  if (!(await limit(context, req, 'payorder', 20, 3600))) return deny(429, 'Too many tries. Please wait a little and try again.');
  let b = {};
  try { b = await req.json(); } catch {}

  const no = orderNumber();
  let rec;
  if (b.kind === 'plan') {
    const plan = PLANS[b.plan];
    if (!plan) return json({ ok: false, error: 'Please choose a plan.' }, 400);
    rec = { no, kind: 'plan', plan: plan.id, desc: `${plan.name}, ${plan.days} days`, totalPaise: plan.rupees * 100 };
  } else if (b.kind === 'shop') {
    const priced = priceShopOrder(b.items, b.coins);
    if (!priced.ok) return json({ ok: false, error: priced.error }, 400);
    const sh = checkShip(b.ship);
    if (!sh.ok) return json({ ok: false, error: sh.error }, 400);
    rec = { no, kind: 'shop', lines: priced.lines, itemsPaise: priced.itemsPaise, deliveryPaise: priced.deliveryPaise, coins: priced.coins, coinsPaise: priced.coinsPaise, totalPaise: priced.totalPaise, ship: sh.ship,
      desc: priced.lines.length === 1 ? `${priced.lines[0].name} × ${priced.lines[0].qty}` : `${priced.lines.length} healthy products` };
  } else return json({ ok: false, error: 'Unknown order type.' }, 400);

  const k = keys();
  let rz;
  try {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${k.id}:${k.secret}`).toString('base64') },
      body: JSON.stringify({ amount: rec.totalPaise, currency: 'INR', receipt: no, notes: { smartbite_order: no, kind: rec.kind } }),
    });
    rz = await r.json().catch(() => ({}));
    if (!r.ok || !rz.id) { console.log('razorpay order failed', r.status, JSON.stringify(rz).slice(0, 300)); return json({ ok: false, error: 'Could not start the payment. Please try again.' }, 502); }
  } catch (e) { console.log('razorpay unreachable', String(e)); return json({ ok: false, error: 'Payment service is not reachable. Please try again.' }, 502); }

  const at = new Date().toISOString();
  await getStore({ name: 'orders', consistency: 'strong' }).setJSON(rz.id, { ...rec, rzpOrderId: rz.id, status: 'created', test: testMode(), created_at: at });

  return json({
    ok: true, orderId: rz.id, no, keyId: k.id, amount: rec.totalPaise, currency: 'INR', test: testMode(), desc: rec.desc,
    prefill: rec.kind === 'shop' ? { name: rec.ship.name, contact: '+91' + rec.ship.phone } : {},
  });
};

export const config = { path: '/api/pay/order', method: ['POST'] };
