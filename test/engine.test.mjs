import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine.js';

// monta um jogo com as cores dadas (dígitos 0-5; letras maiúsculas viram especiais: H/V listrado, W embrulhado, B bomba sobre a cor da posição anterior)
function board(rows, extra = {}) {
  const lv = { layout: rows.map((r) => '.'.repeat(r.length)), colors: 6, moves: 10, goals: [{ type: 'score', target: 999999 }], stars: [1, 2, 3], ...extra };
  const g = new Game(lv, 7);
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    const p = g.grid[r][c].p;
    p.sp = null;
    if (/[0-5]/.test(ch)) p.color = +ch;
    else { p.color = 0; p.sp = { H: 'h', V: 'v', W: 'w', B: 'b' }[ch] || null; if (ch === 'B') p.color = -1; }
  }));
  return g;
}
const empties = (g) => { let n = 0; for (let r = 0; r < g.R; r++) for (let c = 0; c < g.C; c++) if (!g.grid[r][c].hole && !g.grid[r][c].p) n++; return n; };

test('acha linha de 3 horizontal e vertical', () => {
  const g = board(['00012', '34523', '14534', '25145', '31252']);
  const m = g.findMatches();
  assert.equal(m.length, 1);
  assert.equal(m[0].size, 3);
  assert.equal(m[0].special, null);
  const g2 = board(['01234', '02345', '03451', '14512', '25123']);
  assert.equal(g2.findMatches()[0].size, 3);
});

test('sem combinação => nenhum match', () => {
  const g = board(['01234', '12340', '23401', '34012', '40123']);
  assert.equal(g.findMatches().length, 0);
});

test('4 em linha cria listrado, L cria embrulhado, 5 cria bomba', () => {
  assert.equal(board(['00001', '12345', '23451', '34512', '45123']).findMatches()[0].special, 'v');
  assert.equal(board(['01234', '02345', '03451', '04512', '25123']).findMatches()[0].special, 'h');
  assert.equal(board(['00012', '01345', '01451', '34512', '45123']).findMatches()[0].special, 'w');
  assert.equal(board(['00000', '12345', '23451', '34512', '45123']).findMatches()[0].special, 'b');
});

test('troca inválida volta e não gasta jogada', () => {
  const g = board(['01234', '12340', '23401', '34012', '40123']);
  const before = g.snap().pieces.map((p) => p.id + ':' + p.r + ':' + p.c).join();
  const res = g.swap([0, 0], [0, 1]);
  assert.equal(res.valid, false);
  assert.equal(res.phases.length, 2);
  assert.equal(g.movesLeft, 10);
  assert.equal(g.snap().pieces.map((p) => p.id + ':' + p.r + ':' + p.c).join(), before);
});

test('jogada válida limpa, cria especial e reabastece o tabuleiro', () => {
  const g = board(['10002', '02345', '23451', '34512', '45123']);
  // troca (1,0)<->(0,0): o 0 de baixo sobe e forma 0000 na primeira linha
  const res = g.swap([1, 0], [0, 0]);
  assert.equal(res.valid, true);
  assert.equal(g.movesLeft, 9);
  const clear = res.phases.find((p) => p.t === 'clear');
  assert.equal(clear.created.length, 1, 'cria listrado');
  assert.equal(empties(g), 0, 'sem buracos depois da queda');
});

test('listrado ativado limpa a linha inteira', () => {
  const g = board(['12345', 'H0012', '23451', '34512', '45123']);
  g.lamaHit = 0;
  const out = g.clearStep([], [[1, 0]], [], null, 0);
  assert.equal(out.effects[0].type, 'row');
  assert.equal(out.cleared.length, 5, 'linha 1 inteira');
});

test('combos: listrado+listrado (cruz), listrado+embrulhado (3 linhas+3 colunas), bomba+cor, bomba+bomba', () => {
  const g = board(['12345', '23451', '3HV12', '45123', '51234', '12345']);
  let res = g.swap([2, 1], [2, 2]);
  assert.equal(res.valid, true);
  let clear = res.phases.find((p) => p.t === 'clear');
  assert.equal(clear.cleared.length, 5 + 6 - 1, 'linha + coluna');

  const g2 = board(['123451', '234512', '345123', '45HW34', '512345', '123451', '234512']);
  res = g2.swap([3, 2], [3, 3]);
  clear = res.phases.find((p) => p.t === 'clear');
  assert.equal(clear.cleared.length, 3 * 6 + 3 * 7 - 9, '3 linhas + 3 colunas');

  const g3 = board(['12345', '23451', '3B212', '45123', '51234']);
  const twos = g3.snap().pieces.filter((p) => p.color === 2).length;
  res = g3.swap([2, 1], [2, 2]);
  clear = res.phases.find((p) => p.t === 'clear');
  assert.equal(clear.cleared.filter((p) => p.color === 2).length, twos, 'some com todas as peças da cor 2');
  assert.equal(clear.effects[0].type, 'bomb');

  const g4 = board(['12345', '23451', '3BB12', '45123', '51234']);
  res = g4.swap([2, 1], [2, 2]);
  clear = res.phases.find((p) => p.t === 'clear');
  assert.equal(clear.cleared.length, 25, 'tabuleiro inteiro');
});

test('bomba + listrado transforma a cor toda em listrados', () => {
  const g = board(['12345', '23451', '3BH12', '45123', '51234']);
  const res = g.swap([2, 1], [2, 2]);
  assert.ok(res.phases.some((p) => p.t === 'convert'));
});

test('cerca leva dano de combinação vizinha, geleia some', () => {
  const lv = { layout: ['.....', '.....', 'gjjj.', '.....', '.....'], colors: 6, moves: 10, goals: [{ type: 'grade' }, { type: 'jelly' }], stars: [0, 1, 2] };
  const g = new Game(lv, 3);
  const set = (r, c, col) => { g.grid[r][c].p.color = col; g.grid[r][c].p.sp = null; };
  const rows = ['01234', '12340', '-555-', '34012', '40123'];
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '-') set(r, c, +ch); }));
  set(2, 4, 1);
  const res = g.clearStep(g.findMatches(), [], [], null, 0);
  assert.ok(res.cleared.some((p) => p.kind === 'grade'));
  assert.equal(g.jellyLeft(), 0);
  assert.equal(g.countKind('grade'), 0);
});

test('lama se espalha quando ninguém limpa lama', () => {
  const lv = { layout: ['.....', '.....', '.....', '.....', 'm....'], colors: 5, moves: 10, goals: [{ type: 'lama' }], stars: [0, 1, 2] };
  const g = new Game(lv, 3);
  const n0 = g.countKind('lama');
  const mv = g.findMoves().find((m) => m.a[0] < 2 && m.b[0] < 2) || g.findMoves()[0];
  g.swap(mv.a, mv.b);
  assert.ok(g.countKind('lama') >= n0);
});

test('trufa chega no fundo e conta no objetivo', () => {
  const lv = { layout: ['...', '...', '...'], colors: 5, moves: 10, goals: [{ type: 'ingr', n: 1 }], stars: [0, 1, 2] };
  const g = new Game(lv, 3);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g.grid[r][c].p = g.mk('n', (r * 3 + c) % 5);
  g.grid[0][1].p = g.mk('ingr');
  g.grid[1][1].p = null; g.grid[2][1].p = null;
  g.settleAndCollect([]);
  assert.equal(g.ingrDone, 1);
});
