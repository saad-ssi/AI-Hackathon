"use client";

// Shared arcade state for the easter eggs: score, hi-score, collected coins and the sound switch.
// Kept in the browser only (localStorage, wrapped in try/catch), so it's per visitor and never sent anywhere.

export const COIN_IDS = ["hero", "dates", "quests", "rules", "prize", "use-cases", "rubric", "guide", "register", "submit"] as const;
export type CoinId = (typeof COIN_IDS)[number];

type State = { score: number; hi: number; coins: string[]; sound: boolean; crt: boolean };
const KEY = "agent-a-thon-arcade";
const EMPTY: State = { score: 0, hi: 0, coins: [], sound: false, crt: false };

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<(s: State) => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") state = { ...EMPTY, ...saved, coins: Array.isArray(saved.coins) ? saved.coins : [] };
  } catch {}
  // The score starts again each visit; the hi-score and coins carry over
  try {
    if (!sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, "1");
      state = { ...state, score: 0 };
    }
  } catch {}
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((fn) => fn(state));
}

export function getState(): State {
  load();
  return state;
}

export function subscribe(fn: (s: State) => void) {
  load();
  listeners.add(fn);
  fn(state);
  return () => {
    listeners.delete(fn);
  };
}

export function setSound(on: boolean) {
  load();
  state = { ...state, sound: on };
  save();
}

export function setCrt(on: boolean) {
  load();
  state = { ...state, crt: on };
  save();
}

const reducedMotion = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- sound (off until the visitor turns it on) ---------- */
let ctx: AudioContext | null = null;
export function beep(freq = 880, dur = 0.06, type: OscillatorType = "square", vol = 0.05, slideTo?: number) {
  if (!getState().sound) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx || new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {}
}

export const arp = (notes: number[], step = 70) => notes.forEach((n, i) => setTimeout(() => beep(n, 0.09), i * step));

/* ---------- score, pixel bursts, toasts ---------- */
export function addScore(n: number, x?: number, y?: number) {
  load();
  const score = state.score + n;
  state = { ...state, score, hi: Math.max(state.hi, score) };
  save();
  if (x != null && y != null) {
    const p = document.createElement("span");
    p.className = "arcade-pop";
    p.textContent = "+" + n;
    p.style.left = x + "px";
    p.style.top = y + "px";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
}

export function burst(x: number, y: number, colors = ["#FFD23F", "#E5333D", "#F2F2F2", "#3DDC97"], n = 18) {
  if (reducedMotion()) return;
  for (let i = 0; i < n; i++) {
    const b = document.createElement("i");
    b.className = "arcade-bit";
    b.style.background = colors[i % colors.length];
    b.style.left = x + "px";
    b.style.top = y + "px";
    document.body.appendChild(b);
    const a = Math.random() * Math.PI * 2;
    const s = 40 + Math.random() * 90;
    b.animate(
      [
        { transform: "translate(0,0)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * s}px,${Math.sin(a) * s + 40}px)`, opacity: 0 },
      ],
      { duration: 650 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.4,1)" },
    ).onfinish = () => b.remove();
  }
}

export function toast(msg: string, ms = 2600) {
  const t = document.createElement("div");
  t.className = "arcade-toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

/* ---------- hidden coins ---------- */
export function hasCoin(id: CoinId) {
  return getState().coins.includes(id);
}

export function collectCoin(id: CoinId, x: number, y: number) {
  load();
  if (state.coins.includes(id)) return;
  state = { ...state, coins: [...state.coins, id] };
  save();
  burst(x, y, ["#FFD23F", "#C99A12", "#FFFFFF"], 14);
  beep(988, 0.06);
  setTimeout(() => beep(1319, 0.12), 70);
  addScore(500, x, y);
  const found = state.coins.length;
  if (found === COIN_IDS.length) {
    toast(`EXTRA LIFE! YOU FOUND ALL ${COIN_IDS.length} COINS.`, 3600);
    arp([523, 659, 784, 1047, 1319, 1568], 80);
    burst(innerWidth / 2, innerHeight / 2, undefined, 40);
  } else {
    toast(`COIN ${found}/${COIN_IDS.length}. ${found === 1 ? "THERE ARE MORE ON OTHER PAGES." : "KEEP LOOKING."}`, 1800);
  }
}

/** Big celebration, used when a registration or submission goes through. */
export function levelUp(msg: string) {
  burst(innerWidth / 2, innerHeight / 3, undefined, 50);
  arp([392, 523, 659, 784, 1047], 70);
  addScore(1000);
  toast(msg, 3600);
}
