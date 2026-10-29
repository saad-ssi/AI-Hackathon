"use client";

import { useEffect, useState } from "react";
import { arp, beep, COIN_IDS, setCrt, setSound, subscribe } from "./fx";

type View = { score: number; coins: number; sound: boolean; crt: boolean };

function useArcade(): View {
  const [v, setV] = useState<View>({ score: 0, coins: 0, sound: false, crt: false });
  useEffect(() => subscribe((s) => setV({ score: s.score, coins: s.coins.length, sound: s.sound, crt: s.crt })), []);
  return v;
}

export function HudScore() {
  const v = useArcade();
  return (
    <>
      <span className="hud-score" aria-label={`Score ${v.score}`}>
        <b>1UP</b> {String(v.score).padStart(6, "0")}
      </span>
      <span className="hud-coins" title="Hidden coins found across the site">
        ● {v.coins}/{COIN_IDS.length}
      </span>
    </>
  );
}

export function HudToggles() {
  const v = useArcade();
  return (
    <>
      <button
        type="button"
        className="tog"
        aria-pressed={v.sound}
        onClick={() => {
          setSound(!v.sound);
          arp([523, 659, 784, 1047]);
        }}
      >
        {v.sound ? "SOUND ON" : "SOUND"}
      </button>
      <button
        type="button"
        className="tog tog-crt"
        aria-pressed={v.crt}
        onClick={() => {
          setCrt(!v.crt);
          beep(300, 0.1);
        }}
      >
        CRT
      </button>
      {v.crt && <div className="crt" aria-hidden="true" />}
    </>
  );
}

export function HiScore() {
  const [hi, setHi] = useState(0);
  useEffect(() => subscribe((s) => setHi(Math.max(s.hi, 999999))), []);
  return <span>HI {String(hi).padStart(6, "0")}</span>;
}
