// SmartBite payments (Razorpay). Pure helpers, no network or storage here, so every
// rule can be tested on its own (see tests/pay.test.mjs).
//
// Money rules:
//  - Prices ALWAYS come from the server (lib/shop.mjs and PLANS below), never the browser.
//  - Amounts are whole paise (integers) to avoid rounding mistakes.
//  - A payment only counts after its Razorpay signature checks out with our secret key.

import { createHmac, timingSafeEqual, randomInt } from 'node:crypto';
import { SHOP } from './shop.mjs';

export const PLANS = {
  pro: { id: 'pro', name: 'SmartBite Pro', rupees: 99, days: 30 },
  family: { id: 'family', name: 'SmartBite Family', rupees: 149, days: 30 },
};
export const DELIVERY_RUPEES = 40;
export const FREE_DELIVERY_FROM = 499;
export const COIN_MAX_SHARE = 0.2;   // coins can pay for at most 20% of an order
export const COIN_MAX_RUPEES = 100;  // and never more than ₹100 (coins live on the phone)
export const MAX_QTY = 10;

const env = (k) => (globalThis.Netlify && Netlify.env.get(k)) || process.env[k] || '';
export const keys = () => ({ id: env('RAZORPAY_KEY_ID'), secret: env('RAZORPAY_KEY_SECRET'), webhook: env('RAZORPAY_WEBHOOK_SECRET') });
export const paymentsOn = () => { const k = keys(); return !!(k.id && k.secret && /^rzp_(test|live)_/.test(k.id)); };
export const testMode = () => keys().id.startsWith('rzp_test_');

// ---------- Shop order: price it on the server ----------
// items: [{ id, qty }] from the browser. Returns { ok, error?, lines, itemsPaise, deliveryPaise, coinsPaise, totalPaise }.
export function priceShopOrder(items, coinsWanted = 0, catalogue = SHOP) {
  if (!Array.isArray(items) || !items.length) return { ok: false, error: 'Your cart is empty.' };
  if (items.length > 30) return { ok: false, error: 'Too many items in one order.' };
  const merged = new Map();
  for (const it of items) {
    const id = String(it && it.id || '');
    const qty = Number(it && it.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { ok: false, error: 'Please choose a quantity between 1 and 10.' };
    merged.set(id, (merged.get(id) || 0) + qty);
  }
  const lines = [];
  for (const [id, qty] of merged) {
    const p = catalogue.find((x) => x.id === id);
    if (!p) return { ok: false, error: 'One of the products is no longer in the shop. Please refresh your cart.' };
    if (p.sample) return { ok: false, error: `${p.name} is a sample listing and cannot be bought yet.` };
    if (qty > MAX_QTY) return { ok: false, error: 'Please choose a quantity between 1 and 10.' };
    if (!Number.isInteger(p.price) || p.price <= 0) return { ok: false, error: 'A product price is not set. Please try later.' };
    lines.push({ id, name: p.name, size: p.size, qty, pricePaise: p.price * 100, linePaise: p.price * 100 * qty });
  }
  const itemsPaise = lines.reduce((s, l) => s + l.linePaise, 0);
  const deliveryPaise = itemsPaise >= FREE_DELIVERY_FROM * 100 ? 0 : DELIVERY_RUPEES * 100;
  const coinCap = Math.min(Math.floor(((itemsPaise + deliveryPaise) / 100) * COIN_MAX_SHARE), COIN_MAX_RUPEES);
  const coins = Math.max(0, Math.min(Math.floor(Number(coinsWanted) || 0), coinCap));
  const coinsPaise = coins * 100;
  const totalPaise = itemsPaise + deliveryPaise - coinsPaise;
  if (totalPaise < 100) return { ok: false, error: 'The order total must be at least ₹1.' };
  return { ok: true, lines, itemsPaise, deliveryPaise, coins, coinsPaise, totalPaise };
}

// ---------- Delivery address ----------
export function checkShip(s = {}) {
  const t = (v, n) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, n);
  const ship = { name: t(s.name, 60), phone: String(s.phone || '').replace(/\D/g, '').slice(-10), address: t(s.address, 200), pin: String(s.pin || '').trim(), city: t(s.city, 40) };
  if (ship.name.length < 2) return { ok: false, error: 'Please enter the name for delivery.' };
  if (!/^[6-9]\d{9}$/.test(ship.phone)) return { ok: false, error: 'Please enter a 10-digit Indian mobile number.' };
  if (ship.address.length < 8) return { ok: false, error: 'Please enter the full delivery address.' };
  if (!/^[1-9]\d{5}$/.test(ship.pin)) return { ok: false, error: 'Please enter a 6-digit pincode.' };
  if (ship.city.length < 2) return { ok: false, error: 'Please enter the city.' };
  return { ok: true, ship };
}

// ---------- Signatures ----------
const hmac = (secret, msg) => createHmac('sha256', secret).update(msg).digest('hex');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
// Checkout success: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
export const checkPaymentSig = (orderId, paymentId, signature, secret) => !!(secret && orderId && paymentId && signature) && same(hmac(secret, `${orderId}|${paymentId}`), signature);
// Webhook: signature = HMAC_SHA256(raw request body, webhook_secret)
export const checkWebhookSig = (rawBody, signature, secret) => !!(secret && signature) && same(hmac(secret, rawBody), signature);

// Premium receipt the app keeps on the phone: "plan.until.orderId.sig"
export const premiumToken = (plan, until, orderId, secret) => `${plan}.${until}.${orderId}.${hmac(secret, `${plan}.${until}.${orderId}`).slice(0, 32)}`;
export function readPremiumToken(token, secret) {
  const [plan, until, orderId, sig] = String(token || '').split('.');
  if (!PLANS[plan] || !/^\d+$/.test(until || '') || !orderId || !sig) return null;
  if (!same(hmac(secret, `${plan}.${until}.${orderId}`).slice(0, 32), sig)) return null;
  return { plan, until: +until, orderId };
}

// Short, readable order number for receipts, e.g. SB-7K3M9Q
export const orderNumber = () => 'SB-' + Array.from({ length: 6 }, () => '23456789ABCDEFGHJKMNPQRSTUVWXYZ'[randomInt(31)]).join('');
