import { ADDITIVES, ALLERGEN_WORDS } from './data.js';

// Daily limits used for "% of daily limit" reasons (WHO / ICMR-NIN style guidance)
export const LIMITS = {
  adult: { sodium: 2000, sugar: 25, sat: 22, kcal: 2000, fat: 60 },
  child: { sodium: 1200, sugar: 20, sat: 15, kcal: 1500, fat: 45 },
};

const r1 = (x) => Math.round(x * 10) / 10;
const pct = (v, lim) => Math.round((v / lim) * 100);

export function decodeIngredients(ing = []) {
  const text = ing.join(' | ').toLowerCase();
  const found = [];
  for (const a of ADDITIVES) {
    if (a.k.some((k) => (/^\d/.test(k) ? new RegExp(`(^|[^0-9])${k}([^0-9]|$)`).test(text) : text.includes(k)))) {
      if (!found.some((f) => f.name === a.name)) found.push(a);
    }
  }
  return found;
}

export function detectAllergens(p) {
  const text = (p.ing || []).join(' ').toLowerCase();
  const set = new Set(p.allergens || []);
  for (const [al, words] of Object.entries(ALLERGEN_WORDS)) if (words.some((w) => text.includes(w))) set.add(al);
  return [...set];
}

export function dietFlags(p) {
  const text = (p.ing || []).join(' ').toLowerCase();
  const animalAdd = /627|631|635/.test(text);
  const nonVeg = /chicken|mutton|fish|egg|gelatin|meat/.test(text) || p.veg === false;
  const dairy = ALLERGEN_WORDS.milk.some((w) => text.includes(w));
  const jainBad = /onion|garlic|potato|carrot|beetroot|ginger|radish/.test(text);
  return {
    veg: nonVeg ? 'no' : animalAdd ? 'check' : 'yes',
    vegan: nonVeg || dairy ? 'no' : animalAdd ? 'check' : 'yes',
    jain: nonVeg || jainBad ? 'no' : animalAdd ? 'check' : 'yes',
    eggetarian: /chicken|mutton|fish|gelatin|meat/.test(text) ? 'no' : 'yes',
  };
}

function processing(p, adds) {
  if (p.nova === 4) return { level: 'Ultra-processed (NOVA 4)', pen: 0.5 };
  if (p.nova === 3) return { level: 'Processed (NOVA 3)', pen: 0.2 };
  if (p.nova === 1 || p.nova === 2) return { level: p.nova === 1 ? 'Unprocessed (NOVA 1)' : 'Culinary ingredient (NOVA 2)', pen: 0 };
  const text = (p.ing || []).join(' ').toLowerCase();
  let markers = 0;
  ['maltodextrin', 'hydrolysed', 'flavour enhancer', 'flavouring', 'emulsifier', 'colour', 'invert', 'liquid glucose', 'tastemaker'].forEach((m) => { if (text.includes(m)) markers++; });
  if ((p.ing || []).length <= 3 && markers === 0) return { level: 'Minimally processed', pen: 0 };
  if (markers <= 1) return { level: 'Processed', pen: 0.2 };
  return { level: 'Ultra-processed', pen: 0.5 };
}

