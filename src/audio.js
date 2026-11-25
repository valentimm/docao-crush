// Efeitos sonoros sintetizados (WebAudio), sem arquivos.
let ac = null;
let muted = localStorage.getItem('docao-crush-mute') === '1';
export const isMuted = () => muted;
export function setMuted(m) { muted = m; localStorage.setItem('docao-crush-mute', m ? '1' : '0'); }
function ctx() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(freq, dur = 0.12, type = 'sine', vol = 0.18, slide = 0, delay = 0) {
  if (muted) return; const a = ctx(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur = 0.3, vol = 0.25, lp = 900) {
  if (muted) return; const a = ctx(); if (!a) return;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource(); s.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
  const g = a.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination); s.start();
}
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
export const sfx = {
  unlock() { ctx(); },
  click() { tone(660, 0.06, 'triangle', 0.12); },
  swap() { tone(420, 0.08, 'triangle', 0.12, 1.4); },
  bad() { tone(220, 0.1, 'square', 0.08, 0.7); tone(180, 0.12, 'square', 0.06, 0.7, 0.08); },
  match(step) { const n = PENTA[Math.min(PENTA.length - 1, step)]; const f = 523 * 2 ** (n / 12); tone(f, 0.14, 'sine', 0.2); tone(f * 1.5, 0.1, 'triangle', 0.08, 1, 0.03); },
  line() { tone(900, 0.25, 'sawtooth', 0.06, 0.3); noise(0.15, 0.08, 3000); },
  blast() { noise(0.35, 0.3, 700); tone(120, 0.3, 'sine', 0.25, 0.5); },
  bomb() { for (let i = 0; i < 6; i++) tone(700 + i * 160, 0.12, 'triangle', 0.1, 1.2, i * 0.04); noise(0.4, 0.2, 1500); },
  special() { tone(880, 0.1, 'triangle', 0.14); tone(1320, 0.16, 'triangle', 0.12, 1, 0.07); },
  collect() { tone(988, 0.1, 'sine', 0.15); tone(1319, 0.2, 'sine', 0.15, 1, 0.08); },
  oink() { tone(300, 0.08, 'sawtooth', 0.12, 1.6); tone(380, 0.12, 'sawtooth', 0.1, 0.6, 0.09); },
  spread() { tone(140, 0.2, 'sine', 0.2, 0.6); },
  shuffle() { for (let i = 0; i < 5; i++) tone(300 + i * 80, 0.06, 'triangle', 0.08, 1, i * 0.05); },
  win() { [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(523 * 2 ** (n / 12), 0.22, 'triangle', 0.16, 1, i * 0.09)); },
  lose() { [7, 4, 0, -5].forEach((n, i) => tone(392 * 2 ** (n / 12), 0.3, 'sine', 0.16, 0.97, i * 0.2)); },
  star(i) { tone(784 * 2 ** (i * 4 / 12), 0.25, 'triangle', 0.18); },
};
