// Calibração: roda o robô guloso em várias fases e mostra taxa de vitória. Uso: node scripts/sim.mjs [de] [ate] [seeds]
import { getLevel } from '../src/levels.js';
import { playLevel } from '../src/bot.js';
const [from = 1, to = 200, seeds = 3] = process.argv.slice(2).map(Number);
const t0 = Date.now();
let tw = 0, tn = 0;
const band = {};
for (let n = from; n <= to; n++) {
  const lv = getLevel(n);
  let w = 0, st = 0, ml = 0;
  for (let s = 1; s <= seeds; s++) { const r = playLevel(lv, s); if (r.won) { w++; st += r.stars; ml += r.movesLeftAtWin; } }
  tw += w; tn += seeds;
  const b = Math.floor((n - 1) / 25); band[b] = band[b] || [0, 0]; band[b][0] += w; band[b][1] += seeds;
  console.log(String(n).padStart(3), lv.goals.map((g) => g.type).join('+').padEnd(16), 'mv', String(lv.moves).padStart(2), 'cores', lv.colors, 'vit', `${w}/${seeds}`, 'estrelas', w ? (st / w).toFixed(1) : '-', 'sobra', w ? (ml / w).toFixed(1) : '-');
}
console.log('total', `${tw}/${tn}`, Object.entries(band).map(([b, [w, n]]) => `${b * 25 + 1}-${b * 25 + 25}:${Math.round(100 * w / n)}%`).join(' '), (Date.now() - t0) / 1000 + 's');
