// Arte procedural (canvas + SVG): peças, especiais, bloqueios e o Docão.
export const TILE_COLORS = ['#e8445f', '#ffcf2e', '#fff6e6', '#3cb54a', '#8a46b8', '#ff8a1c'];
export const TILE_LABELS = ['Bacon', 'Milho', 'Ovo', 'Pimentão', 'Berinjela', 'Cenoura'];

function gloss(ctx, x, y, rx, ry, a = 0.45) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
let PX = 64;
function shadow(ctx) { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = PX * 0.06; ctx.shadowOffsetY = PX * 0.03; }
function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }

function drawBacon(ctx) {
  const wave = (y0, amp) => {
    ctx.moveTo(0.12, y0);
    ctx.bezierCurveTo(0.3, y0 - amp, 0.4, y0 + amp, 0.55, y0);
    ctx.bezierCurveTo(0.7, y0 - amp, 0.78, y0 + amp, 0.9, y0);
  };
  ctx.save();
  ctx.translate(0.5, 0.5); ctx.rotate(-0.55); ctx.translate(-0.5, -0.5);
  shadow(ctx);
  const g = ctx.createLinearGradient(0, 0.3, 0, 0.72);
  g.addColorStop(0, '#ff6b7f'); g.addColorStop(1, '#b9213b');
  ctx.fillStyle = g;
  ctx.beginPath();
  wave(0.3, 0.12);
  ctx.lineTo(0.9, 0.7);
  ctx.bezierCurveTo(0.78, 0.82, 0.7, 0.58, 0.55, 0.7);
  ctx.bezierCurveTo(0.4, 0.82, 0.3, 0.58, 0.12, 0.7);
  ctx.closePath(); ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = '#ffe0cf'; ctx.lineWidth = 0.07; ctx.lineCap = 'round';
  ctx.beginPath(); wave(0.43, 0.12); ctx.stroke();
  ctx.lineWidth = 0.045;
  ctx.beginPath(); wave(0.57, 0.12); ctx.stroke();
  ctx.strokeStyle = '#7d1427'; ctx.lineWidth = 0.03;
  ctx.beginPath(); wave(0.3, 0.12); ctx.lineTo(0.9, 0.7);
  ctx.bezierCurveTo(0.78, 0.82, 0.7, 0.58, 0.55, 0.7); ctx.bezierCurveTo(0.4, 0.82, 0.3, 0.58, 0.12, 0.7); ctx.closePath(); ctx.stroke();
  gloss(ctx, 0.35, 0.33, 0.12, 0.035, 0.5);
  ctx.restore();
}

function drawMilho(ctx) {
  ctx.save();
  ctx.translate(0.5, 0.5); ctx.rotate(0.35); ctx.translate(-0.5, -0.5);
  shadow(ctx);
  const g = ctx.createLinearGradient(0.3, 0, 0.7, 0);
  g.addColorStop(0, '#ffe066'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#e0a100');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0.5, 0.42, 0.17, 0.33, 0, 0, Math.PI * 2); ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = 'rgba(170,110,0,0.55)'; ctx.lineWidth = 0.018;
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0.5 + i * 0.06, 0.12); ctx.quadraticCurveTo(0.5 + i * 0.075, 0.42, 0.5 + i * 0.06, 0.72); ctx.stroke(); }
  for (let j = 0; j < 9; j++) { const y = 0.16 + j * 0.065; const w = 0.17 * Math.sqrt(Math.max(0, 1 - ((y - 0.42) / 0.33) ** 2)); ctx.beginPath(); ctx.moveTo(0.5 - w, y); ctx.lineTo(0.5 + w, y); ctx.stroke(); }
  ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 0.03;
  ctx.beginPath(); ctx.ellipse(0.5, 0.42, 0.17, 0.33, 0, 0, Math.PI * 2); ctx.stroke();
  // folhas
  ctx.fillStyle = '#4caf50'; ctx.strokeStyle = '#1f6b28'; ctx.lineWidth = 0.025;
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0.5, 0.92);
    ctx.quadraticCurveTo(0.5 + s * 0.28, 0.75, 0.5 + s * 0.16, 0.42);
    ctx.quadraticCurveTo(0.5 + s * 0.12, 0.7, 0.5, 0.92); ctx.fill(); ctx.stroke();
  }
  gloss(ctx, 0.44, 0.27, 0.04, 0.1, 0.55);
  ctx.restore();
}

