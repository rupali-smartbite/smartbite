// SmartBite owner admin panel. The secret key is kept only in this browser tab
// (sessionStorage) and sent to /api/admin, which checks it against ADMIN_KEY.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupees = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const when = (t) => (t ? new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
let KEY = '';
try { KEY = sessionStorage.getItem('sb_admin_key') || ''; } catch {}
let TAB = 'overview';

async function api(view, body) {
  const r = await fetch('/api/admin' + (body ? '' : '?view=' + view), {
    method: body ? 'POST' : 'GET', headers: { 'x-admin-key': KEY, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store',
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 || r.status === 429 || r.status === 503) { const e = new Error(j.error || 'Not allowed'); e.auth = true; throw e; }
  if (!r.ok || !j.ok) throw new Error(j.error || 'Something went wrong');
  return j;
}

function login(msg = '') {
  $('#app').innerHTML = `<form class="login" id="lf" autocomplete="off">
    <img src="/logo.svg" alt=""><h2>SmartBite Admin</h2><p class="muted">Owner only. Enter your admin key.</p>
    <input id="k" type="password" placeholder="Admin key" autocomplete="off" required>
    <div class="err">${esc(msg)}</div><button class="btn" type="submit">Open dashboard</button></form>`;
  $('#lf').onsubmit = async (e) => {
    e.preventDefault(); KEY = $('#k').value.trim();
    try { await api('overview'); try { sessionStorage.setItem('sb_admin_key', KEY); } catch {} shell(); } catch (err) { KEY = ''; login(err.message); }
  };
  $('#k').focus();
}

function shell() {
  $('#app').innerHTML = `<header class="top"><img src="/logo.svg" alt=""><h1>SmartBite Admin</h1><button id="out">Log out</button></header>
    <div class="wrap"><nav class="tabs">${['overview', 'usage', 'reviews', 'enquiries', 'orders'].map((t) => `<button data-t="${t}" class="${t === TAB ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</nav><div id="body"><p class="empty">Loading…</p></div></div>`;
  $('#out').onclick = () => { try { sessionStorage.removeItem('sb_admin_key'); } catch {} KEY = ''; login('Logged out.'); };
  document.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { TAB = b.dataset.t; shell(); }));
  show(TAB);
}

