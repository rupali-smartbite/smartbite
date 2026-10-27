// Open Food Facts helpers. Data: Open Food Facts contributors (ODbL), images CC BY-SA.
const UA = { headers: { 'User-Agent': 'SmartBitePro/1.0 (school ATL project; smartbite-pro.netlify.app)' } };
const FIELDS = 'code,product_name,product_name_en,brands,brand_owner,categories_tags,quantity,product_quantity,nutriments,ingredients_text_en,ingredients_text,allergens_tags,nova_group,nutriscore_grade,image_front_small_url,image_front_url,countries_tags,unique_scans_n,ingredients_tags,lang,image_front_url,selected_images';

// OFF category tag -> SmartBite category label (first match wins)
const CAT_MAP = [
  ['en:instant-noodles', 'Instant food'], ['en:ice-creams', 'Ice cream'], ['en:frozen-desserts', 'Ice cream'],
  ['en:crisps', 'Chips'], ['en:potato-crisps', 'Chips'], ['en:popcorn', 'Snacks'],
  ['en:chocolates', 'Chocolate'], ['en:chocolate-candies', 'Chocolate'],
  ['en:energy-drinks', 'Drinks'], ['en:sodas', 'Drinks'], ['en:sweetened-beverages', 'Drinks'], ['en:fruit-juices', 'Drinks'],
  ['en:wafers', 'Biscuits'], ['en:biscuits', 'Biscuits'], ['en:cookies', 'Biscuits'], ['en:cakes', 'Bakery'], ['en:pastries', 'Bakery'],
  ['en:breakfast-cereals', 'Breakfast'], ['en:candies', 'Sweets'], ['en:confectioneries', 'Sweets'], ['en:salty-snacks', 'Snacks'],
  ['en:spreads', 'Spreads'], ['en:sauces', 'Sauces'], ['en:dairies', 'Dairy'], ['en:beverages', 'Drinks'], ['en:snacks', 'Snacks'],
];

// SmartBite category label -> OFF tags to search
export const CAT_TAGS = {
  Chips: ['en:crisps'],
  Chocolate: ['en:chocolates'],
  'Ice cream': ['en:ice-creams'],
  Drinks: ['en:sodas', 'en:energy-drinks', 'en:sweetened-beverages'],
  Biscuits: ['en:biscuits', 'en:wafers'],
  Sweets: ['en:candies', 'en:confectioneries'],
  'Instant food': ['en:instant-noodles'],
  Snacks: ['en:salty-snacks', 'en:popcorn'],
  Bakery: ['en:cakes', 'en:pastries'],
  Breakfast: ['en:breakfast-cereals'],
  Spreads: ['en:spreads'],
  Sauces: ['en:sauces'],
  Dairy: ['en:dairies'],
  '': ['en:crisps', 'en:chocolates', 'en:ice-creams', 'en:sodas', 'en:biscuits', 'en:candies', 'en:instant-noodles', 'en:energy-drinks'],
};

const catOf = (tags = []) => { for (const [t, c] of CAT_MAP) if (tags.includes(t)) return c; return 'Packaged food'; };
const arr = (x) => (Array.isArray(x) ? x : typeof x === 'string' ? x.split(',') : []).map((s) => String(s).trim()).filter(Boolean);
const num = (x) => (x == null || x === '' || isNaN(+x) ? null : Math.round(+x * 100) / 100);
const ALG = { peanuts: 'peanut', soybeans: 'soy', eggs: 'egg', nuts: 'tree nuts', 'sesame-seeds': 'sesame' };

export function splitTop(text) {
  const out = []; let depth = 0, cur = '';
  for (const ch of String(text)) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';') && depth === 0) { if (cur.trim()) out.push(cur.trim().replace(/_/g, '')); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim().replace(/\.$/, '').replace(/_/g, ''));
  return out.slice(0, 40);
}

