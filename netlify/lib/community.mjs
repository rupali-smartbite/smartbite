// "Help us add this product": shared checks for product submissions and approvals.
// Pure helpers, no storage, so they can be unit-tested (tests/community.test.mjs).

export const MAX_PHOTO = 700_000;   // base64 characters per photo (~500 KB JPEG)
const PHOTO = /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/;
const txt = (v, n) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const num = (v, max) => { if (v === null || v === undefined || v === '') return null; const x = Number(v); return Number.isFinite(x) && x >= 0 && x <= max ? Math.round(x * 10) / 10 : null; };
export const NUT_MAX = { kcal: 900, fat: 100, sat: 100, carbs: 100, sugar: 100, fibre: 100, protein: 100, sodium: 40000 };
export const cleanBarcode = (b) => { const s = String(b || '').replace(/\D/g, ''); return s.length >= 8 && s.length <= 14 ? s : ''; };

// What a phone sends: { barcode?, brand?, name?, front, back?, read? }
export function checkSubmission(b = {}) {
  if (!b || typeof b !== 'object') return { ok: false, error: 'Bad request.' };
  const front = String(b.front || ''), back = String(b.back || '');
  if (!PHOTO.test(front) || front.length > MAX_PHOTO) return { ok: false, error: 'Please add a clear photo of the front of the pack.' };
  if (back && (!PHOTO.test(back) || back.length > MAX_PHOTO)) return { ok: false, error: 'The back photo is too big or not an image.' };
  const r = b.read && typeof b.read === 'object' ? b.read : {};
  const per = r.per100 && typeof r.per100 === 'object' ? r.per100 : {};
  const read = {
    brand: txt(r.brand, 60), name: txt(r.name, 90), category: txt(r.category, 40), drink: !!r.drink, fromPack: !!r.fromPack,
    packG: num(r.packG, 5000), per100: Object.fromEntries(Object.keys(NUT_MAX).map((k) => [k, num(per[k], NUT_MAX[k])])),
    ingredients: Array.isArray(r.ingredients) ? r.ingredients.slice(0, 60).map((x) => txt(x, 80)).filter(Boolean) : [],
  };
  return { ok: true, meta: { barcode: cleanBarcode(b.barcode), brand: txt(b.brand, 60) || read.brand, name: txt(b.name, 90) || read.name, read }, photos: { front, back: back || null } };
}

// What the owner approves in the admin panel. Returns a product in the app's own format.
export function checkApproval(b = {}) {
  const brand = txt(b.brand, 60), name = txt(b.name, 90);
  if (!brand || !name) return { ok: false, error: 'Brand and product name are needed.' };
  const barcode = cleanBarcode(b.barcode);
  const n = {};
  for (const k of Object.keys(NUT_MAX)) { const v = num(b.n && b.n[k], NUT_MAX[k]); if (v === null) return { ok: false, error: `Please fill in ${k} per 100 ${b.drink ? 'ml' : 'g'} (0 if none).` }; n[k] = v; }
  if (n.sugar > n.carbs + 0.5) return { ok: false, error: 'Sugar cannot be more than total carbohydrates.' };
  if (n.sat > n.fat + 0.5) return { ok: false, error: 'Saturated fat cannot be more than total fat.' };
  const packG = num(b.packG, 5000) || 50;
  const ing = (Array.isArray(b.ing) ? b.ing : String(b.ing || '').split(',')).map((x) => txt(x, 80)).filter(Boolean).slice(0, 60);
  const slug = (brand + '-' + name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return { ok: true, product: { id: 'cm-' + (barcode || slug), brand, name, cat: txt(b.cat, 40) || 'Packaged food', drink: !!b.drink, packG, n, ing, allergens: [], veg: b.veg !== false, barcode: barcode || undefined, verified: true, src: 'Checked by SmartBite from a user photo' } };
}
