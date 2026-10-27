import { SHOP, SHOP_CATS } from '../lib/shop.mjs';

// GET /api/shop -> the shop catalogue (products, categories, whether online payment is live)
// Online payment (Razorpay) is not connected yet: PAYMENTS_LIVE stays false until the
// payment step is built and the bank account is decided.
const PAYMENTS_LIVE = false;

export default async () => Response.json(
  { ok: true, payments: PAYMENTS_LIVE, cats: SHOP_CATS, products: SHOP },
  { headers: { 'Cache-Control': 'public, max-age=300', 'Netlify-CDN-Cache-Control': 'public, s-maxage=600' } },
);

export const config = { path: '/api/shop', method: ['GET'] };