// OFF record -> app product shape (same shape the Hatchable API returned)
export function toApp(o, { withIngredients = true } = {}) {
  if (!o || !o.code) return null;
  const name = String(o.product_name_en || o.product_name || '').trim();
  const nu = o.nutriments || {};
  const kcal = nu['energy-kcal_100g'] ?? (nu.energy_100g != null ? nu.energy_100g / 4.184 : null);
  if (!name || kcal == null) return null;
  const sodium = nu.sodium_100g != null ? nu.sodium_100g * 1000 : nu.salt_100g != null ? nu.salt_100g * 400 : null;
  const tags = arr(o.categories_tags);
  const cat = catOf(tags);
  const drink = cat === 'Drinks' || tags.includes('en:beverages');
  const countries = arr(o.countries_tags);
  const pq = num(o.product_quantity);
  const barcode = String(o.code).slice(0, 32);
  const ingList = englishIngredients(o);
  const p = {
    id: 'off-' + barcode, barcode, name: name.slice(0, 160),
    brand: (arr(o.brands)[0] || '').replace(/\s+/g, ' ').slice(0, 80) || 'Unknown brand',
    company: String(o.brand_owner || '').slice(0, 120) || null,
    cat, drink,
    packG: pq && pq > 0 && pq < 5000 ? pq : drink ? 250 : 50,
    quantity: String(o.quantity || '').slice(0, 40) || null,
    img: o.image_front_url || null,
    imgSmall: o.image_front_small_url || o.image_front_url || null,
    n: { kcal: num(kcal), fat: num(nu.fat_100g), sat: num(nu['saturated-fat_100g']), carbs: num(nu.carbohydrates_100g), sugar: num(nu.sugars_100g), fibre: num(nu.fiber_100g), protein: num(nu.proteins_100g), sodium: num(sodium) },
    allergens: arr(o.allergens_tags).map((a) => a.replace(/^..:/, '')).map((a) => ALG[a] || a),
    nova: o.nova_group ? +o.nova_group : null,
    nutriscore: o.nutriscore_grade && /^[a-e]$/.test(o.nutriscore_grade) ? o.nutriscore_grade : null,
    india: countries.includes('en:india'),
    approx: false, src: 'Open Food Facts', veg: true,
  };
  if (withIngredients) p.ing = ingList;
  return p;
}

// Search-a-licious (Open Food Facts full-text search)
export async function searchOFF(q, { page = 1, size = 24, sort = '-unique_scans_n' } = {}) {
  const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page=${page}&page_size=${size}${sort ? `&sort_by=${sort}` : ''}&fields=${FIELDS}`;
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error('Open Food Facts search returned ' + r.status);
  const j = await r.json();
  return { count: j.count || 0, pageCount: j.page_count || 0, hits: j.hits || [] };
}

// Barcode lookup. The classic product API sometimes refuses requests from cloud
// servers, so we fall back to the search service, which knows every barcode too.
export async function productOFF(barcode) {
  const bc = String(barcode).replace(/[^0-9]/g, '');
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${bc}.json?fields=${FIELDS}`, UA);
    if (r.ok) {
      const j = await r.json();
      if ((j.status === 1 || j.status === 'success') && j.product) {
        const p = toApp({ ...j.product, code: j.product.code || bc });
        if (p) return p;
      }
    } else console.log('OFF product API', r.status, 'for', bc);
  } catch (e) { console.log('OFF product API error', String(e).slice(0, 200)); }
  const { hits } = await searchOFF(`code:${bc}`, { size: 3, sort: '' });
  const hit = hits.find((h) => String(h.code) === bc) || null;
  return hit ? toApp(hit) : null;
}

export const json = (data, status = 200, cache = '') => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', ...(cache ? { 'Netlify-CDN-Cache-Control': cache, 'Cache-Control': 'public, max-age=60' } : { 'Cache-Control': 'no-store' }) },
});
export const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

// Ingredients in English. Uses the English label text when there is one; otherwise
// builds the list from Open Food Facts' standard English ingredient names
// (so Spanish "almendras" becomes "almonds"), and fixes common photo-reading typos.
const TYPO = [[/\blodised\b/gi, 'Iodised'], [/\blodized\b/gi, 'Iodized'], [/\bEdibie\b/gi, 'Edible'], [/\bvegetabie\b/gi, 'vegetable'], [/\bPalmoiein\b/gi, 'Palmolein'], [/\bSait\b/g, 'Salt'], [/\bsait\b/g, 'salt'], [/\bF1avour/gi, 'Flavour'], [/\balmand(a|e)s\b/gi, 'almonds'], [/\balmendras\b/gi, 'almonds'], [/\bcashwe\b/gi, 'cashew'], [/\s+/g, ' ']];
const fixText = (t) => TYPO.reduce((s, [re, r]) => s.replace(re, r), String(t)).trim();
function englishIngredients(o) {
  const en = o.ingredients_text_en || (o.lang === 'en' ? o.ingredients_text : '');
  if (en && String(en).trim().length > 2) return splitTop(String(en).slice(0, 3000)).map(fixText).filter(Boolean);
  const tags = arr(o.ingredients_tags).filter((t) => t.startsWith('en:'));
  if (tags.length) {
    const seen = new Set();
    return tags.map((t) => t.slice(3).replace(/-/g, ' ')).map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .filter((t) => !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase())).slice(0, 30);
  }
  // Last resort: original text, which may be in another language
  return o.ingredients_text ? splitTop(String(o.ingredients_text).slice(0, 3000)).map(fixText) : [];
}
