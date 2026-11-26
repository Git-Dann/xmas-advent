/**
 * API-driven Pages deploy for environments without a Cloudflare API token (used for the first
 * deploy from a cloud session). Normal deploys use `npm run deploy:production` (wrangler).
 *
 *   PAGES_UPLOAD_JWT=<token from GET /pages/projects/:name/upload-token> node scripts/deploy-api.mjs assets
 *     Uploads dist/ (public files only) and writes node_modules/.tmp/manifest.json
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const API = 'https://api.cloudflare.com/client/v4';
const jwt = process.env.PAGES_UPLOAD_JWT;
if (!jwt) throw new Error('PAGES_UPLOAD_JWT is required');
const SKIP = new Set(['_headers', '_routes.json', '_redirects', '_worker.js']);
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.m4a': 'audio/mp4', '.glb': 'model/gltf-binary', '.txt': 'text/plain' };

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

async function call(path, body) {
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(`${path} ${res.status} ${JSON.stringify(json.errors ?? json).slice(0, 300)}`);
  return json.result;
}

const files = walk('dist').filter((f) => !SKIP.has(relative('dist', f)));
const entries = files.map((file) => {
  const base64 = readFileSync(file).toString('base64');
  const ext = extname(file);
  const hash = createHash('sha256').update(base64 + ext.slice(1)).digest('hex').slice(0, 32);
  return { path: '/' + relative('dist', file).split('\\').join('/'), hash, base64, contentType: TYPES[ext] ?? 'application/octet-stream' };
});
const missing = new Set(await call('/pages/assets/check-missing', { hashes: entries.map((e) => e.hash) }));
const toUpload = entries.filter((e) => missing.has(e.hash));
let batch = [];
let size = 0;
const flush = async () => {
  if (!batch.length) return;
  await call('/pages/assets/upload', batch.map((e) => ({ key: e.hash, value: e.base64, metadata: { contentType: e.contentType }, base64: true })));
  batch = [];
  size = 0;
};
for (const e of toUpload) {
  if (size + e.base64.length > 20_000_000 || batch.length >= 500) await flush();
  batch.push(e);
  size += e.base64.length;
}
await flush();
await call('/pages/assets/upsert-hashes', { hashes: entries.map((e) => e.hash) });
const manifest = Object.fromEntries(entries.map((e) => [e.path, e.hash]));
writeFileSync('node_modules/.tmp/manifest.json', JSON.stringify(manifest));
console.log(`Uploaded ${toUpload.length} of ${entries.length} files. Manifest written.`);