function drawOvo(ctx) {
  ctx.save();
  shadow(ctx);
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  const pts = 10;
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2, rr = 0.36 + Math.sin(i * 2.3) * 0.04;
    const x = 0.5 + Math.cos(a) * rr, y = 0.52 + Math.sin(a) * rr * 0.85;
    if (i === 0) ctx.moveTo(x, y); else { const a0 = ((i - 0.5) / pts) * Math.PI * 2; ctx.quadraticCurveTo(0.5 + Math.cos(a0) * (rr + 0.05), 0.52 + Math.sin(a0) * (rr + 0.05) * 0.85, x, y); }
  }
  ctx.closePath(); ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = '#d7c49c'; ctx.lineWidth = 0.025; ctx.stroke();
  const g = ctx.createRadialGradient(0.46, 0.45, 0.02, 0.5, 0.5, 0.16);
  g.addColorStop(0, '#ffd54a'); g.addColorStop(1, '#ff9800');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0.5, 0.5, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d06b00'; ctx.lineWidth = 0.02; ctx.stroke();
  gloss(ctx, 0.45, 0.44, 0.05, 0.03, 0.8);
  ctx.restore();
}

function drawPimentao(ctx) {
  ctx.save();
  shadow(ctx);
  const g = ctx.createRadialGradient(0.42, 0.45, 0.05, 0.5, 0.55, 0.42);
  g.addColorStop(0, '#7ee07c'); g.addColorStop(1, '#1f8a32');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0.5, 0.3);
  ctx.bezierCurveTo(0.65, 0.2, 0.9, 0.3, 0.84, 0.58);
  ctx.bezierCurveTo(0.8, 0.85, 0.66, 0.9, 0.58, 0.84);
  ctx.quadraticCurveTo(0.5, 0.92, 0.42, 0.84);
  ctx.bezierCurveTo(0.34, 0.9, 0.2, 0.85, 0.16, 0.58);
  ctx.bezierCurveTo(0.1, 0.3, 0.35, 0.2, 0.5, 0.3);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = '#145c22'; ctx.lineWidth = 0.03; ctx.stroke();
  ctx.strokeStyle = 'rgba(20,92,34,0.5)'; ctx.lineWidth = 0.02;
  ctx.beginPath(); ctx.moveTo(0.5, 0.34); ctx.quadraticCurveTo(0.48, 0.6, 0.5, 0.86); ctx.stroke();
  ctx.fillStyle = '#2e6b1f';
  ctx.beginPath(); ctx.moveTo(0.46, 0.3); ctx.quadraticCurveTo(0.5, 0.1, 0.62, 0.1); ctx.lineTo(0.62, 0.15); ctx.quadraticCurveTo(0.54, 0.16, 0.54, 0.3); ctx.closePath(); ctx.fill();
  gloss(ctx, 0.33, 0.45, 0.05, 0.11, 0.5);
  ctx.restore();
}

