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
    <div class="wrap"><nav class="tabs">${[['overview', 'Overview'], ['requests', 'Add requests'], ['usage', 'Usage'], ['reviews', 'Reviews'], ['enquiries', 'Enquiries'], ['orders', 'Orders']].map(([t, l]) => `<button data-t="${t}" class="${t === TAB ? 'on' : ''}">${l}</button>`).join('')}</nav><div id="body"><p class="empty">Loading…</p></div></div>`;
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
        <div class="stat"><div class="num">${(d.submissions && d.submissions.waiting) || 0}</div><small>Products waiting for you to check · ${(d.submissions && d.submissions.approved) || 0} added so far</small></div>
        <div class="stat"><div class="num">${d.enquiries}</div><small>Brand enquiries</small></div>
        <div class="stat"><div class="num">${d.orders.paid}</div><small>Paid orders · ${rupees(d.orders.live)} real${d.orders.test ? ` · ${rupees(d.orders.test)} test` : ''}</small></div>
      </div>
      <div class="card"><h3>Last 30 days</h3><p>${d.usage.opens30} app opens (once per phone per day), ${d.usage.new30} new phones.</p>
        <p class="note">Payments: ${d.payments ? '✅ Razorpay keys are set' : '⏸ Razorpay keys not added yet'}. Usage numbers are anonymous counts: SmartBite never stores names, IDs or IP addresses of people using the app.</p></div>`;
    } else if (tab === 'requests') {
      const { submissions, approved } = await api('submissions');
      const waiting = submissions.filter((x) => x.status === 'new');
      const N = [['kcal', 'Energy kcal'], ['protein', 'Protein g'], ['carbs', 'Carbs g'], ['sugar', 'Sugar g'], ['fibre', 'Fibre g'], ['fat', 'Fat g'], ['sat', 'Sat fat g'], ['sodium', 'Sodium mg']];
      const v = (x) => (x === null || x === undefined ? '' : esc(x));
      body.innerHTML = `<div class="card"><h3>Products people asked us to add (${waiting.length} waiting)</h3>
        <p class="note">Check the numbers against the photo of the back of the pack, fix anything wrong, then approve. Approved products reach every phone within a few minutes and give the same verdict for everyone.</p></div>
        ${waiting.length ? waiting.map((x) => { const r = x.read || {}, n = r.per100 || {}; return `<form class="card req" data-id="${esc(x.id)}">
          <div class="req-top"><div class="ph" data-ph="${esc(x.id)}"><span class="muted">Loading photos…</span></div>
          <div class="req-f">
            <p class="muted small">Sent ${when(x.created_at)}${r.fromPack ? ' · numbers read from the back of the pack by AI' : r.per100 && Object.values(n).some((y) => y !== null) ? ' · numbers are an AI guess, check carefully' : ' · no numbers yet, type them from the photo'}</p>
            <div class="f2"><label>Brand<input name="brand" value="${v(x.brand)}" required></label><label>Product name<input name="name" value="${v(x.name)}" required></label></div>
            <div class="f2"><label>Barcode<input name="barcode" value="${v(x.barcode)}" inputmode="numeric"></label><label>Category<input name="cat" value="${v(r.category || 'Packaged food')}"></label></div>
            <div class="f2"><label>Pack size (g or ml)<input name="packG" value="${v(r.packG || 50)}" inputmode="decimal"></label><label class="ckl"><input type="checkbox" name="drink" ${r.drink ? 'checked' : ''}> It is a drink (values per 100 ml)</label></div>
            <p class="small"><b>Per 100 g / 100 ml</b></p>
            <div class="f4">${N.map(([k, l]) => `<label>${l}<input name="n_${k}" value="${v(n[k])}" inputmode="decimal" required></label>`).join('')}</div>
            <label>Ingredients (comma separated)<textarea name="ing" rows="2">${esc((r.ingredients || []).join(', '))}</textarea></label>
            <div class="err" data-err></div>
            <div class="btns"><button class="btn" type="submit">✓ Approve and add</button><button class="btn danger" type="button" data-rej>Reject</button></div>
          </div></div></form>`; }).join('') : '<div class="card"><p class="empty">Nothing waiting. When someone scans a product we do not have, their photos appear here.</p></div>'}
        <div class="card"><h3>Added from people's photos (${approved.length})</h3>${approved.length ? `<table><tr><th>Product</th><th>Barcode</th><th>Sugar / 100</th><th>Added</th><th></th></tr>${approved.map((p) => `<tr><td><b>${esc(p.brand)}</b> ${esc(p.name)}</td><td>${esc(p.barcode || '—')}</td><td>${esc(p.n && p.n.sugar)} g</td><td class="muted">${when(p.approved_at)}</td><td><button class="btn sm ghost" data-rm="${esc(p.id)}">Remove</button></td></tr>`).join('')}</table>` : '<p class="empty">None yet.</p>'}</div>`;
      body.querySelectorAll('[data-ph]').forEach(async (box) => {
        try { const ph = await api('photos&id=' + encodeURIComponent(box.dataset.ph)); box.innerHTML = [ph.front, ph.back].filter(Boolean).map((src, i) => `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="${i ? 'Back of pack' : 'Front of pack'}"><small>${i ? 'Back' : 'Front'}</small></a>`).join(''); }
        catch { box.innerHTML = '<span class="muted">Photos could not load.</span>'; }
      });
      body.querySelectorAll('form.req').forEach((f) => {
        const err = f.querySelector('[data-err]');
        f.onsubmit = async (e) => {
          e.preventDefault(); const F = new FormData(f); err.textContent = '';
          const product = { brand: F.get('brand'), name: F.get('name'), barcode: F.get('barcode'), cat: F.get('cat'), packG: F.get('packG'), drink: !!F.get('drink'), ing: F.get('ing'), n: Object.fromEntries(N.map(([k]) => [k, F.get('n_' + k)])) };
          const b = f.querySelector('[type=submit]'); b.disabled = true;
          try { await api(null, { action: 'approve-product', id: f.dataset.id, product }); show('requests'); } catch (x) { err.textContent = x.message; b.disabled = false; }
        };
        f.querySelector('[data-rej]').onclick = async () => {
          if (!confirm('Reject this request? Its photos will be deleted.')) return;
          try { await api(null, { action: 'reject-product', id: f.dataset.id }); show('requests'); } catch (x) { err.textContent = x.message; }
        };
      });
      body.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = async () => {
        if (!confirm('Remove this product from the app for everyone?')) return;
        try { await api(null, { action: 'remove-product', productId: b.dataset.rm }); show('requests'); } catch (x) { alert(x.message); }
      }));
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
