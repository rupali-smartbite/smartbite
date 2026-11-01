// Run: node tests/pay.test.mjs   (no network, no keys needed)
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { priceShopOrder, checkShip, checkPaymentSig, checkWebhookSig, premiumToken, readPremiumToken, orderNumber, PLANS } from '../netlify/lib/pay.mjs';

const CAT = [
  { id: 'a', name: 'Makhana', size: '80 g', price: 149, sample: false },
  { id: 'b', name: 'Peanut butter', size: '350 g', price: 299, sample: false },
  { id: 's', name: 'Sample thing', size: '1', price: 50, sample: true },
  { id: 'z', name: 'No price', size: '1', price: 0, sample: false },
];
let n = 0; const t = (name, fn) => { fn(); n++; console.log('✓', name); };

t('prices come from the server catalogue, in paise', () => {
  const r = priceShopOrder([{ id: 'a', qty: 2 }], 0, CAT);
  assert.equal(r.ok, true); assert.equal(r.itemsPaise, 29800); assert.equal(r.deliveryPaise, 4000); assert.equal(r.totalPaise, 33800);
});
t('a price sent by the browser is ignored', () => {
  const r = priceShopOrder([{ id: 'a', qty: 1, price: 1 }], 0, CAT); assert.equal(r.itemsPaise, 14900);
});
t('free delivery from ₹499', () => {
  const r = priceShopOrder([{ id: 'b', qty: 1 }, { id: 'a', qty: 2 }], 0, CAT); assert.equal(r.itemsPaise, 59700); assert.equal(r.deliveryPaise, 0);
});
t('same product twice is merged', () => {
  const r = priceShopOrder([{ id: 'a', qty: 1 }, { id: 'a', qty: 2 }], 0, CAT); assert.equal(r.lines.length, 1); assert.equal(r.lines[0].qty, 3);
});
t('bad quantities are refused', () => {
  for (const q of [0, -1, 1.5, 11, 'abc', null, NaN, undefined]) assert.equal(priceShopOrder([{ id: 'a', qty: q }], 0, CAT).ok, false, 'qty ' + q);
  assert.equal(priceShopOrder([{ id: 'a', qty: 6 }, { id: 'a', qty: 6 }], 0, CAT).ok, false, 'merged over 10');
});
t('unknown, sample and unpriced products are refused', () => {
  assert.equal(priceShopOrder([{ id: 'nope', qty: 1 }], 0, CAT).ok, false);
  assert.equal(priceShopOrder([{ id: 's', qty: 1 }], 0, CAT).ok, false);
  assert.equal(priceShopOrder([{ id: 'z', qty: 1 }], 0, CAT).ok, false);
  assert.equal(priceShopOrder([], 0, CAT).ok, false);
  assert.equal(priceShopOrder('x', 0, CAT).ok, false);
});
t('coins are capped at 20% and ₹100, never negative', () => {
  const r = priceShopOrder([{ id: 'a', qty: 2 }], 9999, CAT); // 298+40 = 338 → 20% = 67
  assert.equal(r.coins, 67); assert.equal(r.totalPaise, 33800 - 6700);
  const big = priceShopOrder([{ id: 'b', qty: 10 }], 9999, CAT); assert.equal(big.coins, 100);
  assert.equal(priceShopOrder([{ id: 'a', qty: 1 }], -50, CAT).coins, 0);
  assert.equal(priceShopOrder([{ id: 'a', qty: 1 }], 'abc', CAT).coins, 0);
});
t('real shop catalogue: sample products cannot be bought', () => {
  assert.equal(priceShopOrder([{ id: 'makhana-peri', qty: 1 }]).ok, false);
});
t('delivery address checks', () => {
  const good = { name: 'Rupali G', phone: '98201 23456', address: 'Flat 4, Sector 5, Sanpada', pin: '400705', city: 'Navi Mumbai' };
  assert.equal(checkShip(good).ok, true); assert.equal(checkShip(good).ship.phone, '9820123456');
  assert.equal(checkShip({ ...good, phone: '+91 98201 23456' }).ship.phone, '9820123456');
  assert.equal(checkShip({ ...good, phone: '12345' }).ok, false);
  assert.equal(checkShip({ ...good, phone: '5820123456' }).ok, false);
  assert.equal(checkShip({ ...good, pin: '012345' }).ok, false);
  assert.equal(checkShip({ ...good, address: 'x' }).ok, false);
  assert.equal(checkShip({}).ok, false);
});
const SECRET = 'test_secret_123';
t('payment signature: correct one passes, tampered ones fail', () => {
  const sig = createHmac('sha256', SECRET).update('order_1|pay_1').digest('hex');
  assert.equal(checkPaymentSig('order_1', 'pay_1', sig, SECRET), true);
  assert.equal(checkPaymentSig('order_2', 'pay_1', sig, SECRET), false);
  assert.equal(checkPaymentSig('order_1', 'pay_2', sig, SECRET), false);
  assert.equal(checkPaymentSig('order_1', 'pay_1', sig.replace(/.$/, '0'), SECRET), false);
  assert.equal(checkPaymentSig('order_1', 'pay_1', sig, 'other_secret'), false);
  assert.equal(checkPaymentSig('order_1', 'pay_1', '', SECRET), false);
  assert.equal(checkPaymentSig('order_1', 'pay_1', sig, ''), false);
});
t('webhook signature', () => {
  const body = '{"event":"order.paid"}'; const sig = createHmac('sha256', 'wh').update(body).digest('hex');
  assert.equal(checkWebhookSig(body, sig, 'wh'), true);
  assert.equal(checkWebhookSig(body + ' ', sig, 'wh'), false);
  assert.equal(checkWebhookSig(body, sig, ''), false);
  assert.equal(checkWebhookSig(body, null, 'wh'), false);
});
t('premium receipt cannot be forged or changed', () => {
  const tok = premiumToken('pro', 1800000000000, 'order_9', SECRET);
  assert.deepEqual(readPremiumToken(tok, SECRET), { plan: 'pro', until: 1800000000000, orderId: 'order_9' });
  assert.equal(readPremiumToken(tok.replace('pro.', 'family.'), SECRET), null);
  assert.equal(readPremiumToken(tok.replace('1800000000000', '1900000000000'), SECRET), null);
  assert.equal(readPremiumToken(tok, 'other'), null);
  assert.equal(readPremiumToken('garbage', SECRET), null);
});
t('plans and order numbers', () => {
  assert.equal(PLANS.pro.rupees, 99); assert.equal(PLANS.family.rupees, 149);
  const nos = new Set(Array.from({ length: 500 }, orderNumber)); assert.ok(nos.size > 495); assert.match(orderNumber(), /^SB-[2-9A-Z]{6}$/);
});
console.log(`\nAll ${n} payment tests passed.`);
