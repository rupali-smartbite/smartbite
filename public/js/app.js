import { PRODUCTS, FRESH, ALLERGENS, companyOf } from './data.js';
import { scoreFor, verdictKey, swaps, fuzzyFind, decodeIngredients, detectAllergens, dietFlags, LIMITS, junkMeter, typeEmoji, normalize } from './score.js';
import { T } from './i18n.js';
import { checkEnquiry, checkName, checkCompany, checkEmail, checkPhone, checkMessage } from './validate.js';

const API = (window.__HATCHABLE__ && window.__HATCHABLE__.api) || '/api';
const $ = (s, el = document) => el.querySelector(s);
const view = () => $('#view');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r1 = (x) => (x == null || isNaN(x) ? '—' : Math.round(x * 10) / 10);
const today = () => new Date().toISOString().slice(0, 10);
const reduceMotion = () => (typeof S !== 'undefined' && S.profile.motion === 'reduce') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// ---------------- Storage ----------------
const store = {
  get(k, d) { try { const v = localStorage.getItem('sb_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('sb_' + k, JSON.stringify(v)); } catch {} },
};
const S = {
  profile: { name: '', age: 'adult', conditions: [], allergens: [], diet: 'veg', lang: 'en', theme: 'auto', palette: 'masala', ...store.get('profile', {}) },
  plan: store.get('plan', 'free'),
  history: store.get('history', []),
  compare: store.get('compare', []),
  tracker: store.get('tracker', []),
  custom: store.get('custom', []),
  aiCount: store.get('aiCount', { day: today(), n: 0 }),
  upsold: store.get('upsold', false),
  session: store.get('session', null),
  coins: store.get('coins', { bal: 0, log: [] }),
  days: store.get('days', []),
  cart: store.get('cart', []),
  ship: store.get('ship', {}),
  current: null,
};
const save = (k) => store.set(k, S[k]);
const t = (k) => (T[S.profile.lang] || T.en)[k] || T.en[k] || k;
const allProducts = () => [...S.custom, ...PRODUCTS];
const findProduct = (id) => allProducts().find((p) => p.id === id);
async function apiGet(path) {
  const r = await fetch(API + path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) { const e = new Error(j.error || 'Could not load. Check your connection.'); e.status = r.status; throw e; }
  return j;
}
async function openBarcode(bc) {
  const local = allProducts().find((p) => p.barcode === bc && p.ing && p.ing.length);
  if (local) return showProduct(local, local.src || 'Our database');
  const done = showAnalysing('packet', 'Fetching product…');
  try { const { product } = await apiGet('/products/' + encodeURIComponent(bc)); showProduct(product, 'Open Food Facts'); }
  catch (e) { toast(e.status === 404 ? 'Not in any food database yet. Take a photo of the packet.' : e.message, 'bad'); if (e.status === 404) location.hash = '#/scan/packet'; }
  finally { done(); }
}

// ---------------- Imagery ----------------
const CAT_IMG = { Chips: 'chips', Snacks: 'samosa', Namkeen: 'spread', 'Healthy snacks': 'fruits', Biscuits: 'sweets', Breakfast: 'dosa', 'Instant food': 'spices', Dairy: 'drink', Drinks: 'drink', 'Drinks mix': 'drink', Chocolate: 'sweets', Sauces: 'spices', 'Packaged food': 'chips', 'Ice cream': 'sweets', Sweets: 'sweets', Bakery: 'sweets', Spreads: 'sweets' };
// Photos (Unsplash) and videos (Pexels) load straight from their free CDNs.
const IMG_SRC = { thali: '1546833999-b9f581a1996d', spices: '1716816211590-c15a328a5ff0', market: '1697425206245-250e9c651119', panipuri: '1781243680771-1fea4521e196', vadapav: '1750767397012-3413ba4fdbc7', samosa: '1601050690597-df0568f70950', dosa: '1668236543090-82eba5ee5976', fruits: '1619566636858-adf3ef46400b', salad: '1512621776951-a57141f2eefd', chips: '1760997707695-f0b5527e5de9', sweets: '1758910536889-43ce7b3199fd', drink: '1527960471264-932f39eb5846', spread: '1585937421612-70a008356fbe' };
const pic = (k) => (IMG_SRC[k] ? `https://images.unsplash.com/photo-${IMG_SRC[k]}?w=900&q=70&auto=format&fit=crop` : `/img/${k}.jpg`);
const VID_SRC = { thali: '34877658/14777959_540_960_30fps', street: '34705782/14710715_540_960_30fps', vadapav: '39873486/17004108_540_960_30fps' };
const vid = (k) => `https://videos.pexels.com/video-files/${VID_SRC[k]}.mp4`;
const catImg = (p) => pic(CAT_IMG[p && p.cat] || 'spread');
// Product photos go through Netlify Image CDN: the biggest Open Food Facts photo is fetched
// once, cached at the edge and served as a sharp, small WebP sized for the screen.
const ON_NETLIFY = /netlify\.app$|smartbite/.test(location.hostname) && location.hostname !== 'localhost';
function sharp(url, w = 360) {
  if (!url || !ON_NETLIFY || !/^https:\/\/images\.openfoodfacts\.org\//.test(url)) return url;
  const big = url.replace(/\.(100|200)\.jpg$/, '.400.jpg'); // the 400 px original is fast to fetch and still sharp
  return `/.netlify/images?url=${encodeURIComponent(big)}&w=${w}&fm=webp&q=80`;
}
// Image/video events without inline handlers (keeps the Content-Security-Policy strict)
document.addEventListener('load', (e) => { const el = e.target; if (el && el.hasAttribute && el.hasAttribute('data-ld')) el.classList.add('ok'); }, true);
document.addEventListener('error', (e) => { const el = e.target; if (el && el.tagName === 'IMG' && el.dataset.fb && el.src !== el.dataset.fb) { el.src = el.dataset.fb; delete el.dataset.fb; el.classList.add('ok'); } }, true);
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-back]'); if (b && history.length > 1) { e.preventDefault(); history.back(); } });
document.addEventListener('playing', (e) => { const el = e.target; if (el && el.hasAttribute && el.hasAttribute('data-play')) el.classList.add('on'); }, true);
// Short free clips (Pexels) with a food fact on each, shown as swipeable stories on Home
const STORIES = [
  { v: '8879794/8879794-sd_338_640_25fps', img: 124, tag: '🥤 Cola', big: '≈ 9 tsp', t: 'of sugar in one 330 ml can of cola', c: '#E63946' },
  { v: '10973447/10973447-sd_640_360_30fps', img: 100, tag: '🍟 Chips', big: 'up to ⅓', t: "of a child's daily salt in one 52 g pack of masala chips", c: '#FB8500' },
  { v: '5987260/5987260-sd_640_360_25fps', img: 112, tag: '🍬 Sugar', big: '6 tsp', t: "of added sugar a day is WHO's ideal limit for adults", c: '#FF5D8F' },
  { v: '35675125/15117993_360_640_60fps', img: 127, tag: '🍎 Fresh', big: '0 labels', t: 'to read on fresh fruit and veg. Scan your plate to see why', c: '#20B26B' },
  { v: '5025935/5025935-sd_640_360_30fps', img: 144, tag: '🥗 Plate', big: '½ plate', t: 'should be vegetables and fruit, says ICMR-NIN', c: '#2F80ED' },
  { v: '4712018/4712018-sd_338_640_25fps', img: 113, tag: '🧒 Kids', big: 'Swap it', t: 'Chips for fruit, cola for lassi. Compare any two products', c: '#8E3FC9' },
];
const storyCard = (s) => `<article class="story" style="--sc:${s.c}"><img class="st-poster" src="${mealImg(s.img)}" alt="" loading="lazy"><video muted playsinline loop preload="none" data-src="https://videos.pexels.com/video-files/${s.v}.mp4" aria-hidden="true" data-play></video><span class="st-tag">${s.tag}</span><div class="st-txt"><b class="st-big">${esc(s.big)}</b><span>${esc(s.t)}</span></div></article>`;
// Play story videos only while they are on screen (saves data), and reveal sections as you scroll
let storyObs = null, revealObs = null;
function wireMotion(root) {
  if (storyObs) storyObs.disconnect();
  if (revealObs) revealObs.disconnect();
  if (!('IntersectionObserver' in window)) { root.querySelectorAll('.reveal').forEach((el) => el.classList.add('in')); return; }
  storyObs = new IntersectionObserver((ents) => ents.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting) { if (!v.src) v.src = v.dataset.src; if (!reduceMotion()) v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.35 });
  root.querySelectorAll('.story video').forEach((v) => storyObs.observe(v));
  revealObs = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); } }), { threshold: 0.12 });
  root.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));
  root.querySelectorAll('[data-count]').forEach((el) => {
    const o = new IntersectionObserver(([en]) => { if (!en.isIntersecting) return; o.disconnect(); countUp(el); }, { threshold: 0.5 }); o.observe(el);
  });
}
// ---------------- Fruit basket (tiny physics toy) ----------------
const FRUITS = ['🍎', '🍌', '🥭', '🍊', '🍇', '🍉', '🍓', '🥕', '🥦', '🍅', '🥒', '🍐', '🍍', '🫐', '🥝', '🌽', '🍋', '🫛', '🍆', '🥥'];

