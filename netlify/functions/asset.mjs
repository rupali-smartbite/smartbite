import { getStore } from '@netlify/blobs';
import { safeEqual } from '../lib/guard.mjs';

// GET  /api/asset/:name -> serves a stored design asset (AI-made meal photos meal-N and hero banners hero-N)
// POST /api/asset/:name -> owner-only upload, images up to 400 KB. Needs the x-asset-key header to match
// the ASSET_UPLOAD_KEY environment variable set in Netlify (Site configuration > Environment variables).
// No key in the code: when the variable is not set, uploads are switched off completely.
const NAMES = new Set(['fruit-pattern']);

export default async (req, context) => {
  const name = String(context.params.name || '');
  if (!NAMES.has(name) && !/^(meal|hero)-\d{1,3}$/.test(name)) return new Response('Not found', { status: 404 });
  const st = getStore({ name: 'assets', consistency: 'strong' });
  if (req.method === 'POST') {
    const key = Netlify.env.get('ASSET_UPLOAD_KEY');
    if (!key || !safeEqual(req.headers.get('x-asset-key'), key)) return new Response('Forbidden', { status: 403 });
    const type = req.headers.get('content-type') || '';
    if (!/^image\/(webp|png|jpeg)$/.test(type)) return new Response('Images only', { status: 415 });
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 400000) return new Response('Too large', { status: 413 });
    await st.set(name, buf, { metadata: { type } });
    return Response.json({ ok: true, bytes: buf.byteLength });
  }
  const r = await st.getWithMetadata(name, { type: 'arrayBuffer' });
  if (!r) return new Response('Not uploaded yet', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return new Response(r.data, { headers: { 'Content-Type': r.metadata.type || 'image/webp', 'Cache-Control': 'public, max-age=3600', 'Netlify-CDN-Cache-Control': 'public, s-maxage=604800' } });
};

export const config = { path: '/api/asset/:name', method: ['GET', 'POST'] };
