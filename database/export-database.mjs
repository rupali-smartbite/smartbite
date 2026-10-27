import fs from 'fs';
// Run from the project folder: node database/export-database.mjs database/smartbite-database.json
const R=new URL('../', import.meta.url).pathname;
const { PRODUCTS, FRESH, ADDITIVES } = await import(R+'public/js/data.js');
const { scoreFor, junkMeter } = await import(R+'public/js/score.js');
const { SHOP, SHOP_CATS } = await import(R+'netlify/lib/shop.mjs');
const app = fs.readFileSync(R+'public/js/app.js','utf8');
const grab = (name) => { const i = app.indexOf(`const ${name} = `); let j = app.indexOf('\n};', i); let k = app.indexOf('\n];', i); const end = (j<0?1e9:j) < (k<0?1e9:k) ? j+3 : k+3; return Function(`return ${app.slice(i + `const ${name} = `.length, end-1)}`)(); };
const MEALS = grab('MEALS'), SWAP_IDEAS = grab('SWAP_IDEAS'), DISHES = grab('DISHES');
const products = PRODUCTS.map((p) => { const a = scoreFor(p,'adult',{}), c = scoreFor(p,'child',{}), j = junkMeter(p);
  return { id: p.id, brand: p.brand, name: p.name, category: p.cat, drink: !!p.drink, barcode: p.barcode || '', pack: p.packG, unit: p.drink ? 'ml' : 'g',
    kcal: p.n.kcal, fat: p.n.fat, sat_fat: p.n.sat, carbs: p.n.carbs, sugar: p.n.sugar, fibre: p.n.fibre, protein: p.n.protein, sodium_mg: p.n.sodium,
    nova: p.nova ?? '', caffeine: !!p.caffeine, veg: p.veg !== false, allergens: (p.allergens||[]).join(', '), ingredients: (p.ing||[]).join(', '),
    source: p.src || (p.approx ? 'Typical values (verify with pack)' : 'Pack label'), verified: !!p.verified || p.approx === false,
    adult_score: a.score, adult_verdict: a.verdict, child_score: c.score, child_verdict: c.verdict, junk_points: j.pts, junk_label: j.label }; });
const meals = Object.entries(MEALS).flatMap(([slot, list]) => list.map((m) => ({ meal: slot, diet: m.d, instead_of: m.from, try_this: m.to, why: m.why })));
const db = { exported_at: new Date().toISOString(), note: 'SmartBite built-in data. Products per 100 g (drinks per 100 ml).', products, fresh_foods: FRESH, additives: ADDITIVES.map(a=>({ name:a.name, codes:a.k.join(', '), what:a.what, level:a.level, note:a.note||'' })), meal_swaps: meals, swap_ideas: SWAP_IDEAS, dishes: Object.entries(DISHES).map(([id,d])=>({ id, name:d.name, serving:d.serve, kcal:d.kcal, salt_g:d.salt, sugar_g:d.sugar, fat_g:d.fat, verdict:d.v, tips:(d.tips||[]).join(' | '), swap:(d.swap||[]).join(' -> ') })), shop: SHOP.map(s=>({ id:s.id, name:s.name, brand:s.brand, category:s.cat, size:s.size, price_inr:s.price, mrp_inr:s.mrp, verdict:s.verdict, sample:s.sample, highlights:s.highlights.join(', ') })) };
fs.writeFileSync(process.argv[2], JSON.stringify(db, null, 2));
console.log(Object.fromEntries(Object.entries(db).filter(([k,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length])));
