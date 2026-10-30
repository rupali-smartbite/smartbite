// SmartBite service worker: lets the app install on phones and open even with a weak connection.
// Pages and code are always fetched fresh first (so updates show at once), with the saved copy
// used only when offline. API answers and personal data are never cached.
const CACHE = 'smartbite-v1';
const SHELL = ['/', '/index.html', '/styles.css', '/js/app.js', '/js/data.js', '/js/india-db.js', '/js/score.js', '/js/i18n.js', '/js/validate.js', '/logo.svg', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && (req.mode === 'navigate' || SHELL.includes(url.pathname) || url.pathname.startsWith('/img/') || url.pathname.startsWith('/icons/'))) {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req.mode === 'navigate' ? '/' : req, copy));
      }
      return res;
    }).catch(() => caches.match(req.mode === 'navigate' ? '/' : req).then((r) => r || caches.match('/')))
  );
});
