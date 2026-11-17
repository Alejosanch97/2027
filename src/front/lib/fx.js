// Efectos: confeti y sonidos generados con WebAudio (sin archivos).
import confetti from "canvas-confetti";

const PALETTE = ["#E8B95B", "#F3EEE4", "#BFE0EE", "#E27D60", "#5FA57C"];
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function burst(power = 1, origin = { x: 0.5, y: 0.6 }) {
  if (calm()) return;
  confetti({ particleCount: Math.round(70 * power), spread: 70 + 20 * power, startVelocity: 38 + 8 * power, origin, colors: PALETTE, scalar: 0.9 });
}
export function fireworks(ms = 2200) {
  if (calm()) return;
  const end = Date.now() + ms;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: PALETTE });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: PALETTE });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

let ctx;
const audio = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
export const soundOn = () => localStorage.getItem("c27_sound") !== "off";
export const setSound = (on) => localStorage.setItem("c27_sound", on ? "on" : "off");

function tone(freq, start, dur, type = "sine", gain = 0.08) {
  const a = audio(), o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start); o.stop(a.currentTime + start + dur + 0.05);
}
const SOUNDS = {
  tick: [[660, 0, 0.12]], coin: [[880, 0, 0.1], [1320, 0.08, 0.2]],
  win: [[523, 0, 0.18], [659, 0.12, 0.18], [784, 0.24, 0.18], [1047, 0.36, 0.4]],
  bell: [[528, 0, 1.2], [792, 0.02, 0.9]], lose: [[300, 0, 0.2], [220, 0.15, 0.3]],
};
export function play(name) {
  if (!soundOn()) return;
  try { SOUNDS[name].forEach(([f, s, d]) => tone(f, s, d, name === "bell" ? "sine" : "triangle")); } catch { /* sin audio */ }
}

// Ruido marrón suave para concentrarse ("viento de páramo")
let noise;
export function ambient(on) {
  try {
    if (!on) { noise?.stop(); noise = null; return; }
    if (noise) return;
    const a = audio(), len = a.sampleRate * 4, buf = a.createBuffer(1, len, a.sampleRate), data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.2; }
    const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    src.buffer = buf; src.loop = true; f.type = "lowpass"; f.frequency.value = 520; g.gain.value = 0.35;
    src.connect(f).connect(g).connect(a.destination); src.start(); noise = src;
  } catch { /* sin audio */ }
}
