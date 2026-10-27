import { getStore } from '@netlify/blobs';
import { json, clean } from '../lib/off.mjs';
import { sameSite, limit, deny } from '../lib/guard.mjs';

// POST /api/sponsor { company, contact_name, email, phone, budget, message }
// Saves the enquiry in Netlify Blobs (store "enquiries") and also submits it to the
// Netlify form "sponsor", so it shows under Forms and can email the owner.
export default async (req, context) => {
  if (!sameSite(req)) return deny(403, 'Please use the SmartBite app.');
  if (!(await limit(context, req, 'sponsor', 5, 86400))) return deny(429, 'We have your enquiry. Please try again tomorrow.');
  let b = {};
  try { b = await req.json(); } catch {}
  const e = {
    company: clean(b.company, 200), contact_name: clean(b.contact_name, 200), email: clean(b.email, 200),
    phone: clean(b.phone, 50), budget: clean(b.budget, 100), message: String(b.message || '').trim().slice(0, 4000),
  };
  if (!e.company || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.email)) return json({ ok: false, error: 'Company name and a valid email are required.' }, 400);

  const at = new Date().toISOString();
  await getStore({ name: 'enquiries', consistency: 'strong' }).setJSON(`${at}-${Math.random().toString(36).slice(2, 7)}`, { ...e, created_at: at });

  try {
    const form = new URLSearchParams({ 'form-name': 'sponsor', ...e });
    await fetch(new URL('/', req.url), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
  } catch (err) { console.log('form forward failed', String(err)); }

  return json({ ok: true });
};

export const config = { path: '/api/sponsor', method: ['POST'] };
