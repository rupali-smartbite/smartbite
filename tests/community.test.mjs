// Run: node --import ./tests/loader.mjs tests/community.test.mjs
import assert from 'node:assert/strict';
const ENV = { ADMIN_KEY: 'my-very-secret-admin-key-2026' }; globalThis.Netlify = { env: { get: (k) => ENV[k] } };
const { checkSubmission, checkApproval } = await import('../netlify/lib/community.mjs');
const submit = (await import('../netlify/functions/submit-product.mjs')).default;
const community = (await import('../netlify/functions/community.mjs')).default;
const admin = (await import('../netlify/functions/admin.mjs')).default;
const { getStore } = await import('@netlify/blobs');
const O = 'https://smartbite-pro.netlify.app';
let n = 0; const ok = (m) => { n++; console.log('✓', m); };
const JPG = 'data:image/jpeg;base64,' + 'A'.repeat(4000);

// checks
assert.equal(checkSubmission({}).ok, false); ok('a front photo is required');
assert.equal(checkSubmission({ front: 'data:text/html;base64,PHNjcmlwdD4=' }).ok, false); ok('non-image data is refused');
assert.equal(checkSubmission({ front: 'data:image/jpeg;base64,' + 'A'.repeat(800000) }).ok, false); ok('oversized photo is refused');
let c = checkSubmission({ front: JPG, barcode: '89-0172-5100-001', brand: '<b>Hal</b>', read: { per100: { sugar: 12, sodium: 999999, kcal: 'x' }, ingredients: ['Gram flour', '<script>'] } });
assert.equal(c.ok, true); assert.equal(c.meta.barcode, '8901725100001'); assert.equal(c.meta.brand, 'b Hal /b'); assert.equal(c.meta.read.per100.sugar, 12); assert.equal(c.meta.read.per100.sodium, null); assert.equal(c.meta.read.per100.kcal, null);
ok('cleans barcode, strips tags, drops impossible numbers');
const goodN = { kcal: 540, fat: 33, sat: 14, carbs: 52, sugar: 3, fibre: 4, protein: 9, sodium: 900 };
assert.equal(checkApproval({ brand: 'X', name: 'Y', n: { ...goodN, sugar: 60 } }).ok, false); ok('approval refuses sugar > carbs');
assert.equal(checkApproval({ brand: 'X', name: 'Y', n: { ...goodN, sodium: '' } }).ok, false); ok('approval needs every number');
c = checkApproval({ brand: 'Haldiram', name: 'Aloo Bhujia', barcode: '8904004400762', packG: '200', n: goodN, ing: 'Potato, gram flour, oil' });
assert.equal(c.ok, true); assert.equal(c.product.id, 'cm-8904004400762'); assert.equal(c.product.verified, true); assert.deepEqual(c.product.ing, ['Potato', 'gram flour', 'oil']); ok('approved product is in app format, verified, with barcode id');

// endpoints
const post = (body, origin = O) => submit(new Request(O + '/api/submit-product', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) }), { ip: '1.2.3.4' });
let r = await post({ front: JPG }, 'https://evil.example'); assert.equal(r.status, 403); ok('other websites cannot submit');
r = await post({ front: JPG, back: JPG, barcode: '8904004400762', read: { brand: 'Haldiram', name: 'Aloo Bhujia', fromPack: true, per100: goodN } });
const sub = await r.json(); assert.equal(sub.ok, true); ok('submission stored');
const meta = await getStore({ name: 'submissions' }).get(sub.id, { type: 'json' });
assert.equal(meta.status, 'new'); assert.ok(!JSON.stringify(meta).includes('1.2.3.4')); assert.ok(!('front' in meta)); ok('no IP in the record; photos kept separately');
for (let i = 0; i < 7; i++) await post({ front: JPG });
r = await post({ front: JPG }); assert.equal(r.status, 429); ok('limited to 8 submissions a day per visitor');

const H = { 'x-admin-key': ENV.ADMIN_KEY };
const A = (path, body) => admin(new Request(O + path, body ? { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify(body) } : { headers: H }), { ip: '5.5.5.5' });
let j = await (await A('/api/admin?view=submissions')).json(); assert.equal(j.submissions.filter((x) => x.status === 'new').length, 8); ok('admin sees waiting requests');
j = await (await A('/api/admin?view=photos&id=' + sub.id)).json(); assert.equal(j.front, JPG); assert.equal(j.back, JPG); ok('admin can load the photos');
j = await (await A('/api/admin?view=overview')).json(); assert.equal(j.submissions.waiting, 8); ok('overview counts waiting requests');
r = await A('/api/admin', { action: 'approve-product', id: sub.id, product: { brand: 'Haldiram', name: 'Aloo Bhujia', n: { ...goodN, sugar: 99 } } }); assert.equal(r.status, 400); ok('bad numbers are not approved');
r = await A('/api/admin', { action: 'approve-product', id: sub.id, product: { brand: 'Haldiram', name: 'Aloo Bhujia', barcode: '8904004400762', packG: 200, n: goodN, ing: 'Potato, gram flour' } }); j = await r.json(); assert.equal(j.ok, true); ok('one-tap approve');
j = await (await community(new Request(O + '/api/community'))).json(); assert.equal(j.items.length, 1); assert.equal(j.items[0].barcode, '8904004400762'); assert.equal(j.items[0].n.sugar, 3); ok('approved product reaches every phone via /api/community');
assert.equal(await getStore({ name: 'submission-photos' }).get(sub.id), null); ok('photos deleted after approval');
const other = (await (await A('/api/admin?view=submissions')).json()).submissions.find((x) => x.status === 'new');
j = await (await A('/api/admin', { action: 'reject-product', id: other.id })).json(); assert.equal(j.ok, true); ok('reject works');
j = await (await A('/api/admin', { action: 'remove-product', productId: 'cm-8904004400762' })).json(); assert.equal(j.ok, true);
j = await (await community(new Request(O + '/api/community'))).json(); assert.equal(j.items.length, 0); ok('owner can remove a product again');
r = await admin(new Request(O + '/api/admin?view=submissions'), { ip: '6.6.6.6' }); assert.equal(r.status, 401); ok('requests are hidden without the admin key');
console.log(`\nAll ${n} community tests passed.`);