function drawBerinjela(ctx) {
  ctx.save();
  ctx.translate(0.5, 0.5); ctx.rotate(-0.45); ctx.translate(-0.5, -0.5);
  shadow(ctx);
  const g = ctx.createRadialGradient(0.42, 0.55, 0.04, 0.5, 0.6, 0.38);
  g.addColorStop(0, '#b77be0'); g.addColorStop(1, '#4b1b6e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0.5, 0.18);
  ctx.bezierCurveTo(0.66, 0.2, 0.62, 0.42, 0.72, 0.58);
  ctx.bezierCurveTo(0.82, 0.8, 0.64, 0.94, 0.5, 0.94);
  ctx.bezierCurveTo(0.36, 0.94, 0.18, 0.8, 0.28, 0.58);
  ctx.bezierCurveTo(0.38, 0.42, 0.34, 0.2, 0.5, 0.18);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = '#2f0c47'; ctx.lineWidth = 0.03; ctx.stroke();
  ctx.fillStyle = '#4caf50'; ctx.strokeStyle = '#1f6b28'; ctx.lineWidth = 0.02;
  ctx.beginPath(); ctx.moveTo(0.36, 0.3); ctx.quadraticCurveTo(0.5, 0.18, 0.64, 0.3); ctx.quadraticCurveTo(0.58, 0.24, 0.56, 0.36); ctx.quadraticCurveTo(0.5, 0.26, 0.44, 0.36); ctx.quadraticCurveTo(0.42, 0.24, 0.36, 0.3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2e6b1f'; ctx.fillRect(0.47, 0.07, 0.06, 0.14);
  gloss(ctx, 0.4, 0.62, 0.05, 0.12, 0.45);
  ctx.restore();
}

function drawCenoura(ctx) {
  ctx.save();
  ctx.translate(0.5, 0.5); ctx.rotate(0.6); ctx.translate(-0.5, -0.5);
  // folhas
  ctx.fillStyle = '#43a047'; ctx.strokeStyle = '#1f6b28'; ctx.lineWidth = 0.02;
  for (const a of [-0.5, 0, 0.5]) {
    ctx.save(); ctx.translate(0.5, 0.24); ctx.rotate(a);
    ctx.beginPath(); ctx.ellipse(0, -0.1, 0.045, 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  shadow(ctx);
  const g = ctx.createLinearGradient(0.32, 0, 0.68, 0);
  g.addColorStop(0, '#ffb347'); g.addColorStop(0.6, '#ff8a1c'); g.addColorStop(1, '#d9600b');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0.3, 0.3); ctx.quadraticCurveTo(0.5, 0.18, 0.7, 0.3);
  ctx.quadraticCurveTo(0.6, 0.7, 0.5, 0.95);
  ctx.quadraticCurveTo(0.4, 0.7, 0.3, 0.3);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = '#a84a05'; ctx.lineWidth = 0.028; ctx.stroke();
  ctx.lineWidth = 0.018;
  for (const [y, w] of [[0.42, 0.1], [0.55, 0.08], [0.68, 0.06]]) { ctx.beginPath(); ctx.moveTo(0.5 - w, y); ctx.lineTo(0.5 - w + 0.07, y + 0.015); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0.5 + w, y + 0.04); ctx.lineTo(0.5 + w - 0.06, y + 0.05); ctx.stroke(); }
  gloss(ctx, 0.4, 0.38, 0.03, 0.09, 0.5);
  ctx.restore();
}

const DRAW = [drawBacon, drawMilho, drawOvo, drawPimentao, drawBerinjela, drawCenoura];

function drawBomb(ctx) {
  ctx.save();
  shadow(ctx);
  const g = ctx.createRadialGradient(0.4, 0.38, 0.05, 0.5, 0.5, 0.42);
  g.addColorStop(0, '#8a5634'); g.addColorStop(1, '#2a160a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0.5, 0.5, 0.38, 0, Math.PI * 2); ctx.fill();
  noShadow(ctx);
  const cols = ['#ff4d6d', '#ffd23f', '#ffffff', '#4cd964', '#b36bff', '#ff9a1c', '#5ac8fa'];
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39996, rr = 0.12 + ((i * 37) % 23) / 23 * 0.22;
    const x = 0.5 + Math.cos(a) * rr, y = 0.5 + Math.sin(a) * rr;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a * 3);
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(-0.035, -0.012, 0.07, 0.024);
    ctx.restore();
  }
  // focinho do Docão
  ctx.fillStyle = '#f5a23a'; ctx.strokeStyle = '#8a3a08'; ctx.lineWidth = 0.025;
  ctx.beginPath(); ctx.ellipse(0.5, 0.52, 0.15, 0.11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a3010';
  ctx.beginPath(); ctx.ellipse(0.45, 0.52, 0.03, 0.05, 0, 0, Math.PI * 2); ctx.ellipse(0.55, 0.52, 0.03, 0.05, 0, 0, Math.PI * 2); ctx.fill();
  gloss(ctx, 0.37, 0.3, 0.09, 0.05, 0.4);
  ctx.restore();
}

function drawTrufa(ctx) {
  ctx.save();
  const halo = ctx.createRadialGradient(0.5, 0.5, 0.2, 0.5, 0.5, 0.5);
  halo.addColorStop(0, 'rgba(255,215,64,0.85)'); halo.addColorStop(1, 'rgba(255,215,64,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, 1, 1);
  shadow(ctx);
  const g = ctx.createRadialGradient(0.42, 0.4, 0.04, 0.5, 0.52, 0.34);
  g.addColorStop(0, '#9a6a45'); g.addColorStop(1, '#3a2213');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI * 2, rr = 0.3 + (i % 2 ? 0.035 : -0.01);
    const x = 0.5 + Math.cos(a) * rr, y = 0.52 + Math.sin(a) * rr * 0.9;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = '#24130a'; ctx.lineWidth = 0.025; ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,190,0.35)';
  for (let i = 0; i < 9; i++) { const a = i * 2.2; ctx.beginPath(); ctx.arc(0.5 + Math.cos(a) * 0.17, 0.52 + Math.sin(a) * 0.15, 0.025, 0, Math.PI * 2); ctx.fill(); }
  // brilho
  ctx.fillStyle = '#fff6b0';
  const star = (x, y, s) => { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? s * 0.35 : s; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
  star(0.75, 0.22, 0.09); star(0.2, 0.78, 0.06);
  ctx.restore();
}

function drawGrade(ctx, hp) {
  ctx.save();
  const wood = hp >= 2 ? ['#9c6b3c', '#6b4220'] : ['#d9a066', '#a8703c'];
  shadow(ctx);
  ctx.fillStyle = wood[0];
  roundRect(ctx, 0.06, 0.06, 0.88, 0.88, 0.1); ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = wood[1]; ctx.lineWidth = 0.04;
  roundRect(ctx, 0.06, 0.06, 0.88, 0.88, 0.1); ctx.stroke();
  ctx.fillStyle = wood[1];
  for (const y of [0.3, 0.62]) ctx.fillRect(0.06, y, 0.88, 0.08);
  for (const x of [0.22, 0.7]) ctx.fillRect(x, 0.06, 0.08, 0.88);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.02;
  ctx.beginPath(); ctx.moveTo(0.12, 0.18); ctx.lineTo(0.88, 0.18); ctx.moveTo(0.12, 0.5); ctx.lineTo(0.88, 0.5); ctx.moveTo(0.12, 0.82); ctx.lineTo(0.88, 0.82); ctx.stroke();
  if (hp >= 2) {
    ctx.fillStyle = '#c9ced6';
    for (const [x, y] of [[0.26, 0.34], [0.74, 0.34], [0.26, 0.66], [0.74, 0.66]]) { ctx.beginPath(); ctx.arc(x, y, 0.045, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

function drawLama(ctx) {
  ctx.save();
  shadow(ctx);
  const g = ctx.createRadialGradient(0.42, 0.38, 0.05, 0.5, 0.5, 0.5);
  g.addColorStop(0, '#9b6a3f'); g.addColorStop(1, '#5a3417');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2, rr = 0.44 + Math.sin(i * 1.7) * 0.035;
    const x = 0.5 + Math.cos(a) * rr, y = 0.5 + Math.sin(a) * rr;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); ctx.fill();
  noShadow(ctx);
  ctx.fillStyle = '#4a2a10';
  for (const [x, y, r] of [[0.32, 0.6, 0.07], [0.62, 0.66, 0.05], [0.66, 0.36, 0.06]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,220,180,0.5)'; ctx.lineWidth = 0.02;
  for (const [x, y, r] of [[0.4, 0.34, 0.05], [0.58, 0.52, 0.035]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
  gloss(ctx, 0.35, 0.3, 0.1, 0.05, 0.3);
  ctx.restore();
}

function drawLock(ctx) {
  ctx.save();
  ctx.strokeStyle = '#7d8794'; ctx.lineWidth = 0.05; ctx.lineCap = 'round';
  for (const s of [1, -1]) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const t = 0.08 + i * 0.17;
      const x = s > 0 ? t : 1 - t, y = t;
      ctx.moveTo(x, y); ctx.ellipse(x, y, 0.06, 0.035, s * Math.PI / 4, 0, Math.PI * 2);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#ffc107'; ctx.strokeStyle = '#8a6200'; ctx.lineWidth = 0.025;
  roundRect(ctx, 0.38, 0.5, 0.24, 0.2, 0.04); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0.5, 0.5, 0.08, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#5a3d00'; ctx.beginPath(); ctx.arc(0.5, 0.59, 0.025, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

// ---------- cache de sprites ----------
const cache = new Map();
function makeCanvas(px) { const c = document.createElement('canvas'); c.width = c.height = px; return c; }

export function sprite(key, px) {
  const k = key + '@' + px;
  if (cache.has(k)) return cache.get(k);
  const cv = makeCanvas(px);
  const ctx = cv.getContext('2d');
  PX = px;
  ctx.scale(px, px);
  const [kind, a, b] = key.split(':');
  if (kind === 'n') {
    const color = +a, sp = b || '';
    if (sp === 'b') drawBomb(ctx);
    else if (sp === 'w') {
      ctx.save();
      const base = TILE_COLORS[color];
      ctx.shadowColor = base; ctx.shadowBlur = PX * 0.12;
      ctx.fillStyle = base; ctx.globalAlpha = 0.9;
      roundRect(ctx, 0.08, 0.08, 0.84, 0.84, 0.18); ctx.fill();
      ctx.globalAlpha = 1; noShadow(ctx);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 0.04;
      roundRect(ctx, 0.08, 0.08, 0.84, 0.84, 0.18); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.02; ctx.setLineDash([0.04, 0.04]);
      roundRect(ctx, 0.14, 0.14, 0.72, 0.72, 0.14); ctx.stroke(); ctx.setLineDash([]);
      // lacinhos
      ctx.fillStyle = '#fff';
      for (const [x, y] of [[0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]]) { ctx.beginPath(); ctx.arc(x, y, 0.06, 0, Math.PI * 2); ctx.fill(); }
      ctx.translate(0.5, 0.5); ctx.scale(0.78, 0.78); ctx.translate(-0.5, -0.5);
      DRAW[color](ctx);
      ctx.restore();
    } else {
      DRAW[color](ctx);
      if (sp === 'h' || sp === 'v') {
        const tmp = makeCanvas(px); const t2 = tmp.getContext('2d');
        t2.drawImage(cv, 0, 0);
        t2.globalCompositeOperation = 'source-atop';
        t2.fillStyle = 'rgba(255,255,255,0.75)';
        for (let i = 0; i < 4; i++) {
          const p = (0.2 + i * 0.2) * px, w = 0.07 * px;
          if (sp === 'h') t2.fillRect(0, p - w / 2, px, w); else t2.fillRect(p - w / 2, 0, w, px);
        }
        t2.globalCompositeOperation = 'source-over';
        t2.fillStyle = '#fff'; t2.strokeStyle = 'rgba(0,0,0,0.5)'; t2.lineWidth = px * 0.02;
        const arrow = (x, y, ang) => { t2.save(); t2.translate(x, y); t2.rotate(ang); t2.beginPath(); t2.moveTo(px * 0.08, 0); t2.lineTo(-px * 0.04, -px * 0.06); t2.lineTo(-px * 0.04, px * 0.06); t2.closePath(); t2.fill(); t2.stroke(); t2.restore(); };
        if (sp === 'h') { arrow(px * 0.92, px * 0.5, 0); arrow(px * 0.08, px * 0.5, Math.PI); } else { arrow(px * 0.5, px * 0.08, -Math.PI / 2); arrow(px * 0.5, px * 0.92, Math.PI / 2); }
        cache.set(k, tmp);
        return tmp;
      }
    }
  } else if (kind === 'ingr') drawTrufa(ctx);
  else if (kind === 'grade') drawGrade(ctx, +a || 1);
  else if (kind === 'lama') drawLama(ctx);
  else if (kind === 'lock') drawLock(ctx);
  else if (kind === 'jelly') {
    const lv = +a;
    ctx.fillStyle = lv >= 2 ? 'rgba(255,70,160,0.75)' : 'rgba(255,140,200,0.6)';
    roundRect(ctx, 0.04, 0.04, 0.92, 0.92, 0.16); ctx.fill();
    ctx.strokeStyle = lv >= 2 ? '#d6237f' : '#ff7ab8'; ctx.lineWidth = 0.04; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(ctx, 0.12, 0.1, 0.5, 0.14, 0.07); ctx.fill();
  } else if (kind === 'star') {
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#c98a00'; ctx.lineWidth = 0.05;
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 0.2 : 0.45; ctx.lineTo(0.5 + Math.cos(ang) * rr, 0.53 + Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  cache.set(k, cv);
  return cv;
}

export function pieceKey(p) {
  if (p.kind === 'n') return `n:${p.color < 0 ? 0 : p.color}:${p.sp || ''}`;
  if (p.kind === 'grade') return `grade:${p.hp}`;
  return p.kind;
}

export function iconURL(key, px = 64) { return sprite(key, px).toDataURL(); }

// ---------- Docão (SVG) ----------
let svgSeq = 0;
// Docão = porquinho laranja da Cheers, camiseta vermelha com "C!".
export function docaoSVG(mood = 'neutro', extra = '') {
  const eyeWhite = '<ellipse cx="74" cy="92" rx="17" ry="20" fill="#fff" stroke="#5a2a08" stroke-width="4"/><ellipse cx="126" cy="92" rx="17" ry="20" fill="#fff" stroke="#5a2a08" stroke-width="4"/>';
  const eyes = mood === 'feliz'
    ? '<path d="M58 96 q16 -22 32 0" stroke="#3a1a08" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M110 96 q16 -22 32 0" stroke="#3a1a08" stroke-width="8" fill="none" stroke-linecap="round"/>'
    : mood === 'triste'
      ? eyeWhite + '<path d="M54 70 l30 -8" stroke="#5a2a08" stroke-width="6" stroke-linecap="round"/><path d="M146 70 l-30 -8" stroke="#5a2a08" stroke-width="6" stroke-linecap="round"/><ellipse cx="76" cy="100" rx="9" ry="11" fill="#2a1406"/><ellipse cx="124" cy="100" rx="9" ry="11" fill="#2a1406"/><circle cx="79" cy="96" r="3.5" fill="#fff"/><circle cx="127" cy="96" r="3.5" fill="#fff"/><path d="M58 110 q-8 16 0 22 q8 -6 0 -22z" fill="#6ec6ff" stroke="#2b8fd6" stroke-width="2"/>'
      : eyeWhite + '<path d="M56 64 q18 -10 34 0" stroke="#5a2a08" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M110 64 q18 -10 34 0" stroke="#5a2a08" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="78" cy="94" rx="9" ry="11" fill="#2a1406"/><ellipse cx="122" cy="94" rx="9" ry="11" fill="#2a1406"/><circle cx="81" cy="90" r="3.5" fill="#fff"/><circle cx="125" cy="90" r="3.5" fill="#fff"/>';
  const mouth = mood === 'feliz'
    ? '<path d="M66 150 q34 40 68 0 z" fill="#8c1f1f" stroke="#5a2a08" stroke-width="4" stroke-linejoin="round"/><path d="M84 164 q16 12 32 0 q-16 -8 -32 0z" fill="#ff7a6a"/>'
    : mood === 'triste'
      ? '<path d="M78 170 q22 -16 44 0" stroke="#5a2a08" stroke-width="5" fill="none" stroke-linecap="round"/>'
      : '<path d="M76 156 q24 16 48 0" stroke="#5a2a08" stroke-width="5" fill="none" stroke-linecap="round"/>';
  const id = 'dg' + mood + (++svgSeq);
  return `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" class="docao docao-${mood}">
  <defs><radialGradient id="${id}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffd25e"/><stop offset="1" stop-color="#f29a1c"/></radialGradient></defs>
  <path d="M40 196 q60 -30 120 0 l6 34 h-132z" fill="#e3231c" stroke="#7a1010" stroke-width="5" stroke-linejoin="round"/>
  <text x="100" y="226" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="26" fill="#fff">C!</text>
  <path d="M44 64 L20 22 Q50 18 80 40 Z" fill="#f29a1c" stroke="#7a3a08" stroke-width="5" stroke-linejoin="round"/>
  <path d="M156 64 L180 22 Q150 18 120 40 Z" fill="#f29a1c" stroke="#7a3a08" stroke-width="5" stroke-linejoin="round"/>
  <path d="M44 58 L30 30 Q52 30 68 44 Z" fill="#e8742a"/><path d="M156 58 L170 30 Q148 30 132 44 Z" fill="#e8742a"/>
  <ellipse cx="100" cy="114" rx="82" ry="76" fill="url(#${id})" stroke="#7a3a08" stroke-width="5"/>
  <ellipse cx="44" cy="132" rx="15" ry="10" fill="#ff7a6a" opacity=".6"/><ellipse cx="156" cy="132" rx="15" ry="10" fill="#ff7a6a" opacity=".6"/>
  ${eyes}
  <ellipse cx="100" cy="132" rx="34" ry="24" fill="#f08a3c" stroke="#8a3a08" stroke-width="4"/>
  <ellipse cx="88" cy="132" rx="7" ry="10" fill="#8a3010"/><ellipse cx="112" cy="132" rx="7" ry="10" fill="#8a3010"/>
  ${mouth}
  ${extra}
</svg>`;
}
