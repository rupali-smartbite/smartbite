import { getStore } from '@netlify/blobs';
import { sameSite, limit, deny } from '../lib/guard.mjs';
import { checkSubmission } from '../lib/community.mjs';

// POST /api/submit-product  { barcode?, brand?, name?, front: dataURL, back?: dataURL, read?: {...} }
// A person who found a product missing sends photos of the pack. It waits in the owner's
// admin panel until approved. No name, phone number or IP address is stored.
export default async (req, context) => {
  if (!sameSite(req)) return deny(403, 'Not allowed.');
  if (!(await limit(context, req, 'submit', 8, 86400))) return deny(429, 'Thank you! You have sent a lot today. Please try again tomorrow.');
  let b;
  try { const raw = await req.text(); if (raw.length > 1_600_000) return deny(413, 'Photos are too big.'); b = JSON.parse(raw); } catch { return deny(400, 'Bad request.'); }
  const c = checkSubmission(b);
  if (!c.ok) return deny(400, c.error);
  const id = Date.now().toString(36).padStart(9, '0') + '-' + Math.random().toString(36).slice(2, 8);
  await getStore({ name: 'submission-photos', consistency: 'strong' }).setJSON(id, c.photos);
  await getStore({ name: 'submissions', consistency: 'strong' }).setJSON(id, { ...c.meta, status: 'new', created_at: new Date().toISOString() });
  return Response.json({ ok: true, id }, { headers: { 'Cache-Control': 'no-store' } });
};

export const config = { path: '/api/submit-product', method: ['POST'] };
