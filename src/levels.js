// Fases do Docão Crush: 10 tutoriais feitas à mão + gerador determinístico (seed por número da fase).
import { makeRng, hashSeed } from './rng.js';
import { MOVE_ADJ, VARIANT } from './tuning.js';

export const LEVEL_COUNT = 200;

export const EPISODES = [
  { name: 'Chiqueiro do Docão', color: '#f7a8c4' },
  { name: 'Milharal Dourado', color: '#f5d76e' },
  { name: 'Galinheiro Maluco', color: '#fff1c9' },
  { name: 'Horta do Pimentão', color: '#9fdc8a' },
  { name: 'Lamaçal Profundo', color: '#c79a6b' },
  { name: 'Churrascaria Cheers', color: '#ff9a76' },
  { name: 'Feira da Berinjela', color: '#c7a2e8' },
  { name: 'Festa no Celeiro', color: '#ffc36b' },
  { name: 'Trufa Perdida', color: '#b58d6e' },
  { name: 'Rodeio do Bacon', color: '#ff8fa3' },
  { name: 'Pomar Encantado', color: '#a8e6cf' },
  { name: 'Moinho Ventania', color: '#9cc9f5' },
  { name: 'Brejo do Sapão', color: '#7fcf9c' },
  { name: 'Quermesse Junina', color: '#ffd166' },
];
export const LEVELS_PER_EPISODE = 15;
export const episodeOf = (n) => EPISODES[Math.floor((n - 1) / LEVELS_PER_EPISODE) % EPISODES.length];

const FULL8 = Array(8).fill('........');

function rows(...r) { return r; }

const HAND = [
  { moves: 20, colors: 5, layout: FULL8, goals: [{ type: 'score', target: 3000 }],
    tip: 'Arraste uma peça pro lado pra formar 3 iguais em linha!' },
  { moves: 20, colors: 5, layout: FULL8, goals: [{ type: 'collect', color: 0, n: 18 }],
    tip: 'Colete o bacon que o Docão tá com fome. Combine bacons!' },
  { moves: 18, colors: 5, layout: rows('x......x', '........', '........', '........', '........', '........', '........', 'x......x'), goals: [{ type: 'score', target: 6000 }],
    tip: '4 em linha vira um LISTRADO: ele limpa a linha ou coluna inteira.' },
  { moves: 22, colors: 5, layout: rows('........', '........', '..jjjj..', '.jjjjjj.', '.jjjjjj.', '..jjjj..', '........', '........'), goals: [{ type: 'jelly' }],
    tip: 'Faça combinações em cima da GELEIA rosa até ela sumir.' },
  { moves: 22, colors: 5, layout: FULL8, goals: [{ type: 'collect', color: 1, n: 20 }, { type: 'collect', color: 2, n: 20 }],
    tip: 'Combinação em L ou T vira um EMBRULHADO: explode tudo em volta (3x3).' },
  { moves: 25, colors: 5, layout: FULL8, goals: [{ type: 'ingr', n: 2 }], ingrMax: 2,
    tip: 'Leve as TRUFAS até a última linha. Limpe as peças embaixo delas!' },
  { moves: 24, colors: 5, layout: rows('xx....xx', 'x......x', '........', '........', '........', '........', 'x......x', 'xx....xx'), goals: [{ type: 'score', target: 9000 }],
    tip: '5 em linha vira a BOMBA DOCÃO. Troque com uma peça pra sumir com todas daquela cor!' },
  { moves: 25, colors: 5, layout: rows('........', '........', '........', '........', 'gggggggg', '........', '........', '........'), goals: [{ type: 'grade' }],
    tip: 'CERCAS não se mexem. Faça combinações do lado delas pra quebrar.' },
  { moves: 25, colors: 5, layout: rows('........', '........', '..k..k..', '...kk...', '...kk...', '..k..k..', '........', '........'), goals: [{ type: 'score', target: 8000 }],
    tip: 'Peças com CORRENTE não podem ser trocadas. Combine com elas pra soltar.' },
  { moves: 26, colors: 5, layout: rows('........', '........', '........', '........', '........', '........', '..m..m..', 'mmm..mmm'), goals: [{ type: 'lama' }],
    tip: 'A LAMA se espalha se você não limpar nenhuma numa jogada. Ataque sem dó!' },
];