function countUp(el) {
  const end = +el.dataset.count, suf = el.dataset.suffix || '';
  const dp = (el.dataset.count.split('.')[1] || '').length;
  const fmt = (v) => v.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp }) + suf;
  if (reduceMotion()) { el.textContent = fmt(end); return; }
  const t0 = performance.now(), dur = 1400;
  const step = (now) => { const k = Math.min(1, (now - t0) / dur); const v = end * (1 - Math.pow(1 - k, 3)); el.textContent = fmt(dp ? Math.round(v * 10 ** dp) / 10 ** dp : Math.round(v)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const imgFor = (p) => (p && sharp(p.img || p.imgSmall, 160)) || catImg(p);
const JUNK_COLOR = { junk: '#E63946', treat: '#FB8500', ok: '#20B26B' };
const junkBadge = (p, small = false) => { const j = junkMeter(p); return `<span class="junk-badge jb-${j.level}${small ? ' sm' : ''}">${j.emoji} ${esc(j.label)}</span>`; };
const VCOLOR = { good: '#20B26B', okay: '#FB8500', avoid: '#E63946' };
const AV_COLORS = ['#5B2A86', '#E63946', '#FB8500', '#20B26B', '#2F80ED', '#FF5D8F'];

// ---------------- UI helpers ----------------
function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.textContent = msg; el.setAttribute('role', 'status');
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3200);
}
function modal(html) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) wrap.remove(); });
  document.body.appendChild(wrap);
  return wrap;
}
function confetti(kind = 'good') {
  if (reduceMotion()) return;
  // Plain paper confetti in the app's colours (no emojis)
  const cols = kind === 'good' ? ['#20B26B', '#FFB703', '#2F80ED', '#FF5D8F', '#8E3FC9'] : ['#FFB703', '#FB8500', '#FF5D8F', '#8E3FC9'];
  const box = document.createElement('div'); box.className = 'confetti';
  for (let i = 0; i < 40; i++) {
    const it = document.createElement('i');
    it.style.left = Math.random() * 100 + '%';
    it.style.background = cols[i % cols.length];
    it.style.width = 6 + Math.random() * 6 + 'px';
    it.style.height = 10 + Math.random() * 8 + 'px';
    it.style.borderRadius = Math.random() < 0.3 ? '50%' : '2px';
    it.style.animationDuration = 2 + Math.random() * 1.8 + 's';
    it.style.animationDelay = Math.random() * 0.6 + 's';
    box.appendChild(it);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4600);
}
const scoreColor = (s) => (s >= 3.75 ? VCOLOR.good : s >= 2.5 ? VCOLOR.okay : VCOLOR.avoid);
function ring(score, size = 104, label = '') {
  const r = size / 2 - 7, C = 2 * Math.PI * r;
  return `<div class="ring" data-score="${score}" style="--s:${size}px;--c:${scoreColor(score)}" role="img" aria-label="${label ? esc(label) + ' ' : ''}score ${score.toFixed(1)} out of 5">
    <svg viewBox="0 0 ${size} ${size}"><circle class="trk" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="val" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-c="${C}"/></svg>
    <div class="ring-in"><b class="num">0.0</b><small>/5</small></div></div>`;
}
function animateRings(root = document) {
  root.querySelectorAll('.ring[data-score]').forEach((el) => {
    const s = +el.dataset.score, val = el.querySelector('.val'), num = el.querySelector('.num'), C = +val.dataset.c;
    requestAnimationFrame(() => requestAnimationFrame(() => { val.style.strokeDashoffset = C * (1 - s / 5); }));
    if (reduceMotion()) { num.textContent = s.toFixed(1); return; }
    const t0 = performance.now(), dur = 1200;
    const step = (now) => { const k = Math.min(1, (now - t0) / dur); num.textContent = (s * (1 - Math.pow(1 - k, 3))).toFixed(1); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  root.querySelectorAll('.mbar i[data-w]').forEach((i) => requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = i.dataset.w + '%'; })));
}
const vPill = (v) => `<span class="pill v-${verdictKey(v)}">${esc(t(verdictKey(v)))}</span>`;
const stars = (n) => `<span class="stars" aria-label="${n} out of 5 stars">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= Math.round(n) ? '' : 'off'}">★</span>`).join('')}</span>`;
const PALETTES = [
  ['masala', 'Masala', ['#5B2A86', '#FFB703', '#E63946', '#20B26B']],
  ['mango', 'Mango', ['#E85D04', '#FFD60A', '#D00000', '#F48C06']],
  ['ocean', 'Ocean', ['#0B5ED7', '#FFD166', '#00B4D8', '#06D6A0']],
  ['rose', 'Rose', ['#C9184A', '#FFB3C1', '#FF4D6D', '#FF8FA3']],
  ['pista', 'Pista', ['#2D6A4F', '#B7E4C7', '#40916C', '#95D5B2']],
  ['neon', 'Neon', ['#7209B7', '#4CC9F0', '#F72585', '#4361EE']],
  // Soft Indian pastels: tinted background, hero and menu bar in light mode; dark mode keeps dark backgrounds
  ['kesar', 'Kesar Cream', ['#FCEBD3', '#B45309', '#F6C77D', '#FFF8EE']],
  ['pudina', 'Pudina Mint', ['#DAF2E6', '#047857', '#8FD9B6', '#F0FAF5']],
  ['neela', 'Neela Sky', ['#DCEBFB', '#1D4ED8', '#93BDF5', '#F0F7FF']],
  ['gulabi', 'Gulabi', ['#FCE1EA', '#BE185D', '#F5A3C0', '#FFF2F6']],
  ['jamuni', 'Jamuni Lilac', ['#EBE1FC', '#6D28D9', '#C4B0F5', '#F7F2FF']],
  ['chandan', 'Chandan', ['#F1E7D9', '#8B5E34', '#D9BE98', '#FBF7F1']],
];
function applyTheme() {
  const th = S.profile.theme;
  const h = new Date().getHours();
  document.documentElement.setAttribute('data-theme', th === 'auto' ? (h >= 19 || h < 6 ? 'dark' : 'light') : th);
  const OLD_PAL = { peach: 'kesar', mint: 'pudina', lavender: 'jamuni', sky: 'neela', blush: 'gulabi', lemon: 'chandan' };
  if (OLD_PAL[S.profile.palette]) { S.profile = { ...S.profile, palette: OLD_PAL[S.profile.palette] }; store.set('profile', S.profile); }
  document.documentElement.setAttribute('data-palette', 'masala'); // one SmartBite brand palette everywhere
  if (!document.documentElement.dataset.brand) document.documentElement.setAttribute('data-brand', 'green');
  document.documentElement.setAttribute('data-text', S.profile.textSize || 'normal');
  document.documentElement.setAttribute('data-motion', S.profile.motion || 'auto');
  if (!document.body.classList.contains('theme-ready')) setTimeout(() => document.body.classList.add('theme-ready'), 600); // no colour fade on first load
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = document.documentElement.dataset.brand === 'blue' ? '#1A5BB0' : '#17784A';
  document.documentElement.lang = S.profile.lang;
}

// ---------------- Images ----------------
async function fileToB64(file, max = 1280) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL('image/jpeg', 0.82);
    return { data: dataUrl.split(',')[1], mediaType: 'image/jpeg', preview: dataUrl };
  } finally { URL.revokeObjectURL(url); }
}

// ---------------- AI ----------------
function aiAllowed() {
  if (S.aiCount.day !== today()) S.aiCount = { day: today(), n: 0 };
  if (S.plan === 'free' && S.aiCount.n >= 5) { upsell(true); return false; }
  return true;
}
function countAI() {
  S.aiCount.n++; save('aiCount');
  if (S.plan === 'free' && S.aiCount.n === 4 && !S.upsold) { S.upsold = true; save('upsold'); setTimeout(() => upsell(false), 1500); }
}
async function callAI(mode, images, hint = '') {
  const r = await fetch(API + '/analyze', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, lang: S.profile.lang, hint, images: images.map(({ data, mediaType }) => ({ data, mediaType })) }),
  });
  let j = {};
  try { j = await r.json(); } catch {}
  if (!r.ok || !j.ok) { const e = new Error(j.error || 'AI analysis failed. Please try again.'); e.setup = !!j.setup; throw e; }
  countAI();
  return j.result;
}
function showAnalysing(mode, title) {
  const set = { packet: ['🥔', '🧂', '🍫', '🥤'], plate: ['🍛', '🫓', '🥗', '🍚'], label: ['🧪', '🌶️', '🧂', '🌾'] }[mode] || ['🥕', '🍎', '🥦', '🍌'];
  const el = document.createElement('div');
  el.className = 'analysing';
  el.innerHTML = `<div><div class="orbit">${set.map((e) => `<span>${e}</span>`).join('')}</div><b>${esc(title || t('analysing'))}</b><p class="small" style="opacity:.8;margin-top:6px">${title ? 'Checking the world food database' : 'Reading every ingredient for you'}</p></div>`;
  document.body.appendChild(el);
  return () => el.remove();
}

// Product data comes from /api/products, which reads Open Food Facts live.

// ---------------- Records ----------------
function remember(p, source) {
  if (!findProduct(p.id) && !PRODUCTS.some((q) => q.id === p.id)) { S.custom.unshift({ ...p, src: source }); S.custom = S.custom.slice(0, 200); save('custom'); }
  const a = scoreFor(p, 'adult', S.profile);
  S.history = [{ kind: 'product', id: p.id, title: `${p.brand} ${p.name}`, cat: p.cat, imgSmall: p.imgSmall || null, score: a.score, verdict: a.verdict, at: Date.now() }, ...S.history.filter((h) => h.id !== p.id)].slice(0, 50);
  save('history');
}
function showProduct(p, source) {
  p = normalize({ packG: 50, n: {}, ing: [], allergens: [], ...p });
  remember(p, source);
  S.current = { kind: 'product', data: p, source };
  sessionStorage.setItem('sb_current', JSON.stringify(S.current));
  location.hash = '#/result';
}

// ---------------- Nav ----------------
const ICONS = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
  scan: '<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M7 12h10"/>',
  tracker: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  game: '<path d="M12 7.5c-1.6-1.9-5.2-1.8-6.2 1.1-1.1 3.3 1.2 9.3 4.2 10.3 1 .3 1.5-.3 2-.3s1 .6 2 .3c3-1 5.3-7 4.2-10.3-1-2.9-4.6-3-6.2-1.1z"/><path d="M12 7.5c.1-2 1.2-3.3 3-4"/>',
  swapday: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  shop: '<path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
};
function renderNav(active) {
  const tabs = [['home', '#/home'], ['explore', '#/explore'], ['shop', '#/shop'], ['scan', '#/scan/packet'], ['swapday', '#/swaps'], ['tracker', '#/tracker'], ['profile', '#/profile']];
  $('#nav').innerHTML = tabs.map(([k, href]) => `<a href="${href}" class="${k === 'scan' ? 'fab ' : ''}${active === k ? 'on' : ''}" aria-label="${esc(t(k))}" ${active === k ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg><span>${esc(t(k))}</span></a>`).join('');
}

// ---------------- Sponsor ----------------
const sponsorCard = () => `<a class="card sponsor" href="#/partner"><img src="${pic('market')}" alt="" loading="lazy"><div><span class="tag">${esc(t('sponsored'))}</span><b>Your healthy brand here</b><p>Reach families at the moment they choose. Partner with SmartBite.</p></div></a>`;
function todayEntries() { const d = today(); return S.tracker.filter((e) => e.day === d); }

// ---------------- Home ----------------
const HERO_CLIPS = [
  { v: vid('thali'), p: pic('thali'), label: '🍛 Thali', href: '#/dish/thali', cta: 'See thali facts' },
  { v: vid('street'), p: pic('samosa'), label: '🔥 Street snacks', href: '#/dish/panipuri', cta: 'See street food facts' },
  { v: vid('vadapav'), p: pic('vadapav'), label: '🍔 Vada pav', href: '#/dish/vadapav', cta: 'See vada pav facts' },
  { p: `${API}/asset/hero-1`, label: '🌅 Breakfast swaps', href: '#/swaps', cta: "See today's swaps" },
  { p: `${API}/asset/hero-2`, label: '🍟 Junk food explorer', href: '#/explore', cta: 'Check your snack' },
  { p: `${API}/asset/hero-3`, label: '🥭 Fresh & seasonal', href: '#/dish/fruits', cta: 'Why fresh wins' },
];
let heroTimer = null;
function stopHero() { if (heroTimer) { clearInterval(heroTimer); heroTimer = null; } }
function startHero() {
  stopHero();
  const posters = [...view().querySelectorAll('.hero .poster')];
  const dots = [...view().querySelectorAll('.hero-dots i')];
  const lbl = view().querySelector('.vid-label');
  if (!posters.length) return;
  let i = 0;
  const show = (n) => {
    i = n;
    HERO_CLIPS.forEach((c, k) => {
      const v = view().querySelector(`.hero video[data-k="${k}"]`);
      if (k === n) {
        // The photo shows straight away; the video fades in on top only once it really plays
        // (so slow networks or blocked video sites never leave the banner blank).
        posters[k].classList.add('on');
        if (v && !reduceMotion()) { v.onplaying = () => v.classList.add('on'); try { v.currentTime = 0; } catch {} v.play().catch(() => {}); }
      } else { posters[k].classList.remove('on'); if (v) { v.classList.remove('on'); v.pause(); } }
    });
    dots.forEach((d, k) => { d.classList.remove('on'); if (k === n) { void d.offsetWidth; d.classList.add('on'); } });
    if (lbl) { lbl.innerHTML = `${esc(HERO_CLIPS[n].label)} <b>${esc(HERO_CLIPS[n].cta)} ›</b>`; lbl.href = HERO_CLIPS[n].href; }
  };
  dots.forEach((d, k) => (d.onclick = () => { show(k); restart(); }));
  const restart = () => { stopHero(); heroTimer = setInterval(() => show((i + 1) % HERO_CLIPS.length), 6000); };
  show(0); restart();
}

// ---------------- Dish pages (typical values per serving, compared with WHO daily limits) ----------------
// WHO: salt under 5 g a day, free sugars under 50 g and ideally under 25 g, total fat under about 30% of energy (≈ 67 g on 2000 kcal).
const WHO = { kcal: 2000, salt: 5, sugar: 25, fat: 67 };
const DISHES = {
  thali: { name: 'Veg thali', img: 'thali', serve: '2 roti, rice, dal, sabzi, curd', kcal: 650, salt: 3, sugar: 6, fat: 20, v: 'Good', freeSugar: true,
    tips: ['A balanced plate: grains, dal for protein, sabzi and curd.', 'Go easy on the papad, pickle and extra ghee: that is where most of the salt and fat hide.', 'Make half the plate vegetables, as ICMR-NIN suggests.'], swap: ['Extra papad and pickle', 'A bowl of salad or kachumber'] },
  panipuri: { name: 'Pani puri', img: 'panipuri', serve: '6 puris', kcal: 230, salt: 1.5, sugar: 6, fat: 9, v: 'Treat', freeSugar: true,
    tips: ['The puris are deep-fried and the sweet chutney adds sugar.', 'Street pani can carry germs: pick a stall that uses filtered water.', 'Fine as an occasional treat, not a meal.'], swap: ['Pani puri', 'Sprouts chaat or a fruit chaat'] },
  fruits: { name: 'Fresh fruit bowl', img: 'fruits', serve: '1 bowl, about 200 g', kcal: 110, salt: 0, sugar: 20, fat: 0.5, v: 'Good', freeSugar: false,
    tips: ['Fruit sugar comes with fibre, so it does not count as "free sugar" in WHO advice.', 'Eat whole fruit rather than juice to keep the fibre.', 'Pick seasonal fruit: it is fresher, cheaper and tastier.'], swap: ['Packaged fruit juice', 'A whole fruit'] },
  chips: { name: 'Salted chips', img: 'chips', serve: '1 small pack, 52 g', kcal: 280, salt: 1.2, sugar: 1, fat: 18, v: 'Junk', freeSugar: true,
    tips: ['High in fat and salt for a small pack, with almost no protein or fibre.', 'Easy to overeat: the pack feels light but adds up fast.', 'Scan the packet to see its exact score.'], swap: ['Salted potato chips', 'Roasted chana or makhana'] },
  dosa: { name: 'Plain dosa with sambar', img: 'dosa', serve: '1 dosa, sambar and chutney', kcal: 300, salt: 1.8, sugar: 3, fat: 10, v: 'Good', freeSugar: true,
    tips: ['Fermented batter is easy to digest, and sambar adds dal and vegetables.', 'Ask for less oil or butter on the tawa.', 'Ragi or moong dosa adds even more fibre.'], swap: ['Butter masala dosa', 'Ragi or pesarattu dosa'] },
  samosa: { name: 'Samosa', img: 'samosa', serve: '1 large samosa', kcal: 260, salt: 0.9, sugar: 2, fat: 17, v: 'Treat', freeSugar: true,
    tips: ['Deep-fried maida pastry, so most of the energy comes from fat.', 'Reused frying oil at stalls can contain harmful trans fats.', 'Share one instead of having two.'], swap: ['Samosa', 'Steamed dhokla'] },
  salad: { name: 'Green salad', img: 'salad', serve: '1 bowl', kcal: 80, salt: 0.3, sugar: 5, fat: 3, v: 'Good', freeSugar: false,
    tips: ['Full of fibre, vitamins and water, with very few calories.', 'Add sprouts, paneer or chana to make it filling.', 'Keep creamy dressings light.'], swap: ['Mayonnaise dressing', 'Lemon, salt and chaat masala'] },
  sweets: { name: 'Mithai (2 gulab jamun)', img: 'sweets', serve: '2 pieces, about 80 g', kcal: 300, salt: 0.1, sugar: 32, fat: 12, v: 'Treat', freeSugar: true,
    tips: ['Two pieces can pass the WHO ideal sugar limit for a whole day.', 'Fried and soaked in syrup: keep it for festivals.', 'One small piece is enough to enjoy the taste.'], swap: ['Gulab jamun', 'Fresh fruit chaat or dates'] },
  vadapav: { name: 'Vada pav', img: 'vadapav', serve: '1 vada pav', kcal: 300, salt: 1.5, sugar: 4, fat: 14, v: 'Treat', freeSugar: true,
    tips: ['A fried potato vada inside a maida pav: filling but low in protein.', 'The dry garlic chutney adds a lot of salt.', 'Pair it with buttermilk instead of a cold drink.'], swap: ['Vada pav', 'Methi thepla with curd'] },
  drink: { name: 'Cola', img: 'drink', serve: '1 can, 330 ml', kcal: 139, salt: 0, sugar: 35, fat: 0, v: 'Junk', freeSugar: true,
    tips: ['About 9 teaspoons of sugar: more than the WHO ideal for a whole day.', 'Liquid sugar does not fill you up, so it is easy to overdo.', 'Kids should not have energy drinks or caffeine.'], swap: ['Cola or soft drink', 'Nimbu pani or coconut water'] },
};
function screenDish(key) {
  const d = DISHES[key];
  if (!d) { location.hash = '#/home'; return; }
  const vc = { Good: '#20B26B', Treat: '#FB8500', Junk: '#E63946' }[d.v];
  const bar = (label, val, lim, unit, note) => {
    const pct = Math.round((val / lim) * 100);
    const col = pct >= 50 ? '#E63946' : pct >= 20 ? '#FB8500' : '#20B26B';
    return `<div class="who-row"><div class="who-top"><span>${label}</span><b>${val}${unit} <small>of ${lim}${unit}</small></b></div>
      <div class="who-bar"><i style="width:${Math.min(100, pct)}%;background:${col}"></i></div><small class="muted">${note || `${pct}% of the WHO daily limit for adults`}</small></div>`;
  };
  view().innerHTML = `
    <div class="dish-hero" style="background-image:url(${pic(d.img)})"><a class="back" href="#/home" aria-label="Back">‹</a>
      <div class="dish-hero-in"><span class="dish-v" style="background:${vc}">${esc(d.v)}</span><h2>${esc(d.name)}</h2><p>Typical serving: ${esc(d.serve)}</p></div></div>
    <section class="card">
      <h3>Compared with WHO daily limits</h3>
      <p class="muted small" style="margin:-4px 0 12px">One serving, against what WHO recommends for an adult in a whole day.</p>
      ${bar('Energy', d.kcal, WHO.kcal, ' kcal', `${Math.round(d.kcal / WHO.kcal * 100)}% of a 2000 kcal day`)}
      ${bar('Salt', d.salt, WHO.salt, ' g')}
      ${d.freeSugar ? bar('Sugar', d.sugar, WHO.sugar, ' g', `${Math.round(d.sugar / WHO.sugar * 100)}% of WHO's ideal limit of 25 g (6 tsp) of added sugar`) : bar('Sugar', d.sugar, WHO.sugar, ' g', 'Natural sugar with fibre: WHO does not count it in the added-sugar limit')}
      ${bar('Fat', d.fat, WHO.fat, ' g', `${Math.round(d.fat / WHO.fat * 100)}% of about 67 g (WHO: under 30% of energy from fat)`)}
    </section>
    <section class="card"><h3>Good to know</h3><ul class="dish-tips">${d.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
    <section class="card dish-swap"><h3>Healthier swap</h3><div class="swap-row" style="box-shadow:none;border:0;padding:0">
      <div class="sr-side sr-bad"><span><small>Instead of</small><b>${esc(d.swap[0])}</b></span></div><span class="sr-arrow" aria-hidden="true">→</span>
      <div class="sr-side sr-good"><span><small>Try this</small><b>${esc(d.swap[1])}</b></span></div></div>
      <a class="btn-ghost sm" href="#/swaps" style="margin-top:12px">More swaps</a></section>
    <div class="btnrow centred"><a class="btn hot" href="#/scan/plate">Scan your own plate</a></div>
    <p class="foot">Typical values; recipes and portions vary. WHO guidance on salt, sugar and fat for adults. For awareness, not medical advice.</p>`;
}

// Daily Indian food tips (Hindi line + English meaning)
const AAJ = [
  ['Thali mein aadha hissa sabzi ka.', 'Fill half your plate with vegetables and fruit.'],
  ['Cold drink nahi, nimbu pani!', 'Swap the cola for lightly sweet nimbu pani.'],
  ['Namkeen kam, chana zyada.', 'Pick roasted chana over fried namkeen.'],
  ['Mithai sirf tyohaar par.', 'Keep mithai for festivals, not every day.'],
  ['Packet palto, label padho.', 'Turn the packet over and read the label.'],
  ['Ghar ka khana, sabse achha.', 'Home-cooked food beats packaged food.'],
  ['Pani piyo, juice nahi.', 'Drink water; eat the whole fruit instead of juice.'],
];
const dayNum = () => Math.floor(Date.now() / 86400000);
function markActive() { const d = dayNum(); if (!S.days.includes(d)) { S.days = [...S.days, d].slice(-60); save('days'); } }
function dayStreak() { let n = 0; for (let d = dayNum(); S.days.includes(d); d--) n++; return n; }

function screenHome() {
  const entries = todayEntries();
  const avg = entries.length ? entries.reduce((s, e) => s + (e.score || 3), 0) / entries.length : null;
  const hour = new Date().getHours();
  const greet = S.profile.lang === 'mr' ? (hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्कार' : 'शुभ संध्या') : hour < 12 ? 'Shubh prabhat' : hour < 17 ? 'Namaste' : 'Shubh sandhya';
  const first = (S.profile.name || '').split(' ')[0];
  const initials = (S.profile.name || 'SB').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const scansToday = S.history.filter((h) => h.at && new Date(h.at).toDateString() === new Date().toDateString()).length;
  const streak = dayStreak();
  const lows = PRODUCTS.map((p) => ({ p, s: scoreFor(p, 'adult', S.profile).score })).filter((x) => x.s < 3).sort((a, b) => a.p.id.localeCompare(b.p.id));
  const pick = lows.length ? lows[new Date().getDate() % lows.length].p : null;
  const sw = pick ? swaps(pick, PRODUCTS, S.profile)[0] : null;
  const recent = S.history.slice(0, 5);
  const words = (S.profile.lang === 'hi' ? 'आपके खाने में क्या है?' : S.profile.lang === 'mr' ? 'तुमच्या जेवणात काय आहे?' : "What's really in your food?").split(' ');
  const mq = [['thali', 'Thali', '#E63946'], ['panipuri', 'Pani puri', '#FB8500'], ['fruits', 'Fresh fruit', '#20B26B'], ['chips', 'Chips', '#FFB703'], ['dosa', 'Dosa', '#2F80ED'], ['samosa', 'Samosa', '#FF5D8F'], ['salad', 'Salad', '#20B26B'], ['sweets', 'Mithai', '#5B2A86'], ['vadapav', 'Vada pav', '#FB8500'], ['drink', 'Drinks', '#FF5D8F']];
  const cats = [
    ['chips', '🥔', 'Chips & namkeen', "Lay's, Balaji, Haldiram's", '#FB8500', '#/scan/packet'],
    ['thali', '🍛', 'Thali & home food', 'Every item, one photo', '#E63946', '#/scan/plate'],
    ['panipuri', '🌶️', 'Street food', 'Pani puri to pav bhaji', '#FF5D8F', '#/scan/plate'],
    ['market', '🥬', 'Fruits & veg', 'Even at the market', '#20B26B', '#/scan/plate'],
    ['drink', '🥤', 'Drinks', 'Juices, colas, lassi', '#2F80ED', '#/scan/packet'],
    ['sweets', '🍬', 'Sweets & biscuits', 'Hidden sugar check', '#5B2A86', '#/scan/packet'],
    ['spices', '🧪', 'Ingredient labels', 'Decode every E-number', '#241433', '#/scan/label'],
  ];
  view().innerHTML = `
    <header class="hero">
      ${HERO_CLIPS.map((c) => `<div class="poster" style="background-image:url(${c.p})"></div>`).join('')}
      ${HERO_CLIPS.map((c, k) => (c.v ? `<video data-k="${k}" muted playsinline loop preload="metadata" poster="${c.p}" aria-hidden="true"><source src="${c.v}" type="video/mp4"></video>` : '')).join('')}
      <div class="hero-top"><span class="logo"><img src="/logo.svg" alt="" width="38" height="38" style="border-radius:12px"></span><div><b>SmartBite</b><small>Scan. Know. Eat smart.</small></div><span class="hero-me">${coinChip()}<a class="me-av" href="#/profile" aria-label="Your profile">${esc(initials)}</a></span></div>
      <a class="vid-label" href="${HERO_CLIPS[0].href}">${esc(HERO_CLIPS[0].label)}</a>
      <div class="hero-body">
        <p style="font-weight:600;opacity:.9;margin-bottom:6px">${esc(greet)}${first ? ', ' + esc(first) : ''} 🙏</p>
        <h1>${words.map((w, i) => `<span class="w" style="animation-delay:${0.15 + i * 0.09}s">${esc(w)}</span>`).join(' ')}</h1>
        <p class="lead">Scan any packet, thali or fruit and get an honest verdict for adults and kids.</p>
        <div class="hero-cta">
          <a class="cta y" href="#/scan/packet"><span class="ico">📦</span><b>${esc(t('scanPacket'))}</b><small>${esc(t('scanPacketSub'))}</small></a>
          <a class="cta p" href="#/scan/plate"><span class="ico">🍛</span><b>${esc(t('scanPlate'))}</b><small>${esc(t('scanPlateSub'))}</small></a>
        </div>
        <div class="hero-dots">${HERO_CLIPS.map((c, k) => `<i role="button" aria-label="Banner ${k + 1}"></i>`).join('')}</div>
      </div>
    </header>

    <nav class="marquee" aria-label="Popular dishes"><div class="marquee-track">${[...mq, ...mq].map(([img, l, c], i) => `<a class="mq" href="#/dish/${img}" style="background:${c}" ${i >= mq.length ? 'tabindex="-1" aria-hidden="true"' : ''}><img src="${pic(img)}" alt="">${l}</a>`).join('')}</div></nav>

    <div class="card aaj">
      <div class="aaj-k"><span class="rangoli" aria-hidden="true"></span><div><small>Aaj ka tip · Today's tip</small><b>${esc(AAJ[dayNum() % AAJ.length][0])}</b><p>${esc(AAJ[dayNum() % AAJ.length][1])}</p></div></div>
    </div>

    <section class="myday ikat">
      <div class="md-top"><div><small>${first ? esc(first) + "'s" : 'Your'} SmartBite day</small><h3>${scansToday ? `${scansToday} scan${scansToday > 1 ? 's' : ''} today. Shabash!` : 'Aaj kya khaya? Scan your first food.'}</h3></div>
        ${avg ? ring(avg, 70) : `<div class="ring" style="--s:70px"><svg viewBox="0 0 70 70"><circle class="trk" cx="35" cy="35" r="29"/></svg><div class="ring-in"><b>–</b></div></div>`}</div>
      <div class="md-stats">
        <a href="#/tracker"><b>${entries.length}</b><span>logged today</span></a>
        <a href="#/tracker"><b>${streak}${streak ? '🔥' : ''}</b><span>day streak</span></a>
        <a href="#/coins"><b>${S.coins.bal}</b><span>SmartBite Coins</span></a>
      </div>
    </section>

    <section>
      <div class="sec-head"><h3><span class="brandword">SmartBite</span> scans<small class="hi-sub">स्कैन करें</small></h3><span class="muted small">Swipe</span></div>
      <div class="hscroll stagger">${cats.map(([img, e, title, sub, c, href]) => `<a class="cat" href="${href}" style="--c:${c}"><img src="${pic(img)}" alt="" loading="lazy"><span class="chip-ic">${e}</span><span>${esc(title)}<small>${esc(sub)}</small></span></a>`).join('')}</div>
    </section>

    <section>
      <div class="sec-head"><h3><span class="brandword">SmartBite</span> Shop<small class="hi-sub">सेहत की दुकान</small></h3><a class="chip" href="#/shop">See all</a></div>
      <div class="hscroll shop-row" id="homeShop"></div>
    </section>

    <section>
      <div class="sec-head"><h3><span class="brandword">SmartBite</span> Play &amp; Learn<small class="hi-sub">खेलो और सीखो</small></h3><a class="chip" href="#/play">All games</a></div>
      <div class="hscroll play-row">${GAMES.map((g) => `<a class="play-tile" href="#/${g.id}" style="--gc:${g.c}"><img src="${mealImg(g.img)}" alt="" loading="lazy" data-ld><span><b>${g.title}</b><small>${g.sub}</small></span></a>`).join('')}</div>
    </section>

    <a class="junk-band" href="#/explore" aria-label="Open the Junk Food Explorer">
      <div class="jb-row" aria-hidden="true"><div class="jb-track"><span class="">Chips</span><span class="o">Chocolate</span><span class="">Cola</span><span class="o">Noodles</span><span class="">Ice cream</span><span class="o">Biscuits</span><span class="">Namkeen</span><span class="">Chips</span><span class="o">Chocolate</span><span class="">Cola</span><span class="o">Noodles</span><span class="">Ice cream</span><span class="o">Biscuits</span><span class="">Namkeen</span></div></div>
      <div class="jb-row jb-back" aria-hidden="true"><div class="jb-track"><span>🥨</span><span class="o">Namkeen</span><span>🍪</span><span class="">Biscuits</span><span>🍦</span><span class="o">Ice cream</span><span>🍜</span><span class="">Noodles</span><span>🥤</span><span class="o">Cola</span><span>🍫</span><span class="">Chocolate</span><span>🍟</span><span class="o">Chips</span><span>🥨</span><span class="o">Namkeen</span><span>🍪</span><span class="">Biscuits</span><span>🍦</span><span class="o">Ice cream</span><span>🍜</span><span class="">Noodles</span><span>🥤</span><span class="o">Cola</span><span>🍫</span><span class="">Chocolate</span><span>🍟</span><span class="o">Chips</span></div></div>
      <div class="jb-cta"><p>Is your favourite snack junk food? Check real packets from India and the world.</p><span class="btn sm">Open the Junk Food Explorer</span></div>
    </a>

    <section>
      <div class="sec-head"><h3><span class="brandword">SmartBite</span> food facts<small class="hi-sub">खाने का सच</small></h3><span class="muted small">Swipe ›</span></div>
      <div class="hscroll stories">${STORIES.map(storyCard).join('')}</div>
    </section>

    <section class="brag" aria-label="SmartBite in numbers">
      <div class="brag-head"><span class="brag-kicker">SmartBite</span><h3>in numbers</h3><p>Built in an Atal Tinkering Lab. Made for every Indian kitchen.</p></div>
      <div class="brag-grid">
        <div class="bg-big"><b data-count="3000000" data-suffix="+">0</b><span>packaged foods you can check</span></div>
        <div><b data-count="64">0</b><span>desi healthier swaps</span></div>
        <div><b data-count="5" data-suffix=" sec">0</b><span>to an honest verdict</span></div>
        <div><b data-count="3">0</b><span>languages: English, हिन्दी, मराठी</span></div>
        <div><b data-count="2">0</b><span>verdicts: adults and kids</span></div>
        <div><b data-count="3">0</b><span>Play &amp; Learn games</span></div>
        <div class="bg-zero"><b>0</b><span>sponsors who can change a score</span></div>
      </div>
      <p class="brag-foot">100% free to scan · No app download needed</p>
    </section>
    <section class="india ikat" aria-label="India's food health in numbers">
      <div class="in-head"><span class="brag-kicker">Why SmartBite matters</span><h3>भारत की सेहत · India's health</h3><p>The numbers that made us build SmartBite.</p></div>
      <div class="in-grid">
        <div class="in-card c1"><b><span data-count="10.1">0</span> crore</b><span>Indians live with diabetes</span></div>
        <div class="in-card c2"><b><span data-count="13.6">0</span> crore</b><span>more have pre-diabetes</span></div>
        <div class="in-card c3"><b><span data-count="31.5">0</span> crore</b><span>have high blood pressure</span></div>
        <div class="in-card c4"><b><span data-count="8">0</span> g</b><span>salt a day on average, vs WHO's 5 g</span></div>
      </div>
      <div class="mission"><span class="m-k">Our mission</span><b>1 crore Indian families reading their food labels</b><p>Every scan is a step. Scan, share SmartBite and help us get there.</p></div>
      <p class="in-src">Sources: ICMR-INDIAB study (2023); ICMR salt intake survey (2023); WHO.</p>
    </section>

    <section>
      <div class="sec-head"><h3>Your <span class="brandword">SmartBite</span> scans<small class="hi-sub">आपके स्कैन</small></h3></div>
      ${recent.length ? `<div class="list stagger">${recent.map((h) => `<button class="row" ${h.kind === 'product' ? `data-open="${esc(h.id)}"` : 'disabled'}><img class="thumb" src="${esc(h.kind === 'plate' ? pic('thali') : imgFor(h))}" alt=""><span class="grow"><b>${esc(h.title)}</b><br><small class="muted">${esc(t(verdictKey(h.verdict)))}</small></span><span class="score-pill v-${verdictKey(h.verdict)}">${h.score.toFixed(1)}</span></button>`).join('')}</div>`
        : `<div class="card empty"><span class="big-emoji">🛒</span><p><b>Nothing scanned yet</b></p><p class="muted small">Try a packet from your kitchen shelf.</p><a class="btn sm hot" href="#/scan/packet" style="margin-top:8px">Scan your first packet</a></div>`}
    </section>


    ${S.plan === 'free' ? sponsorCard() : ''}
    <p class="foot">${esc(t('disclaimer'))}<br>Photos: Unsplash · Videos: Pexels</p>`;
  startHero();
  shopData().then((d) => { const el = $('#homeShop'); if (el) el.innerHTML = d.products.slice(0, 6).map(shopCard).join(''); }).catch(() => { const el = $('#homeShop'); if (el) el.closest('section').remove(); });
  animateRings(view());
  wireMotion(view());
}

// ---------------- Game: fruit basket ----------------
// ---------------- Play & Learn hub ----------------
const GAMES = [
  { id: 'game', title: 'Healthy Catch', sub: 'Catch the healthy food, dodge the junk.', img: 127, best: 'gameBest', c: '#20B26B' },
  { id: 'quiz', title: 'Junk or Not?', sub: 'Five seconds to decide. How fast is your food sense?', img: 124, best: 'quizBest', c: '#E63946' },
  { id: 'sugar', title: 'Sugar Guess', sub: 'Guess the teaspoons of sugar in drinks and sweets.', img: 130, best: 'sugarBest', c: '#FB8500' },
];
function screenPlayHub() {
  view().innerHTML = `
    <header class="bar"><a href="#/home" class="back" aria-label="Back">‹</a><h2>Play &amp; Learn</h2><span style="width:40px"></span></header>
    <div class="page-title"><p>Quick games that teach you to spot junk food. Your best scores are saved on this phone.</p></div>
    <div class="play-list">${GAMES.map((g) => { const b = store.get(g.best, 0); return `<a class="play-card" href="#/${g.id}" style="--gc:${g.c}">
      <img src="${mealImg(g.img)}" alt="" loading="lazy" data-ld><div class="grow"><b>${g.title}</b><p>${g.sub}</p>${b ? `<small>Best: ${b}</small>` : '<small>Not played yet</small>'}</div><span class="play-go" aria-hidden="true">▶</span></a>`; }).join('')}</div>
    <p class="foot">More games coming soon.</p>`;
}
function gameShell(title, inner) {
  return `<header class="bar"><a href="#/play" class="back" aria-label="Back to games">‹</a><h2>${title}</h2><span style="width:40px"></span></header><section class="hc">${inner}</section>`;
}

// ---- Junk or Not? ----
function screenQuiz() {
  const best = store.get('quizBest', 0);
  view().innerHTML = gameShell('Junk or Not?', `<div class="qz" id="qz"><div class="hc-panel qz-panel">
      <h3>Junk or Not?</h3><p>A food appears. Tap <b class="g">Healthy</b> or <b class="r">Junk</b> before the timer runs out. 12 rounds, and a streak doubles your points.</p>
      <ul><li>Keyboard: ← Healthy, → Junk</li></ul>${best ? `<p class="hc-best">Your best: <b>${best}</b></p>` : ''}<button class="btn hot" id="qzStart">Start</button></div></div>`);
  $('#qzStart').onclick = playQuiz;
}
function playQuiz() {
  const pool = [...GAME_GOOD.map((x) => [...x, true]), ...GAME_JUNK.map((x) => [...x, false])].sort(() => Math.random() - 0.5).slice(0, 12);
  const st = { i: 0, score: 0, streak: 0, wrong: [], timer: 0, locked: false };
  const box = $('#qz');
  const finish = () => {
    clearInterval(st.timer); stopGame();
    const best = Math.max(store.get('quizBest', 0), st.score); store.set('quizBest', best);
    box.innerHTML = `<div class="hc-panel qz-panel"><h3>${st.score >= best && st.score ? 'New best score!' : 'Well played'}</h3>
      <div class="hc-final"><div><b>${st.score}</b><small>Score</small></div><div><b>${12 - st.wrong.length}/12</b><small>Correct</small></div><div><b>${best}</b><small>Best</small></div></div>
      ${st.wrong.length ? `<p class="hc-learn-h">Ones to remember:</p><ul class="hc-learn">${st.wrong.slice(0, 4).map((w) => `<li><b>${esc(w[1])}</b> is ${w[3] ? 'healthy' : 'junk'}: ${esc(w[2])}</li>`).join('')}</ul>` : '<p>All 12 correct. You really know your food!</p>'}
      <div class="btnrow"><button class="btn hot" id="qzAgain">Play again</button><a class="btn-ghost" href="#/play">All games</a></div></div>`;
    $('#qzAgain').onclick = playQuiz;
    if (st.score >= best && st.score) confetti('good');
  };
  const answer = (saidHealthy) => {
    if (st.locked) return; st.locked = true; clearInterval(st.timer);
    const it = pool[st.i], right = saidHealthy === it[3];
    if (right) { st.streak++; st.score += st.streak >= 3 ? 2 : 1; } else { st.streak = 0; st.wrong.push(it); }
    const fb = box.querySelector('.qz-fb');
    fb.className = 'qz-fb show ' + (right ? 'good' : 'bad');
    fb.innerHTML = `<b>${right ? (st.streak >= 3 ? `Correct! Streak ×${st.streak}` : 'Correct!') : saidHealthy === null ? "Time's up!" : 'Not quite'}</b><span>${esc(it[1])} is ${it[3] ? 'healthy' : 'junk'}: ${esc(it[2])}</span>`;
    setTimeout(() => { st.i++; if (st.i >= pool.length) finish(); else round(); }, 1500);
  };
  const round = () => {
    st.locked = false;
    const it = pool[st.i];
    box.innerHTML = `<div class="qz-top"><span>Round <b>${st.i + 1}</b>/12</span><span>Score <b>${st.score}</b></span><span>${st.streak >= 2 ? `🔥 ${st.streak}` : '&nbsp;'}</span></div>
      <div class="qz-time"><i id="qzBar"></i></div>
      <div class="qz-card"><img src="${mealImg(it[0])}" alt="${esc(it[1])}"><b>${esc(it[1])}</b></div>
      <div class="qz-fb"></div>
      <div class="qz-btns"><button class="qz-b good" data-a="1">Healthy</button><button class="qz-b bad" data-a="0">Junk</button></div>`;
    box.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => answer(b.dataset.a === '1')));
    const t0 = performance.now(), T = Math.max(3000, 5000 - st.i * 150);
    st.timer = setInterval(() => { const f = 1 - (performance.now() - t0) / T; const bar = $('#qzBar'); if (bar) bar.style.width = Math.max(0, f * 100) + '%'; if (f <= 0) answer(null); }, 50);
  };
  const kd = (e) => { if (e.key === 'ArrowLeft') answer(true); if (e.key === 'ArrowRight') answer(false); };
  stopGame(); window.addEventListener('keydown', kd);
  GAME.off = () => { clearInterval(st.timer); window.removeEventListener('keydown', kd); };
  round();
}

// ---- Sugar Guess ---- (typical serving, 1 tsp ≈ 4 g; approximate)
const SUGAR_ITEMS = [
  [124, 'Cola, 1 can (330 ml)', 9, 'Added sugar'], [130, 'Strawberry milkshake (300 ml)', 9, 'Mostly added sugar and syrup'], [128, 'Energy drink (250 ml)', 7, 'Added sugar plus caffeine'],
  [126, 'Packaged orange juice (200 ml)', 5, 'Even "no added sugar" juice has fruit sugar without the fibre'], [132, 'Sweet lassi (250 ml)', 6, 'Added sugar on top of milk sugar'],
  [125, 'Nimbu pani, lightly sweet (250 ml)', 2, 'You control the sugar at home'], [129, 'Coconut water (250 ml)', 1.5, 'Natural sugar, no added sugar'],
  [133, 'Masala chaas (250 ml)', 1, 'Only natural milk sugar'], [112, 'Gulab jamun, 2 pieces', 8, 'Soaked in sugar syrup'], [110, 'Milk chocolate bar (50 g)', 7, 'About half of it is sugar'],
  [120, 'Ice cream, 2 scoops', 6, 'Added sugar and fat'], [138, 'Sugary cereal bowl (40 g)', 3.5, 'Frosted coatings add sugar to breakfast'],
];
function screenSugar() {
  const best = store.get('sugarBest', 0);
  view().innerHTML = gameShell('Sugar Guess', `<div class="qz" id="sg"><div class="hc-panel qz-panel">
      <h3>Sugar Guess</h3><p>How many teaspoons of sugar are in it? Slide to guess. Within 1 teaspoon scores 3 points, within 2 scores 1. Six rounds.</p>
      <p class="muted small">WHO's ideal limit is about 6 teaspoons of added sugar a day for adults.</p>${best ? `<p class="hc-best">Your best: <b>${best}</b></p>` : ''}<button class="btn hot" id="sgStart">Start</button></div></div>`);
  $('#sgStart').onclick = playSugar;
}
function playSugar() {
  stopGame();
  const pool = [...SUGAR_ITEMS].sort(() => Math.random() - 0.5).slice(0, 6);
  const st = { i: 0, score: 0, log: [] };
  const box = $('#sg');
  const cubes = (n, cls = '') => Array.from({ length: Math.ceil(n) }, (_, k) => `<i class="cube ${cls} ${k + 1 > n ? 'half' : ''}" style="animation-delay:${k * 0.08}s"></i>`).join('');
  const finish = () => {
    const best = Math.max(store.get('sugarBest', 0), st.score); store.set('sugarBest', best);
    const shock = [...st.log].sort((a, b) => b.real - a.real)[0];
    box.innerHTML = `<div class="hc-panel qz-panel"><h3>${st.score >= best && st.score ? 'New best score!' : 'Nice guessing'}</h3>
      <div class="hc-final"><div><b>${st.score}</b><small>Score</small></div><div><b>${best}</b><small>Best</small></div><div><b>${st.log.filter((l) => Math.abs(l.g - l.real) <= 1).length}/6</b><small>Close</small></div></div>
      <p class="hc-learn-h">Biggest sugar bomb this game:</p><p><b>${esc(shock.name)}</b>: about ${shock.real} teaspoons. That is ${shock.real >= 6 ? 'more than' : 'a big part of'} a whole day's ideal limit.</p>
      <div class="btnrow"><button class="btn hot" id="sgAgain">Play again</button><a class="btn-ghost" href="#/play">All games</a></div></div>`;
    $('#sgAgain').onclick = playSugar;
    if (st.score >= best && st.score) confetti('good');
  };
  const round = () => {
    const [n, name] = pool[st.i];
    box.innerHTML = `<div class="qz-top"><span>Round <b>${st.i + 1}</b>/6</span><span>Score <b>${st.score}</b></span><span>&nbsp;</span></div>
      <div class="qz-card"><img src="${mealImg(n)}" alt=""><b>${esc(name)}</b></div>
      <div class="sg-guess"><div class="sg-val"><b id="sgV">4</b> teaspoons</div><div class="sg-cubes" id="sgC">${cubes(4)}</div>
        <input type="range" id="sgR" min="0" max="12" step="1" value="4" aria-label="Teaspoons of sugar"></div>
      <div class="qz-fb" id="sgFb"></div>
      <div class="btnrow"><button class="btn hot" id="sgGo">Lock my guess</button></div>`;
    const r = $('#sgR');
    r.oninput = () => { $('#sgV').textContent = r.value; $('#sgC').innerHTML = cubes(+r.value); };
    $('#sgGo').onclick = () => {
      const [, nm, real, why] = pool[st.i], g = +r.value, diff = Math.abs(g - real);
      const pts = diff <= 1 ? 3 : diff <= 2 ? 1 : 0; st.score += pts; st.log.push({ name: nm, real, g });
      r.disabled = true; $('#sgGo').disabled = true;
      $('#sgC').innerHTML = `<div class="sg-row"><small>Your guess</small>${cubes(g)}</div><div class="sg-row"><small>Real</small>${cubes(real, 'real')}</div>`;
      const fb = $('#sgFb'); fb.className = 'qz-fb show ' + (pts === 3 ? 'good' : pts ? 'lvl' : 'bad');
      fb.innerHTML = `<b>${pts === 3 ? 'Spot on! +3' : pts ? 'Close! +1' : 'Way off'}</b><span>About ${real} teaspoons. ${esc(why)}.</span>`;
      setTimeout(() => { const nx = document.createElement('button'); nx.className = 'btn'; nx.textContent = st.i === 5 ? 'See my score' : 'Next'; nx.onclick = () => { st.i++; if (st.i >= 6) finish(); else round(); }; $('#sgGo').replaceWith(nx); }, 600);
    };
  };
  round();
}

// ---------------- Game: Healthy Catch ----------------
// Catch healthy food, dodge junk. Photos are the AI food photos (meal-N assets).
const GAME_GOOD = [[101, 'Roasted chana', 'Protein and fibre'], [103, 'Makhana', 'Light and roasted'], [105, 'Sprouts chaat', 'Protein-packed'], [107, 'Dhokla', 'Steamed, not fried'],
  [113, 'Fruit chaat', 'Vitamins and fibre'], [119, 'Dahi with fruit', 'Good for your gut'], [125, 'Nimbu pani', 'Refreshing, little sugar'], [127, 'Whole fruit', 'Fibre keeps you full'],
  [129, 'Coconut water', 'Natural electrolytes'], [133, 'Masala chaas', 'Cools and aids digestion'], [135, 'Poha', 'Light, filling breakfast'], [139, 'Oats', 'Slow, steady energy'], [144, 'Green salad', 'Vitamins, few calories']];
const GAME_JUNK = [[100, 'Chips', 'Fried and very salty'], [102, 'Masala puffs', 'Fried, salty, little nutrition'], [104, 'Namkeen', 'Deep-fried and salty'], [106, 'Samosa', 'Deep-fried maida'],
  [108, 'Cream biscuits', 'Mostly sugar and palm oil'], [110, 'Chocolate bar', 'Lots of added sugar'], [112, 'Gulab jamun', 'Fried and soaked in syrup'], [114, 'Jalebi', 'Fried and dipped in syrup'],
  [120, 'Ice cream', 'High in sugar and fat'], [122, 'Pastry', 'Refined flour, sugar and cream'], [124, 'Cola', 'About 9 tsp sugar a can'], [128, 'Energy drink', 'Caffeine and sugar: not for kids'],
  [130, 'Milkshake', 'Syrup and added sugar'], [134, 'Instant noodles', 'High salt, refined flour'], [140, 'Pizza and burger', 'Cheese, maida and salt']];
const GAME = { raf: 0, imgs: {} };
function stopGame() { cancelAnimationFrame(GAME.raf); GAME.raf = 0; if (GAME.off) GAME.off(); GAME.off = null; }
function gameImg(n) {
  if (!GAME.imgs[n]) { const im = new Image(); im.src = mealImg(n); GAME.imgs[n] = im; }
  return GAME.imgs[n];
}
function screenGame() {
  const best = store.get('gameBest', 0);
  view().innerHTML = `
    <header class="bar"><a href="#/play" class="back" aria-label="Back to games">‹</a><h2>Healthy Catch</h2><span style="width:40px"></span></header>
    <section class="hc" aria-label="Healthy Catch game">
      <div class="hc-stage" id="hcStage">
        <canvas id="hcCanvas" aria-hidden="true"></canvas>
        <div class="hc-hud" aria-live="polite"><span class="hc-score">Score <b id="hcScore">0</b></span><span class="hc-hearts" id="hcHearts">❤️❤️❤️</span><span class="hc-lvl">Level <b id="hcLvl">1</b></span></div>
        <div class="hc-toast" id="hcToast"></div>
        <div class="hc-panel" id="hcPanel">
          <h3>Healthy Catch</h3>
          <p>Catch the <b class="g">healthy food</b>. Dodge the <b class="r">junk</b>. Every junk food you catch costs a heart, and you have three.</p>
          <ul><li>Drag the basket, or use the ← → keys</li><li>It gets faster every 10 points</li></ul>
          ${best ? `<p class="hc-best">Your best: <b>${best}</b></p>` : ''}
          <button class="btn hot" id="hcPlay">Play</button>
        </div>
      </div>
      <p class="muted small centred" style="margin-top:10px">Tip: not sure if a food is healthy? Look it up on the Swaps page.</p>
    </section>`;
  GAME_GOOD.concat(GAME_JUNK).forEach(([n]) => gameImg(n));
  $('#hcPlay').onclick = () => playGame();
}
function playGame() {
  stopGame();
  const stage = $('#hcStage'), cv = $('#hcCanvas'), ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0;
  const size = () => { W = stage.clientWidth; H = stage.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  $('#hcPanel').hidden = true;
  const st = { score: 0, hearts: 3, lvl: 1, items: [], fx: [], bx: W / 2, target: W / 2, spawnIn: 0, t: 0, caught: 0, junk: [], over: false };
  const R = Math.max(26, Math.min(36, W / 12)), BW = Math.min(130, W * 0.32), BH = 44;
  const hud = () => { $('#hcScore').textContent = st.score; $('#hcHearts').textContent = '❤️'.repeat(st.hearts) + '🤍'.repeat(3 - st.hearts); $('#hcLvl').textContent = st.lvl; };
  hud();
  const say = (txt, kind) => { const el = $('#hcToast'); if (!el) return; el.textContent = txt; el.className = 'hc-toast show ' + kind; clearTimeout(st.tt); st.tt = setTimeout(() => el && (el.className = 'hc-toast'), 1600); };
  const move = (x) => { const r = stage.getBoundingClientRect(); st.target = Math.max(BW / 2, Math.min(W - BW / 2, x - r.left)); };
  const onPtr = (e) => { if (e.buttons || e.pointerType === 'touch' || e.type === 'pointerdown') move(e.clientX); };
  const keys = {};
  const kd = (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = true; e.preventDefault(); } };
  const ku = (e) => { keys[e.key] = false; };
  const vis = () => { if (document.hidden) end(true); };
  stage.addEventListener('pointerdown', onPtr); stage.addEventListener('pointermove', onPtr);
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('resize', size); document.addEventListener('visibilitychange', vis);
  GAME.off = () => { stage.removeEventListener('pointerdown', onPtr); stage.removeEventListener('pointermove', onPtr); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', size); document.removeEventListener('visibilitychange', vis); };
  const spawn = () => {
    const good = Math.random() < 0.55;
    const [n, name, why] = (good ? GAME_GOOD : GAME_JUNK)[Math.floor(Math.random() * (good ? GAME_GOOD : GAME_JUNK).length)];
    st.items.push({ n, name, why, good, x: R + Math.random() * (W - 2 * R), y: -R, vy: (90 + st.lvl * 28) * (0.85 + Math.random() * 0.3), rot: (Math.random() - 0.5) * 0.6 });
  };
  const drawItem = (it) => {
    const im = gameImg(it.n);
    ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot * it.y / H);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); ctx.clip();
    if (im.complete && im.naturalWidth) ctx.drawImage(im, -R * 1.18, -R * 1.18, R * 2.36, R * 2.36);
    else { ctx.fillStyle = '#E9E6EF'; ctx.fill(); ctx.fillStyle = '#6E6280'; ctx.font = `700 ${R * 0.8}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.name[0], 0, 2); }
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.restore();
  };
  const drawBasket = () => {
    const x = st.bx - BW / 2, y = H - BH - 14;
    ctx.save();
    ctx.fillStyle = '#B7793B'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + BW, y); ctx.lineTo(x + BW - 12, y + BH); ctx.lineTo(x + 12, y + BH); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8A5526'; ctx.lineWidth = 3;
    for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 4 + i * 3, y + (BH / 3) * i); ctx.lineTo(x + BW - 4 - i * 3, y + (BH / 3) * i); ctx.stroke(); }
    ctx.fillStyle = '#8A5526'; ctx.fillRect(x - 4, y - 6, BW + 8, 9);
    ctx.restore();
  };
  let last = performance.now();
  const end = (paused) => {
    if (st.over) return; st.over = true; stopGame();
    const best = Math.max(store.get('gameBest', 0), st.score); store.set('gameBest', best);
    const p = $('#hcPanel'); if (!p) return;
    const lessons = [...new Map(st.junk.map((j) => [j.name, j])).values()].slice(0, 4);
    p.innerHTML = `<h3>${paused ? 'Paused' : st.score >= best && st.score > 0 ? 'New best score!' : 'Game over'}</h3>
      <div class="hc-final"><div><b>${st.score}</b><small>Score</small></div><div><b>${best}</b><small>Best</small></div><div><b>${st.lvl}</b><small>Level</small></div></div>
      ${lessons.length ? `<p class="hc-learn-h">Junk you caught, and why to skip it:</p><ul class="hc-learn">${lessons.map((j) => `<li><b>${esc(j.name)}</b>: ${esc(j.why)}</li>`).join('')}</ul>` : '<p>Not a single junk food caught. Well played!</p>'}
      <div class="btnrow"><button class="btn hot" id="hcPlay">${paused ? 'Play again' : 'Play again'}</button><a class="btn-ghost" href="#/swaps">Healthier swaps</a></div>`;
    p.hidden = false; $('#hcPlay').onclick = () => playGame();
    if (!paused && st.score >= best && st.score > 0) confetti('good');
  };
  const step = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (keys.ArrowLeft) st.target = Math.max(BW / 2, st.target - 420 * dt);
    if (keys.ArrowRight) st.target = Math.min(W - BW / 2, st.target + 420 * dt);
    st.bx += (st.target - st.bx) * Math.min(1, dt * 14);
    st.spawnIn -= dt;
    if (st.spawnIn <= 0) { spawn(); st.spawnIn = Math.max(0.42, 1.15 - st.lvl * 0.09) * (0.8 + Math.random() * 0.4); }
    const top = H - BH - 14;
    for (const it of st.items) {
      it.y += it.vy * dt;
      if (!it.done && it.y + R * 0.6 >= top && it.y < top + BH && Math.abs(it.x - st.bx) < BW / 2 + R * 0.3) {
        it.done = true;
        if (it.good) { st.score++; st.caught++; st.fx.push({ x: it.x, y: top, txt: '+1', c: '#20B26B', t: 0 }); say(`${it.name}: ${it.why}`, 'good');
          const lvl = 1 + Math.floor(st.score / 10); if (lvl > st.lvl) { st.lvl = lvl; say(`Level ${lvl}! Faster now`, 'lvl'); } }
        else { st.hearts--; st.junk.push(it); st.fx.push({ x: it.x, y: top, txt: '−❤️', c: '#E63946', t: 0 }); say(`${it.name}: ${it.why}`, 'bad'); stage.classList.remove('hit'); void stage.offsetWidth; stage.classList.add('hit'); }
        hud();
      }
    }
    st.items = st.items.filter((it) => !it.done && it.y < H + R);
    ctx.clearRect(0, 0, W, H);
    st.items.forEach(drawItem);
    drawBasket();
    st.fx = st.fx.filter((f) => (f.t += dt) < 0.9);
    st.fx.forEach((f) => { ctx.globalAlpha = 1 - f.t / 0.9; ctx.fillStyle = f.c; ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f.txt, f.x, f.y - 20 - f.t * 50); ctx.globalAlpha = 1; });
    if (st.hearts <= 0) { end(false); return; }
    GAME.raf = requestAnimationFrame(step);
  };
  GAME.raf = requestAnimationFrame((n) => { last = n; step(n); });
}

// ---------------- Swaps: breakfast, lunch and dinner swap of the day ----------------
// AI-made food photos (one per dish, stored as meal-N in the app's asset store, in list order).
// Non-veg ideas use only chicken, fish and egg (no beef or pork) and appear only when the
// person picks Egg or Non-veg.
const MEALS = {
  breakfast: [
    { d: 'veg', from: 'Aloo paratha with butter', to: 'Besan chilla with curd', why: 'Less butter and oil, and besan adds protein that keeps you full till lunch.' },
    { d: 'egg', from: 'Bread omelette fried in butter', to: 'Masala omelette with veggies and roti', why: 'Same eggs, more onion, tomato and capsicum, and whole-wheat roti instead of buttered white bread.' },
    { d: 'veg', from: 'White bread with jam', to: 'Vegetable upma', why: 'Jam is mostly sugar. Upma with veggies gives slow energy for school or work.' },
    { d: 'veg', from: 'Puri bhaji', to: 'Idli sambar', why: 'Steamed idli instead of deep-fried puri, and sambar adds dal and vegetables.' },
    { d: 'nonveg', from: 'Fried chicken nuggets', to: 'Chicken sandwich on whole-wheat bread', why: 'Nuggets are breaded and deep-fried. Plain cooked chicken gives the same protein with far less oil.' },
    { d: 'veg', from: 'Medu vada', to: 'Pesarattu (moong dosa)', why: 'Vada soaks up oil. Pesarattu is made from whole moong, rich in protein and fibre.' },
    { d: 'veg', from: 'Kachori', to: 'Kanda poha', why: 'Kachori is deep-fried maida. Poha is light, and peanuts and peas make it filling.' },
    { d: 'egg', from: 'Egg puff', to: 'Two boiled eggs', why: 'Puff pastry is full of fat. Boiled eggs are pure protein with nothing added.' },
    { d: 'veg', from: 'Instant noodles', to: 'Oats upma', why: 'Instant noodles are high in salt and refined flour. Oats give fibre and steady energy.' },
    { d: 'veg', from: 'Masala dosa with extra butter', to: 'Ragi dosa', why: 'Ragi is a millet rich in calcium and fibre. Skip the extra butter.' },
    { d: 'veg', from: 'Cream biscuits with chai', to: 'Oats porridge with fruit', why: 'Cream biscuits are sugar and palm oil. Oats with banana or apple is a real breakfast.' },
    { d: 'egg', from: 'Egg bhurji with buttered pav', to: 'Egg bhurji with whole-wheat roti', why: 'Keep the bhurji, swap maida pav and butter for roti.' },
    { d: 'veg', from: 'Samosa', to: 'Steamed dhokla', why: 'Steamed instead of deep-fried, and besan gives extra protein.' },
    { d: 'veg', from: 'Vada pav', to: 'Methi thepla with curd', why: 'Thepla is whole wheat with methi leaves. Vada pav is fried potato inside maida bread.' },
  ],
  lunch: [
    { d: 'veg', from: 'Chole bhature', to: 'Chana masala with roti', why: 'Keep the chole. Swap the deep-fried bhatura for a roti and save a lot of oil.' },
    { d: 'nonveg', from: 'Butter chicken with butter naan', to: 'Tandoori chicken with roti and salad', why: 'Same chicken, without the cream and butter gravy. Grilled and high in protein.' },
    { d: 'veg', from: 'Pizza', to: 'Rajma chawal', why: 'Rajma with rice gives protein and fibre. Pizza is maida, cheese and salt.' },
    { d: 'veg', from: 'Paneer butter masala', to: 'Palak paneer', why: 'Spinach gravy instead of butter and cream, with iron and vitamins.' },
    { d: 'egg', from: 'Kolkata egg roll', to: 'Egg curry with roti', why: 'The roll uses a fried maida paratha. Egg curry with roti has the protein without the extra oil.' },
    { d: 'veg', from: 'Dal makhani', to: 'Dal tadka with chapati', why: 'Dal makhani is cooked with lots of butter and cream. Dal tadka has the same protein, much less fat.' },
    { d: 'veg', from: 'Aloo tikki burger', to: 'Home-style veg thali', why: 'A thali gives dal, sabzi, roti and rice: a balanced plate instead of a fried patty in a white bun.' },
    { d: 'nonveg', from: 'Restaurant chicken biryani', to: 'Kerala fish curry with rice', why: 'Fish gives healthy omega-3 fats. Restaurant biryani is heavy on ghee and oil.' },
    { d: 'veg', from: 'Pav bhaji with butter', to: 'Sambar with rice', why: 'Sambar is dal and vegetables with little oil. Pav bhaji is cooked in a lot of butter.' },
    { d: 'veg', from: 'Malabar porotta', to: 'Jowar roti', why: 'Porotta is layered maida and oil. Jowar is a millet with fibre and iron.' },
    { d: 'nonveg', from: 'Fish fry and chips', to: 'Tandoori fish tikka', why: 'Grilled fish keeps the protein and good fats without deep frying.' },
    { d: 'veg', from: 'French fries on the side', to: 'Cucumber raita', why: 'Raita cools you down and adds protein from curd. Fries add oil and salt.' },
    { d: 'veg', from: 'Kadhi pakora', to: 'Mixed vegetable sabzi with roti', why: 'The pakoras are deep-fried. A mixed sabzi gives you many vegetables in one bowl.' },
  ],
  dinner: [
    { d: 'veg', from: 'Hakka noodles and Manchurian', to: 'Vegetable pulao with raita', why: 'Manchurian is fried and the sauces are very salty. Pulao is lighter for night.' },
    { d: 'nonveg', from: 'Chilli chicken', to: 'Kerala chicken stew', why: 'Chilli chicken is battered, fried and saucy. The stew is gentle and light for dinner.' },
    { d: 'veg', from: 'White sauce pasta', to: 'Moong dal khichdi', why: 'Khichdi is easy to digest at night. White sauce is butter, maida and cheese.' },
    { d: 'veg', from: 'Malai kofta', to: 'Baingan bharta with roti', why: 'Koftas are fried and the gravy is cream. Roasted baingan is smoky, light and full of fibre.' },
    { d: 'egg', from: 'Egg fried rice', to: 'Egg curry with roti', why: 'Less oil and soy sauce salt, same egg protein.' },
    { d: 'veg', from: 'Shahi paneer with butter naan', to: 'Grilled paneer tikka', why: 'Grilled paneer and veggies instead of a cream gravy and buttered maida naan.' },
    { d: 'veg', from: 'Onion pakora', to: 'Hot vegetable soup', why: 'Pakoras are deep-fried. A bowl of soup warms you up with almost no oil.' },
    { d: 'nonveg', from: 'Chicken lollipop', to: 'Chicken hariyali kebab', why: 'Lollipops are coated and deep-fried. Kebabs are marinated in mint and grilled.' },
    { d: 'veg', from: 'Chilli paneer', to: 'Paneer bhurji with roti', why: 'Same paneer protein without the fried coating and salty sauces.' },
    { d: 'veg', from: 'Loaded nachos', to: 'Sprouts salad with corn', why: 'Sprouts give crunch, protein and fibre. Nachos are fried chips with cheese sauce.' },
    { d: 'nonveg', from: 'Pomfret rawa fry', to: 'Meen curry (fish curry)', why: 'Cooked in a light coconut and tamarind gravy instead of shallow frying.' },
    { d: 'veg', from: 'Garlic bread', to: 'Dal palak with roti', why: 'Dal with spinach gives protein and iron. Garlic bread is maida and butter.' },
    { d: 'veg', from: 'Vegetable fried rice', to: 'Tomato rasam with rice', why: 'Rasam is light, tangy and good for digestion at night.' },
    { d: 'nonveg', from: 'Fried chicken', to: 'Chicken soup', why: 'Soup keeps the chicken protein with very little oil.' },
    { d: 'veg', from: 'Cheese pizza', to: 'Matar paneer with roti', why: 'Peas and paneer give protein. Pizza is mostly cheese and refined flour.' },
  ],
};
{ let n = 0; for (const k of ['breakfast', 'lunch', 'dinner']) for (const m of MEALS[k]) { m.fi = n++; m.ti = n++; } }
const mealImg = (i) => `${API}/asset/meal-${i}`;
const MEAL_SLOTS = [['breakfast', '🌅', 'Breakfast'], ['lunch', '☀️', 'Lunch'], ['dinner', '🌙', 'Dinner']];
const DIETS = [['veg', 'Veg'], ['egg', 'Egg'], ['nonveg', 'Non-veg']];
const dietMark = (d) => `<i class="fmark ${d}" title="${d === 'veg' ? 'Vegetarian' : d === 'egg' ? 'Contains egg' : 'Non-vegetarian'}"></i>`;
const SWD = { s: { breakfast: 0, lunch: 0, dinner: 0 } };
function mealDiet() { const d = S.profile.diet; return d === 'egg' || d === 'nonveg' ? d : 'veg'; }
function mealFor(slot, day) {
  const d = mealDiet();
  const ok = (x) => x.d === 'veg' || (d === 'egg' && x.d === 'egg') || (d === 'nonveg');
  // Egg / non-veg: show those dishes first (rotating daily), then the veg ideas
  const own = d === 'veg' ? [] : MEALS[slot].filter((x) => x.d !== 'veg' && ok(x));
  const off = { breakfast: 0, lunch: 5, dinner: 11 }[slot];
  const mod = (a, n) => ((a % n) + n) % n;
  if (own.length) {
    const st = mod(day + off, own.length);
    const list = [...own.slice(st), ...own.slice(0, st), ...MEALS[slot].filter((x) => x.d === 'veg')];
    return list[mod(SWD.s[slot], list.length)];
  }
  const list = MEALS[slot].filter(ok);
  return list[mod(day + off + SWD.s[slot], list.length)];
}
function mealCard(slot, e, l, day) {
  const m = mealFor(slot, day);
  return `<article class="meal-card" data-slot="${slot}">
          <div class="meal-head"><span class="meal-e" aria-hidden="true">${e}</span><h3>${l}</h3><button class="another" data-another="${slot}" aria-label="Show another ${l.toLowerCase()} swap">↻ Another option</button></div>
          <div class="meal-pair">
            <figure class="meal-side bad"><img src="${mealImg(m.fi)}" alt="" loading="lazy" data-ld><figcaption><small>Instead of</small><b>${esc(m.from)}</b></figcaption></figure>
            <div class="vs"><span>→</span></div>
            <figure class="meal-side good"><img src="${mealImg(m.ti)}" alt="" loading="lazy" data-ld><figcaption><small>Try this ${dietMark(m.d)}</small><b>${esc(m.to)}</b></figcaption></figure>
          </div>
          <p class="meal-why">${esc(m.why)}</p>
        </article>`;
}
// ---------- Swap finder: pick any dish, see a healthier choice ----------
// Two ways to explore: "Another healthy option" keeps your dish and shows a different
// healthy choice; "One step lighter" moves the current suggestion to "Instead of" and
// suggests an even lighter dish.
const famOf = (n) => (/chicken/i.test(n) ? 'chicken' : /fish|meen|pomfret/i.test(n) ? 'fish' : /egg|omelette/i.test(n) ? 'egg' : /paneer/i.test(n) ? 'paneer'
  : /dal|rajma|chana|chole|sambar|moong|besan|sprouts|pesarattu|khichdi|chilla|dhokla|peanut/i.test(n) ? 'dal' : 'veg');
const dietOf = (n) => { const f = famOf(n); return f === 'chicken' || f === 'fish' ? 'nonveg' : f === 'egg' ? 'egg' : 'veg'; };
const heavyOf = (n) => (/soup|rasam/i.test(n) ? 1 : /with (whole-wheat )?(roti|rice|chapati)|thali|pulao|chawal|sandwich|roll|frankie/i.test(n) ? 3
  : /salad|raita|chaas|coconut water|whole fruit|fruit chaat|nimbu|dates|cashews|boiled/i.test(n) ? 1 : 2);
const RELATED = { chicken: ['chicken', 'fish', 'egg', 'paneer', 'dal', 'veg'], fish: ['fish', 'chicken', 'egg', 'dal', 'paneer', 'veg'], egg: ['egg', 'chicken', 'fish', 'paneer', 'dal', 'veg'],
  paneer: ['paneer', 'dal', 'egg', 'veg', 'chicken', 'fish'], dal: ['dal', 'paneer', 'veg', 'egg', 'fish', 'chicken'], veg: ['veg', 'dal', 'paneer', 'egg', 'fish', 'chicken'] };
// Extra street and restaurant favourites for the finder (photos in /img/dishes/)
const EXTRA_DISHES = [
  { name: 'Misal pav', img: '/img/dishes/misal-pav.jpg', d: 'veg', fam: 'dal', to: 'Sprouts salad with corn', why: 'Keep the protein-rich sprouts, but skip the oily tarri, farsan and white pav.' },
  { name: 'Dabeli', img: '/img/dishes/dabeli.jpg', d: 'veg', to: 'Methi thepla with curd', why: 'Dabeli is buttered maida pav with sev. Thepla is whole wheat with methi leaves, and curd adds protein.' },
  { name: 'Pani puri', img: '/img/panipuri.jpg', d: 'veg', to: 'Sprouts chaat', why: 'The same tangy chaat taste from moong sprouts, without the deep-fried puris.' },
  { name: 'Bhel puri', img: '/img/dishes/bhel-puri.jpg', d: 'veg', to: 'Sprouts chaat', why: 'Sprouts add protein and fibre. Go easy on the sev and sweet chutney.' },
  { name: 'Fried momos', img: '/img/dishes/fried-momos.jpg', d: 'veg', to: 'Steamed dhokla', why: 'Fried momos soak up oil. Steamed snacks like dhokla, or steamed momos, are much lighter.' },
  { name: 'Chole kulche', img: '/img/dishes/chole-kulche.jpg', d: 'veg', to: 'Chana masala with roti', why: 'Keep the chole, and swap the buttered maida kulcha for a whole-wheat roti.' },
  { name: 'Chicken 65', img: '/img/dishes/chicken-65.jpg', d: 'nonveg', to: 'Chicken hariyali kebab', why: 'Chicken 65 is deep-fried with added colour. Kebabs are marinated in mint and grilled.' },
];
const fImg = (x) => (typeof x === 'string' ? x : mealImg(x));
let FINDER = null; // { dishes, alts } built once
function finderData() {
  if (FINDER) return FINDER;
  const dishes = [], alts = new Map();
  const addAlt = (name, img, slot) => { if (!alts.has(name)) alts.set(name, { name, img, slot, fam: famOf(name), d: dietOf(name), h: heavyOf(name) }); };
  for (const [slot] of MEAL_SLOTS) for (const m of MEALS[slot]) {
    dishes.push({ name: m.from, img: m.fi, slot, d: m.d === 'veg' ? dietOf(m.from) : m.d, fam: famOf(m.from), to: m.to, why: m.why });
    addAlt(m.to, m.ti, slot);
  }
  EXTRA_DISHES.forEach((x) => dishes.push({ name: x.name, img: x.img, slot: 'street', d: x.d, fam: x.fam || famOf(x.name), to: x.to, why: x.why }));
  SWAP_IDEAS.forEach((x, i) => {
    if (!dishes.some((d) => d.name.toLowerCase() === x.from.toLowerCase())) dishes.push({ name: x.from, img: 100 + i * 2, slot: x.cat, d: 'veg', fam: famOf(x.from), to: x.to, why: x.why });
    addAlt(x.to, 101 + i * 2, x.cat);
  });
  FINDER = { dishes, alts: [...alts.values()] };
  return FINDER;
}
const dietAllows = (d) => { const u = mealDiet(); return d === 'veg' || (u === 'egg' && d === 'egg') || u === 'nonveg'; };
function altsFor(dish) {
  const { alts } = finderData();
  const order = RELATED[dish.fam] || RELATED.veg;
  const snack = ['snacks', 'sweets', 'drinks'].includes(dish.slot);
  const fits = (a) => (dish.slot === 'street' ? !['sweets', 'drinks'].includes(a.slot) : snack ? ['snacks', 'sweets', 'drinks'].includes(a.slot) : !['snacks', 'sweets', 'drinks'].includes(a.slot)) || a.name === dish.to;
  return alts.filter((a) => a.name !== dish.name && dietAllows(a.d) && fits(a))
    .map((a) => ({ a, r: (a.name === dish.to ? -100 : 0) + order.indexOf(a.fam) * 10 + (a.slot === dish.slot || (dish.slot === 'street' && ['snacks', 'breakfast'].includes(a.slot)) ? 0 : 3) + a.h }))
    .sort((x, y) => x.r - y.r).map((x) => x.a);
}
const altWhy = (dish, a) => {
  if (a.name === dish.to) return dish.why;
  const how = a.h === 1 ? 'Very light, with almost no oil.' : a.h === 2 ? 'Steamed, grilled or lightly cooked instead of fried or creamy.' : 'A balanced home-style plate with whole grains.';
  const p = { chicken: 'Keeps the chicken protein.', fish: 'Fish adds protein and healthy fats.', egg: 'Eggs give simple, filling protein.', paneer: 'Paneer gives protein and calcium.', dal: 'Dal and pulses give protein and fibre.', veg: 'More vegetables and fibre.' }[a.fam];
  return `${how} ${p}`;
};
const FS = { dish: null, left: null, i: 0, msg: '' };
function finderCard() {
  const dish = FS.dish; if (!dish) return '';
  const list = altsFor(FS.left || dish);
  const a = list[FS.i % Math.max(1, list.length)];
  if (!a) return '<p class="muted">No other choices match your food preference.</p>';
  const left = FS.left || dish;
  return `<article class="meal-card finder-card">
      <div class="meal-pair">
        <figure class="meal-side bad"><img src="${fImg(left.img)}" alt="" data-ld><figcaption><small>Instead of</small><b>${esc(left.name)}</b></figcaption></figure>
        <div class="vs"><span>→</span></div>
        <figure class="meal-side good"><img src="${fImg(a.img)}" alt="" data-ld><figcaption><small>Try this ${dietMark(a.d)}</small><b>${esc(a.name)}</b></figcaption></figure>
      </div>
      <p class="meal-why">${esc(altWhy(left.to ? left : dish, a))}</p>
      ${FS.msg ? `<p class="finder-msg">${esc(FS.msg)}</p>` : ''}
      <div class="finder-btns">
        <button class="another" data-fnext>↻ Another healthy option</button>
        <button class="another lighter" data-flighter>⬇ One step lighter</button>
      </div>
      ${FS.left ? `<button class="link-btn" data-freset>Start again from ${esc(dish.name)}</button>` : ''}
    </article>`;
}
function wireFinder() {
  const inp = $('#fq'), lb = $('#flist'), out = $('#fout');
  if (!inp) return;
  let active = -1, shown = [];
  const render = () => { out.innerHTML = finderCard(); };
  const open = () => {
    const q = inp.value.trim().toLowerCase();
    const { dishes } = finderData();
    shown = dishes.filter((d) => dietAllows(d.d) && (!q || d.name.toLowerCase().includes(q) || q.split(/\s+/).every((w) => d.name.toLowerCase().includes(w)))).slice(0, 60);
    active = -1;
    lb.innerHTML = shown.length ? shown.map((d, i) => `<li role="option" id="fo-${i}" data-fi="${i}" aria-selected="false"><img src="${fImg(d.img)}" alt="" loading="lazy">${dietMark(d.d)}<span>${esc(d.name)}</span></li>`).join('')
      : '<li class="none" role="option" aria-disabled="true">No match yet. Try "chicken", "paneer", "samosa" or "pizza".</li>';
    lb.hidden = false; inp.setAttribute('aria-expanded', 'true');
  };
  const close = () => { lb.hidden = true; inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); };
  const pick = (d) => { if (!d) return; FS.dish = d; FS.left = null; FS.i = 0; FS.msg = ''; inp.value = d.name; close(); render(); };
  inp.addEventListener('focus', open);
  inp.addEventListener('input', open);
  inp.addEventListener('keydown', (e) => {
    if (lb.hidden && (e.key === 'ArrowDown' || e.key === 'Enter')) { open(); }
    const items = lb.querySelectorAll('[data-fi]');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!items.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((el, i) => el.setAttribute('aria-selected', i === active ? 'true' : 'false'));
      inp.setAttribute('aria-activedescendant', 'fo-' + active); items[active].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') { e.preventDefault(); pick(shown[active >= 0 ? active : 0]); }
    else if (e.key === 'Escape') close();
  });
  lb.addEventListener('mousedown', (e) => { const li = e.target.closest('[data-fi]'); if (li) { e.preventDefault(); pick(shown[+li.dataset.fi]); } });
  if (!wireFinder.docClick) { wireFinder.docClick = true; document.addEventListener('click', (e) => { const l = $('#flist'); if (l && !e.target.closest('.finder-box')) { l.hidden = true; const i = $('#fq'); if (i) i.setAttribute('aria-expanded', 'false'); } }); }
  out.addEventListener('click', (e) => {
    if (e.target.closest('[data-fnext]')) { FS.i += 1; FS.msg = ''; render(); }
    else if (e.target.closest('[data-freset]')) { FS.left = null; FS.i = 0; FS.msg = ''; render(); }
    else if (e.target.closest('[data-flighter]')) {
      const list = altsFor(FS.left || FS.dish), cur = list[FS.i % Math.max(1, list.length)];
      if (!cur) return;
      const lighter = altsFor(cur).filter((x) => x.h < cur.h && x.name !== (FS.left || FS.dish).name);
      if (!lighter.length) { FS.msg = `${cur.name} is already one of the lightest choices. Well done!`; render(); return; }
      FS.left = { ...cur, to: null }; FS.i = altsFor(FS.left).indexOf(lighter[0]); FS.msg = ''; render();
    }
  });
  // Popular dishes as tappable photo chips, so the list is visible without typing
  const POP = ['Vada pav', 'Misal pav', 'Pav bhaji with butter', 'Samosa', 'Pani puri', 'Dabeli', 'Chole bhature', 'Bhel puri', 'Fried momos', 'Chole kulche', 'Butter chicken with butter naan', 'Chicken 65', 'Restaurant chicken biryani', 'Egg puff', 'Pizza', 'Instant noodles', 'Aloo paratha with butter', 'Kachori'];
  const pop = POP.map((n) => finderData().dishes.find((d) => d.name === n)).filter((d) => d && dietAllows(d.d));
  $('#fpop').innerHTML = pop.map((d) => `<button class="fchip" data-pop="${esc(d.name)}"><img src="${fImg(d.img)}" alt="" loading="lazy"><span>${esc(d.name.replace(/ with butter.*| with butter naan/, ''))}</span></button>`).join('');
  $('#fpop').onclick = (e) => { const b = e.target.closest('[data-pop]'); if (b) { pick(finderData().dishes.find((d) => d.name === b.dataset.pop)); $('#fout').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' }); } };
  if (FS.dish) { inp.value = FS.dish.name; render(); }
}

function screenSwaps() {
  const now = new Date();
  const day = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  const dateLabel = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const pd = S.profile.diet;
  view().innerHTML = `
    <header class="bar centred"><h2>${esc(t('swapday'))}</h2></header>
    <div class="page-title centred"><p>A healthier swap for every meal. New ideas every day.</p></div>

    <section class="finder">
      <div class="sec-head centred"><h3>Find a swap for any dish</h3></div>
      <div class="finder-box">
        <input id="fq" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="flist" autocomplete="off" placeholder="Type a dish, e.g. butter chicken" aria-label="Type a dish">
        <ul id="flist" class="finder-list" role="listbox" aria-label="Dishes" hidden></ul>
      </div>
      <div class="fpop" id="fpop" aria-label="Popular dishes"></div>
      <div id="fout"></div>
    </section>

    <section>
      <div class="meal-top centred">
        <span class="meal-date">📅 ${esc(dateLabel)}</span>
        <div class="diet-seg" role="radiogroup" aria-label="Food preference">${DIETS.map(([v, l]) => `<button role="radio" aria-checked="${mealDiet() === v}" class="${mealDiet() === v ? 'on' : ''}" data-diet="${v}">${dietMark(v)}${l}</button>`).join('')}</div>
        ${pd === 'jain' ? '<p class="muted small">Jain: make these without onion, garlic and root vegetables.</p>' : pd === 'vegan' ? '<p class="muted small">Vegan: use plant curd and tofu in place of dahi and paneer.</p>' : ''}
      </div>
      <div class="meal-list">${MEAL_SLOTS.map(([slot, e, l]) => mealCard(slot, e, l, day)).join('')}</div>
    </section>

    <section>
      <div class="sec-head centred"><h3>More healthier swaps</h3></div>
      <div class="cat-pills swap-pills centred">${SWAP_CATS.map(([c, l]) => `<button class="cpill ${SW.cat === c ? 'on' : ''}" data-swcat="${esc(c)}">${esc(l)}</button>`).join('')}</div>
      <div class="swap-list" id="swapList2"></div>
    </section>
    <p class="foot">Simple swaps for everyday Indian food. For awareness, not medical advice.</p>`;
  view().querySelectorAll('[data-diet]').forEach((b) => (b.onclick = () => {
    S.profile = { ...S.profile, diet: b.dataset.diet }; store.set('profile', S.profile); SWD.s = { breakfast: 0, lunch: 0, dinner: 0 }; if (FS.dish && !dietAllows(FS.dish.d)) FS.dish = null; FS.left = null; FS.i = 0; FS.msg = ''; screenSwaps();
  }));
  wireFinder();
  view().querySelector('.meal-list').onclick = (e) => {
    const b = e.target.closest('[data-another]'); if (!b) return;
    const slot = b.dataset.another; SWD.s[slot] += 1;
    const [, em, l] = MEAL_SLOTS.find((x) => x[0] === slot);
    const card = b.closest('.meal-card'); card.outerHTML = mealCard(slot, em, l, day);
  };
  const draw = () => {
    const list = SWAP_IDEAS.filter((x) => !SW.cat || x.cat === SW.cat);
    $('#swapList2').innerHTML = list.map((x) => `<article class="swap-row">
        <div class="sr-side sr-bad"><img class="sr-img" src="${mealImg(100 + SWAP_IDEAS.indexOf(x) * 2)}" alt="" loading="lazy"><span><small>Instead of</small><b>${esc(x.from)}</b></span></div>
        <span class="sr-arrow" aria-hidden="true">→</span>
        <div class="sr-side sr-good"><img class="sr-img" src="${mealImg(101 + SWAP_IDEAS.indexOf(x) * 2)}" alt="" loading="lazy"><span><small>Try this</small><b>${esc(x.to)}</b></span></div>
        <p class="sr-why">${esc(x.why)}</p>
      </article>`).join('');
  };
  view().querySelectorAll('[data-swcat]').forEach((btn) => (btn.onclick = () => {
    SW.cat = btn.dataset.swcat;
    view().querySelectorAll('[data-swcat]').forEach((x) => x.classList.toggle('on', x === btn));
    draw();
  }));
  draw();
}

// Everyday Indian swaps (general nutrition guidance, not product claims)
const SW = { cat: '' };
const SWAP_CATS = [['', 'All'], ['snacks', 'Snacks'], ['sweets', 'Mithai & sweets'], ['drinks', 'Drinks'], ['meals', 'Meals']];
const SWAP_IDEAS = [
  { cat: 'snacks', from: 'Salted potato chips', to: 'Roasted chana', why: 'Fried and salty vs roasted, with protein and fibre that keep you full.' },
  { cat: 'snacks', from: 'Kurkure or masala puffs', to: 'Roasted makhana', why: 'Makhana is light and crunchy, with far less oil and salt.' },
  { cat: 'snacks', from: 'Aloo bhujia or namkeen mix', to: 'Sprouts chaat', why: 'Namkeen is deep-fried and very salty. Sprouts give protein, fibre and crunch.' },
  { cat: 'snacks', from: 'Samosa', to: 'Steamed dhokla', why: 'Steamed instead of deep-fried, made from besan for extra protein.' },
  { cat: 'snacks', from: 'Cream biscuits', to: 'Banana and a handful of peanuts', why: 'Cream biscuits are mostly sugar and palm oil. This gives real energy and protein.' },
  { cat: 'snacks', from: 'Milk chocolate bar', to: 'Dates with almonds', why: 'Naturally sweet, with fibre and healthy fats instead of added sugar.' },
  { cat: 'sweets', from: 'Gulab jamun', to: 'Fresh fruit chaat', why: 'Gulab jamun is fried and soaked in sugar syrup. Fruit chaat is sweet, fresh and full of vitamins.' },
  { cat: 'sweets', from: 'Jalebi', to: 'Dates and dry fruits', why: 'Jalebi is fried and dipped in syrup. Dates satisfy a sweet craving with fibre.' },
  { cat: 'sweets', from: 'Kaju katli', to: 'A few plain cashews and raisins', why: 'Same cashews, without all the added sugar of the barfi.' },
  { cat: 'sweets', from: 'Rasgulla', to: 'Plain dahi with fruit', why: 'Rasgulla sits in sugar syrup. Dahi with fruit gives protein and gut-friendly curd.' },
  { cat: 'sweets', from: 'Ice cream', to: 'Homemade fruit kulfi or frozen banana', why: 'Less added sugar and no artificial flavours when you make it at home.' },
  { cat: 'sweets', from: 'Pastry or cream cake', to: 'Baked shakarkandi chaat', why: 'Sweet potato is naturally sweet and has fibre. Cakes are mostly refined flour, sugar and fat.' },
  { cat: 'drinks', from: 'Cola or soft drink', to: 'Nimbu pani with little sugar', why: 'A can of cola has about 9 teaspoons of sugar. Nimbu pani is refreshing with far less.' },
  { cat: 'drinks', from: 'Packaged fruit juice', to: 'A whole fruit', why: 'Whole fruit keeps its fibre, so the sugar is absorbed slowly.' },
  { cat: 'drinks', from: 'Energy drink', to: 'Coconut water', why: 'Natural electrolytes without the caffeine and added sugar.' },
  { cat: 'drinks', from: 'Flavoured milkshake', to: 'Plain milk blended with a banana', why: 'Sweetness from fruit instead of syrup and flavouring.' },
  { cat: 'drinks', from: 'Sweet lassi', to: 'Masala chaas', why: 'Chaas cools and helps digestion, with almost no sugar.' },
  { cat: 'meals', from: 'Instant noodles', to: 'Vegetable poha or upma', why: 'Instant noodles are high in salt and refined flour. Poha with veggies is light and filling.' },
  { cat: 'meals', from: 'White bread sandwich', to: 'Paneer or veg roti roll', why: 'Whole-wheat roti and paneer give more fibre and protein.' },
  { cat: 'meals', from: 'Sugary breakfast cereal', to: 'Oats or dalia with fruit', why: 'Whole grains without the added sugar coating.' },
  { cat: 'meals', from: 'Pizza or burger', to: 'Homemade besan chilla or veg frankie', why: 'More veggies and protein, much less cheese, oil and refined flour.' },
  { cat: 'meals', from: 'Restaurant butter-heavy curry', to: 'Home-style dal and sabzi', why: 'Same flavours with far less butter, cream and salt.' },
];

// ---------------- Shop ----------------
// Products come from /api/shop (netlify/lib/shop.mjs). Sample listings are shown but cannot be bought.
let SHOPDATA = null;
async function shopData() { if (!SHOPDATA) SHOPDATA = await apiGet('/shop'); return SHOPDATA; }
const rupees = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const shopImg = (p) => mealImg(p.img);
const cartCount = () => S.cart.reduce((n, c) => n + c.qty, 0);
const SHOPSTATE = { cat: '', q: '' };
function shopCard(p) {
  const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  return `<a class="shop-card" href="#/shop/${esc(p.id)}">
    <div class="sc-img"><img src="${shopImg(p)}" alt="" loading="lazy" data-ld>${p.sample ? '<span class="sc-tag">Sample</span>' : off ? `<span class="sc-tag off">${off}% off</span>` : ''}</div>
    <div class="sc-body"><small class="muted">${esc(p.brand)} · ${esc(p.size)}</small><b>${esc(p.name)}</b>
      <div class="sc-price"><span>${rupees(p.price)}</span>${p.mrp > p.price ? `<s>${rupees(p.mrp)}</s>` : ''}</div>${vPill(p.verdict)}</div></a>`;
}
function cartBtn() { const n = cartCount(); return `<a class="chip cart-chip" href="#/cart" aria-label="Cart, ${n} items">🛒 Cart${n ? ` <b>${n}</b>` : ''}</a>`; }
async function screenShop(id) {
  if (id) return screenShopItem(id);
  view().innerHTML = `
    <header class="bar"><h2>${esc(t('shop'))}</h2><span class="shop-hd"><a class="chip" href="#/coins"><i class="coin" aria-hidden="true"></i> ${S.coins.bal}</a>${cartBtn()}</span></header>
    <div class="page-title"><p>Healthier packaged food, checked by SmartBite before it is listed.</p></div>
    <div class="pad"><input class="shop-search" id="shopQ" type="search" placeholder="Search makhana, millet, peanut butter…" value="${esc(SHOPSTATE.q)}" aria-label="Search the shop"></div>
    <div class="cat-pills" id="shopCats"></div>
    <div id="shopGrid" class="shop-grid"><div class="card empty" style="grid-column:1/-1"><span class="spin" style="color:var(--jamun)"></span></div></div>
    <a class="card shop-brand" href="#/partner"><div><b>Are you a healthy food brand?</b><p class="muted small">List your products in the SmartBite shop. Every product gets a SmartBite score before it goes live.</p></div><span class="btn sm">Sell with us</span></a>
    <p class="foot">Products marked "Sample" are examples of what partner brands can list. They are not for sale yet.</p>`;
  let d;
  try { d = await shopData(); } catch (e) { $('#shopGrid').innerHTML = `<div class="card empty" style="grid-column:1/-1"><p class="muted">${esc(e.message)}</p></div>`; return; }
  const draw = () => {
    const q = SHOPSTATE.q.trim().toLowerCase();
    const list = d.products.filter((p) => (!SHOPSTATE.cat || p.cat === SHOPSTATE.cat) && (!q || `${p.name} ${p.brand} ${p.cat}`.toLowerCase().includes(q)));
    $('#shopCats').innerHTML = ['', ...d.cats].map((c) => `<button class="cpill ${SHOPSTATE.cat === c ? 'on' : ''}" data-shopcat="${esc(c)}">${esc(c || 'All')}</button>`).join('');
    $('#shopGrid').innerHTML = list.length ? list.map(shopCard).join('') : '<div class="card empty" style="grid-column:1/-1"><p class="muted">Nothing matches that search yet.</p></div>';
    view().querySelectorAll('[data-shopcat]').forEach((b) => (b.onclick = () => { SHOPSTATE.cat = b.dataset.shopcat; draw(); }));
  };
  $('#shopQ').oninput = (e) => { SHOPSTATE.q = e.target.value; draw(); };
  draw();
}
async function screenShopItem(id) {
  view().innerHTML = '<div class="card empty" style="margin-top:40px"><span class="spin" style="color:var(--jamun)"></span></div>';
  let d; try { d = await shopData(); } catch (e) { view().innerHTML = `<div class="card empty"><p>${esc(e.message)}</p></div>`; return; }
  const p = d.products.find((x) => x.id === id);
  if (!p) { location.hash = '#/shop'; return; }
  const n = p.per100 || {};
  const inCart = S.cart.find((c) => c.id === p.id);
  view().innerHTML = `
    <header class="bar"><a href="#/shop" class="back" aria-label="Back">‹</a><span></span>${cartBtn()}</header>
    <div class="si-img"><img src="${shopImg(p)}" alt="${esc(p.name)}" data-ld></div>
    <section class="card si-main">
      <small class="muted">${esc(p.brand)} · ${esc(p.cat)} · ${esc(p.size)}</small>
      <h2>${esc(p.name)}</h2>
      <div class="sc-price big"><span>${rupees(p.price)}</span>${p.mrp > p.price ? `<s>${rupees(p.mrp)}</s><em>${Math.round((1 - p.price / p.mrp) * 100)}% off</em>` : ''}</div>
      <div style="margin:8px 0 12px">${vPill(p.verdict)} <span class="muted small">SmartBite verdict</span></div>
      ${p.sample ? '<div class="si-note">This is a sample listing. It shows how partner brands will appear and is not for sale yet.</div>'
        : `<div class="qty" id="qty"><button data-q="-1" aria-label="Less">−</button><b id="qn">${inCart ? inCart.qty : 1}</b><button data-q="1" aria-label="More">+</button></div>`}
      <button class="btn hot wide" id="addCart" ${p.sample ? 'disabled' : ''}>${p.sample ? 'Not for sale yet' : inCart ? 'Update cart' : 'Add to cart'}</button>
    </section>
    <section class="card"><h3>Why it scores well</h3><ul class="dish-tips">${p.highlights.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
    <section class="card"><h3>Nutrition per 100 ${/ml/.test(p.size) ? 'ml' : 'g'}</h3>
      <table class="nt"><tr><th>Energy</th><td>${n.kcal} kcal</td></tr><tr><th>Protein</th><td>${n.protein} g</td></tr><tr><th>Sugar</th><td>${n.sugar} g</td></tr><tr><th>Fat</th><td>${n.fat} g</td></tr><tr><th>Sodium</th><td>${n.sodium} mg</td></tr></table>
      <p class="muted small" style="margin-top:8px">Typical values. Always check the label on the pack.</p></section>`;
  if (p.sample) return;
  let q = inCart ? inCart.qty : 1;
  view().querySelectorAll('[data-q]').forEach((b) => (b.onclick = () => { q = Math.max(1, Math.min(10, q + +b.dataset.q)); $('#qn').textContent = q; }));
  $('#addCart').onclick = () => {
    const c = S.cart.find((x) => x.id === p.id);
    if (c) c.qty = q; else S.cart.push({ id: p.id, qty: q });
    save('cart'); toast('Added to cart ✓'); screenShopItem(id);
  };
}
async function screenCart() {
  view().innerHTML = '<div class="card empty" style="margin-top:40px"><span class="spin" style="color:var(--jamun)"></span></div>';
  let d; try { d = await shopData(); } catch (e) { view().innerHTML = `<div class="card empty"><p>${esc(e.message)}</p></div>`; return; }
  const items = S.cart.map((c) => ({ ...c, p: d.products.find((x) => x.id === c.id) })).filter((x) => x.p && !x.p.sample);
  if (items.length !== S.cart.length) { S.cart = items.map(({ id, qty }) => ({ id, qty })); save('cart'); }
  const total = items.reduce((s, x) => s + x.p.price * x.qty, 0);
  view().innerHTML = `
    <header class="bar"><a href="#/shop" class="back" aria-label="Back">‹</a><h2>Your cart</h2><span style="width:40px"></span></header>
    ${items.length ? `<div class="list">${items.map((x) => `<div class="row cart-row"><img class="thumb" src="${shopImg(x.p)}" alt=""><span class="grow"><b>${esc(x.p.name)}</b><br><small class="muted">${esc(x.p.size)} · ${rupees(x.p.price)}</small></span>
        <span class="qty sm"><button data-cq="${esc(x.id)}" data-d="-1" aria-label="Less">−</button><b>${x.qty}</b><button data-cq="${esc(x.id)}" data-d="1" aria-label="More">+</button></span></div>`).join('')}</div>
      <section class="card"><div class="tot-row"><span>Items</span><b>${rupees(total)}</b></div><div class="tot-row"><span>Delivery</span><b>${total >= 499 ? 'Free' : rupees(40)}</b></div>
        <div class="tot-row big"><span>Total</span><b>${rupees(total + (total >= 499 ? 0 : 40))}</b></div>
        <a class="btn hot wide" href="#/checkout" style="margin-top:12px">Checkout</a></section>`
      : `<div class="card empty"><span class="big-emoji">🛒</span><p><b>Your cart is empty</b></p><p class="muted small">Products from partner brands will appear in the shop soon.</p><a class="btn sm hot" href="#/shop" style="margin-top:8px">Go to the shop</a></div>`}`;
  view().querySelectorAll('[data-cq]').forEach((b) => (b.onclick = () => {
    const c = S.cart.find((x) => x.id === b.dataset.cq); if (!c) return;
    c.qty += +b.dataset.d; if (c.qty < 1) S.cart = S.cart.filter((x) => x !== c);
    save('cart'); screenCart();
  }));
}
async function screenCheckout() {
  let d; try { d = await shopData(); } catch (e) { view().innerHTML = `<div class="card empty"><p>${esc(e.message)}</p></div>`; return; }
  const items = S.cart.map((c) => ({ ...c, p: d.products.find((x) => x.id === c.id) })).filter((x) => x.p && !x.p.sample);
  if (!items.length) { location.hash = '#/cart'; return; }
  const total = items.reduce((s, x) => s + x.p.price * x.qty, 0), ship = total >= 499 ? 0 : 40;
  const sh = S.ship || {};
  view().innerHTML = `
    <header class="bar"><a href="#/cart" class="back" aria-label="Back">‹</a><h2>Checkout</h2><span style="width:40px"></span></header>
    <form id="co" class="card form">
      <h3>Delivery address</h3>
      <label>Full name<input name="name" required maxlength="60" autocomplete="name" value="${esc(sh.name || S.profile.name || '')}"></label>
      <label>Mobile number<input name="phone" required inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" autocomplete="tel-national" value="${esc(sh.phone || '')}"></label>
      <label>Address<textarea name="address" required rows="2" maxlength="200" autocomplete="street-address">${esc(sh.address || '')}</textarea></label>
      <div class="two-col"><label>Pincode<input name="pin" required inputmode="numeric" pattern="[1-9][0-9]{5}" maxlength="6" autocomplete="postal-code" value="${esc(sh.pin || '')}"></label>
        <label>City<input name="city" required maxlength="40" autocomplete="address-level2" value="${esc(sh.city || '')}"></label></div>
    </form>
    <section class="card"><h3>Order summary</h3>${items.map((x) => `<div class="tot-row"><span>${esc(x.p.name)} × ${x.qty}</span><b>${rupees(x.p.price * x.qty)}</b></div>`).join('')}
      <div class="tot-row"><span>Delivery</span><b>${ship ? rupees(ship) : 'Free'}</b></div><div class="tot-row big"><span>Total</span><b>${rupees(total + ship)}</b></div></section>
    ${S.coins.bal ? `<section class="card coin-use"><label class="cu-row"><input type="checkbox" id="useCoins"><span class="coin" aria-hidden="true"></span><span class="grow"><b>Use ${Math.min(S.coins.bal, Math.floor((total + ship) * COIN_MAX_SHARE))} SmartBite Coins</b><small class="muted">Save ${rupees(Math.min(S.coins.bal, Math.floor((total + ship) * COIN_MAX_SHARE)))} on this order</small></span></label><p class="muted small" id="coinEarn">You'll earn ${Math.round(total * COIN_BACK)} coins on this order.</p></section>` : `<p class="muted small centred">You'll earn ${Math.round(total * COIN_BACK)} SmartBite Coins on this order.</p>`}
    <section class="card pay-box" id="payBox">
      <h3>Payment</h3>
      <div class="pay-opt"><span class="pay-ic">💳</span><div><b>UPI, cards and netbanking</b><p class="muted small">${d.payments ? 'Secure online payment' : 'Online payment is being set up. You can place orders here as soon as it opens.'}</p></div></div>
      <button class="btn hot wide" id="payBtn" ${d.payments ? '' : 'disabled'}>${d.payments ? `Pay ${rupees(total + ship)}` : 'Payment opening soon'}</button>
    </section>`;
  if ($('#useCoins')) $('#useCoins').onchange = (e) => {
    const off = e.target.checked ? Math.min(S.coins.bal, Math.floor((total + ship) * COIN_MAX_SHARE)) : 0;
    view().querySelector('.tot-row.big b').textContent = rupees(total + ship - off);
    if (d.payments) $('#payBtn').textContent = `Pay ${rupees(total + ship - off)}`;
  };
  $('#co').addEventListener('input', () => { S.ship = Object.fromEntries(new FormData($('#co')).entries()); save('ship'); });
  $('#payBtn').onclick = async () => {
    const f = $('#co'); if (!f.reportValidity()) return;
    const coinsUsed = $('#useCoins') && $('#useCoins').checked ? Math.min(S.coins.bal, Math.floor((total + ship) * COIN_MAX_SHARE)) : 0;
    try { await startPayment({ items: items.map((x) => ({ id: x.id, qty: x.qty })), coinsUsed, ship: Object.fromEntries(new FormData(f).entries()) }); }
    catch (e) { toast(e.message, 'bad'); }
  };
}
// ---- PAYMENT HOOK: Razorpay goes here (not built yet) ----
// Plan, once the bank account is decided:
//  1. netlify/functions/pay-order.mjs: read items from the request, price them from
//     netlify/lib/shop.mjs (never trust the browser), create a Razorpay order with the
//     RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET environment variables, save it in Blobs.
//  2. Here: load https://checkout.razorpay.com/v1/checkout.js and open Razorpay Checkout
//     with the order id that step 1 returns.
//  3. netlify/functions/pay-verify.mjs: check the payment signature (HMAC-SHA256 with the
//     key secret), mark the order paid, then clear S.cart and show the order confirmation.
//     On success: addCoins(-order.coinsUsed, 'Used on order'); addCoins(round(itemsTotal * COIN_BACK), 'Order cashback').
//  4. Set PAYMENTS_LIVE = true in netlify/functions/shop.mjs to switch the Pay button on.
async function startPayment(order) { // eslint-disable-line no-unused-vars
  throw new Error('Online payment is not live yet.');
}

// ---------------- Reviews ----------------
const REVIEW_TAGS = ['Easy to use', 'Accurate verdicts', 'Helps my kids', 'Great swaps', 'Fast scanning', 'Looks good', 'Needs work'];
const STAR_WORDS = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Excellent'];
const RV = { star: 0, sort: 'new' };
function ago(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return 'Today'; if (d < 2) return 'Yesterday'; if (d < 7) return `${Math.floor(d)} days ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d > 300 ? 'numeric' : undefined });
}
function revSummary(j, link) {
  const dist = j.dist || [0, 0, 0, 0, 0], max = Math.max(1, ...dist);
  return `<div class="card rv-sum">
    <div class="rv-avg"><b>${(+j.avg).toFixed(1)}</b>${stars(j.avg)}<small>${j.count} review${j.count > 1 ? 's' : ''}</small></div>
    <div class="rv-bars">${[5, 4, 3, 2, 1].map((n) => `<button class="rv-bar ${RV.star === n ? 'on' : ''}" data-star="${n}" aria-label="Show ${n} star reviews"><span>${n}★</span><i><em style="width:${Math.round(dist[n - 1] / max * 100)}%"></em></i><small>${dist[n - 1]}</small></button>`).join('')}</div>
    ${link ? '<a class="chip rv-all" href="#/reviews/app">See all reviews ›</a>' : ''}</div>`;
}
function appRevCard(rv, i) {
  const c = AV_COLORS[i % AV_COLORS.length];
  return `<article class="rev rv-card">
    <div class="who"><span class="avatar" style="background:${c}">${esc((rv.name || '?').trim().charAt(0).toUpperCase())}</span><div class="grow"><b>${esc(rv.name)}</b><small class="muted"> · ${esc(ago(rv.created_at))}</small><br>${stars(rv.rating)} <small class="rv-word">${STAR_WORDS[rv.rating] || ''}</small></div></div>
    <p>${esc(rv.comment)}</p>
    ${(rv.tags || []).length ? `<div class="rv-tags">${rv.tags.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
    ${rv.scanned ? `<small class="muted">Scanned: ${esc(rv.scanned)}</small>` : ''}</article>`;
}
async function loadReviews() {
  const box = $('#revBox'); if (!box) return;
  const full = box.dataset.full === '1';
  try {
    const j = await apiGet('/reviews');
    if (!j.count) {
      box.innerHTML = `<div class="card empty"><span class="big-emoji">⭐</span><p><b>No reviews yet</b></p><p class="muted small">Tried SmartBite? Be the first to tell others what you think.</p></div>`;
      return;
    }
    const draw = () => {
      let list = j.reviews.filter((r) => !RV.star || r.rating === RV.star);
      if (RV.sort === 'high') list = [...list].sort((a, b) => b.rating - a.rating);
      if (RV.sort === 'low') list = [...list].sort((a, b) => a.rating - b.rating);
      box.innerHTML = revSummary(j, !full) + (full
        ? `<div class="rv-tools pad"><span class="muted small">${RV.star ? `${RV.star}★ only · <button class="linkbtn" data-star="0">Show all</button>` : 'All ratings'}</span>
            <select id="rvSort" aria-label="Sort reviews"><option value="new">Newest</option><option value="high">Highest rated</option><option value="low">Lowest rated</option></select></div>
           <div class="rev-list stagger">${list.length ? list.map(appRevCard).join('') : '<div class="card empty"><p class="muted">No reviews with this rating yet.</p></div>'}</div>`
        : `<div class="rev-track stagger">${list.slice(0, 8).map(appRevCard).join('')}</div>`);
      if (full) { $('#rvSort').value = RV.sort; $('#rvSort').onchange = (e) => { RV.sort = e.target.value; draw(); }; }
      box.querySelectorAll('[data-star]').forEach((b) => (b.onclick = () => { const n = +b.dataset.star; RV.star = RV.star === n ? 0 : n; draw(); }));
    };
    draw();
  } catch {
    box.innerHTML = `<div class="card empty"><p class="muted">Reviews could not load. Check your connection and try again.</p></div>`;
  }
}
function openReviewForm(product) {
  let rating = 0;
  const m = modal(`${product ? `<div class="rev-head">${product.imgSmall || product.img ? `<img src="${esc(product.imgSmall || product.img)}" alt="">` : ''}<div><h2>Rate this product</h2><p class="muted">${esc(product.brand)} ${esc(product.name)}</p></div></div>` : '<h2>Rate SmartBite</h2><p class="muted">Your review shows on the home screen for everyone.</p>'}
    <form id="rf" class="form" style="margin-top:12px">
      <div class="star-input" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-r="${i}" aria-label="${i} star${i > 1 ? 's' : ''}">★</button>`).join('')}</div>
      <p class="star-word" id="sword">Tap a star</p>
      ${product ? '' : `<fieldset><legend>What stood out? <span class="muted small">(optional)</span></legend><div class="checks">${REVIEW_TAGS.map((x) => `<label class="ck"><input type="checkbox" name="tags" value="${esc(x)}"><span>${esc(x)}</span></label>`).join('')}</div></fieldset>`}
      <label>Your name<input name="name" required maxlength="40" value="${esc(S.profile.name)}"></label>
      ${product ? '' : `<label>What did you scan? <span class="muted small">(optional)</span><input name="scanned" maxlength="60" placeholder="e.g. Lay's Magic Masala"></label>`}
      <label>Your review<textarea name="comment" required rows="3" maxlength="500" placeholder="${product ? 'How does it taste? Is it worth it? Would you give it to kids?' : 'What helped you? What should we improve?'}"></textarea></label>
      <p id="rmsg" class="small"></p>
      <div class="btnrow"><button type="button" class="btn-ghost" data-close>Cancel</button><button class="btn hot" id="rsend">Post review</button></div>
    </form>`);
  const btns = [...m.querySelectorAll('[data-r]')];
  btns.forEach((b) => (b.onclick = () => { rating = +b.dataset.r; btns.forEach((x) => x.classList.toggle('on', +x.dataset.r <= rating)); m.querySelector('#sword').textContent = STAR_WORDS[rating]; }));
  m.querySelector('#rf').onsubmit = async (e) => {
    e.preventDefault();
    const msg = m.querySelector('#rmsg'), send = m.querySelector('#rsend');
    if (!rating) { msg.className = 'small err'; msg.textContent = 'Tap the stars to choose a rating.'; return; }
    send.disabled = true; send.innerHTML = '<span class="spin"></span> Posting…';
    try {
      const fd = new FormData(e.target); const body = { ...Object.fromEntries(fd.entries()), tags: fd.getAll('tags'), rating };
      if (product) Object.assign(body, { key: reviewKey(product), product_name: `${product.brand} ${product.name}`.slice(0, 160), brand: product.brand, img: product.imgSmall || product.img || '' });
      const r = await fetch(API + (product ? '/product-reviews' : '/reviews'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'Could not post right now.');
      if (body.name && !S.profile.name) { S.profile.name = body.name; save('profile'); }
      m.remove(); toast('Review posted ✓'); confetti('star'); if (product) loadProductReviews(product); else loadReviews();
    } catch (err) { msg.className = 'small err'; msg.textContent = err.message; send.disabled = false; send.textContent = 'Post review'; }
  };
}

// ---------------- Scan ----------------
let qr = null;
async function stopCam() { if (qr) { try { await qr.stop(); } catch {} try { qr.clear(); } catch {} qr = null; } }
const MODES = [
  ['barcode', '▥', '#2F80ED'], ['packet', '📦', '#FB8500'], ['plate', '🍛', '#20B26B'], ['label', '🧪', '#FF5D8F'],
];
function screenScan(mode) {
  if (!MODES.some((m) => m[0] === mode)) mode = 'packet';
  const hint = { barcode: t('hintBarcode'), packet: t('hintPacket'), plate: t('hintPlate'), label: t('hintLabel') }[mode];
  const left = Math.max(0, 5 - (S.aiCount.day === today() ? S.aiCount.n : 0));
  let body = '';
  if (mode === 'barcode') {
    body = `<div id="reader" class="reader"><div class="scanline"></div></div>
      <div class="btnrow"><button class="btn" id="camBtn">${esc(t('startCam'))}</button></div>
      ${searchBox()}`;
  } else if (mode === 'packet') {
    body = `<div class="shots">${shot('front', t('takeFront'), true, 'chips')}${shot('back', t('takeBack'), false, 'spices')}</div>
      <button class="btn hot wide" id="go" disabled>${esc(t('analyse'))}</button>
      <p class="muted small pad" style="margin-top:12px">Works with any product on the shelf, e.g. Lay's American Style Cream &amp; Onion or Balaji Masala Masti. Prefer barcodes? <a href="#/scan/barcode">Scan the barcode</a>.</p>
      ${searchBox()}`;
  } else {
    body = `<div class="shots one">${shot('front', t('takePhoto'), true, mode === 'plate' ? 'thali' : 'spices')}</div>
      <button class="btn hot wide" id="go" disabled>${esc(t('analyse'))}</button>`;
  }
  view().innerHTML = `
    <header class="bar"><h2>${esc(t('scan'))}</h2>${S.plan === 'free' ? `<a class="chip" href="#/plans">⚡ ${left} AI scans left</a>` : '<span class="pro-badge">PRO</span>'}</header>
    <div class="modes">${MODES.map(([m, e, c]) => `<a href="#/scan/${m}" class="mode ${m === mode ? 'on' : ''}" style="--mc:${c}" ${m === mode ? 'aria-current="true"' : ''}><span class="e">${e}</span>${esc(t(m))}</a>`).join('')}</div>
    <p class="hint">${esc(hint)}</p>
    ${body}`;

  const shots = {};
  view().querySelectorAll('input[type=file]').forEach((inp) => inp.addEventListener('change', async () => {
    const f = inp.files[0]; if (!f) return;
    const box = inp.closest('.shot');
    try { shots[inp.dataset.slot] = await fileToB64(f); box.style.backgroundImage = `url(${shots[inp.dataset.slot].preview})`; box.classList.add('has'); }
    catch { toast('Could not read that photo. Try another one.', 'bad'); }
    $('#go').disabled = !shots.front;
  }));
  const goBtn = $('#go');
  if (goBtn) goBtn.addEventListener('click', async () => {
    if (!aiAllowed()) return;
    goBtn.disabled = true;
    const done = showAnalysing(mode);
    try {
      if (mode === 'packet') await runPacket(shots);
      else if (mode === 'plate') await runPlate(shots.front);
      else await runLabel(shots.front);
    } catch (e) {
      toast(e.setup ? 'AI photo scanning is not switched on for this site yet. Barcode scan and search still work.' : e.message, 'bad');
      goBtn.disabled = false;
    } finally { done(); }
  });
  wireSearch();

  const cam = $('#camBtn');
  if (cam) {
    const start = async () => {
      if (!window.Html5Qrcode) { toast('Scanner is still loading. Try again in a second.'); return; }
      try {
        const F = window.Html5QrcodeSupportedFormats;
        qr = new window.Html5Qrcode('reader', { formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128], verbose: false });
        await qr.start({ facingMode: 'environment' }, { fps: 12, qrbox: (w, h) => ({ width: Math.min(300, w * 0.85), height: Math.min(160, h * 0.5) }) },
          async (code) => { await stopCam(); lookupBarcode(code); }, () => {});
        cam.textContent = t('stopCam'); cam.onclick = async () => { await stopCam(); screenScan('barcode'); };
      } catch { toast('Camera not available. Type the barcode or use a packet photo.', 'bad'); }
    };
    cam.onclick = start;
    start();
  }
}
const searchBox = () => `<div class="search"><input id="q" inputmode="search" placeholder="${esc(t('search'))}" autocomplete="off" aria-label="${esc(t('search'))}"><button class="btn sm" id="qGo">Go</button></div><div id="qres" class="list"></div>`;
function wireSearch() {
  const q = $('#q'); if (!q) return;
  let timer = null, seq = 0;
  const row = (p) => { const a = scoreFor(p, 'adult', S.profile); return `<button class="row" ${p.id.startsWith('off-') && !findProduct(p.id) ? `data-bc="${esc(p.barcode)}"` : `data-open="${esc(p.id)}"`}><img class="thumb" src="${esc(imgFor(p))}" alt="" loading="lazy"><span class="grow"><b>${esc(p.brand)}</b> ${esc(p.name)}<br>${junkBadge(p, true)}</span><span class="score-pill v-${verdictKey(a.verdict)}">${a.score.toFixed(1)}</span></button>`; };
  const show = () => {
    const v = q.value.trim(), lv = v.toLowerCase();
    if (!v) { $('#qres').innerHTML = ''; return; }
    if (/^\d{8,14}$/.test(v)) { $('#qres').innerHTML = `<button class="row" id="bcLook"><span class="grow">Look up barcode <b>${esc(v)}</b></span>›</button>`; $('#bcLook').onclick = () => lookupBarcode(v); return; }
    const local = allProducts().filter((p) => `${p.brand} ${p.name}`.toLowerCase().includes(lv)).slice(0, 5);
    $('#qres').innerHTML = local.map(row).join('') + '<div class="row muted" id="qmore"><span class="spin"></span> Searching millions of products worldwide…</div>';
    clearTimeout(timer);
    const my = ++seq;
    timer = setTimeout(async () => {
      try {
        const r = await apiGet('/products?q=' + encodeURIComponent(v));
        if (my !== seq) return;
        const seen = new Set(local.map((p) => p.barcode).filter(Boolean));
        const more = r.items.filter((p) => !seen.has(p.barcode));
        const el = $('#qmore'); if (!el) return;
        el.outerHTML = more.length ? more.map(row).join('') : (local.length ? '' : '<div class="card empty"><p class="muted">No match. Try the brand name, or take a photo of the packet.</p></div>');
      } catch { const el = $('#qmore'); if (el) el.textContent = 'World search is offline right now.'; }
    }, 350);
  };
  q.addEventListener('input', show);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const v = q.value.trim(); if (/^\d{8,14}$/.test(v)) lookupBarcode(v); else show(); } });
  $('#qGo').onclick = () => { const v = q.value.trim(); if (/^\d{8,14}$/.test(v)) lookupBarcode(v); else show(); };
}
function shot(slot, label, req, img) {
  return `<label class="shot ${req ? 'req' : ''}"><img class="bgimg" src="${pic(img)}" alt=""><input type="file" accept="image/*" capture="environment" data-slot="${slot}" hidden><span class="plus">＋</span><span class="lbl">${esc(label)}</span></label>`;
}

