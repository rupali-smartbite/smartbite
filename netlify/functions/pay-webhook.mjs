import { getStore } from '@netlify/blobs';
import { PLANS, keys, checkWebhookSig } from '../lib/pay.mjs';

// POST /api/pay/webhook  (set this URL in Razorpay Dashboard → Webhooks,
// events: order.paid and payment.failed, with a secret saved as RAZORPAY_WEBHOOK_SECRET)
// A safety net: if someone pays but closes the app before it confirms, Razorpay still
// tells us here, and the order is marked paid.

export default async (req) => {
  const raw = await req.text();
  const { webhook } = keys();
  if (!checkWebhookSig(raw, req.headers.get('x-razorpay-signature'), webhook)) return new Response('bad signature', { status: 400 });
  let ev = {};
  try { ev = JSON.parse(raw); } catch { return new Response('bad body', { status: 400 }); }
  const orderId = ev?.payload?.order?.entity?.id || ev?.payload?.payment?.entity?.order_id;
  if (!orderId) return new Response('ok');
  const st = getStore({ name: 'orders', consistency: 'strong' });
  const rec = await st.get(orderId, { type: 'json' });
  if (!rec) return new Response('ok');
  if (ev.event === 'order.paid' && rec.status !== 'paid') {
    rec.status = 'paid'; rec.paymentId = ev?.payload?.payment?.entity?.id || rec.paymentId; rec.paid_at = new Date().toISOString(); rec.via = 'webhook';
    if (rec.kind === 'plan') rec.until = Date.now() + PLANS[rec.plan].days * 86400000;
    await st.setJSON(orderId, rec);
  } else if (ev.event === 'payment.failed' && rec.status === 'created') {
    rec.status = 'failed'; rec.failed_at = new Date().toISOString();
    await st.setJSON(orderId, rec);
  }
  return new Response('ok');
};

export const config = { path: '/api/pay/webhook', method: ['POST'] };