async function show(tab) {
  const body = $('#body');
  try {
    if (tab === 'overview') {
      const d = await api('overview');
      body.innerHTML = `<div class="grid">
        <div class="stat"><div class="num">${d.usage.opens7}</div><small>Phones that opened the app, last 7 days (counted once a day)</small></div>
        <div class="stat"><div class="num">${d.usage.new7}</div><small>New phones, last 7 days</small></div>
        <div class="stat"><div class="num">${d.usage.avgMins7} min</div><small>Average visit length, last 7 days</small></div>
        <div class="stat"><div class="num">${d.usage.chats7}</div><small>Messages to Bitu, last 7 days</small></div>
        <div class="stat"><div class="num">${d.reviews.app}</div><small>App reviews · average ${d.reviews.avg} ★</small></div>
        <div class="stat"><div class="num">${d.reviews.products}</div><small>Product reviews</small></div>
        <div class="stat"><div class="num">${d.enquiries}</div><small>Brand enquiries</small></div>
        <div class="stat"><div class="num">${d.orders.paid}</div><small>Paid orders · ${rupees(d.orders.live)} real${d.orders.test ? ` · ${rupees(d.orders.test)} test` : ''}</small></div>
      </div>
      <div class="card"><h3>Last 30 days</h3><p>${d.usage.opens30} app opens (once per phone per day), ${d.usage.new30} new phones.</p>
        <p class="note">Payments: ${d.payments ? '✅ Razorpay keys are set' : '⏸ Razorpay keys not added yet'}. Usage numbers are anonymous counts: SmartBite never stores names, IDs or IP addresses of people using the app.</p></div>`;
    } else if (tab === 'usage') {
      const { days } = await api('usage');
      const max = Math.max(1, ...days.map((x) => x.opens));
      const views = {}; days.forEach((x) => Object.entries(x.views || {}).forEach(([k, v]) => (views[k] = (views[k] || 0) + v)));
      const top = Object.entries(views).sort((a, b) => b[1] - a[1]).slice(0, 12), vmax = Math.max(1, ...top.map((x) => x[1]));
      const mins = days.reduce((s, x) => s + x.minutes, 0), ses = days.reduce((s, x) => s + x.sessions, 0);
      body.innerHTML = `<div class="card"><h3>Phones opening SmartBite each day (last 30 days)</h3>
          <div class="bars">${days.map((x) => `<div style="height:${(x.opens / max) * 100}%" data-t="${x.day}: ${x.opens} phones, ${x.newPhones} new"></div>`).join('')}</div>
          <div class="axis"><span>${days[0].day}</span><span>${days[days.length - 1].day}</span></div></div>
        <div class="card"><h3>Time spent</h3><p><b>${ses}</b> visits, <b>${Math.round(mins / 60)}</b> hours in total, <b>${ses ? Math.round((mins / ses) * 10) / 10 : 0} min</b> average per visit.</p></div>
        <div class="card"><h3>Most used screens (30 days)</h3>${top.length ? top.map(([k, v]) => `<div class="hbar"><span>${esc(k)}</span><i style="width:${(v / vmax) * 100}%"></i><b>${v}</b></div>`).join('') : '<p class="empty">No data yet. Numbers appear once people use the new version.</p>'}</div>`;
    } else if (tab === 'reviews') {
      const d = await api('reviews');
      const row = (r, store, extra = '') => `<tr><td class="stars">${'★'.repeat(r.rating || 0)}${'☆'.repeat(5 - (r.rating || 0))}</td><td><b>${esc(r.name)}</b>${extra}<br>${esc(r.comment)}${r.tags && r.tags.length ? `<br><small class="muted">${r.tags.map(esc).join(', ')}</small>` : ''}</td><td class="muted">${when(r.at || r.created_at)}</td><td><button class="btn sm danger" data-del="${esc(r.id)}" data-store="${store}">Delete</button></td></tr>`;
      body.innerHTML = `<div class="card"><h3>App reviews (${d.app.length})</h3>${d.app.length ? `<table><tr><th>Rating</th><th>Review</th><th>When</th><th></th></tr>${d.app.map((r) => row(r, 'app-reviews')).join('')}</table>` : '<p class="empty">No app reviews yet.</p>'}</div>
        <div class="card"><h3>Product reviews (${d.products.length})</h3>${d.products.length ? `<table><tr><th>Rating</th><th>Review</th><th>When</th><th></th></tr>${d.products.map((r) => row(r, 'product-reviews', ` <small class="muted">on ${esc(r.brand)} ${esc(r.product_name)}</small>`)).join('')}</table>` : '<p class="empty">No product reviews yet.</p>'}</div>`;
      body.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
        if (!confirm('Delete this review for everyone? This cannot be undone.')) return;
        b.disabled = true; try { await api(null, { action: 'delete-review', store: b.dataset.store, id: b.dataset.del }); show('reviews'); } catch (e) { alert(e.message); b.disabled = false; }
      }));
    } else if (tab === 'enquiries') {
      const { enquiries } = await api('enquiries');
      body.innerHTML = `<div class="card"><h3>Brand enquiries (${enquiries.length})</h3>${enquiries.length ? `<table><tr><th>Company</th><th>Contact</th><th>Budget</th><th>Message</th><th>When</th></tr>${enquiries.map((e) => `<tr><td><b>${esc(e.company)}</b></td><td>${esc(e.contact_name)}<br><a href="mailto:${esc(e.email)}">${esc(e.email)}</a><br>${esc(e.phone)} <small class="muted">${esc(e.phone_type)}</small></td><td>${esc(e.budget)}</td><td>${esc(e.message)}</td><td class="muted">${when(e.created_at)}</td></tr>`).join('')}</table>` : '<p class="empty">No enquiries yet.</p>'}</div>`;
    } else if (tab === 'orders') {
      const { orders } = await api('orders');
      body.innerHTML = `<div class="card"><h3>Orders (${orders.length})</h3>${orders.length ? `<table><tr><th>Order</th><th>What</th><th>Amount</th><th>Status</th><th>Delivery</th><th>When</th></tr>${orders.map((o) => `<tr><td><b>${esc(o.no)}</b>${o.test ? ' <span class="pill test">test</span>' : ''}<br><small class="muted">${esc(o.paymentId || o.rzpOrderId || '')}</small></td>
          <td>${o.kind === 'plan' ? `${esc(o.desc)}${o.until ? `<br><small class="muted">until ${when(o.until)}</small>` : ''}` : (o.lines || []).map((l) => `${esc(l.name)} × ${l.qty}`).join('<br>')}</td>
          <td>${rupees(o.totalPaise / 100)}${o.coins ? `<br><small class="muted">${o.coins} coins used</small>` : ''}</td><td><span class="pill ${esc(o.status)}">${esc(o.status)}</span></td>
          <td>${o.ship ? `${esc(o.ship.name)}<br>${esc(o.ship.phone)}<br><small>${esc(o.ship.address)}, ${esc(o.ship.city)} ${esc(o.ship.pin)}</small>` : '<span class="muted">—</span>'}</td><td class="muted">${when(o.paid_at || o.created_at)}</td></tr>`).join('')}</table>` : '<p class="empty">No orders yet.</p>'}</div>`;
    }
  } catch (e) {
    if (e.auth) { try { sessionStorage.removeItem('sb_admin_key'); } catch {} KEY = ''; login(e.message); return; }
    body.innerHTML = `<p class="err">${esc(e.message)}</p>`;
  }
}

if (KEY) shell(); else login();
