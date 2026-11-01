import { getStore } from '@netlify/blobs';
import { sameSite, limit, deny } from '../lib/guard.mjs';
import { PLANS, keys, paymentsOn, checkPaymentSig, premiumToken } from '../lib/pay.mjs';

// POST /api/pay/verify { orderId, paymentId, signature }
// Called by the app after Razorpay Checkout says "paid". We only trust it if the
// signature matches our secret key. Marks the order paid and, for a plan, returns a
// signed Premium receipt for the app to keep.

const json = (b, status = 200) => Response.json(b, { status, headers: { 'Cache-Control': 'no-store' } });

export default async (req, context) => {
  if (!sameSite(req)) return deny(403, 'Please use the SmartBite app.');
  if (!paymentsOn()) return deny(503, 'Online payment is not switched on yet.');
  if (!(await limit(context, req, 'payverify', 30, 3600))) return deny(429, 'Too many tries. Please wait a little.');
  let b = {};
  try { b = await req.json(); } catch {}
  const { orderId, paymentId, signature } = b;
  const k = keys();
  if (!checkPaymentSig(orderId, paymentId, signature, k.secret)) return json({ ok: false, error: 'We could not confirm this payment. If money was taken, it will be refunded automatically.' }, 400);

  const st = getStore({ name: 'orders', consistency: 'strong' });
  const rec = await st.get(orderId, { type: 'json' });
  if (!rec) return json({ ok: false, error: 'Order not found.' }, 404);
  const now = Date.now();
  if (rec.status !== 'paid') {
    rec.status = 'paid'; rec.paymentId = paymentId; rec.paid_at = new Date(now).toISOString();
    if (rec.kind === 'plan') rec.until = now + PLANS[rec.plan].days * 86400000;
    await st.setJSON(orderId, rec);
  }
  const out = { ok: true, no: rec.no, kind: rec.kind, totalPaise: rec.totalPaise, test: !!rec.test };
  if (rec.kind === 'plan') Object.assign(out, { plan: rec.plan, until: rec.until, token: premiumToken(rec.plan, rec.until, orderId, k.secret) });
  else Object.assign(out, { lines: rec.lines, coins: rec.coins, itemsPaise: rec.itemsPaise });
  return json(out);
};

export const config = { path: '/api/pay/verify', method: ['POST'] };