async function lookupBarcode(bc) {
  bc = String(bc).trim();
  const local = allProducts().find((p) => p.barcode === bc);
  if (local) return showProduct(local, local.src || 'Our database');
  return openBarcode(bc);
}

// Do numbers read from a photo add up? (sugar within carbs, saturated within total fat,
// calories close to what fat + carbs + protein give). Blurry photos fail this check.
function plausible(n, drink) {
  const v = (k) => (n[k] == null || n[k] === '' || isNaN(+n[k]) ? null : +n[k]);
  const kcal = v('kcal'), fat = v('fat'), sat = v('sat'), carbs = v('carbs'), sugar = v('sugar'), protein = v('protein'), sodium = v('sodium');
  if (kcal == null || sugar == null || sodium == null) return false;
  if ([kcal, fat, sat, carbs, sugar, protein, sodium].some((x) => x != null && x < 0)) return false;
  if (carbs != null && sugar > carbs + 0.5) return false;
  if (fat != null && sat != null && sat > fat + 0.5) return false;
  if (kcal > 900 || (drink && kcal > 120) || sodium > 5000) return false;
  if (fat != null && carbs != null && protein != null) {
    const est = fat * 9 + carbs * 4 + protein * 4;
    if (est > 20 && Math.abs(est - kcal) / Math.max(est, kcal) > 0.25) return false;
  }
  return true;
}

