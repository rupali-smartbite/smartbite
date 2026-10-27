// Password lock for the whole SmartBite site (pages and API).
//
// The password is NOT in the code. Set it in Netlify:
//   Site configuration > Environment variables > Add variable
//   Key: SITE_PASSWORD   Value: the password you choose
// then deploy again. Remove the variable (and deploy) to open the site to everyone.
//
// After the right password is typed once, the browser keeps a secure cookie for 30 days.
// Changing the password logs everyone out.

const COOKIE = 'sb_gate';
const DAYS = 30;

async function tokenFor(password) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('smartbite-site-gate-v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function sameToken(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function readCookie(req, name) {
  const all = req.headers.get('cookie') || '';
  for (const part of all.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function lockPage(next, wrong) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SmartBite</title><meta name="robots" content="noindex"><link rel="icon" href="/logo.svg" type="image/svg+xml"><meta name="theme-color" content="#5B2A86">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:linear-gradient(160deg,#2A1640,#5B2A86);color:#241433;padding:16px}
.card{width:100%;max-width:380px;background:#fff;border-radius:24px;padding:28px 24px;box-shadow:0 20px 50px rgba(0,0,0,.3);text-align:center}
img{width:64px;height:64px}h1{margin:10px 0 4px;font-size:26px}p{margin:0 0 18px;color:#6b5a7a;font-size:15px}
input{width:100%;font-size:17px;padding:14px 16px;border:2px solid #e2d8ec;border-radius:14px;outline:none}input:focus{border-color:#5B2A86}
button{width:100%;margin-top:12px;font-size:17px;font-weight:700;padding:14px;border:0;border-radius:14px;color:#fff;background:linear-gradient(90deg,#FB8500,#E63946);cursor:pointer}
.err{color:#C0262E;font-weight:600;margin:10px 0 0;font-size:14px}small{display:block;margin-top:16px;color:#8a7a98}
</style></head><body><main class="card">
<img src="/logo.svg" alt=""><h1>SmartBite</h1><p>This app is private. Enter the password to continue.</p>
<form method="post" action="/__unlock"><input type="hidden" name="next" value="${esc(next)}">
<input type="password" name="password" placeholder="Password" autocomplete="current-password" required autofocus aria-label="Password">
<button type="submit">Open SmartBite</button>${wrong ? '<p class="err" role="alert">Wrong password. Please try again.</p>' : ''}</form>
<small>Scan. Know. Eat smart.</small></main></body></html>`;
  return new Response(html, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex' } });
}

const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n.slice(0, 300) : '/');

export default async (req, context) => {
  const password = Netlify.env.get('SITE_PASSWORD');
  if (!password) return context.next(); // no password set: site is open

  const url = new URL(req.url);
  const token = await tokenFor(password);

  if (url.pathname === '/__unlock') {
    if (req.method !== 'POST') return lockPage('/', false);
    let guess = '', next = '/';
    try { const f = await req.formData(); guess = String(f.get('password') || '').slice(0, 200); next = safeNext(f.get('next')); } catch {}
    if (guess && sameToken(await tokenFor(guess), token)) {
      return new Response(null, { status: 303, headers: { Location: next, 'Cache-Control': 'no-store', 'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Lax` } });
    }
    await new Promise((r) => setTimeout(r, 800)); // slows down password guessing
    return lockPage(next, true);
  }

  if (sameToken(readCookie(req, COOKIE), token)) return context.next();

  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ ok: false, error: 'SmartBite is locked. Open the app and enter the password.' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
  return lockPage(url.pathname + url.search, false);
};

export const config = { path: '/*', excludedPath: ['/logo.svg', '/manifest.webmanifest'] };
