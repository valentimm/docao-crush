// Motor do Docão Crush: tabuleiro, combinações, especiais, cascatas, objetivos.
// Puro (sem DOM): cada jogada devolve uma lista de "fases" com snapshot do tabuleiro pra animação.
import { makeRng } from './rng.js';

export const TILE_NAMES = ['Bacon', 'Milho', 'Ovo', 'Pimentão', 'Berinjela', 'Cenoura'];
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];

// Códigos do layout: x buraco · . normal · j/J geleia 1/2 camadas · g/G cerca 1/2 · m lama · k cadeado · K cadeado+geleia
export function parseLayout(layout) {
  const R = layout.length, C = Math.max(...layout.map((l) => l.length));
  const cells = [];
  for (let r = 0; r < R; r++) {
    const row = [];
    for (let c = 0; c < C; c++) {
      const ch = layout[r][c] || 'x';
      row.push({ ch, hole: ch === 'x', jelly: ch === 'j' || ch === 'K' ? 1 : ch === 'J' ? 2 : 0 });
    }
    cells.push(row);
  }
  return { R, C, cells };
}

export class Game {
  constructor(level, seed = 1) {
    this.level = level;
    this.rng = makeRng(seed);
    this.nextId = 1;
    this.ncolors = level.colors;
    const { R, C, cells } = parseLayout(level.layout);
    this.R = R; this.C = C;
    this.grid = cells.map((row) => row.map((c) => ({ hole: c.hole, jelly: c.jelly, p: null, ch: c.ch })));
    this.top = [];
    this.bottom = [];
    for (let c = 0; c < C; c++) {
      let t = -1, b = -1;
      for (let r = 0; r < R; r++) if (!this.grid[r][c].hole) { if (t < 0) t = r; b = r; }
      this.top.push(t); this.bottom.push(b);
    }
    this.goals = level.goals.map((g) => ({ ...g }));
    this.movesLeft = level.moves;
    this.score = 0;
    this.collected = new Array(6).fill(0);
    this.ingrDone = 0;
    this.ingrGoal = (this.goals.find((g) => g.type === 'ingr') || { n: 0 }).n;
    this.ingrMax = level.ingrMax || 2;
    this.ended = false;
    this.fillInitial();
    this.jelly0 = this.jellyLeft();
    this.grade0 = this.countKind('grade');
    this.lama0 = this.countKind('lama');
  }

  // cópia independente (pro robô de testes/simulação)
  clone(seed = 1) {
    const g = Object.create(Game.prototype);
    Object.assign(g, this);
    g.grid = this.grid.map((row) => row.map((c) => ({ ...c, p: c.p ? { ...c.p } : null })));
    g.collected = [...this.collected];
    g.rng = makeRng(seed);
    return g;
  }

  // progresso 0..1 por objetivo (pro robô)
  progress() {
    return this.goalStatus().reduce((s, g) => {
      if (g.done) return s + 1;
      if (g.need) return s + g.have / g.need;
      if (g.type === 'jelly') return s + 1 - g.left / Math.max(1, this.jelly0 || g.left);
      return s + 1 - g.left / Math.max(1, (g.type === 'grade' ? this.grade0 : this.lama0) || g.left);
    }, 0);
  }

  // ---------- peças ----------
  mk(kind, color = -1, sp = null) { return { id: this.nextId++, kind, color, sp, lock: 0, hp: 0 }; }
  randColor() { return this.rng.int(this.ncolors); }
  inside(r, c) { return r >= 0 && c >= 0 && r < this.R && c < this.C && !this.grid[r][c].hole; }
  at(r, c) { return this.inside(r, c) ? this.grid[r][c].p : null; }
  static movable(p) { return !!p && (p.kind === 'n' || p.kind === 'ingr') && !p.lock; }
  static matchable(p) { return !!p && p.kind === 'n' && p.sp !== 'b' && p.color >= 0; }