// ---------- gerador ----------
function shapeMask(rng, kind, R, C) {
  const m = Array.from({ length: R }, () => Array(C).fill(true));
  const mid = (C - 1) / 2, midR = (R - 1) / 2;
  const set = (r, c, v) => { if (r >= 0 && c >= 0 && r < R && c < C) { m[r][c] = v; m[r][C - 1 - c] = v; } };
  switch (kind) {
    case 'cantos': { const k = rng.range(1, 2); for (let r = 0; r < k; r++) for (let c = 0; c < k - r; c++) { set(r, c, false); set(R - 1 - r, c, false); } break; }
    case 'diamante': { const k = Math.floor((R + C) / 2) - 1; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (Math.abs(r - midR) + Math.abs(c - mid) > k - 1) m[r][c] = false; break; }
    case 'ampulheta': { for (let r = 0; r < R; r++) { const d = Math.floor(Math.min(r, R - 1 - r, Math.abs(r - midR)) * 0); const w = Math.round(Math.abs(r - midR) < 1.5 ? 1 : 0) + d; for (let c = 0; c < w; c++) set(r, c, false); } break; }
    case 'focinho': { const r0 = Math.floor(midR) - 1; for (const cc of [Math.floor(mid) - 1]) { set(r0 + 1, cc, false); set(r0 + 2, cc, false); } break; }
    case 'ilhas': { const c0 = Math.floor(mid); for (let r = 0; r < R; r++) if (r % 3 !== 1) { m[r][c0] = false; if (C % 2 === 0) m[r][c0 + 1] = false; } break; }
    case 'moldura': { const r0 = Math.floor(midR), c0 = Math.floor(mid); m[r0][c0] = m[r0 + 1][c0] = false; m[r0][C - 1 - c0] = m[r0 + 1][C - 1 - c0] = false; break; }
    case 'aleatorio': { const n = rng.range(2, 5); for (let i = 0; i < n; i++) set(rng.range(1, R - 2), rng.range(0, Math.floor(mid)), false); break; }
    case 'escada': { for (let r = 0; r < R; r++) { const w = Math.max(0, Math.floor((R - 1 - r) / 3)); for (let c = 0; c < w; c++) m[r][c] = false; for (let c = 0; c < Math.floor(r / 3); c++) m[r][C - 1 - c] = false; } break; }
    case 'cruz': { const k = rng.range(1, 2); for (let r = 0; r < k; r++) for (let c = 0; c < k; c++) { set(r, c, false); set(R - 1 - r, c, false); } break; }
    default: break;
  }
  // garante que cada linha/coluna não fique isolada demais
  return m;
}

const SHAPES_EARLY = ['cheio', 'cheio', 'cantos', 'focinho', 'cruz'];
const SHAPES_ALL = ['cheio', 'cantos', 'diamante', 'focinho', 'ilhas', 'moldura', 'aleatorio', 'escada', 'cruz', 'ampulheta'];

