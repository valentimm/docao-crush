// Afinação da curva de dificuldade: ajusta as jogadas de cada fase até o robô guloso
// vencer na taxa-alvo (fácil no começo, mais difícil no fim; fases "difíceis" a cada 5).
// Gera src/tuning.js. Uso: node scripts/tune.mjs
import { writeFileSync } from 'node:fs';
import { getLevel, LEVEL_COUNT } from '../src/levels.js';
import { playLevel } from '../src/bot.js';
const SEEDS = [11, 22, 33, 44];
const adj = {};
const variants = {};
const rate = (lv, extra) => SEEDS.filter((s) => playLevel(lv, s, extra).won).length;
for (let n = 1; n <= LEVEL_COUNT; n++) {
  let lv, extra, w, need, v = 0;
  for (; v < 8; v++) {
  lv = getLevel(n, true, v);
  const t = Math.min(1, (n - 1) / 199);
  need = n <= 10 ? 4 : t < 0.35 ? 3 : t < 0.75 ? 3 : 2;
  if (lv.hard && n > 10) need = Math.max(1, need - 1);
  extra = 0; w = rate(lv, 0);
  while (w < need && lv.moves + extra < 46) { extra += 3; w = rate(lv, extra); }
  while (w >= 4 && n > 10 && lv.moves + extra > 14 && extra > -10) {
    const w2 = rate(lv, extra - 2);
    if (w2 < need + (t < 0.5 ? 1 : 0)) break;
    extra -= 2; w = w2;
  }
  if (w >= need || n <= 10) break;
  }
  if (v >= 8) v = 7;
  if (v) variants[n] = v;
  if (extra) adj[n] = extra;
  console.log(n, 'v' + v, lv.goals.map((g) => g.type).join('+'), lv.moves, '->', lv.moves + extra, `${w}/4`);
}
writeFileSync(new URL('../src/tuning.js', import.meta.url), `// Gerado por scripts/tune.mjs: ajuste de jogadas por fase (calibrado com o robô guloso).\nexport const MOVE_ADJ = ${JSON.stringify(adj)};\nexport const VARIANT = ${JSON.stringify(variants)};\n`);
