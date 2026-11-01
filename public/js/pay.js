// SmartBite payments in the app: opens Razorpay Checkout for an order that the server
// priced (/api/pay/order), then asks the server to verify it (/api/pay/verify).
// The app never decides a price and never sees the secret key.

const CHECKOUT_JS = 'https://checkout.razorpay.com/v1/checkout.js';
let loading = null;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = CHECKOUT_JS; s.async = true;
    s.onload = () => (window.Razorpay ? res() : rej(new Error('Payment window could not load.')));
    s.onerror = () => { loading = null; rej(new Error('Payment window could not load. Check your internet and try again.')); };
    document.head.appendChild(s);
  });
  return loading;
}

// True inside the Play Store app (Trusted Web Activity). Google Play does not allow
// digital purchases (Premium) through other payment systems inside the Android app.
const TWA_KEY = 'smartbite_android_app';
export function isAndroidApp() {
  try {
    if (document.referrer.startsWith('android-app://')) localStorage.setItem(TWA_KEY, '1');
    return localStorage.getItem(TWA_KEY) === '1';
  } catch { return document.referrer.startsWith('android-app://'); }
}

async function post(api, path, body) {
  const r = await fetch(api + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
  return j;
}

// body: { kind:'plan', plan } or { kind:'shop', items, coins, ship }
// Resolves with the verified receipt. Rejects with err.cancelled = true if the person closes the window.
export async function payNow(api, body, { onStage = () => {} } = {}) {
  onStage('preparing');
  const [o] = await Promise.all([post(api, '/pay/order', body), loadRazorpay()]);
  onStage('paying');
  let lastFail = '';
  const paid = await new Promise((resolve, reject) => {
    const rz = new window.Razorpay({
      key: o.keyId, order_id: o.orderId, amount: o.amount, currency: o.currency,
      name: 'SmartBite', description: o.desc, image: location.origin + '/icons/icon-192.png',
      prefill: o.prefill || {}, notes: { smartbite_order: o.no },
      theme: { color: '#5B2A86' },
      handler: (res) => resolve(res),
      modal: { ondismiss: () => { const e = new Error(lastFail ? `Payment did not go through: ${lastFail} No money was taken.` : 'Payment cancelled. No money was taken.'); e.cancelled = true; reject(e); }, confirm_close: true },
      retry: { enabled: true, max_count: 2 },
    });
    // A failed try keeps the Razorpay window open so the person can retry another way;
    // we only stop when they close it (then we show the last reason).
    rz.on('payment.failed', (r) => { lastFail = (r && r.error && r.error.description) || ''; });
    rz.open();
  });
  onStage('verifying');
  const v = await post(api, '/pay/verify', { orderId: paid.razorpay_order_id, paymentId: paid.razorpay_payment_id, signature: paid.razorpay_signature });
  onStage('done');
  return { ...v, test: o.test };
}
