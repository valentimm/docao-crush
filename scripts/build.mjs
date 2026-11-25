// Build estático: dist/index.html (CSS embutido) + dist/app.js (bundle esbuild).
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
mkdirSync('dist', { recursive: true });
await build({ entryPoints: ['src/main.js'], bundle: true, format: 'esm', minify: true, target: 'es2019', outfile: 'dist/app.js', logLevel: 'warning' });
const js = readFileSync('dist/app.js', 'utf8');
const v = createHash('sha256').update(js).digest('hex').slice(0, 10);
const html = readFileSync('index.html', 'utf8')
  .replace('<link rel="stylesheet" href="./style.css">', `<style>${readFileSync('style.css', 'utf8')}</style>`)
  .replace('<script type="module" src="./src/main.js"></script>', `<script type="module" src="./app.js?v=${v}"></script>`);
writeFileSync('dist/index.html', html);
console.log('dist/index.html', html.length, 'dist/app.js', js.length, 'v', v);
