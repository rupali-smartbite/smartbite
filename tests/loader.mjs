import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) { if (s === '@netlify/blobs') return { url: new URL('./fake-blobs.mjs', ${JSON.stringify(import.meta.url)}).href, shortCircuit: true }; return next(s, c); }`));