// ---------------- Data cleanup ----------------
// Open Food Facts data is crowd-sourced: values can be missing, or entered per serving
// instead of per 100 g. Missing data must never make a product look healthy, so we fill
// gaps with typical values for the product type and mark them as estimates.
const JUNK_RE = {
  Chips: /\b(chips?|crisps?|wafers?|lay'?s|pringles|doritos|kurkure|uncle chipps|bingo|balaji|cheetos|nachos?)\b/i,
  Namkeen: /\b(bhujia|namkeen|sev|mixture|chivda|chiwda|farsan|haldiram'?s|bikaji|moong dal|chakli|gathiya|papdi)\b/i,
  'Instant food': /\b(noodles?|maggi|yippee|ramen|cup noodles|top ramen)\b/i,
  Drinks: /\b(cola|coke|pepsi|sprite|fanta|thums up|mountain dew|limca|7up|red bull|monster|soda|soft drink|energy drink|maaza|frooti|slice)\b/i,
  Chocolate: /\b(chocolate|dairy milk|kitkat|kit kat|5 star|munch|snickers|mars|perk|galaxy|nutella)\b/i,
  'Ice cream': /\b(ice ?cream|kulfi|cornetto|magnum|frozen dessert)\b/i,
  Biscuits: /\b(biscuits?|cookies?|oreo|bourbon|hide ?& ?seek|good ?day|parle[- ]?g|marie|cream crackers?)\b/i,
};
const TYPICAL = { // per 100 g / ml, used only when the label value is missing
  Chips: { sodium: 650, sat: 12, nova: 4, kcal: 540 }, Namkeen: { sodium: 900, sat: 13, nova: 4, kcal: 560 }, Snacks: { sodium: 700, sat: 10, nova: 4, kcal: 520 },
  'Instant food': { sodium: 1000, sat: 7, nova: 4, kcal: 440 }, Drinks: { sodium: 15, sat: 0, nova: 4, kcal: 42 }, Chocolate: { sodium: 90, sat: 18, nova: 4, kcal: 530 },
  'Ice cream': { sodium: 80, sat: 8, nova: 4, kcal: 210 }, Biscuits: { sodium: 380, sat: 10, nova: 4, kcal: 480 }, Sweets: { sodium: 60, sat: 3, nova: 4, kcal: 390 }, Bakery: { sodium: 350, sat: 8, nova: 4, kcal: 420 },
};
const CAPS = { Chips: 3, Namkeen: 3, Snacks: 3.5, 'Instant food': 3, Drinks: 3, Chocolate: 3, 'Ice cream': 3, Biscuits: 3.5, Sweets: 3, Bakery: 3.5 };
const cache = new WeakMap();

export function normalize(p) {
  if (!p || typeof p !== 'object') return p;
  if (p._norm) return p;
  if (cache.has(p)) return cache.get(p);
  const text = `${p.brand || ''} ${p.name || ''}`;
  let type = TYPICAL[p.cat] ? p.cat : null;
  if (!type || type === 'Snacks') for (const [t, re] of Object.entries(JUNK_RE)) if (re.test(text)) { type = t; break; }
  const n = { ...(p.n || {}) };
  const est = [];
  const has = (k) => n[k] != null && n[k] !== '' && !isNaN(+n[k]);
  const T = type ? TYPICAL[type] : null;
  const drink = !!p.drink || type === 'Drinks';

  // Typing errors in crowd-sourced data, fixed before scoring so they can never flip a verdict
  for (const k of ['kcal', 'fat', 'sat', 'carbs', 'sugar', 'fibre', 'protein', 'sodium']) if (has(k) && +n[k] < 0) n[k] = null;
  if (has('sodium') && +n.sodium > 5000 && !/salt|sauce|chutney|pickle|soup|seasoning|masala powder/i.test(text + ' ' + (p.cat || ''))) {
    n.sodium = Math.round(+n.sodium / 1000 * 10) / 10; est.push('Salt value on the label data looked mistyped, so it was corrected');
  }
  if (has('sugar') && has('carbs') && +n.carbs > 0 && +n.sugar > +n.carbs) { n.sugar = +n.carbs; est.push('Sugar was higher than total carbs in the label data, so it was corrected'); }
  if (has('sat') && has('fat') && +n.sat > +n.fat) n.sat = +n.fat;
  if (drink && has('sugar') && +n.sugar > 30 && has('kcal') && +n.kcal < 80) { n.sugar = Math.round(+n.kcal / 4 * 10) / 10; est.push('Sugar value did not match the calories, so it was corrected'); }

  // Values entered per serving instead of per 100 g (e.g. 133 kcal for chips)
  if (T && !drink && has('kcal') && +n.kcal > 0 && +n.kcal < T.kcal * 0.45) {
    const f = T.kcal / +n.kcal;
    for (const k of ['kcal', 'fat', 'sat', 'carbs', 'sugar', 'fibre', 'protein', 'sodium']) if (has(k)) n[k] = Math.round(+n[k] * f * 10) / 10;
    est.push('Label values looked like per serving, so they were converted to per 100 g');
  }
  // Energy from fat, carbs and protein when kcal is missing or impossible
  const macro = (+n.fat || 0) * 9 + (+n.carbs || 0) * 4 + (+n.protein || 0) * 4;
  if ((!has('kcal') || +n.kcal < macro * 0.6) && macro > 0) { n.kcal = Math.round(macro); est.push('Calories worked out from fat, carbs and protein'); }
  if (T) {
    if (!has('sodium')) { n.sodium = T.sodium; est.push(`Salt not on the label data, so we used a typical ${type.toLowerCase()} value (${T.sodium} mg per 100 g)`); }
    if (!has('sat') && (!drink)) { n.sat = has('fat') ? Math.round(+n.fat * 0.35 * 10) / 10 : T.sat; est.push('Saturated fat estimated (most Indian snacks use palm oil)'); }
    if (!has('kcal')) { n.kcal = T.kcal; est.push('Calories estimated for this type of food'); }
  }
  const missing = ['sugar', 'sodium', 'fat', 'kcal'].filter((k) => !has(k) && n[k] == null).length;
  const out = { ...p, n, _norm: true, _type: type, _est: est, _cap: type ? CAPS[type] : null, _incomplete: missing >= 2 || (!p.ing || !p.ing.length) && missing >= 1 };
  if (p.nova == null && T) { out.nova = T.nova; out._novaEst = true; }
  if (est.length) out.approx = true;
  cache.set(p, out);
  return out;
}

// Score one audience. Returns { score, verdict, reasons:[{t, s:'bad'|'ok'|'good'}], breakdown:[{label, delta}] }
export function scoreFor(p, who = 'adult', profile = {}) {
  p = normalize(p);
  const n = p.n || {};
  const L = LIMITS[who];
  const drink = !!p.drink;
  const conds = new Set(profile.conditions || []);
  const kid = who === 'child';
  const br = [];
  const reasons = [];
  let s = 5;
  const add = (label, d) => { if (d) { s += d; br.push({ label, delta: r1(d) }); } };

  // Sugar
  const sug = n.sugar || 0;
  const sugW = conds.has('diabetes') ? 1.5 : 1;
  const sHigh = drink ? 8 : kid ? 10 : 22.5, sMed = drink ? 5 : 5;
  if (sug > sHigh) { add('High sugar', -1.5 * sugW); reasons.push({ s: 'bad', t: `Sugar ${r1(sug)} g per 100${drink ? ' ml' : ' g'} is high — one pack (${p.packG} ${drink ? 'ml' : 'g'}) gives ${r1(sug * p.packG / 100)} g, about ${pct(sug * p.packG / 100, L.sugar)}% of a${kid ? ' child' : 'n adult'}'s daily added-sugar limit.` }); }
  else if (sug > sMed) { add('Some sugar', -0.6 * sugW); reasons.push({ s: 'ok', t: `Sugar ${r1(sug)} g per 100${drink ? ' ml' : ' g'} is moderate.` }); }
  else reasons.push({ s: 'good', t: `Low sugar (${r1(sug)} g per 100${drink ? ' ml' : ' g'}).` });
  if (!drink && sug > 45) { add('Mostly sugar', -1 * sugW); reasons.push({ s: 'bad', t: `About ${Math.round(sug)}% of this is sugar.` }); }
  if (drink && sug > 8) { add('Sugary drink', -1 * sugW); reasons.push({ s: 'bad', t: `Sugary drink — liquid sugar is absorbed fast and does not keep you full. ${r1(sug * p.packG / 100 / 4)} teaspoons of sugar in one ${p.packG} ml pack.` }); }

  // Sodium
  const na = n.sodium || 0;
  const naW = conds.has('bp') ? 1.5 : 1;
  const naHigh = kid ? 300 : 600, naMed = kid ? 150 : 300;
  const packNa = na * (p.packG || 100) / 100;
  if (na > naHigh) { add('High salt/sodium', -1.5 * naW); reasons.push({ s: 'bad', t: `Sodium ${Math.round(na)} mg per 100 g is high — one pack has ${Math.round(packNa)} mg, about ${pct(packNa, L.sodium)}% of a${kid ? ' child' : 'n adult'}'s daily limit (${L.sodium} mg).` }); }
  else if (na > naMed) { add('Moderate salt', -0.7 * naW); reasons.push({ s: 'ok', t: `Sodium ${Math.round(na)} mg per 100 g is moderate (${pct(packNa, L.sodium)}% of daily limit per pack).` }); }
  else reasons.push({ s: 'good', t: `Low sodium (${Math.round(na)} mg per 100 g).` });

  // Saturated fat & fat
  const sat = n.sat || 0;
  const satW = conds.has('heart') ? 1.5 : 1;
  if (sat > 5) { add('High saturated fat', -1 * satW); reasons.push({ s: 'bad', t: `Saturated fat ${r1(sat)} g per 100 g is high — the pack gives ${pct(sat * p.packG / 100, L.sat)}% of the daily limit. Often from palm oil.` }); }
  else if (sat > 1.5) { add('Some saturated fat', -0.4 * satW); reasons.push({ s: 'ok', t: `Saturated fat ${r1(sat)} g per 100 g is moderate.` }); }
  if ((n.fat || 0) > 17.5 && !drink) add('High total fat', -0.4);

  // Energy density
  const kcalW = conds.has('weightloss') ? 1.6 : 1;
  if (!drink && (n.kcal || 0) > 450) { add('Very energy-dense', -0.5 * kcalW); reasons.push({ s: conds.has('weightloss') ? 'bad' : 'ok', t: `${Math.round(n.kcal)} kcal per 100 g — easy to overeat; one pack is ${Math.round(n.kcal * p.packG / 100)} kcal.` }); }

  // Positives
  if ((n.fibre || 0) >= 6) { add('High fibre', +0.5); reasons.push({ s: 'good', t: `Good fibre (${r1(n.fibre)} g per 100 g) — keeps you full longer.` }); }
  else if ((n.fibre || 0) >= 3) add('Some fibre', +0.2);
  if ((n.protein || 0) >= 10) { add('Good protein', +0.5); reasons.push({ s: 'good', t: `Good protein (${r1(n.protein)} g per 100 g).` }); }
  else if ((n.protein || 0) >= 5 && !drink) add('Some protein', +0.15);

  // Additives & processing
  const adds = decodeIngredients(p.ing);
  const risky = adds.filter((a) => a.level >= 2);
  const kidBad = adds.filter((a) => a.level >= 3);
  if (risky.length) { add('Additives to limit', -Math.min(0.8, 0.25 * risky.length) * (kid ? 1.4 : 1)); reasons.push({ s: kid ? 'bad' : 'ok', t: `Contains ${risky.map((a) => a.name.split(' (')[0]).join(', ')}.` }); }
  if (kid && kidBad.length) { add('Not suited for kids', -1); reasons.push({ s: 'bad', t: `${kidBad.map((a) => a.name.split(' (')[0]).join(', ')} — best avoided for children.` }); }
  if (p.caffeine && (kid || conds.has('pregnancy'))) { add('Caffeine', -1); reasons.push({ s: 'bad', t: 'Contains caffeine — not recommended for children or during pregnancy.' }); }
  const proc = processing(p, adds);
  add(proc.level, -proc.pen);

  // Allergens from profile
  const al = detectAllergens(p).filter((a) => (profile.allergens || []).includes(a));
  if (al.length) { add('Your allergen', -3); reasons.unshift({ s: 'bad', t: `⚠ Contains ${al.join(', ')} — on your allergy list.` }); }

  // Fried snacks, sugary drinks, chocolate etc. can't be "Good", whatever the label says
  if (p._cap && s > p._cap) { add(`${p._type} are an occasional food`, p._cap - s); reasons.push({ s: 'ok', t: `${p._type} are best kept as an occasional treat, so the score is capped at ${p._cap}.` }); }
  if (!drink && sug >= 15 && s > 3.5) { add('Sweet food', 3.5 - s); reasons.push({ s: 'ok', t: 'Sweet foods are best as a small serving, so this cannot rate higher than 3.5.' }); }
  if (kid && p.caffeine && s > 2) { add('Caffeine (not for children)', 2 - s); }
  if (p._incomplete && s > 3.5) { add('Incomplete label data', 3.5 - s); reasons.push({ s: 'ok', t: 'Some nutrition values are missing in the database, so this score is kept cautious. Check the pack.' }); }
  (p._est || []).forEach((t) => reasons.push({ s: 'ok', t: `ℹ ${t}.` }));

  s = Math.max(1, Math.min(5, s));
  const score = Math.round(s * 2) / 2;
  const verdict = al.length ? 'Avoid' : score >= 3.75 ? 'Good' : score >= 2.5 ? 'Okay in moderation' : 'Avoid';
  return { score, verdict, reasons, breakdown: br, processing: proc.level, additives: adds, allergensHit: al };
}

// Icon for the kind of food (shown on product cards)
const TYPE_EMOJI = { Chips: '🍟', Namkeen: '🥨', Snacks: '🍿', 'Instant food': '🍜', Drinks: '🥤', 'Drinks mix': '🥛', Chocolate: '🍫', 'Ice cream': '🍦', Biscuits: '🍪', Sweets: '🍬', Bakery: '🧁', Breakfast: '🥣', Spreads: '🍯', Sauces: '🥫', Dairy: '🥛', 'Healthy snacks': '🥜' };
export function typeEmoji(p) { const q = normalize(p); return TYPE_EMOJI[q._type] || TYPE_EMOJI[q.cat] || '🛒'; }

export function verdictKey(v) { return v === 'Good' ? 'good' : v === 'Avoid' ? 'avoid' : 'okay'; }

// Healthier swaps: same or related category, higher adult score
export function swaps(p, all, profile) {
  const base = scoreFor(p, 'adult', profile).score;
  const related = { Chips: ['Healthy snacks', 'Namkeen', 'Snacks'], Snacks: ['Healthy snacks', 'Namkeen'], Namkeen: ['Healthy snacks'], Drinks: ['Dairy', 'Drinks'], 'Drinks mix': ['Dairy'], Biscuits: ['Breakfast', 'Healthy snacks'], 'Instant food': ['Breakfast'], Chocolate: ['Chocolate', 'Healthy snacks'] };
  const cats = new Set([p.cat, ...(related[p.cat] || [])]);
  return all
    .filter((q) => q.id !== p.id && cats.has(q.cat))
    .map((q) => ({ q, s: scoreFor(q, 'adult', profile).score }))
    .filter((x) => x.s > base)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
}

// Fuzzy match for AI-identified names. Never matches across sugar-free/diet variants
// (Sprite vs Sprite Zero), and prefers Indian-market products.
const VARIANT = /\b(zero|diet|sugar ?free|no added sugar|lite|light|unsweetened)\b/;
export function fuzzyFind(all, brand = '', name = '') {
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const qb = norm(brand), qn = norm(name);
  const qVar = (`${qb} ${qn}`.match(VARIANT) || [''])[0];
  const qWords = new Set(`${qb} ${qn}`.split(' ').filter((w) => w.length > 2 && !['the', 'and', 'style', 'flavour', 'flavor', 'wafers', 'chips'].includes(w)));
  let best = null, bestScore = 0;
  for (const p of all) {
    const pb = norm(p.brand), pn = norm(p.name);
    if (((`${pb} ${pn}`.match(VARIANT) || [''])[0]) !== qVar) continue;
    const words = new Set(`${pb} ${pn}`.split(' ').filter((w) => w.length > 2));
    let hit = 0; qWords.forEach((w) => { if (words.has(w)) hit++; });
    let sc = hit / Math.max(1, qWords.size);
    if (qb && (pb.includes(qb.split(' ')[0]) || qb.includes(pb.split(' ')[0]))) sc += 0.3;
    if (p.verified || p.india) sc += 0.1;
    if (sc > bestScore) { bestScore = sc; best = p; }
  }
  return bestScore >= 0.75 ? best : null;
}

// ---------------- Junk food meter ----------------
// Points from processing level (NOVA), sugar, saturated fat, salt, energy density,
// Nutri-Score and additives. 0-7 scale: >=3.5 junk, >=1.75 treat, else not junk.
export function junkMeter(p) {
  p = normalize(p);
  const n = p.n || {}, drink = !!p.drink || p._type === 'Drinks', why = [];
  let pts = 0;
  const add = (v, t) => { if (v) { pts += v; why.push(t); } };
  if (p.nova === 4) add(2, p._novaEst ? 'Ultra-processed (typical for this food)' : 'Ultra-processed (NOVA 4)'); else if (p.nova === 3) add(1, 'Processed (NOVA 3)');
  else if (p.nova == null) {
    const m = (p.ing || []).join(' ').toLowerCase();
    if (/maltodextrin|flavour enhancer|hydrolysed|emulsifier|colour|627|631|635/.test(m)) add(1.5, 'Ultra-processed ingredients');
    else if (['Chips', 'Chocolate', 'Sweets', 'Ice cream', 'Instant food', 'Bakery', 'Biscuits'].includes(p.cat)) add(1, 'Packaged snack food');
  }
  const sug = +n.sugar || 0;
  if (sug > (drink ? 8 : 22.5)) add(1.5, 'Lots of sugar'); else if (sug > (drink ? 4 : 10)) add(0.75, 'Added sugar');
  if ((+n.sat || 0) > 5) add(1, 'High saturated fat');
  const na = +n.sodium || 0;
  if (na > 600) add(1, 'High salt'); else if (na > 300) add(0.5, 'Salty');
  if (!drink && (+n.kcal || 0) > 450) add(0.5, 'Very high calories');
  if (!drink && (+n.fat || 0) > 25) add(0.5, 'Very high fat (often fried)');
  if (p.nutriscore === 'e') add(1, 'Nutri-Score E'); else if (p.nutriscore === 'd') add(0.5, 'Nutri-Score D');
  const risky = decodeIngredients(p.ing || []).filter((a) => a.level >= 2).length;
  if (risky) add(Math.min(1, risky * 0.3), 'Additives to limit');
  if ((+n.fibre || 0) >= 6) { pts -= 0.75; why.push('High fibre (−)'); }
  if ((+n.protein || 0) >= 10 && !drink) { pts -= 0.5; why.push('Good protein (−)'); }
  pts = Math.max(0, Math.min(7, Math.round(pts * 4) / 4));
  const level = pts >= 3.5 ? 'junk' : pts >= 1.75 ? 'treat' : 'ok';
  const label = { junk: 'Junk food', treat: 'Occasional treat', ok: 'Not junk' }[level];
  const emoji = { junk: '🍟', treat: '🍪', ok: '🥗' }[level];
  return { pts, level, label, emoji, why };
}