  fillInitial() {
    for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) {
      const cell = this.grid[r][c];
      if (cell.hole) continue;
      const ch = cell.ch;
      if (ch === 'g' || ch === 'G') { const p = this.mk('grade'); p.hp = ch === 'G' ? 2 : 1; cell.p = p; }
      else if (ch === 'm') cell.p = this.mk('lama');
      else {
        const p = this.mk('n', 0);
        if (ch === 'k' || ch === 'K') p.lock = 1;
        cell.p = p;
      }
    }
    // ingredientes iniciais nas linhas de cima
    if (this.ingrGoal > 0) {
      const want = Math.min(this.ingrMax, this.ingrGoal);
      const cand = [];
      for (let r = 0; r < Math.min(3, this.R); r++) for (let c = 0; c < this.C; c++) {
        const p = this.at(r, c);
        if (p && p.kind === 'n' && !p.lock && r < this.bottom[c]) cand.push([r, c]);
      }
      for (let i = 0; i < want && cand.length; i++) {
        const [r, c] = cand.splice(this.rng.int(cand.length), 1)[0];
        this.grid[r][c].p = this.mk('ingr');
      }
    }
    for (let tries = 0; tries < 200; tries++) {
      this.recolorNoMatches();
      if (this.findMoves(1).length) return;
    }
  }

  recolorNoMatches() {
    for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) {
      const p = this.at(r, c);
      if (!p || p.kind !== 'n' || p.sp) continue;
      const bad = new Set();
      const a1 = this.at(r, c - 1), a2 = this.at(r, c - 2);
      if (Game.matchable(a1) && Game.matchable(a2) && a1.color === a2.color) bad.add(a1.color);
      const b1 = this.at(r - 1, c), b2 = this.at(r - 2, c);
      if (Game.matchable(b1) && Game.matchable(b2) && b1.color === b2.color) bad.add(b1.color);
      let col = this.randColor();
      for (let k = 0; k < 10 && bad.has(col); k++) col = this.randColor();
      if (bad.has(col)) for (let k = 0; k < this.ncolors; k++) if (!bad.has(k)) { col = k; break; }
      p.color = col;
    }
  }

  // ---------- snapshot ----------
  snap() {
    const pieces = [];
    const jelly = [];
    for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) {
      const cell = this.grid[r][c];
      jelly.push(cell.jelly);
      const p = cell.p;
      if (p) pieces.push({ id: p.id, r, c, kind: p.kind, color: p.color, sp: p.sp, lock: p.lock, hp: p.hp });
    }
    return { pieces, jelly, score: this.score, movesLeft: this.movesLeft };
  }

  // ---------- combinações ----------
  findMatches() {
    const runs = [];
    for (let r = 0; r < this.R; r++) {
      let c = 0;
      while (c < this.C) {
        const p = this.at(r, c);
        if (!Game.matchable(p)) { c++; continue; }
        let e = c + 1;
        while (e < this.C && Game.matchable(this.at(r, e)) && this.at(r, e).color === p.color) e++;
        if (e - c >= 3) { const cells = []; for (let k = c; k < e; k++) cells.push([r, k]); runs.push({ dir: 'h', color: p.color, cells }); }
        c = e;
      }
    }
    for (let c = 0; c < this.C; c++) {
      let r = 0;
      while (r < this.R) {
        const p = this.at(r, c);
        if (!Game.matchable(p)) { r++; continue; }
        let e = r + 1;
        while (e < this.R && Game.matchable(this.at(e, c)) && this.at(e, c).color === p.color) e++;
        if (e - r >= 3) { const cells = []; for (let k = r; k < e; k++) cells.push([k, c]); runs.push({ dir: 'v', color: p.color, cells }); }
        r = e;
      }
    }
    // agrupa corridas que compartilham células
    const parent = runs.map((_, i) => i);
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const owner = new Map();
    runs.forEach((run, i) => run.cells.forEach(([r, c]) => {
      const k = r * 64 + c;
      if (owner.has(k)) parent[find(i)] = find(owner.get(k)); else owner.set(k, i);
    }));
    const groups = new Map();
    runs.forEach((run, i) => {
      const g = find(i);
      if (!groups.has(g)) groups.set(g, { runs: [], cells: new Map(), color: run.color });
      const G = groups.get(g);
      G.runs.push(run);
      run.cells.forEach(([r, c]) => G.cells.set(r * 64 + c, [r, c]));
    });
    return [...groups.values()].map((g) => {
      const maxLen = Math.max(...g.runs.map((x) => x.cells.length));
      const hasH = g.runs.some((x) => x.dir === 'h'), hasV = g.runs.some((x) => x.dir === 'v');
      let special = null;
      if (maxLen >= 5) special = 'b';
      else if (hasH && hasV) special = 'w';
      else if (maxLen === 4) special = g.runs[0].dir === 'h' ? 'v' : 'h';
      let inter = null;
      if (hasH && hasV) {
        const hs = new Set(g.runs.filter((x) => x.dir === 'h').flatMap((x) => x.cells.map(([r, c]) => r * 64 + c)));
        for (const x of g.runs.filter((x) => x.dir === 'v')) for (const [r, c] of x.cells) if (hs.has(r * 64 + c)) inter = [r, c];
      }
      const longest = g.runs.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
      const mid = longest.cells[Math.floor((longest.cells.length - 1) / 2)];
      return { color: g.color, cells: [...g.cells.values()], special, size: g.cells.size, anchor: inter || mid };
    });
  }

  // checa se a peça em (r,c) faz linha de 3+
  lineAt(r, c) {
    const p = this.at(r, c);
    if (!Game.matchable(p)) return 0;
    let h = 1, v = 1;
    for (let k = c - 1; Game.matchable(this.at(r, k)) && this.at(r, k).color === p.color; k--) h++;
    for (let k = c + 1; Game.matchable(this.at(r, k)) && this.at(r, k).color === p.color; k++) h++;
    for (let k = r - 1; Game.matchable(this.at(k, c)) && this.at(k, c).color === p.color; k--) v++;
    for (let k = r + 1; Game.matchable(this.at(k, c)) && this.at(k, c).color === p.color; k++) v++;
    let s = 0;
    if (h >= 3) s += h;
    if (v >= 3) s += v;
    return s;
  }

  swapRaw(a, b) {
    const ca = this.grid[a[0]][a[1]], cb = this.grid[b[0]][b[1]];
    const t = ca.p; ca.p = cb.p; cb.p = t;
  }

  // lista de jogadas válidas [{a,b,value}] (limit opcional)
  findMoves(limit = Infinity) {
    const out = [];
    for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        const p = this.at(r, c), q = this.at(r2, c2);
        if (!Game.movable(p) || !Game.movable(q)) continue;
        let value = 0;
        if ((p.sp === 'b' && q.kind === 'n') || (q.sp === 'b' && p.kind === 'n')) value = 50;
        else if (p.sp && q.sp) value = 40;
        else {
          this.swapRaw([r, c], [r2, c2]);
          const v1 = this.lineAt(r, c), v2 = this.lineAt(r2, c2);
          this.swapRaw([r, c], [r2, c2]);
          value = v1 + v2;
          if (value && (p.sp || q.sp)) value += 5;
        }
        if (value) { out.push({ a: [r, c], b: [r2, c2], value }); if (out.length >= limit) return out; }
      }
    }
    return out;
  }

  hint() {
    const mv = this.findMoves();
    if (!mv.length) return null;
    mv.sort((x, y) => y.value - x.value);
    return mv[0];
  }

  // ---------- jogada ----------
  canSwap(a, b) {
    if (this.ended) return false;
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return false;
    return Game.movable(this.at(a[0], a[1])) && Game.movable(this.at(b[0], b[1]));
  }

  swap(a, b) {
    if (!this.canSwap(a, b) || this.movesLeft <= 0) return null;
    const phases = [];
    this.swapRaw(a, b);
    phases.push({ t: 'swap', snap: this.snap() });
    const P = this.at(b[0], b[1]); // peça que o jogador arrastou (agora em b)
    const Q = this.at(a[0], a[1]);
    let combo = null;
    const isSp = (x) => x.kind === 'n' && x.sp;
    if (P.sp === 'b' || Q.sp === 'b') combo = this.comboBomb(P, Q, a, b);
    else if (isSp(P) && isSp(Q)) combo = this.comboSpecial(P, Q, b);
    if (!combo && !this.findMatches().length) {
      this.swapRaw(a, b);
      phases.push({ t: 'swap', back: true, snap: this.snap() });
      return { valid: false, phases };
    }
    this.movesLeft--;
    this.lamaHit = 0;
    this.cascade(phases, combo, [b, a]);
    this.endOfMove(phases);
    return { valid: true, phases };
  }

  // bomba + algo
  comboBomb(P, Q, a, b) {
    const cells = [];
    const effects = [];
    const bombPos = P.sp === 'b' ? b : a;
    const other = P.sp === 'b' ? Q : P;
    const otherPos = P.sp === 'b' ? a : b;
    const bomb = P.sp === 'b' ? P : Q;
    if (other.sp === 'b') {
      bomb.sp = null; other.sp = null;
      for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) if (this.inside(r, c)) cells.push([r, c]);
      effects.push({ type: 'nuke', r: bombPos[0], c: bombPos[1] });
      return { cells, effects };
    }
    if (other.kind !== 'n') return null; // bomba + ingrediente: sem efeito especial, cai no fluxo normal (sem match => volta)
    const color = other.color;
    const targets = [];
    for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) {
      const p = this.at(r, c);
      if (Game.matchable(p) && p.color === color) targets.push([r, c]);
    }
    bomb.sp = null; bomb.color = -1;
    if (other.sp === 'h' || other.sp === 'v' || other.sp === 'w') {
      for (const [r, c] of targets) {
        const p = this.at(r, c);
        if (!p.sp) p.sp = other.sp === 'w' ? 'w' : (this.rng() < 0.5 ? 'h' : 'v');
      }
    }
    effects.push({ type: 'bomb', r: bombPos[0], c: bombPos[1], color, targets: targets.map(([r, c]) => ({ r, c })) });
    cells.push(bombPos, ...targets);
    if (!targets.some(([r, c]) => r === otherPos[0] && c === otherPos[1])) cells.push(otherPos);
    return { cells, effects, convert: other.sp ? this.snap() : null };
  }

  // listrado/embrulhado combinados
  comboSpecial(P, Q, pos) {
    const [r0, c0] = pos;
    const kinds = [P.sp, Q.sp].map((s) => (s === 'w' ? 'w' : 's'));
    P.sp = null; Q.sp = null;
    const cells = [];
    const effects = [];
    const row = (r) => { for (let c = 0; c < this.C; c++) cells.push([r, c]); effects.push({ type: 'row', r, c: c0 }); };
    const col = (c) => { for (let r = 0; r < this.R; r++) cells.push([r, c]); effects.push({ type: 'col', r: r0, c }); };
    if (kinds[0] === 's' && kinds[1] === 's') { row(r0); col(c0); }
    else if (kinds[0] === 'w' && kinds[1] === 'w') {
      for (let r = r0 - 2; r <= r0 + 2; r++) for (let c = c0 - 2; c <= c0 + 2; c++) cells.push([r, c]);
      effects.push({ type: 'blast', r: r0, c: c0, size: 5 });
    } else {
      for (let d = -1; d <= 1; d++) { row(r0 + d); col(c0 + d); }
    }
    cells.push(pos);
    return { cells: cells.filter(([r, c]) => this.inside(r, c)), effects };
  }

  cascade(phases, combo, focus) {
    let step = 0;
    for (let guard = 0; guard < 60; guard++) {
      let res;
      if (step === 0 && combo) {
        if (combo.convert) phases.push({ t: 'convert', snap: this.snap() });
        res = this.clearStep([], combo.cells, combo.effects, focus, step);
      } else {
        const groups = this.findMatches();
        if (!groups.length) break;
        res = this.clearStep(groups, [], [], step === 0 ? focus : null, step);
      }
      phases.push({ t: 'clear', step, ...res, snap: this.snap() });
      this.settleAndCollect(phases);
      step++;
    }
    return step;
  }

  settleAndCollect(phases) {
    for (let k = 0; k < 20; k++) {
      const fall = this.settle();
      if (fall) phases.push({ t: 'fall', spawnFrom: fall, snap: this.snap() });
      const got = [];
      for (let c = 0; c < this.C; c++) {
        const b = this.bottom[c];
        if (b < 0) continue;
        const p = this.grid[b][c].p;
        if (p && p.kind === 'ingr') { got.push({ id: p.id, r: b, c }); this.grid[b][c].p = null; this.ingrDone++; this.score += 1000; }
      }
      if (!got.length) break;
      phases.push({ t: 'collect', got, popups: got.map((g) => ({ r: g.r, c: g.c, v: 1000 })), snap: this.snap() });
    }
  }

  // limpa: grupos de match + células extras (explosões). Ativa especiais em cadeia.
  clearStep(groups, extraCells, effects, focus, step) {
    const mult = 1 + step * 0.5;
    const queue = [];
    const visited = new Set();
    const cleared = [];
    const popups = [];
    const hitDone = new Set();
    let score = 0;
    const creates = [];
    const matchCells = new Set();
    const focusKeys = focus ? focus.map(([r, c]) => r * 64 + c) : [];
    for (const g of groups) {
      let pts = Math.round((g.size * 20 + (g.size - 3) * 40) * mult);
      score += pts;
      popups.push({ r: g.anchor[0], c: g.anchor[1], v: pts, color: g.color });
      for (const [r, c] of g.cells) { matchCells.add(r * 64 + c); queue.push([r, c]); }
      if (g.special) {
        let pos = g.anchor;
        const f = g.cells.find(([r, c]) => focusKeys.includes(r * 64 + c));
        if (f && g.special !== 'w') pos = f;
        else if (f && g.special === 'w' && !g.cells.some(([r, c]) => r === g.anchor[0] && c === g.anchor[1])) pos = f;
        creates.push({ pos, sp: g.special, color: g.special === 'b' ? -1 : g.color, cells: g.cells });
      }
    }
    for (const c of extraCells) queue.push(c);
    const hitBlocker = (r, c) => {
      const k = r * 64 + c;
      if (hitDone.has(k)) return;
      hitDone.add(k);
      const p = this.grid[r][c].p;
      p.hp = Math.max(0, (p.hp || 1) - 1);
      score += 40;
      if (p.kind === 'lama' || p.hp <= 0) {
        if (p.kind === 'lama') this.lamaHit++;
        cleared.push({ id: p.id, r, c, color: -1, kind: p.kind });
        this.grid[r][c].p = null;
      }
    };
    const decJelly = (r, c) => {
      const cell = this.grid[r][c];
      if (cell.jelly > 0) { cell.jelly--; score += 100; }
    };
    while (queue.length) {
      const [r, c] = queue.shift();
      if (!this.inside(r, c)) continue;
      const k = r * 64 + c;
      if (visited.has(k)) continue;
      visited.add(k);
      const cell = this.grid[r][c];
      const p = cell.p;
      if (!p) { decJelly(r, c); continue; }
      if (p.kind === 'grade' || p.kind === 'lama') { hitBlocker(r, c); continue; }
      if (p.kind === 'ingr') continue;
      if (p.lock) { p.lock = 0; decJelly(r, c); score += 20; continue; }
      cell.p = null;
      cleared.push({ id: p.id, r, c, color: p.color, sp: p.sp, kind: 'n' });
      if (p.color >= 0) this.collected[p.color]++;
      decJelly(r, c);
      if (!matchCells.has(k)) score += Math.round(30 * mult);
      if (p.sp) this.activate(p, r, c, queue, effects);
    }
    // cerca/lama vizinhas de células de match levam dano
    for (const k of matchCells) {
      const r = Math.floor(k / 64), c = k % 64;
      for (const [dr, dc] of DIRS) {
        const q = this.at(r + dr, c + dc);
        if (q && (q.kind === 'grade' || q.kind === 'lama')) hitBlocker(r + dr, c + dc);
      }
    }
    const created = [];
    for (const cr of creates) {
      let [r, c] = cr.pos;
      if (this.grid[r][c].p) {
        const alt = cr.cells.find(([rr, cc]) => !this.grid[rr][cc].p);
        if (!alt) continue;
        [r, c] = alt;
      }
      const p = this.mk('n', cr.color, cr.sp);
      this.grid[r][c].p = p;
      created.push({ id: p.id, r, c });
      score += cr.sp === 'b' ? 200 : 120;
    }
    this.score += score;
    return { cleared, effects, popups, created };
  }

  activate(p, r, c, queue, effects) {
    const sp = p.sp;
    if (sp === 'h') { for (let k = 0; k < this.C; k++) queue.push([r, k]); effects.push({ type: 'row', r, c }); }
    else if (sp === 'v') { for (let k = 0; k < this.R; k++) queue.push([k, c]); effects.push({ type: 'col', r, c }); }
    else if (sp === 'w') { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) queue.push([r + dr, c + dc]); effects.push({ type: 'blast', r, c, size: 3 }); }
    else if (sp === 'b') {
      const cnt = new Array(6).fill(0);
      for (let rr = 0; rr < this.R; rr++) for (let cc = 0; cc < this.C; cc++) { const q = this.at(rr, cc); if (Game.matchable(q)) cnt[q.color]++; }
      const color = cnt.indexOf(Math.max(...cnt));
      const targets = [];
      for (let rr = 0; rr < this.R; rr++) for (let cc = 0; cc < this.C; cc++) { const q = this.at(rr, cc); if (Game.matchable(q) && q.color === color) { targets.push({ r: rr, c: cc }); queue.push([rr, cc]); } }
      effects.push({ type: 'bomb', r, c, color, targets });
    }
  }

  // gravidade + reposição. Devolve {id: {r,c}} de onde as peças novas surgem (acima do tabuleiro) ou null se nada mexeu.
  settle() {
    const spawnFrom = {};
    const spawnCount = new Array(this.C).fill(0);
    let any = false;
    let ingrOnBoard = 0;
    for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) { const p = this.grid[r][c].p; if (p && p.kind === 'ingr') ingrOnBoard++; }
    for (let guard = 0; guard < 2000; guard++) {
      let moved = false;
      for (let c = 0; c < this.C; c++) {
        for (let r = this.R - 1; r >= 0; r--) {
          const cell = this.grid[r][c];
          if (cell.hole || cell.p) continue;
          for (let r2 = r - 1; r2 >= 0; r2--) {
            const c2 = this.grid[r2][c];
            if (c2.hole || !c2.p) continue;
            if (Game.movable(c2.p)) { cell.p = c2.p; c2.p = null; moved = true; }
            break;
          }
        }
      }
      for (let c = 0; c < this.C; c++) {
        const t = this.top[c];
        if (t < 0 || this.grid[t][c].p) continue;
        let p;
        const remaining = this.ingrGoal - this.ingrDone - ingrOnBoard;
        if (remaining > 0 && ingrOnBoard < this.ingrMax && (ingrOnBoard === 0 || this.rng() < 0.08) && t < this.bottom[c]) {
          p = this.mk('ingr'); ingrOnBoard++;
        } else p = this.mk('n', this.randColor());
        this.grid[t][c].p = p;
        spawnCount[c]++;
        spawnFrom[p.id] = { r: t - spawnCount[c], c };
        moved = true;
      }
      if (moved) { any = true; continue; }
      // escorrega na diagonal pra preencher buracos embaixo de bloqueios
      outer: for (let r = this.R - 1; r >= 1; r--) for (let c = 0; c < this.C; c++) {
        const cell = this.grid[r][c];
        if (cell.hole || cell.p) continue;
        for (const dc of [-1, 1]) {
          const sc = c + dc;
          if (!this.inside(r - 1, sc)) continue;
          const sp = this.grid[r - 1][sc].p;
          if (Game.movable(sp)) { cell.p = sp; this.grid[r - 1][sc].p = null; moved = true; break outer; }
        }
      }
      if (!moved) break;
      any = true;
    }
    return any ? spawnFrom : null;
  }

  endOfMove(phases) {
    // lama se espalha se ninguém limpou lama nessa jogada
    if (!this.lamaHit) {
      const lamas = [];
      for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) { const p = this.at(r, c); if (p && p.kind === 'lama') lamas.push([r, c]); }
      const cand = [];
      for (const [r, c] of lamas) for (const [dr, dc] of DIRS) {
        const q = this.at(r + dr, c + dc);
        if (q && q.kind === 'n' && !q.sp && !q.lock) cand.push([r + dr, c + dc]);
      }
      if (cand.length) {
        const [r, c] = cand[this.rng.int(cand.length)];
        this.grid[r][c].p = this.mk('lama');
        phases.push({ t: 'spread', r, c, snap: this.snap() });
      }
    }
    if (this.isWon()) return;
    if (!this.findMoves(1).length) this.shuffle(phases);
  }

  shuffle(phases) {
    const pos = [];
    for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) { const p = this.at(r, c); if (p && p.kind === 'n' && !p.lock) pos.push([r, c]); }
    const pieces = pos.map(([r, c]) => this.grid[r][c].p);
    for (let tries = 0; tries < 100; tries++) {
      for (let i = pieces.length - 1; i > 0; i--) { const j = this.rng.int(i + 1); [pieces[i], pieces[j]] = [pieces[j], pieces[i]]; }
      pos.forEach(([r, c], i) => { this.grid[r][c].p = pieces[i]; });
      if (tries > 50) this.recolorNoMatches();
      if (!this.findMatches().length && this.findMoves(1).length) break;
    }
    phases.push({ t: 'shuffle', snap: this.snap() });
  }

  // ---------- objetivos ----------
  countKind(kind) { let n = 0; for (const row of this.grid) for (const cell of row) if (cell.p && cell.p.kind === kind) n++; return n; }
  jellyLeft() { let n = 0; for (const row of this.grid) for (const cell of row) n += cell.jelly; return n; }
  goalStatus() {
    return this.goals.map((g) => {
      if (g.type === 'score') return { ...g, have: this.score, need: g.target, done: this.score >= g.target };
      if (g.type === 'collect') return { ...g, have: Math.min(this.collected[g.color], g.n), need: g.n, done: this.collected[g.color] >= g.n };
      if (g.type === 'jelly') { const left = this.jellyLeft(); return { ...g, left, done: left === 0 }; }
      if (g.type === 'ingr') return { ...g, have: this.ingrDone, need: g.n, done: this.ingrDone >= g.n };
      if (g.type === 'grade') { const left = this.countKind('grade'); return { ...g, left, done: left === 0 }; }
      if (g.type === 'lama') { const left = this.countKind('lama'); return { ...g, left, done: left === 0 }; }
      return { ...g, done: true };
    });
  }
  isWon() { return this.goalStatus().every((g) => g.done); }
  isLost() { return !this.isWon() && this.movesLeft <= 0; }
  stars() {
    if (!this.isWon()) return 0;
    const s = this.level.stars;
    return this.score >= s[2] ? 3 : this.score >= s[1] ? 2 : 1;
  }

  // Festa do Docão: jogadas que sobraram viram listrados e explodem
  bonus() {
    const phases = [];
    if (this.movesLeft > 0) {
      const cand = [];
      for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) { const p = this.at(r, c); if (p && p.kind === 'n' && !p.sp && !p.lock) cand.push(p); }
      const k = Math.min(this.movesLeft, 15, cand.length);
      for (let i = 0; i < k; i++) { const p = cand.splice(this.rng.int(cand.length), 1)[0]; p.sp = this.rng() < 0.5 ? 'h' : 'v'; }
      this.score += this.movesLeft * 300;
      this.movesLeft = 0;
      phases.push({ t: 'convert', bonus: true, snap: this.snap() });
    }
    for (let loop = 0; loop < 6; loop++) {
      const cells = [];
      for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) { const p = this.at(r, c); if (p && p.kind === 'n' && p.sp) cells.push([r, c]); }
      if (!cells.length) break;
      this.lamaHit = 0;
      this.cascade(phases, { cells, effects: [] }, null);
    }
    this.ended = true;
    return phases;
  }
}
