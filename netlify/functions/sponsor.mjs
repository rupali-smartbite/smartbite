import { getStore } from '@netlify/blobs';
import { resolveMx, resolve4 } from 'node:dns/promises';
import { json } from '../lib/off.mjs';
import { sameSite, limit, deny } from '../lib/guard.mjs';
import { checkEnquiry } from '../../public/js/validate.js';

// POST /api/sponsor { company, contact_name, email, phone_type, phone, budget, message }
// Every field is required and checked again here (the same rules as the form), so the
// checks cannot be skipped. The email's domain must really exist and accept mail.
// Saves the enquiry in Netlify Blobs (store "enquiries") and submits it to the Netlify
// form "sponsor", whose email notifications send it to the owner's Gmail.

async function domainAcceptsMail(domain) {
  try { const mx = await resolveMx(domain); if (mx && mx.length) return true; } catch {}
  try { const a = await resolve4(domain); return !!(a && a.length); } catch {}
  return false;
}

export default async (req, context) => {
  if (!sameSite(req)) return deny(403, 'Please use the SmartBite app.');
  if (!(await limit(context, req, 'sponsor', 5, 86400))) return deny(429, 'We have your enquiry. Please try again tomorrow.');
  let b = {};
  try { b = await req.json(); } catch {}
  if (b['bot-field']) return json({ ok: true }); // honeypot: bots fill hidden fields

  const { ok, errors, clean } = checkEnquiry(b);
  if (!ok) return json({ ok: false, errors, error: Object.values(errors)[0] }, 400);
  const domain = clean.email.split('@')[1];
  if (!(await domainAcceptsMail(domain))) {
    return json({ ok: false, errors: { email: `The email domain "${domain}" does not exist or cannot receive email. Please check it.` }, error: 'Please check the email address.' }, 400);
  }

  const at = new Date().toISOString();
  const e = { ...clean, created_at: at };
  await getStore({ name: 'enquiries', consistency: 'strong' }).setJSON(`${at}-${Math.random().toString(36).slice(2, 7)}`, e);

  try {
    const form = new URLSearchParams({ 'form-name': 'sponsor', ...e });
    await fetch(new URL('/', req.url), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
  } catch (err) { console.log('form forward failed', String(err)); }

  return json({ ok: true });
};

export const config = { path: '/api/sponsor', method: ['POST'] };
