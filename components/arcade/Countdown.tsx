"use client";

import { useEffect, useRef, useState } from "react";

export type Milestone = { at: string | null; label: string };

/** Counts down to the next milestone; the dates come from lib/config.ts. */
export default function Countdown({ milestones, done }: { milestones: Milestone[]; done: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const next = now == null ? null : milestones.find((m) => m.at && new Date(m.at).getTime() > now);
  const ms = next && now != null ? new Date(next.at!).getTime() - now : 0;
  const parts: [string, number][] = [
    ["DAYS", Math.floor(ms / 864e5)],
    ["HRS", Math.floor(ms / 36e5) % 24],
    ["MIN", Math.floor(ms / 6e4) % 60],
    ["SEC", Math.floor(ms / 1e3) % 60],
  ];

  return (
    <div className="timer" aria-live="off">
      <span className="lbl">{now == null ? " " : next ? `${next.label} IN` : done}</span>
      {(now == null || next) && (
        <div className="digits">
          {parts.map(([unit, v]) => (
            <Digit key={unit} unit={unit} value={now == null ? "--" : String(v).padStart(2, "0")} />
          ))}
        </div>
      )}
    </div>
  );
}

function Digit({ unit, value }: { unit: string; value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value && ref.current) {
      ref.current.classList.remove("tick");
      void ref.current.offsetWidth;
      ref.current.classList.add("tick");
    }
    last.current = value;
  }, [value]);
  return (
    <div className="digit" ref={ref}>
      <span>{value}</span>
      <small>{unit}</small>
    </div>
  );
}
