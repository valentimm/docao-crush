// Docão Crush: telas (menu, mapa, fase), entrada (toque/mouse) e progresso no localStorage.
import { Game } from './engine.js';
import { getLevel, LEVEL_COUNT, EPISODES, LEVELS_PER_EPISODE } from './levels.js';
import { BoardView } from './render.js';
import { docaoSVG, iconURL, TILE_LABELS } from './art.js';
import { sfx, isMuted, setMuted } from './audio.js';

const $ = (id) => document.getElementById(id);
const KEY = 'docao-crush-v1';
const load = () => { try { return { max: 1, stars: {}, best: {}, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { max: 1, stars: {}, best: {} }; } };
let save = load();
const persist = () => localStorage.setItem(KEY, JSON.stringify(save));

const STAR_SVG = (on) => `<svg viewBox="0 0 24 24" class="st ${on ? 'on' : ''}"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>`;
const MUTE_SVG = (m) => `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/>${m ? '<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' : '<path d="M16 8.5q3 3.5 0 7M18.5 6q5 6 0 12" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>'}</svg>`;

function show(id) { for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id); }

// ---------- menu ----------
function renderMenu() {
  $('menuDocao').innerHTML = docaoSVG('feliz');
  const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
  $('menuInfo').textContent = save.max > 1 ? `Fase ${Math.min(save.max, LEVEL_COUNT)} de ${LEVEL_COUNT} · ${total} estrelas` : `${LEVEL_COUNT} fases te esperando no chiqueiro`;
  show('scr-menu');
}
$('btnPlay').onclick = () => { sfx.unlock(); sfx.oink(); renderMap(); };
$('menuDocao').onclick = () => { sfx.oink(); const d = $('menuDocao'); d.classList.remove('boing'); void d.offsetWidth; d.classList.add('boing'); };

function syncMute() { for (const b of document.querySelectorAll('.mute')) b.innerHTML = MUTE_SVG(isMuted()); }
for (const b of document.querySelectorAll('.mute')) b.onclick = (e) => { e.stopPropagation(); setMuted(!isMuted()); syncMute(); sfx.click(); };
syncMute();

// ---------- mapa ----------
const NODE_GAP = 92;
function nodePos(n) {
  return { x: 50 + Math.sin(n * 0.85) * 30, y: (LEVEL_COUNT - n) * NODE_GAP + 140 };
}
function renderMap() {
  const inner = $('mapInner');
  const H = LEVEL_COUNT * NODE_GAP + 220;
  inner.style.height = H + 'px';
  let html = '';
  const neps = Math.ceil(LEVEL_COUNT / LEVELS_PER_EPISODE);
  for (let e = 0; e < neps; e++) {
    const first = e * LEVELS_PER_EPISODE + 1, last = Math.min(LEVEL_COUNT, first + LEVELS_PER_EPISODE - 1);
    const top = nodePos(last).y - NODE_GAP / 2 - 30, bottom = nodePos(first).y + NODE_GAP / 2;
    const ep = EPISODES[e % EPISODES.length];
    html += `<div class="ep" style="top:${top}px;height:${bottom - top}px;background:linear-gradient(180deg, ${ep.color}55, ${ep.color}aa)"><span>${e + 1}. ${ep.name}</span></div>`;
  }
  let path = '';
  for (let n = 1; n <= LEVEL_COUNT; n++) { const p = nodePos(n); path += `${n === 1 ? 'M' : 'L'}${p.x * 4} ${p.y} `; }
  html += `<svg class="path" viewBox="0 0 400 ${H}" preserveAspectRatio="none" style="height:${H}px"><path d="${path}" /></svg>`;
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const p = nodePos(n), st = save.stars[n] || 0, locked = n > save.max;
    const lv = getLevel(n);
    html += `<button class="node ${locked ? 'locked' : ''} ${n === save.max ? 'cur' : ''} ${lv.hard ? 'hard' : ''}" data-n="${n}" style="left:${p.x}%;top:${p.y}px"><b>${n}</b>${locked ? '' : `<span class="stars">${[1, 2, 3].map((i) => STAR_SVG(st >= i)).join('')}</span>`}</button>`;
  }
  const cur = nodePos(Math.min(save.max, LEVEL_COUNT));
  html += `<div class="mapDocao" style="left:${cur.x}%;top:${cur.y - 70}px">${docaoSVG('feliz')}</div>`;
  inner.innerHTML = html;
  const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
  $('mapStars').innerHTML = `${STAR_SVG(true)} ${total}/${LEVEL_COUNT * 3}`;
  show('scr-map');
  const sc = $('mapScroll');
  sc.scrollTop = cur.y - sc.clientHeight / 2;
}
$('mapInner').addEventListener('click', (e) => {
  const b = e.target.closest('.node');
  if (!b) return;
  const n = +b.dataset.n;
  if (n > save.max) { sfx.bad(); return; }
  sfx.click();
  levelIntro(n);
});
$('btnMapBack').onclick = () => { sfx.click(); renderMenu(); };