async function runPacket(shots) {
  const imgs = [shots.front, shots.back].filter(Boolean);
  const res = await callAI('packet', imgs, shots.back ? 'Image 1 is the FRONT of the pack, image 2 is the BACK (nutrition table and ingredients).' : 'Image 1 is the FRONT of the pack.');
  const id = res.identified || {};
  if (!id.name && !id.brand) throw new Error('Could not recognise this product. Try a clearer photo of the front.');
  const ai = res.product || {};
  const label = `${id.brand || ''} ${id.name || ''}${id.variant ? ' ' + id.variant : ''}`.trim();
  const fromAI = (approx) => ({
    id: 'ai-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60), brand: id.brand || 'Unknown', name: `${id.name || ''}${id.variant && !String(id.name).includes(id.variant) ? ' ' + id.variant : ''}`.trim(),
    cat: ai.category || 'Packaged food', drink: !!ai.isDrink, packG: +ai.packSize || 50, n: ai.per100 || {}, ing: ai.ingredients || [], allergens: (ai.allergens || []).map((a) => String(a).toLowerCase()),
    veg: ai.veg !== false, approx, caffeine: !!ai.caffeine,
  });
  // 1. Our verified database first: the same product must always get the same verdict,
  //    whatever the photo quality. (Earlier AI estimates saved on this phone are never reused.)
  const q = `${id.name || ''} ${id.variant || ''}`;
  const db = fuzzyFind(PRODUCTS, id.brand, q) || fuzzyFind(S.custom.filter((p) => !String(p.id).startsWith('ai-') && !p.approx), id.brand, q);
  if (db) return showProduct(db, db.src || 'Our database');
  // 2. Numbers read from a clear photo of the back of the pack, if they make sense
  if (shots.back && res.readFromPack && ai.per100 && plausible(ai.per100, !!ai.isDrink)) return showProduct(fromAI(false), 'Read from your pack');
  // 3. Open Food Facts, Indian packs preferred (recipes differ between countries)
  try {
    const r = await apiGet('/products?q=' + encodeURIComponent(`${id.brand || ''} ${id.name || ''}`.trim()));
    const items = [...r.items.filter((x) => x.india), ...r.items.filter((x) => !x.india)];
    const hit = fuzzyFind(items, id.brand, q) || (items.length && id.confidence !== 'low' && items.find((x) => x.india && (x.brand || '').toLowerCase().includes(String(id.brand || '').toLowerCase().slice(0, 4))));
    if (hit) return openBarcode(hit.barcode);
  } catch {}
  // 4. Last resort: AI estimate, clearly marked
  if (shots.back && res.readFromPack && ai.per100) return showProduct(fromAI(true), 'Read from your pack (some values unclear, check the pack)');
  if (ai.per100) return showProduct(fromAI(true), 'AI estimate, verify with pack');
  throw new Error('Recognised “' + label + '” but found no nutrition data. Add a photo of the back of the pack.');
}
async function runPlate(img) {
  const ref = FRESH.map((f) => `${f.name} ${f.serv}: ${f.kcal} kcal, P${f.protein} C${f.carbs} F${f.fat} sugar${f.sugar} Na${f.sodium}mg`).join('; ');
  const res = await callAI('plate', [img], `Reference values for common Indian foods (per serving): ${ref}`);
  S.current = { kind: 'plate', data: { ...res, img: img.preview }, source: 'AI estimate' };
  sessionStorage.setItem('sb_current', JSON.stringify({ ...S.current, data: { ...res } }));
  const title = (res.items || []).slice(0, 3).map((i) => i.name).join(', ') || 'Plate';
  S.history = [{ kind: 'plate', id: 'plate-' + Date.now(), title: '🍛 ' + title, score: +res.score || 3, verdict: res.verdict || 'Okay in moderation', at: Date.now() }, ...S.history].slice(0, 50);
  save('history');
  location.hash = '#/plate';
}
async function runLabel(img) {
  const res = await callAI('label', [img]);
  S.current = { kind: 'label', data: res, source: 'Read from label' };
  sessionStorage.setItem('sb_current', JSON.stringify(S.current));
  location.hash = '#/label';
}

