// Desenho do tabuleiro em canvas + animações (troca, estouro, queda, efeitos especiais).
import { sprite, pieceKey, TILE_COLORS, roundRect } from './art.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeFall = (t) => { if (t < 0.85) return (t / 0.85) ** 2; const u = (t - 0.85) / 0.15; return 1 + Math.sin(u * Math.PI) * 0.06; };

export class BoardView {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = new Map();
    this.fx = [];
    this.particles = [];
    this.popups = [];
    this.sel = null;
    this.hint = null;
    this.speed = 1;
    this.cell = 48;
    this.dpr = 1;
    const loop = (t) => { this.draw(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  setGame(game) {
    this.game = game;
    this.R = game.R; this.C = game.C;
    this.holes = game.grid.map((row) => row.map((c) => c.hole));
    this.sprites.clear(); this.fx = []; this.particles = []; this.popups = [];
    this.sel = null; this.hint = null;
    const snap = game.snap();
    this.jelly = snap.jelly;
    const now = performance.now();
    for (const p of snap.pieces) this.sprites.set(p.id, { id: p.id, p, x: p.c, y: p.r - this.R - 1 - Math.random() * 0.5, anim: { fx: p.c, fy: p.r - this.R - 1, tx: p.c, ty: p.r, t0: now + (this.R - p.r) * 30 + p.c * 15, dur: 500, ease: easeFall } });
    this.resize();
  }

  resize() {
    if (!this.game) return;
    const wrap = this.cv.parentElement.getBoundingClientRect();
    const cell = Math.max(20, Math.floor(Math.min((wrap.width - 8) / this.C, (wrap.height - 8) / this.R, 72)));
    this.cell = cell;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.cv.style.width = cell * this.C + 'px';
    this.cv.style.height = cell * this.R + 'px';
    this.cv.width = Math.round(cell * this.C * this.dpr);
    this.cv.height = Math.round(cell * this.R * this.dpr);
    this.px = Math.round(cell * this.dpr);
  }

  cellAt(x, y) {
    const r = this.cv.getBoundingClientRect();
    return [Math.floor((y - r.top) / this.cell), Math.floor((x - r.left) / this.cell)];
  }

  async apply(phase) {
    const now = performance.now();
    const sp = this.speed;
    let dur = 0;
    const seen = new Set();
    for (const p of phase.snap.pieces) {
      seen.add(p.id);
      let s = this.sprites.get(p.id);
      if (!s) {
        const from = phase.spawnFrom && phase.spawnFrom[p.id];
        s = { id: p.id, p, x: from ? from.c : p.c, y: from ? from.r : p.r };
        if (!from) { s.born = now; dur = Math.max(dur, 220 / sp); }
        this.sprites.set(p.id, s);
      }
      if (s.p.sp !== p.sp && phase.t === 'convert') { s.born = now; this.burst(p.r, p.c, '#fff', 6); }
      s.p = p;
      if (s.x !== p.c || s.y !== p.r) {
        const dist = Math.hypot(s.x - p.c, s.y - p.r);
        const d = (phase.t === 'swap' ? 170 : phase.t === 'shuffle' ? 500 : 110 + 75 * Math.sqrt(dist)) / sp;
        s.anim = { fx: s.x, fy: s.y, tx: p.c, ty: p.r, t0: now, dur: d, ease: phase.t === 'fall' ? easeFall : easeInOut };
        dur = Math.max(dur, d);
      }
    }
    for (const [id, s] of this.sprites) {
      if (seen.has(id) || s.dying) continue;
      s.dying = now;
      const col = s.p.kind === 'n' && s.p.color >= 0 ? TILE_COLORS[s.p.color] : s.p.kind === 'ingr' ? '#ffd740' : s.p.kind === 'lama' ? '#7a4a26' : '#c08a52';
      this.burst(s.y, s.x, col, s.p.kind === 'ingr' ? 18 : 7);
      dur = Math.max(dur, 230 / sp);
    }
    this.jelly = phase.snap.jelly;
    for (const e of phase.effects || []) { this.fx.push({ ...e, t0: now, dur: (e.type === 'bomb' || e.type === 'nuke' ? 520 : 380) / sp }); dur = Math.max(dur, (e.type === 'bomb' ? 420 : 260) / sp); }
    for (const pp of phase.popups || []) this.popups.push({ ...pp, t0: now });
    if (phase.t === 'clear') dur = Math.max(dur, 200 / sp);
    if (phase.t === 'spread') dur = Math.max(dur, 300);
    await wait(dur + 10);
  }

  burst(r, c, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 4;
      this.particles.push({ x: c + 0.5, y: r + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 0.5 + Math.random() * 0.4, t: 0, color, size: 0.06 + Math.random() * 0.08 });
    }
  }

  draw(now) {
    const ctx = this.ctx;
    if (!this.game) return;
    const cell = this.cell, dpr = this.dpr;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
    this.last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.C * cell, this.R * cell);
    // fundo das casas
    for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) {
      if (this.holes[r][c]) continue;
      ctx.fillStyle = (r + c) % 2 ? 'rgba(52,24,70,0.62)' : 'rgba(70,34,92,0.62)';
      roundRect(ctx, c * cell + 1, r * cell + 1, cell - 2, cell - 2, cell * 0.14); ctx.fill();
      const j = this.jelly[r * this.C + c];
      if (j) ctx.drawImage(sprite('jelly:' + j, this.px), c * cell, r * cell, cell, cell);
    }
    // saída das trufas
    if (this.game.ingrGoal > 0) {
      ctx.fillStyle = 'rgba(255,215,64,0.9)';
      for (let c = 0; c < this.C; c++) {
        const b = this.game.bottom[c];
        if (b < 0) continue;
        const x = (c + 0.5) * cell, y = (b + 1) * cell - 3;
        ctx.beginPath(); ctx.moveTo(x - cell * 0.14, y - cell * 0.12); ctx.lineTo(x + cell * 0.14, y - cell * 0.12); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
      }
    }
    // seleção
    if (this.sel) {
      const [r, c] = this.sel;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      roundRect(ctx, c * cell + 2, r * cell + 2, cell - 4, cell - 4, cell * 0.16); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, this.C * cell, this.R * cell); ctx.clip();
    const hintIds = new Set();
    if (this.hint) for (const [r, c] of [this.hint.a, this.hint.b]) { const p = this.game.at(r, c); if (p) hintIds.add(p.id); }
    const list = [...this.sprites.values()];
    for (const s of list) {
      if (s.anim) {
        const t = Math.min(1, Math.max(0, (now - s.anim.t0) / s.anim.dur));
        const e = s.anim.ease(t);
        s.x = s.anim.fx + (s.anim.tx - s.anim.fx) * e;
        s.y = s.anim.fy + (s.anim.ty - s.anim.fy) * e;
        if (t >= 1) { s.x = s.anim.tx; s.y = s.anim.ty; s.anim = null; }
      }
      let scale = 1, alpha = 1, rot = 0;
      if (s.born) { const t = Math.min(1, (now - s.born) / 260); scale = t < 0.7 ? (t / 0.7) * 1.2 : 1.2 - (t - 0.7) / 0.3 * 0.2; if (t >= 1) s.born = null; }
      if (s.dying) {
        const t = (now - s.dying) / (230 / this.speed);
        if (t >= 1) { this.sprites.delete(s.id); continue; }
        scale = 1 + t * 0.35; alpha = 1 - t;
      }
      if (hintIds.has(s.id)) { const w = Math.sin(now / 120); scale *= 1 + 0.08 * Math.abs(w); rot = w * 0.12; }
      if (s.p.kind === 'n' && s.p.sp === 'b') rot += now / 900;
      const blocker = s.p.kind === 'grade' || s.p.kind === 'lama';
      const size = cell * (blocker ? 1 : 0.9) * scale;
      const cx = (s.x + 0.5) * cell, cy = (s.y + 0.5) * cell;
      ctx.globalAlpha = alpha;
      ctx.save(); ctx.translate(cx, cy); if (rot) ctx.rotate(rot);
      ctx.drawImage(sprite(pieceKey(s.p), this.px), -size / 2, -size / 2, size, size);
      if (s.p.lock) ctx.drawImage(sprite('lock', this.px), -cell / 2, -cell / 2, cell, cell);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // efeitos
    this.fx = this.fx.filter((f) => {
      const t = (now - f.t0) / f.dur;
      if (t >= 1) return false;
      const a = 1 - t;
      ctx.save();
      if (f.type === 'row' || f.type === 'col') {
        const w = cell * (0.25 + 0.6 * Math.sin(t * Math.PI));
        const g = f.type === 'row' ? ctx.createLinearGradient(0, (f.r + 0.5) * cell - w / 2, 0, (f.r + 0.5) * cell + w / 2) : ctx.createLinearGradient((f.c + 0.5) * cell - w / 2, 0, (f.c + 0.5) * cell + w / 2, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,230,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        if (f.type === 'row') ctx.fillRect(0, (f.r + 0.5) * cell - w / 2, this.C * cell, w);
        else ctx.fillRect((f.c + 0.5) * cell - w / 2, 0, w, this.R * cell);
      } else if (f.type === 'blast') {
        ctx.strokeStyle = `rgba(255,220,120,${a})`; ctx.lineWidth = cell * 0.3 * a;
        ctx.beginPath(); ctx.arc((f.c + 0.5) * cell, (f.r + 0.5) * cell, cell * (f.size / 2) * (0.3 + t), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a * 0.5})`; ctx.fill();
      } else if (f.type === 'bomb') {
        ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 3; ctx.shadowColor = '#ff7ac0'; ctx.shadowBlur = 12;
        for (const tg of f.targets) {
          ctx.beginPath(); ctx.moveTo((f.c + 0.5) * cell, (f.r + 0.5) * cell);
          const mx = ((f.c + tg.c) / 2 + 0.5) * cell + (Math.random() - 0.5) * cell * 0.6, my = ((f.r + tg.r) / 2 + 0.5) * cell + (Math.random() - 0.5) * cell * 0.6;
          ctx.lineTo(mx, my); ctx.lineTo((tg.c + 0.5) * cell, (tg.r + 0.5) * cell); ctx.stroke();
        }
      } else if (f.type === 'nuke') {
        ctx.fillStyle = `rgba(255,240,255,${a * 0.85})`; ctx.fillRect(0, 0, this.C * cell, this.R * cell);
      }
      ctx.restore();
      return true;
    });
    // partículas
    this.particles = this.particles.filter((p) => {
      p.t += dt; if (p.t >= p.life) return false;
      p.vy += 12 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x * cell, p.y * cell, p.size * cell, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      return true;
    });
    // pontos flutuando
    this.popups = this.popups.filter((p) => {
      const t = (now - p.t0) / 900; if (t >= 1) return false;
      ctx.globalAlpha = 1 - t * t;
      ctx.font = `900 ${Math.round(cell * 0.42)}px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#3a1240';
      const x = (p.c + 0.5) * cell, y = (p.r + 0.5) * cell - t * cell * 0.9;
      ctx.strokeText(p.v, x, y); ctx.fillStyle = p.color >= 0 ? TILE_COLORS[p.color] : '#ffe066'; ctx.fillText(p.v, x, y);
      ctx.globalAlpha = 1;
      return true;
    });
  }
}