// ---------- modal ----------
function modal(html) { $('modalCard').innerHTML = html; $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); }

function goalIcon(g) {
  if (g.type === 'collect') return iconURL(`n:${g.color}:`);
  if (g.type === 'jelly') return iconURL('jelly:1');
  if (g.type === 'ingr') return iconURL('ingr');
  if (g.type === 'grade') return iconURL('grade:1');
  if (g.type === 'lama') return iconURL('lama');
  return iconURL('star');
}
function goalText(g) {
  if (g.type === 'score') return `Faça ${g.target.toLocaleString('pt-BR')} pontos`;
  if (g.type === 'collect') return `Colete ${g.n} ${TILE_LABELS[g.color].toLowerCase()}`;
  if (g.type === 'jelly') return 'Limpe toda a geleia';
  if (g.type === 'ingr') return `Leve ${g.n} trufa${g.n > 1 ? 's' : ''} até embaixo`;
  if (g.type === 'grade') return 'Quebre todas as cercas';
  if (g.type === 'lama') return 'Limpe toda a lama';
  return '';
}

function levelIntro(n) {
  const lv = getLevel(n);
  const st = save.stars[n] || 0;
  modal(`<div class="mDocao">${docaoSVG('neutro')}</div>
    <h2>Fase ${n}</h2><p class="epn">${lv.episode}${lv.hard ? ' · <b class="hardtag">DIFÍCIL</b>' : ''}</p>
    <div class="mstars">${[1, 2, 3].map((i) => STAR_SVG(st >= i)).join('')}</div>
    <ul class="goals">${lv.goals.map((g) => `<li><img src="${goalIcon(g)}" alt=""><span>${goalText(g)}</span></li>`).join('')}</ul>
    <p class="mv"><b>${lv.moves}</b> jogadas</p>
    ${lv.tip ? `<p class="tip">${lv.tip}</p>` : ''}
    <div class="row"><button class="btn ghost" id="mBack">Voltar</button><button class="btn" id="mGo">Jogar!</button></div>`);
  $('mBack').onclick = () => { sfx.click(); closeModal(); };
  $('mGo').onclick = () => { sfx.click(); closeModal(); startLevel(n); };
}

// ---------- jogo ----------
const view = new BoardView($('board'));
let game = null, levelN = 1, busy = false, idleTimer = 0;
window.addEventListener('resize', () => view.resize());

function setMood(m) { $('hudDocao').innerHTML = docaoSVG(m); }

function startLevel(n) {
  levelN = n;
  const lv = getLevel(n);
  game = new Game(lv, (Math.random() * 1e9) | 0);
  show('scr-game');
  $('hudLevel').textContent = `Fase ${n}`;
  setMood('neutro');
  view.setGame(game);
  requestAnimationFrame(() => view.resize());
  busy = false;
  updateHud();
  resetIdle();
  if (lv.tip) banner(lv.tip, 2600);
}
window.__crush = { startLevel, get game() { return game; }, view, getLevel, unlockAll() { save.max = LEVEL_COUNT; persist(); } };

