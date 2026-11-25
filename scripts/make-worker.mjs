// Gera o código de deploy do Worker `docao-crush` (HTML + JS embutidos no script, sem assets separados).
// Uso: npm run build && node scripts/make-worker.mjs [saida]   -> rodar a saída no `execute` da API da Cloudflare.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const out = process.argv[2] || '/tmp/deploy-docao-crush.js';
const js = readFileSync('dist/app.js', 'utf8');
const html = readFileSync('dist/index.html', 'utf8');
const v = createHash('sha256').update(js + html).digest('hex').slice(0, 10);
const worker = `const HTML = ${JSON.stringify(html)};
const JS = ${JSON.stringify(js)};
export default { async fetch(req) {
  const u = new URL(req.url);
  if (u.pathname === '/app.js') return new Response(JS, { headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable' } });
  if (u.pathname === '/health') return new Response('ok ${v}');
  return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
} };`;
const code = `async () => {
const script = ${JSON.stringify(worker)};
const metadata = { main_module: "index.js", compatibility_date: "2026-10-01" };
const form = new FormData();
form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
form.append("index.js", new Blob([script], { type: "application/javascript+module" }), "index.js");
const r = await cloudflare.request({ method: "PUT", path: \`/accounts/\${accountId}/workers/scripts/docao-crush\`, body: form });
let sub = null; try { sub = await cloudflare.request({ method: "POST", path: \`/accounts/\${accountId}/workers/scripts/docao-crush/subdomain\`, body: { enabled: true } }); } catch (e) { sub = String(e.message || e); }
return { ok: r.success, errors: r.errors, etag: r.result && r.result.etag, sub: sub && sub.success !== undefined ? sub.success : sub, v: "${v}" };
}`;
writeFileSync(out, code);
console.log(out, 'versão', v, code.length, 'bytes');
