// Robô guloso: testa cada jogada válida numa cópia e escolhe a que mais avança os objetivos.
import { Game } from './engine.js';
import { makeRng } from './rng.js';

function ingrDepth(g) {
  let d = 0;
  for (let r = 0; r < g.R; r++) for (let c = 0; c < g.C; c++) { const p = g.grid[r][c].p; if (p && p.kind === 'ingr') d += r; }
  return d;
}

export function botMove(game, rng) {
  const moves = game.findMoves();
  let best = null, bestV = -Infinity;
  for (const m of moves) {
    const g = game.clone(rng.int(1e9));
    const p0 = g.progress(), s0 = g.score, d0 = ingrDepth(g);
    const res = g.swap(m.a, m.b);
    if (!res || !res.valid) continue;
    const v = (g.progress() - p0) * 1000 + (g.score - s0) * 0.02 + (g.isWon() ? 1e6 : 0) + (ingrDepth(g) - d0) * 30 + rng() * 5;
    if (v > bestV) { bestV = v; best = m; }
  }
  return best;
}

export function playLevel(level, seed = 1, extraMoves = 0) {
  const rng = makeRng(seed * 7 + 3);
  const game = new Game({ ...level, moves: level.moves + extraMoves }, seed);
  let used = 0;
  while (!game.isWon() && game.movesLeft > 0) {
    const m = botMove(game, rng);
    if (!m) break;
    game.swap(m.a, m.b);
    used++;
  }
  const won = game.isWon();
  if (won) game.bonus();
  return { won, used, score: game.score, stars: game.stars(), movesLeftAtWin: level.moves + extraMoves - used };
}
