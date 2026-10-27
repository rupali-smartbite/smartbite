import { CAT_TAGS, searchOFF, productOFF, toApp, json, clean } from '../lib/off.mjs';

// GET /api/products?cat=Chips&page=1   -> products in a category (Indian products first on page 1)
// GET /api/products?q=kurkure&page=1   -> search by name, brand or barcode
// Data comes live from Open Food Facts; Netlify's CDN caches each answer for an hour.
const SIZE = 24;
const tagQuery = (tags) => '(' + tags.map((t) => `categories_tags:"${t}"`).join(' OR ') + ')';
const slim = (o) => {
  const p = toApp(o, { withIngredients: false });
  if (!p || !p.img) return null;
  const n = p.n || {};
  // Quality: complete nutrition, processing level and a selected front photo rank higher
  p._q = ['sodium', 'sugar', 'sat', 'fat'].filter((k) => n[k] != null).length + (p.nova ? 1 : 0) + (p.nutriscore ? 1 : 0) + (o.selected_images && o.selected_images.front ? 1 : 0);
  return p;
};
const rank = (list) => list.map((p, i) => ({ p, i })).sort((a, b) => (b.p.india - a.p.india) || (b.p._q - a.p._q) || (a.i - b.i)).map(({ p }) => { delete p._q; return p; });

export default async (req) => {
  const url = new URL(req.url);
  const q = clean(url.searchParams.get('q'), 80);
  const catParam = url.searchParams.get('cat') || '';
  const cat = Object.prototype.hasOwnProperty.call(CAT_TAGS, catParam) ? catParam : '';
  const page = Math.max(1, Math.min(40, parseInt(url.searchParams.get('page'), 10) || 1));

  try {
    if (q) {
      if (/^\d{8,14}$/.test(q)) {
        const p = await productOFF(q);
        return json({ ok: true, live: true, more: false, items: p ? [p] : [] }, 200, 'public, s-maxage=3600');
      }
      const { hits, pageCount } = await searchOFF(q, { page, size: 40, sort: '' });
      const items = rank(dedupe(hits.map(slim))).slice(0, SIZE);
      return json({ ok: true, live: true, more: page < pageCount, items }, 200, 'public, s-maxage=3600, stale-while-revalidate=86400');
    }

    const base = tagQuery(CAT_TAGS[cat]);
    const world = await searchOFF(base, { page, size: 40 });
    let rows = world.hits;
    if (page === 1) {
      try {
        const india = await searchOFF(`${base} AND countries_tags:"en:india"`, { page: 1, size: 16 });
        rows = [...india.hits, ...rows];
      } catch { /* India-first is a nice-to-have */ }
    }
    const items = rank(dedupe(rows.map(slim))).slice(0, SIZE);
    return json({ ok: true, total: world.count, more: page < world.pageCount, items }, 200, 'public, s-maxage=3600, stale-while-revalidate=86400');
  } catch (e) {
    console.log('products failed', String(e));
    return json({ ok: false, error: 'The world food database is busy. Try again in a moment.' }, 502);
  }
};

function dedupe(list) {
  const seen = new Set();
  return list.filter((p) => p && !seen.has(p.barcode) && seen.add(p.barcode));
}

export const config = { path: '/api/products', method: ['GET'] };
