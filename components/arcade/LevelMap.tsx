"use client";

import { useEffect, useState } from "react";
import Bot from "./Bot";

export type Level = { tag: string; name: string; when: string; at: string | null; color: string };

/** The key dates as a level map, with the bot standing where today falls. */
export default function LevelMap({ levels }: { levels: Level[] }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const times = levels.map((l) => (l.at ? new Date(l.at).getTime() : Infinity));
  const n = levels.length;
  let pos = 0;
  if (now != null) {
    if (now >= times[n - 1]) pos = 100;
    else if (now > times[0]) {
      for (let i = 0; i < n - 1; i++) {
        if (now < times[i + 1]) {
          const span = times[i + 1] - times[i];
          pos = ((i + (Number.isFinite(span) ? (now - times[i]) / span : 0)) / (n - 1)) * 100;
          break;
        }
      }
    }
  }

  return (
    <div className="map">
      <div className="track">
        <div className="done" style={{ width: `${pos}%` }} />
        {levels.map((l, i) => (
          <div key={l.tag} className={`node${now != null && now >= times[i] ? " passed" : ""}`} style={{ left: `${(i / (n - 1)) * 100}%` }}>
            <div className="tip">
              <b style={{ color: l.color }}>{l.tag}</b>
              <span>{l.name}</span>
              <em>{l.when}</em>
            </div>
          </div>
        ))}
        {now != null && (
          <div className="walker" style={{ left: `${pos}%` }}>
            <span className="you">YOU</span>
            <Bot color="#FFD23F" size={44} />
          </div>
        )}
      </div>
      <div className="map-spacer" />
    </div>
  );
}