function updateHud() {
  $('hudMoves').textContent = game.movesLeft;
  $('hudMoves').parentElement.classList.toggle('low', game.movesLeft <= 5);
  $('hudScore').textContent = game.score.toLocaleString('pt-BR');
  const s = game.level.stars;
  const pct = Math.min(1, game.score / s[2]);
  $('hudBar').style.width = pct * 100 + '%';
  $('hudStars').innerHTML = s.map((v, i) => `<i style="left:${Math.min(95, Math.max(4, (v / s[2]) * 100))}%" class="${game.score >= v && (i > 0 || v > 0) ? 'on' : ''}">${STAR_SVG(game.score >= v && (v > 0 || game.isWon()))}</i>`).join('');
  $('hudGoals').innerHTML = game.goalStatus().map((g) => {
    let txt;
    if (g.type === 'score') txt = g.target >= 1000 ? `${(g.target / 1000).toLocaleString('pt-BR')}k` : g.target;
    else if (g.need) txt = Math.max(0, g.need - g.have);
    else txt = g.left;
    return `<div class="goal ${g.done ? 'done' : ''}"><img src="${goalIcon(g)}" alt=""><span>${g.done ? '✓' : txt}</span></div>`;
  }).join('');
}

function banner(text, ms = 1400) {
  const b = $('banner');
  b.textContent = text;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('show'), ms);
}

function resetIdle() {
  view.hint = null;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (!busy && game && !game.ended) view.hint = game.hint(); }, 5000);
}

async function playPhases(phases) {
  let maxStep = 0;
  for (const ph of phases) {
    if (ph.t === 'swap') ph.back ? sfx.bad() : sfx.swap();
    if (ph.t === 'clear') {
      sfx.match(ph.step);
      maxStep = Math.max(maxStep, ph.step);
      for (const e of ph.effects) { if (e.type === 'row' || e.type === 'col') sfx.line(); else if (e.type === 'blast') sfx.blast(); else sfx.bomb(); }
      if (ph.created.length) sfx.special();
      if (ph.step === 2) banner('Delícia!', 900);
      if (ph.step === 4) banner('Porcotástico!', 900);
      if (ph.step === 6) banner('DOCÃÃÃO!', 900);
    }
    if (ph.t === 'collect') { sfx.collect(); banner('Trufa entregue!', 900); }
    if (ph.t === 'spread') sfx.spread();
    if (ph.t === 'shuffle') { sfx.shuffle(); banner('Sem jogadas: embaralhando!', 1200); }
    await view.apply(ph);
    updateHud();
  }
  return maxStep;
}

async function doSwap(a, b) {
  if (busy || !game || game.ended) return;
  if (!game.canSwap(a, b)) return;
  busy = true;
  view.sel = null; view.hint = null;
  const res = game.swap(a, b);
  if (!res) { busy = false; return; }
  const maxStep = await playPhases(res.phases);
  if (res.valid && maxStep >= 2) { setMood('feliz'); setTimeout(() => game && !game.ended && setMood(game.movesLeft <= 3 ? 'triste' : 'neutro'), 1500); }
  else if (res.valid) setMood(game.movesLeft <= 3 ? 'triste' : 'neutro');
  if (game.isWon()) return finishWin();
  if (game.isLost()) return finishLose();
  busy = false;
  resetIdle();
}

async function finishWin() {
  busy = true;
  setMood('feliz');
  sfx.oink();
  banner(game.movesLeft > 0 ? 'Festa do Docão!' : 'Conseguiu!', 1600);
  await new Promise((r) => setTimeout(r, 700));
  view.speed = 1.6;
  await playPhases(game.bonus());
  view.speed = 1;
  const stars = game.stars();
  save.stars[levelN] = Math.max(save.stars[levelN] || 0, stars);
  save.best[levelN] = Math.max(save.best[levelN] || 0, game.score);
  if (levelN + 1 > save.max) save.max = Math.min(LEVEL_COUNT, levelN + 1);
  if (levelN === LEVEL_COUNT) save.max = LEVEL_COUNT;
  persist();
  sfx.win();
  const last = levelN >= LEVEL_COUNT;
  modal(`<div class="mDocao win">${docaoSVG('feliz')}</div><h2>${['', 'Boa!', 'Muito bom!', 'Porcotástico!'][stars]}</h2>
    <div class="mstars big">${[1, 2, 3].map((i) => `<span class="pop" style="animation-delay:${i * 0.25}s">${STAR_SVG(stars >= i)}</span>`).join('')}</div>
    <p class="mscore">${game.score.toLocaleString('pt-BR')} pontos</p>
    ${last ? '<p class="tip">Você zerou o Docão Crush! O Docão tá orgulhoso.</p>' : ''}
    <div class="row"><button class="btn ghost" id="mMap">Mapa</button>${last ? '' : '<button class="btn" id="mNext">Próxima fase</button>'}</div>`);
  [1, 2, 3].forEach((i) => stars >= i && setTimeout(() => sfx.star(i - 1), 250 * i + 300));
  $('mMap').onclick = () => { sfx.click(); closeModal(); renderMap(); };
  if (!last) $('mNext').onclick = () => { sfx.click(); closeModal(); levelIntro(levelN + 1); };
}