// ---------------- Result: product ----------------
function chip(label, val, unit, red, amber) {
  const k = val > red ? 'bad' : val > amber ? 'okay' : 'good';
  return `<span class="tl tl-${k}"><b>${esc(label)}</b>${r1(val)}${unit}</span>`;
}
function screenResult() {
  const cur = S.current || JSON.parse(sessionStorage.getItem('sb_current') || 'null');
  if (!cur || cur.kind !== 'product') { location.hash = '#/scan/packet'; return; }const p = cur.data;
  const A = scoreFor(p, 'adult', S.profile), C = scoreFor(p, 'child', S.profile);
  const n = p.n, k = p.packG / 100, unit = p.drink ? 'ml' : 'g';
  const d = p.drink ? 2 : 1;
  const diet = dietFlags(p);
  const algs = detectAllergens(p);
  const sw = swaps(p, allProducts(), S.profile);
  const focusChild = S.profile.age === 'child';
  const F = focusChild ? C : A;
  const fk = verdictKey(F.verdict);
  const dietLabel = (v) => (v === 'yes' ? '✓' : v === 'no' ? '✗' : '?');
  view().innerHTML = `
    <div class="res-hero" style="--vc:${VCOLOR[fk]}">
      <img class="bg" src="${esc(p.img || catImg(p))}" alt="">
      <header class="bar"><a href="#/home" class="back" data-back aria-label="Back">‹</a><span class="chip">${esc(p.cat || 'Product')}</span></header>
      <div class="res-title ${p.img || p.imgSmall ? 'has-photo' : ''}">
        ${p.img || p.imgSmall ? `<img class="prod-photo" src="${esc(sharp(p.img || p.imgSmall, 520))}" data-fb="${esc(p.img || p.imgSmall)}" alt="${esc(p.brand + ' ' + p.name)} pack">` : ''}
        <div><small>${esc(p.brand)}${companyOf(p) && companyOf(p) !== p.brand ? ' · by ' + esc(companyOf(p)) : ''}</small><h1>${esc(p.name)}</h1>
        <div class="srcrow"><span class="src">${esc(t('source'))}: ${esc(cur.source)}</span>${p.quantity ? `<span class="src">${esc(p.quantity)}</span>` : ''}${p.approx ? '<span class="src">Approx values</span>' : ''}${p.barcode ? `<span class="src">#${esc(p.barcode)}</span>` : ''}</div></div></div>
    </div>
    <div class="verdicts">
      <div class="vbox ${!focusChild ? 'focus' : ''} ${verdictKey(A.verdict) === 'avoid' ? 'shake' : ''}"><span class="who-lbl">👩 ${esc(t('adult'))}</span>${ring(A.score, 100, t('adult'))}${vPill(A.verdict)}</div>
      <div class="vbox ${focusChild ? 'focus' : ''} ${verdictKey(C.verdict) === 'avoid' ? 'shake' : ''}"><span class="who-lbl">🧒 ${esc(t('child'))}</span>${ring(C.score, 100, t('child'))}${vPill(C.verdict)}</div>
    </div>
    ${junkCard(p)}
    <div class="tls">${chip('Fat', n.fat, 'g', 17.5 / d, 3 / d)}${chip('Sat fat', n.sat, 'g', 5 / d, 1.5 / d)}${chip('Sugar', n.sugar, 'g', 22.5 / d, 5 / d)}${chip('Salt', (n.sodium || 0) * 2.5 / 1000, 'g', 1.5 / d, 0.3 / d)}</div>
    <div class="card"><div class="seg" id="who"><a class="${!focusChild ? 'on' : ''}" data-who="a">👩 ${esc(t('adult'))}</a><a class="${focusChild ? 'on' : ''}" data-who="c">🧒 ${esc(t('child'))}</a></div>
      <ul class="reasons" id="reasons"></ul>
      <details><summary>${esc(t('why'))}</summary><div id="bd" class="bd"></div><p class="muted small" style="margin-top:8px">Every product starts at 5.0. Points come off or go on for each factor. Processing level: <b id="proc"></b>.</p></details>
    </div>
    <section class="card"><h3>${esc(t('nutrition'))}</h3>
      <table class="nt"><tr><th></th><th>${esc(t('per100'))} ${unit}</th><th>${esc(t('perPack'))} (${r1(p.packG)} ${unit})</th></tr>
      ${[['Energy', 'kcal', 'kcal'], ['Protein', 'protein', 'g'], ['Carbohydrates', 'carbs', 'g'], ['  of which sugar', 'sugar', 'g'], ['Fibre', 'fibre', 'g'], ['Total fat', 'fat', 'g'], ['  Saturated fat', 'sat', 'g'], ['Sodium', 'sodium', 'mg']].map(([l, key, u]) => `<tr><td>${esc(l)}</td><td>${r1(n[key])} ${u}</td><td>${r1((n[key] || 0) * k)} ${u}</td></tr>`).join('')}
      </table></section>
    <section class="card"><h3>Diet check</h3><div class="diets">
      <span class="dg ${diet.veg}">${dietLabel(diet.veg)} Veg</span><span class="dg ${diet.jain}">${dietLabel(diet.jain)} Jain</span><span class="dg ${diet.vegan}">${dietLabel(diet.vegan)} Vegan</span><span class="dg ${diet.eggetarian}">${dietLabel(diet.eggetarian)} Eggetarian</span></div>
      ${diet.veg === 'check' ? '<p class="muted small" style="margin-top:8px">Has flavour enhancers 627/631, which can be animal-derived. Check the green dot on the pack.</p>' : ''}
      <h4>Allergens</h4><div class="diets">${algs.length ? algs.map((a) => `<span class="dg ${(S.profile.allergens || []).includes(a) ? 'no' : 'neutral'}">${esc(a)}</span>`).join('') : '<span class="muted">None found in the ingredient list</span>'}</div></section>
    <section class="card"><h3>${esc(t('ingredients'))}</h3>
      <p class="ing">${p.ing.length ? p.ing.map(esc).join(', ') : 'Not available. Add a back-of-pack photo.'}</p>
      ${A.additives.length ? `<div class="adds">${A.additives.map((a) => `<div class="add lv${a.level}"><b>${esc(a.name)}</b><p>${esc(a.what)}${a.note ? ' ' + esc(a.note) : ''}</p></div>`).join('')}</div>` : ''}
    </section>
    <section><div class="sec-head"><h3>${esc(t('swaps'))} 🌱</h3></div><div class="list" id="swapList">${sw.map(({ q, s }) => `<button class="row" data-open="${esc(q.id)}"><img class="thumb" src="${esc(imgFor(q))}" alt=""><span class="grow"><b>${esc(q.brand)}</b> ${esc(q.name)}<br>${junkBadge(q, true)}</span><span class="score-pill v-${verdictKey(scoreFor(q, 'adult', S.profile).verdict)}">${s.toFixed(1)}</span></button>`).join('')}</div></section>
    <button class="card ask-bitu" data-act="bitu"><span class="bitu-av">🤖</span><span class="grow"><b>Ask Bitu about this</b><small>Is it OK for kids? What are these additives? Healthier swap?</small></span>›</button>
    <div class="btnrow"><button class="btn-ghost" data-act="cmp">＋ ${esc(t('addCompare'))}</button><button class="btn" data-act="trk">＋ ${esc(t('addTracker'))}</button></div>
    ${S.plan === 'free' ? sponsorCard() : ''}
    <p class="foot">${esc(t('disclaimer'))}${p.approx ? ' Values marked approx are typical figures. Check the pack.' : ''}</p>`;

  const showWho = (w) => {
    const R = w === 'c' ? C : A;
    $('#reasons').innerHTML = R.reasons.map((x, i) => `<li class="r-${x.s}" style="animation-delay:${i * 0.06}s">${esc(x.t)}</li>`).join('');
    $('#bd').innerHTML = `<div class="bdrow"><span>Start</span><b>5.0</b></div>` + R.breakdown.map((b) => `<div class="bdrow"><span>${esc(b.label)}</span><b class="${b.delta < 0 ? 'neg' : 'pos'}">${b.delta > 0 ? '+' : ''}${b.delta}</b></div>`).join('') + `<div class="bdrow tot"><span>Final</span><b>${R.score.toFixed(1)}</b></div>`;
    $('#proc').textContent = R.processing;
    view().querySelectorAll('#who a').forEach((a) => a.classList.toggle('on', a.dataset.who === w));
  };
  showWho(focusChild ? 'c' : 'a');
  view().querySelectorAll('#who a').forEach((a) => (a.onclick = () => showWho(a.dataset.who)));
  $('[data-act=cmp]').onclick = () => { if (!S.compare.includes(p.id)) { S.compare = [...S.compare, p.id].slice(-3); save('compare'); } toast(t('added') + ' ✓'); };
  $('[data-act=trk]').onclick = () => {
    const f = p.packG / 100;
    S.tracker.push({ day: today(), at: Date.now(), title: `${p.brand} ${p.name}`, kind: 'packet', score: A.score, kcal: (n.kcal || 0) * f, sugar: (n.sugar || 0) * f, sodium: (n.sodium || 0) * f, protein: (n.protein || 0) * f });
    save('tracker'); toast(t('added') + ' ✓');
  };
  animateRings(view());
  if (fk === 'good') setTimeout(() => confetti('good'), 700);
  loadRemoteSwaps(p, A.score);
}

function nutriRow(g) { return `<span class="nutri" aria-label="Nutri-Score ${g.toUpperCase()}">${'abcde'.split('').map((l) => `<i class="ns-${l} ${l === g ? 'on' : ''}">${l.toUpperCase()}</i>`).join('')}</span>`; }
const NOVA_TXT = { 1: 'Unprocessed', 2: 'Cooking ingredient', 3: 'Processed', 4: 'Ultra-processed' };
function junkCard(p) {
  const j = junkMeter(p), pct = Math.round((j.pts / 7) * 100);
  return `<div class="card junk-card jc-${j.level}">
    <div class="jc-top"><span class="jc-emoji">${j.emoji}</span><div class="grow"><small>Junk food meter</small><h3>${esc(j.label)}</h3></div><b class="jc-pts">${j.pts}<small>/7</small></b></div>
    <div class="jc-bar"><i style="--w:${pct}%"></i><span class="jc-mark" style="--l:${pct}%"></span></div>
    <div class="jc-scale"><span>Not junk</span><span>Treat</span><span>Junk</span></div>
    ${j.why.length ? `<div class="diets" style="margin-top:12px">${j.why.map((w) => `<span class="dg neutral">${esc(w)}</span>`).join('')}</div>` : ''}
    ${p.nova || p.nutriscore ? `<div class="jc-tags">${p.nova ? `<span class="nova n${p.nova}"><b>NOVA ${p.nova}</b> ${NOVA_TXT[p.nova]}</span>` : ''}${p.nutriscore ? nutriRow(p.nutriscore) : ''}</div>` : ''}
  </div>`;
}
const reviewKey = (p) => (p.barcode ? 'bc:' + p.barcode : p.id);
function revCard(rv, i, withProduct = false) {
  const c = AV_COLORS[i % AV_COLORS.length];
  return `<article class="rev" style="--c:${c}">${withProduct && rv.product_name ? `<button class="rev-prod" ${String(rv.product_key || '').startsWith('bc:') ? `data-bc="${esc(rv.product_key.slice(3))}"` : ''}>${rv.img ? `<img src="${esc(rv.img)}" alt="">` : ''}<span><b>${esc(rv.product_name)}</b><br><small>${esc(rv.brand || '')}</small></span></button>` : ''}
    <div class="who"><span class="avatar" style="background:${c}">${esc((rv.name || '?').trim().charAt(0).toUpperCase())}</span><div><b>${esc(rv.name)}</b><br>${stars(rv.rating)}</div></div>
    <p>${esc(rv.comment)}</p><small>${rv.scanned ? 'Scanned: ' + esc(rv.scanned) + ' · ' : ''}${new Date(rv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small></article>`;
}
async function loadProductReviews(p) {
  const box = $('#prevBox'); if (!box) return;
  try {
    const j = await apiGet('/product-reviews?key=' + encodeURIComponent(reviewKey(p)));
    if (!$('#prevBox')) return;
    box.innerHTML = j.count
      ? `<div class="card rev-summary"><div class="rev-avg">${(+j.avg).toFixed(1)}</div><div>${stars(j.avg)}<p class="small" style="margin-top:4px">${j.count} review${j.count > 1 ? 's' : ''} of this product</p></div></div><div class="rev-track">${j.reviews.map((rv, i) => revCard(rv, i)).join('')}</div>`
      : `<div class="card empty"><span class="big-emoji">💬</span><p><b>No reviews of this product yet</b></p><p class="muted small">Tried it? Tell others how it tastes and whether it is worth it.</p></div>`;
  } catch { box.innerHTML = '<div class="card empty"><p class="muted">Reviews could not load right now.</p></div>'; }
}
async function loadRemoteSwaps(p, myScore) {
  const list = $('#swapList'); if (!list || !p.cat) return;
  try {
    const j = await apiGet('/products?cat=' + encodeURIComponent(p.cat));
    const mine = junkMeter(p).pts;
    const better = j.items.filter((q) => q.barcode !== p.barcode && junkMeter(q).pts < mine && scoreFor(q, 'adult', S.profile).score > myScore)
      .sort((a, b) => scoreFor(b, 'adult', S.profile).score - scoreFor(a, 'adult', S.profile).score).slice(0, 4);
    if (!$('#swapList')) return;
    list.insertAdjacentHTML('beforeend', better.map((q) => { const s = scoreFor(q, 'adult', S.profile); return `<button class="row" data-bc="${esc(q.barcode)}"><img class="thumb" src="${esc(imgFor(q))}" alt="" loading="lazy"><span class="grow"><b>${esc(q.brand)}</b> ${esc(q.name)}<br>${junkBadge(q, true)}</span><span class="score-pill v-${verdictKey(s.verdict)}">${s.score.toFixed(1)}</span></button>`; }).join(''));
    if (!list.children.length) list.innerHTML = '<div class="card empty"><p class="muted">This is already one of the better picks in its category.</p></div>';
  } catch {}
}

// ---------------- Explore ----------------
const EXPLORE_CATS = [['', '🌍', 'All', '#5B2A86'], ['Chips', '🥔', 'Chips', '#FB8500'], ['Chocolate', '🍫', 'Chocolate', '#7B4019'], ['Ice cream', '🍦', 'Ice cream', '#FF5D8F'], ['Drinks', '🥤', 'Drinks', '#2F80ED'], ['Biscuits', '🍪', 'Biscuits', '#C26100'], ['Sweets', '🍬', 'Sweets', '#E63946'], ['Instant food', '🍜', 'Noodles', '#E0A800'], ['Snacks', '🍿', 'Snacks', '#20B26B'], ['Bakery', '🧁', 'Cakes', '#B5179E'], ['Breakfast', '🥣', 'Cereals', '#0B8457'], ['Spreads', '🍯', 'Spreads', '#8E3FC9']];
const EX = { cat: '', q: '', page: 1, items: [], more: false, total: 0 };
function pcard(p) {
  const j = junkMeter(p), s = scoreFor(p, 'adult', S.profile);
  return `<button class="pcard" data-bc="${esc(p.barcode)}" style="--c:${JUNK_COLOR[j.level]}"><span class="pimg"><img class="lz" src="${esc(sharp(p.img || p.imgSmall) || catImg(p))}" alt="${esc(p.brand + ' ' + p.name)}" loading="lazy" decoding="async" data-ld data-fb="${esc(p.img || p.imgSmall || catImg(p))}"></span><span class="pjunk" title="${esc(j.label)}">${typeEmoji(p)}</span><span class="pbrand">${esc(p.brand)}</span><b class="pname">${esc(p.name)}</b><span class="prow"><span class="junk-badge jb-${j.level} sm">${esc(j.label)}</span><span class="score-pill v-${verdictKey(s.verdict)}">${s.score.toFixed(1)}</span></span></button>`;
}
function screenExplore() {
  view().innerHTML = `
    <header class="bar"><h2>Junk Food Explorer</h2><a class="chip" href="#/compare">⚖️ Compare</a></header>
    <div class="page-title"><p>Real products from around the world with their real pack photos, brands and companies.</p></div>
    <div class="search"><input id="exq" inputmode="search" placeholder="Search chips, chocolate, Coke, Maggi…" autocomplete="off" value="${esc(EX.q)}" aria-label="Search products"></div>
    <div class="cat-pills">${EXPLORE_CATS.map(([c, e, l, col]) => `<button class="cpill ${EX.cat === c ? 'on' : ''}" data-cat="${esc(c)}" style="--pc:${col}"><span>${e}</span>${esc(l)}</button>`).join('')}</div>
    <p class="muted small pad" id="exInfo"></p>
    <div class="pgrid" id="exGrid"></div>
    <div class="btnrow" id="exMoreRow" hidden><button class="btn-ghost" id="exMore">Show more</button></div>
    <p class="foot">Product data and photos: Open Food Facts contributors (ODbL / CC BY-SA). Brands belong to their owners.</p>`;
  view().querySelectorAll('.cpill').forEach((b) => (b.onclick = () => { EX.cat = b.dataset.cat; EX.q = ''; $('#exq').value = ''; view().querySelectorAll('.cpill').forEach((x) => x.classList.toggle('on', x === b)); loadExplore(true); }));
  let tmr; $('#exq').addEventListener('input', (e) => { clearTimeout(tmr); tmr = setTimeout(() => { EX.q = e.target.value.trim(); loadExplore(true); }, 400); });
  $('#exMore').onclick = () => { EX.page++; loadExplore(false); };
  if (EX.items.length) renderExplore(); else loadExplore(true);
}
function renderExplore() {
  const g = $('#exGrid'); if (!g) return;
  g.innerHTML = EX.items.length ? EX.items.map(pcard).join('') : '<div class="card empty" style="grid-column:1/-1"><span class="big-emoji">🔍</span><p class="muted">No products found. Try another word or category.</p></div>';
  $('#exMoreRow').hidden = !EX.more;
  const junk = EX.items.filter((p) => junkMeter(p).level === 'junk').length;
  $('#exInfo').textContent = EX.items.length ? `${EX.q ? 'Results for “' + EX.q + '”' : (EX.total ? EX.total.toLocaleString('en-IN') + ' products' : '')}${EX.items.length ? ' · ' + junk + ' of ' + EX.items.length + ' shown are junk food' : ''}` : '';
}
async function loadExplore(reset) {
  if (reset) { EX.page = 1; EX.items = []; const g = $('#exGrid'); if (g) g.innerHTML = Array.from({ length: 6 }, () => '<div class="pcard skel"></div>').join(''); }
  try {
    const qs = EX.q ? 'q=' + encodeURIComponent(EX.q) : 'cat=' + encodeURIComponent(EX.cat);
    const j = await apiGet(`/products?${qs}&page=${EX.page}`);
    EX.items = reset ? j.items : [...EX.items, ...j.items]; EX.more = j.more; if (j.total) EX.total = j.total;
    renderExplore();
  } catch (e) { const g = $('#exGrid'); if (g) g.innerHTML = `<div class="card empty" style="grid-column:1/-1"><p class="muted">${esc(e.message)}</p></div>`; }
}

// ---------------- Community reviews ----------------
function screenReviews(tab) {
  tab = tab === 'app' ? 'app' : 'products';
  view().innerHTML = `
    <header class="bar"><a href="#/home" class="back" aria-label="Back">‹</a><h2>Reviews</h2><span style="width:40px"></span></header>
    <div class="pad"><div class="seg"><a href="#/reviews/products" class="${tab === 'products' ? 'on' : ''}">🍫 Products</a><a href="#/reviews/app" class="${tab === 'app' ? 'on' : ''}">📱 The app</a></div></div>
    ${tab === 'app' ? '<div class="btnrow" style="margin-top:0"><button class="btn hot" id="writeRev">Write a review of SmartBite</button></div><div id="revBox" data-full="1"></div>' : '<div id="feedBox"><div class="card empty"><span class="spin" style="color:var(--jamun)"></span></div></div>'}`;
  if (tab === 'app') { $('#writeRev').onclick = () => openReviewForm(); loadReviews(); return; }
  apiGet('/product-reviews?feed=1').then((j) => {
    const box = $('#feedBox'); if (!box) return;
    if (!j.reviews.length) { box.innerHTML = '<div class="card empty"><span class="big-emoji">💬</span><p><b>No product reviews yet</b></p><p class="muted small">Open any product and tap “Rate this” to post the first one.</p><a class="btn sm hot" href="#/explore" style="margin-top:8px">Explore products</a></div>'; return; }
    box.innerHTML = `${j.top.length ? `<section><div class="sec-head"><h3>Most reviewed</h3></div><div class="hscroll">${j.top.map((t2) => `<button class="mini-prod" ${t2.product_key.startsWith('bc:') ? `data-bc="${esc(t2.product_key.slice(3))}"` : ''}>${t2.img ? `<img src="${esc(t2.img)}" alt="">` : '<span class="big-emoji">🍽️</span>'}<b>${esc(t2.product_name)}</b>${stars(t2.avg)}<small>${t2.n} review${t2.n > 1 ? 's' : ''}</small></button>`).join('')}</div></section>` : ''}
      <section><div class="sec-head"><h3>Latest</h3></div><div class="rev-list">${j.reviews.map((rv, i) => revCard(rv, i, true)).join('')}</div></section>`;
  }).catch(() => { const box = $('#feedBox'); if (box) box.innerHTML = '<div class="card empty"><p class="muted">Reviews could not load right now.</p></div>'; });
}

// ---------------- Result: plate ----------------
function screenPlate() {
  const cur = S.current && S.current.kind === 'plate' ? S.current : JSON.parse(sessionStorage.getItem('sb_current') || 'null');
  if (!cur || cur.kind !== 'plate') { location.hash = '#/scan/plate'; return; }
  const d = cur.data, items = d.items || [], tot = d.total || {};
  const score = Math.max(1, Math.min(5, +d.score || 3));
  const verdict = d.verdict || (score >= 3.75 ? 'Good' : score >= 2.5 ? 'Okay in moderation' : 'Avoid');
  const childV = d.childVerdict || verdict;
  const vk = verdictKey(verdict);
  view().innerHTML = `
    <div class="res-hero" style="--vc:${VCOLOR[vk]}">
      <img class="bg" src="${d.img || pic('thali')}" alt="" style="opacity:.55;mix-blend-mode:normal">
      <header class="bar"><a href="#/scan/plate" class="back" aria-label="Back">‹</a><span class="chip">AI estimate</span></header>
      <div class="res-title"><small>Your plate</small><h1>${esc(d.title || 'Your plate')}</h1>${d.summary ? `<p style="opacity:.92">${esc(d.summary)}</p>` : ''}</div>
    </div>
    <div class="verdicts">
      <div class="vbox focus ${vk === 'avoid' ? 'shake' : ''}"><span class="who-lbl">Plate score</span>${ring(score, 100, 'Plate')}${vPill(verdict)}</div>
      <div class="vbox"><span class="who-lbl">Total energy</span><div class="big">${Math.round(tot.kcal || 0)}</div><small class="muted">kcal</small><span class="who-lbl">🧒 ${esc(t('child'))}</span>${vPill(childV)}</div>
    </div>
    <section class="card"><h3>What's on the plate</h3>
      <table class="nt"><tr><th>Item</th><th>Portion</th><th>kcal</th><th>Protein</th><th>Sugar</th><th>Sodium</th></tr>
      ${items.map((i) => `<tr><td><b>${esc(i.name)}</b>${(i.flags || []).map((f) => `<span class="flag">${esc(f)}</span>`).join('')}${i.freshness ? `<div class="muted small">${esc(i.freshness)}</div>` : ''}</td><td>${esc(i.portion || '')}</td><td>${Math.round(i.kcal || 0)}</td><td>${r1(i.protein)}g</td><td>${r1(i.sugar)}g</td><td>${Math.round(i.sodium || 0)}mg</td></tr>`).join('')}
      <tr class="tot"><td>Total</td><td></td><td>${Math.round(tot.kcal || 0)}</td><td>${r1(tot.protein)}g</td><td>${r1(tot.sugar)}g</td><td>${Math.round(tot.sodium || 0)}mg</td></tr></table>
      <p class="muted small" style="margin-top:8px">Carbs ${r1(tot.carbs)} g · Fat ${r1(tot.fat)} g</p></section>
    ${(d.tips || []).length ? `<section class="card"><h3>Make it healthier 🌱</h3><ul class="reasons">${d.tips.map((x, i) => `<li class="r-good" style="animation-delay:${i * 0.08}s">${esc(x)}</li>`).join('')}</ul></section>` : ''}
    ${d.childNote ? `<div class="card"><h3>For kids 🧒</h3><p>${esc(d.childNote)}</p></div>` : ''}
    <div class="btnrow"><button class="btn" data-act="trk">＋ ${esc(t('addTracker'))}</button></div>
    <p class="foot">AI estimate. Values are approximate. ${esc(t('disclaimer'))}</p>`;
  $('[data-act=trk]').onclick = () => {
    S.tracker.push({ day: today(), at: Date.now(), title: '🍛 ' + (d.title || items.map((i) => i.name).slice(0, 3).join(', ')), kind: 'plate', score, kcal: +tot.kcal || 0, sugar: +tot.sugar || 0, sodium: +tot.sodium || 0, protein: +tot.protein || 0 });
    save('tracker'); toast(t('added') + ' ✓');
  };
  animateRings(view());
  if (vk === 'good') setTimeout(() => confetti('good'), 700);
}

// ---------------- Result: label ----------------
function screenLabel() {
  const cur = S.current || JSON.parse(sessionStorage.getItem('sb_current') || 'null');
  if (!cur || cur.kind !== 'label') { location.hash = '#/scan/label'; return; }
  const d = cur.data;
  const lv = { none: 0, low: 1, medium: 2, high: 3 };
  view().innerHTML = `
    <div class="res-hero" style="--vc:#FF5D8F;padding-bottom:28px">
      <img class="bg" src="${pic('spices')}" alt="">
      <header class="bar"><a href="#/scan/label" class="back" aria-label="Back">‹</a><span class="chip">Label decoded</span></header>
      <div class="res-title"><small>${esc(d.brand || 'Ingredient label')}</small><h1>${esc(d.productName || 'Your label')}</h1>${d.summary ? `<p style="opacity:.92">${esc(d.summary)}</p>` : ''}</div>
    </div>
    <section class="card"><h3>Every ingredient, in simple words</h3><div class="adds">
      ${(d.ingredients || []).map((i) => `<div class="add lv${lv[i.concern] ?? 0}"><b>${esc(i.name)}</b><p>${esc(i.plain || '')}</p></div>`).join('')}</div></section>
    ${(d.allergens || []).length ? `<section class="card"><h3>Allergens</h3><div class="diets">${d.allergens.map((a) => `<span class="dg ${(S.profile.allergens || []).includes(String(a).toLowerCase()) ? 'no' : 'neutral'}">${esc(a)}</span>`).join('')}</div></section>` : ''}
    ${d.per100 ? `<div class="btnrow"><button class="btn hot" id="asProd">Score this product</button></div>` : ''}
    <p class="foot">${esc(t('disclaimer'))}</p>`;
  const b = $('#asProd');
  if (b) b.onclick = () => showProduct({ id: 'label-' + Date.now(), brand: d.brand || 'Scanned label', name: d.productName || 'Product', cat: 'Packaged food', packG: +d.packSize || 50, drink: !!d.isDrink, n: d.per100, ing: (d.ingredients || []).map((i) => i.name), allergens: (d.allergens || []).map((a) => String(a).toLowerCase()), approx: false }, 'Read from your pack');
}

// ---------------- Compare ----------------
function screenCompare() {
  const items = S.compare.map(findProduct).filter(Boolean);
  const rows = [['SmartBite score', (p) => scoreFor(p, 'adult', S.profile).score, 'high'], ['Kids score', (p) => scoreFor(p, 'child', S.profile).score, 'high'], ['Energy (kcal)', (p) => p.n.kcal, 'low'], ['Sugar (g)', (p) => p.n.sugar, 'low'], ['Sodium (mg)', (p) => p.n.sodium, 'low'], ['Sat fat (g)', (p) => p.n.sat, 'low'], ['Fibre (g)', (p) => p.n.fibre, 'high'], ['Protein (g)', (p) => p.n.protein, 'high'], ['Additives to limit', (p) => decodeIngredients(p.ing).filter((a) => a.level >= 2).length, 'low']];
  view().innerHTML = `
    <header class="bar"><h2>${esc(t('compare'))}</h2>${items.length ? '<button class="btn-ghost sm" id="clr">Clear</button>' : '<span></span>'}</header>
    <div class="cmp-hero"><img src="${pic('spread')}" alt=""><span>Put 2–3 products side by side. The winner of each row lights up green.</span></div>
    <div class="search"><input id="q" placeholder="Add a product to compare…" autocomplete="off" aria-label="Add a product to compare"></div><div id="qres" class="list"></div>
    ${items.length < 2 ? `<div class="card empty"><span class="big-emoji">⚖️</span><p class="muted">${items.length ? 'One added. Add one more to compare.' : "Try Lay's Classic Salted vs Balaji Crunchem."}</p></div>` : ''}
    ${items.length ? `<div class="card scroll"><table class="cmp"><tr><th></th>${items.map((p) => `<th><button class="linkbtn" data-open="${esc(p.id)}">${esc(p.brand)}<br><small class="muted">${esc(p.name)}</small></button><button class="x" data-rm="${esc(p.id)}" aria-label="Remove">✕</button></th>`).join('')}</tr>
      ${rows.map(([l, f, better]) => { const vals = items.map((p) => +f(p) || 0); const best = better === 'high' ? Math.max(...vals) : Math.min(...vals); return `<tr><td>${esc(l)}</td>${vals.map((v) => `<td class="${items.length > 1 && v === best ? 'win' : ''}">${r1(v)}</td>`).join('')}</tr>`; }).join('')}
      </table><p class="muted small" style="margin-top:8px">Values per 100 g / 100 ml.</p></div>` : ''}`;
  const q = $('#q');
  q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase();
    $('#qres').innerHTML = !v ? '' : allProducts().filter((p) => `${p.brand} ${p.name}`.toLowerCase().includes(v)).slice(0, 6).map((p) => `<button class="row" data-add="${esc(p.id)}"><img class="thumb" src="${esc(imgFor(p))}" alt=""><span class="grow"><b>${esc(p.brand)}</b> ${esc(p.name)}</span>＋</button>`).join('');
  });
  view().onclick = (e) => {
    const a = e.target.closest('[data-add]'); if (a) { if (!S.compare.includes(a.dataset.add)) { S.compare = [...S.compare, a.dataset.add].slice(-3); save('compare'); } screenCompare(); return; }
    const r = e.target.closest('[data-rm]'); if (r) { S.compare = S.compare.filter((x) => x !== r.dataset.rm); save('compare'); screenCompare(); }
  };
  const c = $('#clr'); if (c) c.onclick = () => { S.compare = []; save('compare'); screenCompare(); };
}

// ---------------- Tracker ----------------
function screenTracker() {
  const kid = S.profile.age === 'child';
  const L = LIMITS[kid ? 'child' : 'adult'];
  const targets = { kcal: L.kcal, sugar: L.sugar, sodium: L.sodium, protein: kid ? 35 : 50 };
  const e = todayEntries();
  const sum = (k) => e.reduce((s, x) => s + (x[k] || 0), 0);
  const days = [...Array(7)].map((_, i) => { const dt = new Date(); dt.setDate(dt.getDate() - (6 - i)); const key = dt.toISOString().slice(0, 10); return { key, lab: dt.toLocaleDateString('en-IN', { weekday: 'short' }), kcal: S.tracker.filter((x) => x.day === key).reduce((s, x) => s + (x.kcal || 0), 0) }; });
  const maxK = Math.max(targets.kcal, ...days.map((x) => x.kcal));
  let streak = 0;
  for (let i = 0; i < 366; i++) { const dt = new Date(); dt.setDate(dt.getDate() - i); const key = dt.toISOString().slice(0, 10); if (S.tracker.some((x) => x.day === key)) streak++; else if (i === 0) continue; else break; }
  const bar = (label, v, tgt, unit, c) => { const p = Math.min(100, (v / tgt) * 100); return `<div class="meter"><div class="mrow"><span>${label}</span><b>${Math.round(v)} / ${tgt} ${unit}</b></div><div class="mbar"><i data-w="${p}" style="--mc:${c}" class="${v > tgt ? 'over' : ''}"></i></div></div>`; };
  view().innerHTML = `
    <header class="bar"><h2>${esc(t('tracker'))}</h2><span class="streak">🔥 ${streak} day streak</span></header>
    <section class="card">${bar('⚡ Energy', sum('kcal'), targets.kcal, 'kcal', '#FB8500')}${bar('🍬 Sugar', sum('sugar'), targets.sugar, 'g', '#FF5D8F')}${bar('🧂 Sodium', sum('sodium'), targets.sodium, 'mg', '#2F80ED')}${bar('💪 Protein', sum('protein'), targets.protein, 'g', '#20B26B')}<p class="muted small">Targets for ${kid ? 'a child' : 'an adult'}. Change the age group in Profile.</p></section>
    <section class="card"><h3>This week</h3><div class="week">${days.map((x) => `<div class="wcol"><i style="height:${Math.round((x.kcal / maxK) * 100)}%" class="${x.kcal > targets.kcal ? 'over' : ''}"></i><small>${esc(x.lab)}</small></div>`).join('')}</div></section>
    <section><div class="sec-head"><h3>Today</h3></div>${e.length ? `<div class="list stagger">${e.slice().reverse().map((x) => `<div class="row"><span class="score-pill v-${x.score >= 3.75 ? 'good' : x.score >= 2.5 ? 'okay' : 'avoid'}">${(+x.score).toFixed(1)}</span><span class="grow"><b>${esc(x.title)}</b><br><small class="muted">${Math.round(x.kcal)} kcal · ${r1(x.sugar)} g sugar · ${Math.round(x.sodium)} mg sodium</small></span><button class="x" data-del="${x.at}" aria-label="Remove">✕</button></div>`).join('')}</div>` : `<div class="card empty"><span class="big-emoji">🍽️</span><p class="muted">Nothing logged today. Scan something and tap “Add to tracker”.</p></div>`}</section>
    ${S.plan === 'free' ? `<a class="card upsell" href="#/plans"><b>📈 Weekly health report</b><p>Get a weekly summary and smart tips with SmartBite Pro.</p></a>` : `<div class="card"><h3>Weekly report</h3><p>${days.filter((x) => x.kcal > 0).length} active days this week · average ${Math.round(days.reduce((s, x) => s + x.kcal, 0) / Math.max(1, days.filter((x) => x.kcal > 0).length))} kcal/day. ${days.some((x) => x.kcal > targets.kcal) ? 'Some days went over your energy target. Try fruit or roasted chana instead of chips.' : 'You stayed within your energy target.'}</p></div>`}`;
  view().querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { S.tracker = S.tracker.filter((x) => String(x.at) !== b.dataset.del); save('tracker'); screenTracker(); }));
  animateRings(view());
}

// ---------------- Profile ----------------
const PF = { tab: 'you' };
function screenProfile() {
  const pr = S.profile;
  const conds = [['diabetes', 'Diabetes / blood sugar'], ['bp', 'High blood pressure'], ['heart', 'Heart health / cholesterol'], ['weightloss', 'Weight loss'], ['pregnancy', 'Pregnancy'], ['kids', 'Shopping for kids under 12']];
  const radio = (name, opts, cur) => `<div class="checks">${opts.map(([v, l]) => `<label class="ck"><input type="radio" name="${name}" value="${v}" ${cur === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  const tabs = [['you', 'You'], ['health', 'Health'], ['look', 'Look & feel']];
  const panes = {
    you: `<label>${esc(t('name'))}<input name="name" value="${esc(pr.name)}" maxlength="40" placeholder="What should we call you?" autocomplete="given-name"></label>
      <fieldset><legend>${esc(t('ageGroup'))}</legend>${radio('age', [['child', 'Child (under 12)'], ['teen', 'Teen'], ['adult', 'Adult'], ['senior', 'Senior']], pr.age)}</fieldset>
      <fieldset><legend>${esc(t('diet'))}</legend><div class="checks">${[['veg', 'Vegetarian', 'veg'], ['jain', 'Jain', 'veg'], ['vegan', 'Vegan', 'veg'], ['egg', 'Eggetarian', 'egg'], ['nonveg', 'Non-veg', 'nonveg']].map(([v, l, m]) => `<label class="ck"><input type="radio" name="diet" value="${v}" ${pr.diet === v ? 'checked' : ''}><span>${dietMark(m)} ${l}</span></label>`).join('')}</div></fieldset>
      <fieldset><legend>${esc(t('language'))}</legend>${radio('lang', [['en', 'English'], ['hi', 'हिन्दी'], ['mr', 'मराठी']], pr.lang)}</fieldset>`,
    health: `<p class="muted small" style="margin:0">Verdicts and warnings change to match what you pick here.</p>
      <fieldset><legend>${esc(t('conditions'))}</legend><div class="checks">${conds.map(([v, l]) => `<label class="ck"><input type="checkbox" name="cond" value="${v}" ${pr.conditions.includes(v) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>
      <fieldset><legend>${esc(t('allergens'))}</legend><div class="checks">${ALLERGENS.map((a) => `<label class="ck"><input type="checkbox" name="al" value="${a}" ${pr.allergens.includes(a) ? 'checked' : ''}><span>${a}</span></label>`).join('')}</div></fieldset>`,
    look: `<div class="look-preview" aria-hidden="true"><div class="lp-top"><span class="lp-dot"></span><b>Your colours</b><span class="lp-tog"><i></i></span></div><div class="lp-card"><small>How buttons and verdicts will look</small><div class="lp-pills"><span class="pill v-good">${esc(t('good'))}</span><span class="pill v-okay">${esc(t('okay'))}</span><span class="pill v-avoid">${esc(t('avoid'))}</span></div></div><span class="lp-btn">Button</span></div>
      <fieldset><legend>Mode</legend><div class="modepick">${[['light', '☀️', t('light')], ['dark', '🌙', t('dark')], ['auto', '🌗', 'Auto']].map(([v, e, l]) => `<label class="ck"><input type="radio" name="theme" value="${v}" ${pr.theme === v ? 'checked' : ''}><span>${e} ${esc(l)}</span></label>`).join('')}</div></fieldset>

      <fieldset><legend>Text size</legend><div class="modepick">${[['normal', 'A', 'Normal'], ['large', 'A+', 'Large']].map(([v, e, l]) => `<label class="ck"><input type="radio" name="textSize" value="${v}" ${(pr.textSize || 'normal') === v ? 'checked' : ''}><span><b>${e}</b> ${l}</span></label>`).join('')}</div></fieldset>
      <fieldset><legend>Animations</legend><div class="modepick">${[['auto', 'Full'], ['reduce', 'Reduced']].map(([v, l]) => `<label class="ck"><input type="radio" name="motion" value="${v}" ${(pr.motion || 'auto') === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>`,
  };
  view().innerHTML = `
    <header class="bar"><h2>${esc(t('profile'))}</h2><a class="chip" href="#/plans">${S.plan === 'free' ? '⭐ Upgrade' : S.plan === 'pro' ? 'Pro plan' : 'Family plan'}</a></header>
    <div class="profile-head"><span class="avatar">${esc(pr.name ? pr.name.charAt(0).toUpperCase() : '🙂')}</span><div><h3 style="margin:0">${esc(pr.name || 'Your profile')}</h3><p class="muted small">Changes save automatically.</p></div></div>
    <div class="pad"><div class="seg pf-tabs" role="tablist">${tabs.map(([k, l]) => `<a role="tab" aria-selected="${PF.tab === k}" class="${PF.tab === k ? 'on' : ''}" data-pftab="${k}">${l}</a>`).join('')}</div></div>
    <form id="pf" class="card form pf-pane">${panes[PF.tab]}</form>
    <div class="card pf-links">
      <a class="row" href="#/plans"><span class="grow">⭐ ${esc(t('plans'))}</span>›</a>
      <a class="row" href="#/coins"><span class="grow">🪙 SmartBite Coins</span><b>${S.coins.bal}</b>›</a>
      <a class="row" href="#/shop"><span class="grow">🛍 ${esc(t('shop'))}</span>›</a>
      <a class="row" href="#/play"><span class="grow">🎮 Play &amp; Learn games</span>›</a>
      <a class="row" href="#/compare"><span class="grow">⚖️ Compare products</span>›</a>
      <a class="row" href="#/partner"><span class="grow">🤝 ${esc(t('partner'))}</span>›</a>
      <a class="row" href="/about.html"><span class="grow">ℹ️ About SmartBite</span>›</a>
      <button class="row danger" id="reset"><span class="grow">🗑 Clear my history and tracker</span></button>
      <button class="row danger" id="logout"><span class="grow">🚪 Log out and clear this phone</span></button>
    </div>
    <p class="foot">Your profile stays on this phone. ${esc(t('disclaimer'))}</p>`;
  view().querySelectorAll('[data-pftab]').forEach((a) => (a.onclick = () => { PF.tab = a.dataset.pftab; screenProfile(); }));
  let timer = null;
  const commit = (quiet) => {
    const f = new FormData($('#pf'));
    const p = { ...S.profile };
    if (PF.tab === 'you') Object.assign(p, { name: String(f.get('name') || '').trim(), age: f.get('age') || p.age, diet: f.get('diet') || p.diet, lang: f.get('lang') || p.lang });
    if (PF.tab === 'health') Object.assign(p, { conditions: f.getAll('cond'), allergens: f.getAll('al') });
    if (PF.tab === 'look') Object.assign(p, { theme: f.get('theme') || 'auto', palette: f.get('palette') || 'masala', textSize: f.get('textSize') || 'normal', motion: f.get('motion') || 'auto' });
    const langChanged = p.lang !== S.profile.lang;
    S.profile = p; save('profile'); applyTheme();
    if (langChanged) { renderNav('profile'); screenProfile(); }
    if (!quiet) { clearTimeout(timer); timer = setTimeout(() => toast('Saved ✓'), 250); }
  };
  $('#pf').addEventListener('change', () => commit(false));
  $('#pf').addEventListener('input', (e) => { if (e.target.name === 'name') commit(true); });
  $('#pf').onsubmit = (e) => e.preventDefault();
  $('#logout').onclick = logout;
  $('#reset').onclick = () => { if (confirm('Clear history and tracker on this phone?')) { S.history = []; S.tracker = []; S.compare = []; ['history', 'tracker', 'compare'].forEach(save); toast('Cleared'); } };
}

// ---------------- Plans ----------------
function upsell(blocked) {
  return modal(`<div style="font-size:44px">🚀</div><h2>${blocked ? "You've used today's free AI scans" : 'Loving SmartBite?'}</h2><p>Unlock unlimited thali and packet photo scans, personalised verdicts and weekly reports with <b>SmartBite Pro</b>.</p><div class="btnrow"><button class="btn-ghost" data-close>${blocked ? 'Maybe later' : 'Continue free'}</button><a class="btn hot" href="#/plans" data-close>See plans</a></div><p class="muted small" style="margin-top:10px">Barcode scans and search stay free.</p>`);
}
function screenPlans() {
  const plans = [
    { id: 'free', name: 'Free', price: '₹0', per: 'forever', f: ['Unlimited barcode scans and search', '5 AI photo scans a day', 'Adult and child verdicts', 'Healthier swaps'] },
    { id: 'pro', cls: 'hot', name: 'Pro', price: '₹99', per: '/month', tag: 'Most popular', f: ['Unlimited packet and thali AI scans', 'Personalised for diabetes, BP, pregnancy', 'Compare up to 3 products', 'Weekly health report', 'No sponsored cards'] },
    { id: 'family', cls: 'fam', name: 'Family', price: '₹149', per: '/month', f: ['Everything in Pro', 'Up to 5 profiles incl. kids', 'Kid-safe shopping mode', 'Shared family tracker'] },
  ];
  view().innerHTML = `
    <header class="bar"><a href="#/profile" class="back" aria-label="Back">‹</a><h2>${esc(t('plans'))}</h2><span style="width:40px"></span></header>
    <div class="page-title"><p>Scan the packet, the plate and the market, not just barcodes.</p></div>
    <div class="stagger">${plans.map((p) => `<div class="card plan ${p.cls || ''} ${S.plan === p.id ? 'cur' : ''}">${p.tag ? `<span class="tag">${p.tag}</span>` : ''}<div class="pl-head"><span>${p.name}</span><span><b class="price">${p.price}</b> <small>${p.per}</small></span></div><ul>${p.f.map((x) => `<li>✓ ${esc(x)}</li>`).join('')}</ul>${S.plan === p.id ? '<button class="btn-ghost wide" disabled>Current plan</button>' : `<button class="btn wide" data-plan="${p.id}">${p.id === 'free' ? 'Switch to Free' : 'Subscribe'}</button>`}</div>`).join('')}</div>
    `;
  view().querySelectorAll('[data-plan]').forEach((b) => (b.onclick = () => {
    const id = b.dataset.plan;
    if (id === 'free') { S.plan = 'free'; save('plan'); screenPlans(); return; }
    modal(`<div style="font-size:44px">🎉</div><h2>${id === 'pro' ? 'Pro' : 'Family'} unlocked</h2><p>Every feature is now open on this phone. Enjoy!</p><button class="btn wide" data-close>Start scanning</button>`);
    confetti('star');
    S.plan = id; save('plan'); screenPlans();
  }));
}

// ---------------- Partner ----------------
// Every field is required. The same checks (validate.js) run here for instant help and
// again on the server, which also confirms the email's domain really receives mail.
function screenPartner() {
  view().innerHTML = `
    <div class="res-hero" style="--vc:var(--jamun);padding-bottom:28px">
      <img class="bg" src="${pic('market')}" alt="">
      <header class="bar"><a href="#/home" class="back" aria-label="Back">‹</a><span></span></header>
      <div class="res-title"><small>For brands</small><h1>${esc(t('partner'))}</h1><p style="opacity:.92">One clearly labelled sponsored card on the home and result screens. We only partner with brands that meet our health criteria, and sponsorship never changes a score.</p></div>
    </div>`;
  // The form itself is plain HTML in index.html (<template id="tpl-partner">)
  view().append(document.getElementById('tpl-partner').content.cloneNode(true));
  const form = $('#sf');
  const PH = { mobile: ['98201 23456', '10-digit mobile number starting with 6, 7, 8 or 9', '+91'], landline: ['022 2345 6789', 'Area code + number, e.g. 022 for Mumbai, 020 for Pune', '+91'], tollfree: ['1800 123 4567', 'Toll-free numbers start with 1800', ''] };
  const syncPhone = () => { const ty = form.phone_type.value; $('#f-phone').placeholder = PH[ty][0]; $('#phint').textContent = PH[ty][1]; $('#cc').textContent = PH[ty][2]; $('#cc').hidden = !PH[ty][2]; };
  form.querySelectorAll('input[name=phone_type]').forEach((r) => r.addEventListener('change', () => { syncPhone(); if ($('#f-phone').value) showErr('phone', checkPhone(form.phone_type.value, $('#f-phone').value).error); }));
  syncPhone();
  const showErr = (k, m, fix) => {
    const box = form.querySelector(`[data-f="${k}"]`), el = $('#e-' + k);
    box.classList.toggle('bad', !!m); box.classList.toggle('good', !m && !!(form[k] && form[k].value));
    el.textContent = m || '';
    if (fix) { const b = document.createElement('button'); b.type = 'button'; b.className = 'fixbtn'; b.textContent = 'Use ' + fix; b.onclick = () => { form.email.value = fix; showErr('email', ''); }; el.append(' ', b); }
    const inp = form[k]; if (inp && inp.setAttribute) inp.setAttribute('aria-invalid', m ? 'true' : 'false');
  };
  const one = (k) => {
    const v = form[k].value;
    if (k === 'company') return showErr(k, checkCompany(v));
    if (k === 'contact_name') return showErr(k, checkName(v));
    if (k === 'email') { const r = checkEmail(v); return showErr(k, r.error, r.fix); }
    if (k === 'phone') return showErr(k, checkPhone(form.phone_type.value, v).error);
    if (k === 'budget') return showErr(k, v ? '' : 'Please choose a budget range.');
    if (k === 'message') return showErr(k, checkMessage(v));
  };
  ['company', 'contact_name', 'email', 'phone', 'budget', 'message'].forEach((k) => {
    form[k].addEventListener('blur', () => { if (form[k].value) one(k); });
    form[k].addEventListener('input', () => { if (form.querySelector(`[data-f="${k}"]`).classList.contains('bad')) one(k); });
  });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = $('#sbtn'), msg = $('#smsg');
    msg.textContent = '';
    const body = Object.fromEntries(new FormData(form).entries());
    const v = checkEnquiry(body);
    ['company', 'contact_name', 'email', 'phone', 'budget', 'message'].forEach((k) => showErr(k, v.errors[k], k === 'email' ? checkEmail(body.email).fix : undefined));
    if (!v.ok) { msg.className = 'small err'; msg.textContent = 'Please fix the highlighted fields.'; const first = form.querySelector('.fld.bad input, .fld.bad select, .fld.bad textarea'); if (first) first.focus(); return; }
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Sending…';
    try {
      const r = await fetch(API + '/sponsor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (j.errors) Object.entries(j.errors).forEach(([k, m]) => showErr(k, m));
      if (!r.ok || !j.ok) throw new Error(j.error || 'Could not send right now.');
      form.reset(); syncPhone(); form.querySelectorAll('.fld').forEach((f) => f.classList.remove('good', 'bad'));
      msg.className = 'small ok'; msg.textContent = 'Enquiry sent. We reply within 2 working days.';
      btn.textContent = 'Sent ✓'; confetti('star');
    } catch (err) {
      msg.className = 'small err'; msg.textContent = err.message;
      btn.disabled = false; btn.textContent = 'Send enquiry';
    }
  };
}

// ---------------- SmartBite Coins (1 coin = ₹1 off in the SmartBite shop) ----------------
// Earn: welcome bonus + 5% back on every shop order (credited when online payment confirms the order).
// Use: up to 20% of an order's value. Stored on this phone for this user; when payments go live the
// server must check the balance before applying a discount.
const WELCOME_COINS = 50, COIN_BACK = 0.05, COIN_MAX_SHARE = 0.2;
function addCoins(n, why) {
  n = Math.round(n); if (!n) return;
  S.coins.bal = Math.max(0, S.coins.bal + n);
  S.coins.log = [{ n, why, at: Date.now() }, ...S.coins.log].slice(0, 50);
  save('coins');
}
const coinChip = () => `<a class="coin-chip" href="#/coins" aria-label="${S.coins.bal} SmartBite Coins"><i class="coin" aria-hidden="true"></i>${S.coins.bal}</a>`;
function screenCoins() {
  view().innerHTML = `
    <header class="bar"><a href="#/home" class="back" aria-label="Back">‹</a><h2>SmartBite Coins</h2><span style="width:40px"></span></header>
    <section class="coin-hero">
      <div class="coin-big"><i class="coin xl" aria-hidden="true"></i><div><b>${S.coins.bal}</b><span>coins · worth ${rupees(S.coins.bal)}</span></div></div>
      <p>1 coin = ₹1 off in the SmartBite Shop</p>
    </section>
    <section class="card coin-how">
      <h3>How it works</h3>
      <div class="ch-row"><span class="ch-n">1</span><div><b>Buy healthy, earn coins</b><p>Get 5% back as coins on every order from the SmartBite Shop.</p></div></div>
      <div class="ch-row"><span class="ch-n">2</span><div><b>Use them next time</b><p>Pay up to 20% of any order with coins at checkout.</p></div></div>
      <div class="ch-row"><span class="ch-n">3</span><div><b>Welcome gift</b><p>Every new SmartBite login starts with ${WELCOME_COINS} coins.</p></div></div>
      <a class="btn hot wide" href="#/shop" style="margin-top:6px">Shop and earn</a>
    </section>
    <section class="card"><h3>Coin history</h3>${S.coins.log.length ? S.coins.log.map((l) => `<div class="tot-row"><span>${esc(l.why)}<br><small class="muted">${new Date(l.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small></span><b class="${l.n > 0 ? 'ok' : 'err'}">${l.n > 0 ? '+' : ''}${l.n}</b></div>`).join('') : '<p class="muted">No coins yet.</p>'}</section>
    <p class="foot">Coins are for this login on this phone and are cleared when you log out.</p>`;
}

// ---------------- Login (details stay on this phone; Log out wipes them) ----------------
const LG = { age: 'adult', diet: 'veg', lang: 'en' };
function screenLogin() {
  document.body.classList.add('pre-login');
  const chips = (name, opts, cur) => `<div class="checks">${opts.map(([v, l]) => `<label class="ck"><input type="radio" name="${name}" value="${v}" ${cur === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  view().innerHTML = `
    <div class="login">
      <div class="lg-hero" style="background-image:url(${API}/asset/hero-1)">
        <div class="lg-brand"><img src="/logo.svg" alt="" width="54" height="54"><div><b>SmartBite</b><small>Scan. Know. Eat smart.</small></div></div>
        <h1>Namaste! 🙏</h1><p>Know what's really in your food, in 5 seconds.</p>
      </div>
      <form class="card form lg-form" id="lgf">
        <h2>Let's get started</h2>
        <label>Your name<input name="name" required maxlength="40" placeholder="e.g. Ananya" autocomplete="given-name"></label>
        <fieldset><legend>Who is this for?</legend>${chips('age', [['child', 'Child (under 12)'], ['teen', 'Teen'], ['adult', 'Adult'], ['senior', 'Senior']], LG.age)}</fieldset>
        <fieldset><legend>Food preference</legend><div class="checks">${[['veg', 'Veg', 'veg'], ['jain', 'Jain', 'veg'], ['egg', 'Egg', 'egg'], ['nonveg', 'Non-veg', 'nonveg']].map(([v, l, m]) => `<label class="ck"><input type="radio" name="diet" value="${v}" ${LG.diet === v ? 'checked' : ''}><span>${dietMark(m)} ${l}</span></label>`).join('')}</div></fieldset>
        <fieldset><legend>Language</legend>${chips('lang', [['en', 'English'], ['hi', 'हिन्दी'], ['mr', 'मराठी']], LG.lang)}</fieldset>
        <button class="btn hot wide">Start using SmartBite</button>
        <button type="button" class="linkbtn lg-guest" id="lgGuest">Continue as guest</button>
        <p class="muted small lg-note">🔒 Your details stay only on this phone. Nothing is shared. Tap <b>Log out</b> in Profile when you're done and everything is cleared for the next person.</p>
      </form>
    </div>`;
  const start = (name, f) => {
    // Every login starts fresh: nothing from an earlier person carries over.
    try { Object.keys(localStorage).filter((k) => k.startsWith('sb_')).forEach((k) => localStorage.removeItem(k)); } catch {}
    try { sessionStorage.clear(); } catch {}
    Object.assign(S, { history: [], compare: [], tracker: [], custom: [], cart: [], ship: {}, days: [], plan: 'free', aiCount: { day: today(), n: 0 } });
    S.profile = { name: '', conditions: [], allergens: [], theme: 'auto', palette: 'masala', textSize: 'normal', motion: 'auto', name, age: (f && f.get('age')) || 'adult', diet: (f && f.get('diet')) || 'veg', lang: (f && f.get('lang')) || 'en' };
    S.session = { at: Date.now(), guest: !name };
    S.coins = { bal: 0, log: [] };
    addCoins(WELCOME_COINS, 'Welcome bonus');
    ['profile', 'session', 'history', 'compare', 'tracker', 'custom', 'cart', 'ship', 'days', 'plan', 'aiCount'].forEach(save);
    document.body.classList.remove('pre-login'); applyTheme();
    location.hash = '#/home'; route();
    toast(`${WELCOME_COINS} SmartBite Coins added. Welcome${name ? ', ' + name : ''}!`);
  };
  $('#lgf').onsubmit = (e) => { e.preventDefault(); const f = new FormData(e.target); start(String(f.get('name') || '').trim().slice(0, 40), f); };
  $('#lgGuest').onclick = () => start('', null);
}
function logout() {
  if (!confirm('Log out and clear all your SmartBite data from this phone?')) return;
  try { Object.keys(localStorage).filter((k) => k.startsWith('sb_')).forEach((k) => localStorage.removeItem(k)); } catch {}
  try { sessionStorage.clear(); } catch {}
  location.hash = '#/home'; location.reload();
}

// ---------------- Router ----------------
async function route() {
  stopHero();
  stopGame();
  await stopCam();
  view().onclick = null;
  const h = location.hash.replace(/^#\/?/, '') || 'home';
  const [page, arg] = h.split('/');
  if (!S.session) { renderNav(''); screenLogin(); return; }
  document.body.classList.remove('pre-login');
  markActive();
  const navKey = { coins: 'home', dish: 'home', shop: 'shop', cart: 'shop', checkout: 'shop', game: 'home', play: 'home', quiz: 'home', sugar: 'home', swaps: 'swapday', home: 'home', scan: 'scan', result: 'scan', plate: 'scan', label: 'scan', compare: 'explore', explore: 'explore', reviews: 'home', tracker: 'tracker', profile: 'profile', plans: 'profile', partner: 'home' }[page] || 'home';
  renderNav(navKey);
  window.scrollTo(0, 0);
  ({ home: screenHome, game: screenGame, play: screenPlayHub, quiz: screenQuiz, sugar: screenSugar, swaps: screenSwaps, explore: screenExplore, coins: screenCoins, dish: () => screenDish(arg), shop: () => screenShop(arg), cart: screenCart, checkout: screenCheckout, reviews: screenHome, scan: () => screenScan(arg), result: screenResult, plate: screenPlate, label: screenLabel, compare: screenCompare, tracker: screenTracker, profile: screenProfile, plans: screenPlans, partner: screenPartner }[page] || screenHome)();
  if (!['home', ''].includes(page) && !view().querySelector('.brandbar')) view().insertAdjacentHTML('afterbegin', '<a class="brandbar" href="#/home" aria-label="SmartBite home"><img src="/logo.svg" alt="" width="30" height="30"><b>SmartBite</b><small>Scan. Know. Eat smart.</small></a>');
  const v = view(); v.classList.remove('view-enter'); void v.offsetWidth; v.classList.add('view-enter');
}

// ---------------- Bitu: AI food assistant ----------------
const CHAT = { open: false, busy: false, msgs: (() => { try { return JSON.parse(sessionStorage.getItem('sb_chat') || '[]'); } catch { return []; } })() };
const saveChat = () => { try { sessionStorage.setItem('sb_chat', JSON.stringify(CHAT.msgs.slice(-20))); } catch {} };
const md = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^\s*[-•]\s+(.*)$/gm, '<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m.replace(/\n/g, '')}</ul>`).replace(/\n/g, '<br>');
function chatProduct() {
  if (!/^#\/result/.test(location.hash) || !S.current || S.current.kind !== 'product') return null;
  const p = S.current.data, n = p.n || {}, a = scoreFor(p, 'adult', S.profile), j = junkMeter(p);
  return { p, text: `${p.brand} ${p.name} (${p.cat || 'packaged food'}${p.quantity ? ', ' + p.quantity : ''}). Per 100${p.drink ? ' ml' : ' g'}: ${n.kcal ?? '?'} kcal, sugar ${n.sugar ?? '?'} g, fat ${n.fat ?? '?'} g, saturated fat ${n.sat ?? '?'} g, sodium ${n.sodium ?? '?'} mg, protein ${n.protein ?? '?'} g, fibre ${n.fibre ?? '?'} g. NOVA ${p.nova ?? '?'}, Nutri-Score ${(p.nutriscore || '?').toUpperCase()}. SmartBite adult score ${a.score}/5 (${a.verdict}), junk meter ${j.pts}/7 (${j.label}). Ingredients: ${(p.ing || []).slice(0, 25).join(', ') || 'not available'}.` };
}
function chatSuggestions() {
  const cp = chatProduct();
  if (cp) return [`Is ${cp.p.brand} ${cp.p.name} OK for kids?`, 'Explain the additives in this', 'Suggest a healthier swap', 'How much is too much?'];
  return ['Is Maggi healthy?', 'Healthy tiffin ideas for school', 'What is 627 / 631 in chips?', 'Kurkure vs Lay\'s: which is better?', 'Healthy evening snacks under ₹20', 'How much sugar is in a cold drink?'];
}
function mountChat() {
  if ($('#bituBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'bituBtn'; btn.className = 'bitu-btn'; btn.setAttribute('aria-label', 'Ask Bitu, the food assistant');
  btn.innerHTML = '<span class="bitu-face">🤖</span><span class="bitu-label">Ask Bitu</span>';
  btn.onclick = () => toggleChat(true);
  document.body.appendChild(btn);
  const panel = document.createElement('section');
  panel.id = 'bitu'; panel.className = 'bitu'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Bitu food assistant'); panel.hidden = true;
  panel.innerHTML = `<header class="bitu-head"><span class="bitu-av">🤖</span><div class="grow"><b>Bitu</b><small>Your AI food buddy</small></div><button class="bitu-x" data-chat-clear aria-label="New chat" title="New chat">↺</button><button class="bitu-x" data-chat-close aria-label="Close">✕</button></header>
    <div class="bitu-ctx" id="bituCtx" hidden></div>
    <div class="bitu-log" id="bituLog" aria-live="polite"></div>
    <div class="bitu-sugs" id="bituSugs"></div>
    <form class="bitu-form" id="bituForm"><input id="bituIn" autocomplete="off" maxlength="500" placeholder="Ask about any food, snack or label…" aria-label="Your question"><button class="bitu-send" aria-label="Send">➤</button></form>
    <p class="bitu-note">AI answers can be wrong. For health conditions, ask a doctor.</p>`;
  document.body.appendChild(panel);
  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-chat-close]')) toggleChat(false);
    else if (e.target.closest('[data-chat-clear]')) { CHAT.msgs = []; saveChat(); renderChat(); }
    else { const sg = e.target.closest('[data-sug]'); if (sg) sendChat(sg.dataset.sug); }
  });
  $('#bituForm').onsubmit = (e) => { e.preventDefault(); const v = $('#bituIn').value.trim(); if (v) { $('#bituIn').value = ''; sendChat(v); } };
}
function toggleChat(open) {
  CHAT.open = open;
  $('#bitu').hidden = !open;
  $('#bituBtn').classList.toggle('hide', open);
  document.body.classList.toggle('chat-open', open);
  if (open) { renderChat(); setTimeout(() => $('#bituIn').focus(), 50); }
}
function renderChat() {
  const log = $('#bituLog'); if (!log) return;
  const cp = chatProduct();
  const ctx = $('#bituCtx');
  ctx.hidden = !cp;
  if (cp) ctx.innerHTML = `${cp.p.imgSmall || cp.p.img ? `<img src="${esc(cp.p.imgSmall || cp.p.img)}" alt="">` : ''}<span>Asking about <b>${esc(cp.p.brand)} ${esc(cp.p.name)}</b></span>`;
  const hello = `<div class="msg bot"><div class="b">Namaste! I'm <b>Bitu</b> 🤖. Ask me anything about food: is a snack healthy, what an E-number means, tiffin ideas, or healthier swaps.</div></div>`;
  log.innerHTML = hello + CHAT.msgs.map((m) => `<div class="msg ${m.role === 'user' ? 'me' : 'bot'}${m.error ? ' err' : ''}"><div class="b">${m.role === 'user' ? esc(m.content) : md(m.content)}</div></div>`).join('') + (CHAT.busy ? '<div class="msg bot typing"><div class="b"><i></i><i></i><i></i></div></div>' : '');
  $('#bituSugs').innerHTML = CHAT.busy ? '' : chatSuggestions().slice(0, CHAT.msgs.length ? 3 : 6).map((q) => `<button class="chip" data-sug="${esc(q)}">${esc(q)}</button>`).join('');
  log.scrollTop = log.scrollHeight;
}
async function sendChat(text) {
  if (CHAT.busy) return;
  CHAT.msgs.push({ role: 'user', content: text.slice(0, 500) });
  CHAT.busy = true; renderChat();
  try {
    const cp = chatProduct();
    const r = await fetch(API + '/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: S.profile.lang, product: cp ? cp.text : undefined, profile: { age: S.profile.age, diet: S.profile.diet, conditions: S.profile.conditions || [], allergens: S.profile.allergens || [] }, messages: CHAT.msgs.filter((m) => !m.error).slice(-12) }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || 'Bitu could not answer. Check your connection.');
    CHAT.msgs.push({ role: 'assistant', content: j.reply });
  } catch (e) { CHAT.msgs.push({ role: 'assistant', content: e.message, error: true }); }
  CHAT.busy = false; saveChat(); renderChat();
}

document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]');
  if (o) { const p = findProduct(o.dataset.open); if (p) showProduct(p, p.src || 'Our database'); else if (o.dataset.open.startsWith('off-')) openBarcode(o.dataset.open.slice(4)); }
  const bcEl = e.target.closest('[data-bc]');
  if (bcEl) openBarcode(bcEl.dataset.bc);
  if (e.target.closest('[data-act=bitu]')) toggleChat(true);
});
window.addEventListener('hashchange', () => { route(); if (CHAT.open) renderChat(); });
applyTheme();
setInterval(() => { if (S.profile.theme === 'auto') applyTheme(); }, 60000);
mountChat();
route();

// Installable app (Android APK / Add to Home screen): register the service worker
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
