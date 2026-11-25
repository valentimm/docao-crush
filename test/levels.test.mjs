import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLevel, generateLevel, LEVEL_COUNT } from '../src/levels.js';
import { Game } from '../src/engine.js';
import { playLevel } from '../src/bot.js';

test(`tem pelo menos 100 fases (${LEVEL_COUNT})`, () => { assert.ok(LEVEL_COUNT >= 100); });

test('gerador é determinístico', () => {
  for (const n of [11, 57, 123, 200]) assert.deepEqual(generateLevel(n), generateLevel(n));
});

test('toda fase começa sem combinação pronta e com jogada válida; objetivos coerentes', () => {
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const lv = getLevel(n);
    for (const seed of [1, 2]) {
      const g = new Game(lv, seed);
      assert.equal(g.findMatches().length, 0, `fase ${n} começa com match`);
      assert.ok(g.findMoves(1).length > 0, `fase ${n} sem jogada`);
    }
    assert.ok(lv.moves >= 10 && lv.moves <= 60, `fase ${n} jogadas ${lv.moves}`);
    assert.ok(lv.stars[0] <= lv.stars[1] && lv.stars[1] < lv.stars[2], `fase ${n} estrelas`);
    const g = new Game(lv, 1);
    for (const goal of lv.goals) {
      if (goal.type === 'jelly') assert.ok(g.jellyLeft() > 0, `fase ${n} sem geleia`);
      if (goal.type === 'grade') assert.ok(g.countKind('grade') > 0, `fase ${n} sem cerca`);
      if (goal.type === 'lama') assert.ok(g.countKind('lama') > 0, `fase ${n} sem lama`);
      if (goal.type === 'collect') assert.ok(goal.color < lv.colors && goal.n > 0);
    }
  }
});

test('objetivos alcançáveis: o robô guloso vence fases de amostra', () => {
  for (let n = 1; n <= LEVEL_COUNT; n += 9) {
    const lv = getLevel(n);
    const won = [11, 22, 33, 44].some((s) => playLevel(lv, s).won);
    assert.ok(won, `robô não venceu a fase ${n}`);
  }
});
