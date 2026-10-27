import { productOFF, json } from '../lib/off.mjs';

// GET /api/products/:barcode -> full product (ingredients, NOVA, Nutri-Score) from Open Food Facts
export default async (req, context) => {
  const bc = String(context.params.barcode || '').replace(/[^0-9]/g, '').slice(0, 20);
  if (bc.length < 6) return json({ ok: false, error: 'Barcode should be 8 to 14 digits.' }, 400);
  try {
    const product = await productOFF(bc);
    if (!product) return json({ ok: false, error: 'Not found in any food database yet.' }, 404, 'public, s-maxage=600');
    return json({ ok: true, product }, 200, 'public, s-maxage=86400, stale-while-revalidate=604800');
  } catch (e) {
    console.log('product lookup failed', String(e));
    return json({ ok: false, error: 'The world food database is busy. Try again in a moment.' }, 502);
  }
};

export const config = { path: '/api/products/:barcode', method: ['GET'] };
