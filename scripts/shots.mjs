// Screenshots headless (menu, mapa, fase em andamento). Uso: node scripts/shots.mjs <url> <pasta>
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
const url = process.argv[2] || 'http://localhost:8787/';
const out = process.argv[3] || '/workspace/docao-crush-shots';
const base = homedir() + '/.cache/ms-playwright/';
const dir = readdirSync(base).find((d) => d.startsWith('chromium-'));
const exe = `${base}${dir}/chrome-linux64/chrome`;
const b = await chromium.launch({ executablePath: process.env.CHROME || exe });
const errors = [];
async function page(vp) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return p;
}
const d = await page({ width: 1280, height: 860 });
await d.goto(url); await d.waitForTimeout(800);
await d.screenshot({ path: `${out}/01-menu-desktop.png` });
await d.click('#btnPlay', { force: true }); await d.waitForTimeout(600);
await d.screenshot({ path: `${out}/02-mapa.png` });
await d.click('.node.cur', { force: true }); await d.waitForTimeout(500);
await d.screenshot({ path: `${out}/03-intro-fase.png` });
await d.click('#mGo', { force: true }); await d.waitForTimeout(3200);
// joga algumas jogadas com a dica do jogo
for (let i = 0; i < 4; i++) {
  await d.evaluate(async () => {
    const g = window.__crush.game; const h = g.hint(); if (!h) return;
    const cv = document.getElementById('board'); const r = cv.getBoundingClientRect(); const cell = window.__crush.view.cell;
    const pt = ([rr, cc]) => ({ clientX: r.left + (cc + 0.5) * cell, clientY: r.top + (rr + 0.5) * cell, pointerId: 1, bubbles: true });
    cv.dispatchEvent(new PointerEvent('pointerdown', pt(h.a)));
    cv.dispatchEvent(new PointerEvent('pointermove', pt(h.b)));
  });
  await d.waitForTimeout(1800);
}
await d.screenshot({ path: `${out}/04-fase1-jogando.png` });
// fase avançada com bloqueios
await d.evaluate(() => { window.__crush.unlockAll(); window.__crush.startLevel(57); });
await d.waitForTimeout(1800);
await d.evaluate(() => {
  const g = window.__crush.game; const h = g.hint();
  const cv = document.getElementById('board'); const r = cv.getBoundingClientRect(); const cell = window.__crush.view.cell;
  const pt = ([rr, cc]) => ({ clientX: r.left + (cc + 0.5) * cell, clientY: r.top + (rr + 0.5) * cell, pointerId: 1, bubbles: true });
  cv.dispatchEvent(new PointerEvent('pointerdown', pt(h.a))); cv.dispatchEvent(new PointerEvent('pointermove', pt(h.b)));
});
await d.waitForTimeout(350);
await d.screenshot({ path: `${out}/05-fase57-cascata.png` });
await d.waitForTimeout(2500);
await d.evaluate(() => window.__crush.startLevel(142));
await d.waitForTimeout(1800);
await d.screenshot({ path: `${out}/06-fase142.png` });
// celular
const m = await page({ width: 390, height: 844 });
await m.goto(url); await m.waitForTimeout(600);
await m.screenshot({ path: `${out}/07-menu-celular.png` });
await m.evaluate(() => { window.__crush.unlockAll(); window.__crush.startLevel(23); });
await m.waitForTimeout(2200);
await m.screenshot({ path: `${out}/08-fase23-celular.png` });
// vitória e derrota
await m.evaluate(async () => { const g = window.__crush.game; g.score = 0; g.goals = [{ type: 'score', target: 1 }]; g.movesLeft = 6; });
await m.evaluate(async () => {
  const g = window.__crush.game; const h = g.hint();
  const cv = document.getElementById('board'); const r = cv.getBoundingClientRect(); const cell = window.__crush.view.cell;
  const pt = ([rr, cc]) => ({ clientX: r.left + (cc + 0.5) * cell, clientY: r.top + (rr + 0.5) * cell, pointerId: 1, bubbles: true });
  cv.dispatchEvent(new PointerEvent('pointerdown', pt(h.a))); cv.dispatchEvent(new PointerEvent('pointermove', pt(h.b)));
});
await m.waitForTimeout(9000);
await m.screenshot({ path: `${out}/09-vitoria-celular.png` });
await m.evaluate(() => { document.getElementById('modal').classList.add('hidden'); window.__crush.startLevel(40); const g = window.__crush.game; g.movesLeft = 1; });
await m.waitForTimeout(1500);
await m.evaluate(async () => {
  const g = window.__crush.game; const h = g.hint();
  const cv = document.getElementById('board'); const r = cv.getBoundingClientRect(); const cell = window.__crush.view.cell;
  const pt = ([rr, cc]) => ({ clientX: r.left + (cc + 0.5) * cell, clientY: r.top + (rr + 0.5) * cell, pointerId: 1, bubbles: true });
  cv.dispatchEvent(new PointerEvent('pointerdown', pt(h.a))); cv.dispatchEvent(new PointerEvent('pointermove', pt(h.b)));
});
await m.waitForTimeout(4000);
await m.screenshot({ path: `${out}/10-derrota-celular.png` });
await b.close();
console.log(errors.length ? 'ERROS:\n' + errors.join('\n') : 'sem erros no console');
