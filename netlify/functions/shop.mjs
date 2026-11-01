import { SHOP, SHOP_CATS } from '../lib/shop.mjs';
import { paymentsOn, testMode, PLANS } from '../lib/pay.mjs';

// GET /api/shop -> the shop catalogue (products, categories, whether online payment is live)
// Online payment switches on by itself once RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are
// set in Netlify (Site configuration → Environment variables).

export default async () => Response.json(
  { ok: true, payments: paymentsOn(), test: paymentsOn() && testMode(), plans: Object.values(PLANS), cats: SHOP_CATS, products: SHOP },
  { headers: { 'Cache-Control': 'public, max-age=60', 'Netlify-CDN-Cache-Control': 'public, s-maxage=60' } },
);

export const config = { path: '/api/shop', method: ['GET'] };