export function generateLevel(n, variant = 0) {
  const rng = makeRng(variant ? hashSeed('docao-crush', n, variant) : hashSeed('docao-crush', n));
  const t = Math.min(1, Math.max(0, (n - 10) / 190)); // 0..1
  const mod = n % 10;
  const hard = mod === 0 || mod === 5;
  const easy = mod === 1 || mod === 6;
  const R = rng.pick(t < 0.2 ? [8, 8, 9] : [7, 8, 8, 9, 9]);
  const C = rng.pick(t < 0.2 ? [8, 8, 9] : [7, 8, 8, 9, 9]);
  const shape = rng.pick(n < 40 ? SHAPES_EARLY : SHAPES_ALL);
  const mask = shapeMask(rng, shape, R, C);
  const cellsList = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (mask[r][c]) cellsList.push([r, c]);
  const ncell = cellsList.length;
  const grid = mask.map((row) => row.map((v) => (v ? '.' : 'x')));

  const feats = ['score', 'collect'];
  if (n >= 11) feats.push('jelly', 'jelly');
  if (n >= 15) feats.push('ingr');
  if (n >= 45) feats.push('grade', 'lama');
  let goalType = rng.pick(feats);
  if (n === 11) goalType = 'jelly';
  if (n === 15) goalType = 'ingr';

  let colors = 5;
  if (n >= 25 && rng() < 0.15 + t * 0.35 && ncell >= 60 && !easy) colors = 6;
  if (easy && n > 60 && rng() < 0.3) colors = 4;

  const blockerFrac = (n < 20 ? 0 : 0.04 + t * 0.14) * (hard ? 1.4 : easy ? 0.5 : 1);
  const free = () => cellsList.filter(([r, c]) => grid[r][c] === '.');
  const bottomRow = (r, c) => { for (let k = r + 1; k < R; k++) if (mask[k][c]) return false; return true; };

  // cercas: faixas horizontais ou blocos
  let nGrade = n >= 20 ? Math.round(ncell * blockerFrac * (rng() < 0.5 ? 1 : 0.6)) : 0;
  if (goalType === 'grade') nGrade = Math.max(nGrade, Math.round(ncell * (0.12 + t * 0.12)));
  if (nGrade) {
    const band = rng.range(Math.floor(R / 2), R - 2);
    let placed = 0;
    const off = rng.int(3);
    const rowCount = (r) => grid[r].filter((x) => x === 'g' || x === 'G' || x === 'x').length;
    for (const [r, c] of cellsList) if (r === band && placed < nGrade && grid[r][c] === '.' && (c + off) % 3 !== 0) { grid[r][c] = n > 70 && rng() < 0.35 + t * 0.3 ? 'G' : 'g'; placed++; }
    const pool = free().filter(([r, c]) => r >= 2 && !(goalType === 'ingr' && bottomRow(r, c)));
    while (placed < nGrade && pool.length) {
      const [r, c] = pool.splice(rng.int(pool.length), 1)[0];
      if (rowCount(r) >= C - 3) continue;
      grid[r][c] = n > 70 && rng() < 0.3 + t * 0.3 ? 'G' : 'g'; placed++;
    }
  }
  // lama
  let nLama = n >= 40 ? Math.round(ncell * blockerFrac * 0.5) : 0;
  if (goalType === 'lama') nLama = Math.max(nLama, Math.round(ncell * (0.08 + t * 0.1)));
  if (nLama) {
    const pool = free().filter(([r, c]) => r >= R - 3 && !(goalType === 'ingr' && bottomRow(r, c)));
    for (let i = 0; i < nLama && pool.length; i++) { const [r, c] = pool.splice(rng.int(pool.length), 1)[0]; grid[r][c] = 'm'; }
  }
  // geleia
  if (goalType === 'jelly') {
    const frac = Math.min(1, 0.35 + t * 0.6 + (hard ? 0.1 : 0));
    const pool = free();
    const k = Math.round(pool.length * frac);
    // escolhe um bloco simétrico: ordena por distância ao centro
    const cr = (R - 1) / 2, cc = (C - 1) / 2;
    const style = rng.int(3);
    pool.sort((a, b) => {
      const d = (p) => style === 0 ? Math.abs(p[0] - cr) + Math.abs(p[1] - cc) : style === 1 ? -p[0] + Math.abs(p[1] - cc) * 0.1 : Math.abs(p[1] - cc) * 2 + Math.abs(p[0] - cr) * 0.3;
      return d(a) - d(b);
    });
    for (let i = 0; i < k; i++) { const [r, c] = pool[i]; grid[r][c] = n > 50 && rng() < t * 0.8 ? 'J' : 'j'; }
  }
  // correntes
  let nLock = n >= 30 ? Math.round(ncell * blockerFrac * 0.6) : 0;
  if (nLock) {
    const pool = cellsList.filter(([r, c]) => grid[r][c] === '.' || grid[r][c] === 'j');
    for (let i = 0; i < nLock && pool.length; i++) { const [r, c] = pool.splice(rng.int(pool.length), 1)[0]; grid[r][c] = grid[r][c] === 'j' ? 'K' : 'k'; }
  }
  const layout = grid.map((row) => row.join(''));
  const nBlock = layout.join('').replace(/[^gGm]/g, '').length;
  const jellyN = layout.join('').replace(/[^jJK]/g, '').length + layout.join('').replace(/[^J]/g, '').length;

  // jogadas e metas (calibradas com o robô guloso de scripts/sim.mjs)
  const diff = (hard ? 1.25 : easy ? 0.8 : 1) * (1 + t * 0.5);
  let moves, goals;
  const colorF = colors === 6 ? 1.25 : colors === 4 ? 0.8 : 1;
  if (goalType === 'score') {
    moves = rng.range(18, 28);
    const target = Math.round((moves * (380 + 260 * t) * (hard ? 1.2 : easy ? 0.8 : 1) / colorF) / 500) * 500;
    goals = [{ type: 'score', target }];
  } else if (goalType === 'collect') {
    const k = n < 30 ? rng.range(1, 2) : rng.range(1, 3);
    const cs = [];
    while (cs.length < k) { const c = rng.int(colors); if (!cs.includes(c)) cs.push(c); }
    const per = Math.round((14 + 22 * t) * (hard ? 1.15 : easy ? 0.85 : 1) / 5) * 5;
    goals = cs.map((c) => ({ type: 'collect', color: c, n: per }));
    moves = Math.round((per * (0.75 + 0.2 * k)) / (1.25 * diff / (1 + t * 0.5)) * colorF * 0.9) + 4;
  } else if (goalType === 'jelly') {
    goals = [{ type: 'jelly' }];
    moves = Math.round(10 + jellyN * 0.42 * colorF / diff * (1 + t * 0.3)) + nBlock * 0.2 | 0;
  } else if (goalType === 'ingr') {
    const k = Math.min(6, 2 + Math.floor(t * 4) + (hard ? 1 : 0));
    goals = [{ type: 'ingr', n: k }];
    moves = Math.round((12 + k * 7) * colorF / diff * (1 + t * 0.3)) + Math.round(nBlock * 0.25);
  } else if (goalType === 'grade') {
    goals = [{ type: 'grade' }];
    moves = Math.round(12 + nBlock * 0.9 * colorF / diff * (1 + t * 0.4));
  } else {
    goals = [{ type: 'lama' }];
    moves = Math.round(14 + nBlock * 1.3 * colorF / diff * (1 + t * 0.4));
  }
  moves = Math.max(12, Math.min(50, moves));
  return { n, layout, colors, moves, goals, ingrMax: 2, shape, hard };
}

function withStars(lv) {
  const score = lv.goals.find((g) => g.type === 'score');
  let cells = 0;
  for (const row of lv.layout) for (const ch of row) if (ch !== 'x') cells++;
  const base = score ? score.target : Math.round((lv.moves * 260 + cells * 40) / 500) * 500;
  lv.stars = score ? [base, Math.round(base * 1.6 / 500) * 500, Math.round(base * 2.4 / 500) * 500]
    : [0, base, Math.round(base * 1.7 / 500) * 500];
  return lv;
}

const cache = new Map();
export function getLevel(n, raw = false, variant = null) {
  if (!raw && cache.has(n)) return cache.get(n);
  let lv;
  if (n <= HAND.length) lv = { n, ingrMax: 2, ...HAND[n - 1], hard: false };
  else lv = generateLevel(n, variant ?? (raw ? 0 : VARIANT[n] || 0));
  lv.episode = episodeOf(n).name;
  if (!raw && MOVE_ADJ[n]) lv.moves += MOVE_ADJ[n];
  withStars(lv);
  if (!raw) cache.set(n, lv);
  return lv;
}