function finishLose() {
  busy = true;
  game.ended = true;
  setMood('triste');
  sfx.lose();
  const left = game.goalStatus().filter((g) => !g.done);
  modal(`<div class="mDocao lose">${docaoSVG('triste')}</div><h2>Acabaram as jogadas!</h2>
    <p class="tip">O Docão ficou tristinho. Faltou:</p>
    <ul class="goals">${left.map((g) => `<li><img src="${goalIcon(g)}" alt=""><span>${g.need ? `faltou ${Math.max(0, g.need - g.have)} de ${g.need}` : g.type === 'score' ? `${(g.target - game.score).toLocaleString('pt-BR')} pontos` : `${g.left} restante${g.left > 1 ? 's' : ''}`}</span></li>`).join('')}</ul>
    <div class="row"><button class="btn ghost" id="mMap">Mapa</button><button class="btn" id="mRetry">Tentar de novo</button></div>`);
  $('mMap').onclick = () => { sfx.click(); closeModal(); renderMap(); };
  $('mRetry').onclick = () => { sfx.click(); closeModal(); startLevel(levelN); };
}

$('btnQuit').onclick = () => {
  sfx.click();
  modal(`<h2>Pausa</h2><p class="tip">Fase ${levelN} · ${game.movesLeft} jogadas restantes</p>
    <div class="row col"><button class="btn" id="pCont">Continuar</button><button class="btn ghost" id="pRetry">Recomeçar</button><button class="btn ghost" id="pMap">Sair pro mapa</button></div>`);
  $('pCont').onclick = () => { sfx.click(); closeModal(); };
  $('pRetry').onclick = () => { sfx.click(); closeModal(); startLevel(levelN); };
  $('pMap').onclick = () => { sfx.click(); closeModal(); if (game) game.ended = true; renderMap(); };
};

// ---------- entrada: arrastar ou tocar duas peças ----------
let drag = null;
const cv = $('board');
cv.addEventListener('pointerdown', (e) => {
  if (busy || !game) return;
  sfx.unlock();
  const [r, c] = view.cellAt(e.clientX, e.clientY);
  if (!game.inside(r, c)) return;
  resetIdle();
  if (view.sel && Math.abs(view.sel[0] - r) + Math.abs(view.sel[1] - c) === 1) { const a = view.sel; view.sel = null; doSwap(a, [r, c]); return; }
  const p = game.at(r, c);
  if (!Game.movable(p)) { view.sel = null; return; }
  view.sel = [r, c];
  drag = { r, c, x: e.clientX, y: e.clientY, id: e.pointerId };
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', (e) => {
  if (!drag || busy) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  const th = view.cell * 0.35;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
  const b = Math.abs(dx) > Math.abs(dy) ? [drag.r, drag.c + Math.sign(dx)] : [drag.r + Math.sign(dy), drag.c];
  const a = [drag.r, drag.c];
  drag = null;
  view.sel = null;
  doSwap(a, b);
});
const endDrag = () => { drag = null; };
cv.addEventListener('pointerup', endDrag);
cv.addEventListener('pointercancel', endDrag);

// ?fase=N abre direto (útil pra testes)
const q = new URLSearchParams(location.search);
if (q.get('fase')) { const n = Math.max(1, Math.min(LEVEL_COUNT, +q.get('fase'))); if (n <= save.max || q.has('livre')) startLevel(n); else renderMenu(); }
else renderMenu();
