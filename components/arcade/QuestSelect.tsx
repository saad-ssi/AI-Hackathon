"use client";

import { useEffect, useRef, useState } from "react";
import type { Agent } from "@/lib/config";
import Bot from "./Bot";
import { beep } from "./fx";

export type Quest = { tag: string; name: string; desc: string; team: Agent[] };

/** Character-select view of the use cases. Arrow keys switch quests while the section is on screen. */
export default function QuestSelect({ quests }: { quests: Quest[] }) {
  const [qi, setQi] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  function pick(i: number) {
    const next = (i + quests.length) % quests.length;
    setQi(next);
    quests[next].team.forEach((_, j) => setTimeout(() => beep(523 + j * 130, 0.07), j * 120));
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = box.current?.getBoundingClientRect();
      if (!r || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
      if ((e.target as HTMLElement).matches?.("input, textarea, select")) return;
      if (r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.3) {
        e.preventDefault();
        setQi((cur) => {
          const next = (cur + (e.key === "ArrowRight" ? 1 : -1) + quests.length) % quests.length;
          quests[next].team.forEach((_, j) => setTimeout(() => beep(523 + j * 130, 0.07), j * 120));
          return next;
        });
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [quests]);

  const q = quests[qi];
  return (
    <div className="select" ref={box}>
      <div className="qlist" role="tablist" aria-label="Quests">
        {quests.map((x, i) => (
          <button key={x.name} type="button" className="q" role="tab" aria-selected={i === qi} onClick={() => pick(i)}>
            <span className="qtag">{x.tag}</span>
            <h3>{x.name}</h3>
          </button>
        ))}
      </div>
      <div className="qcard" role="tabpanel" aria-live="polite">
        <span className="eyebrow">{q.tag}</span>
        <h3>{q.name}</h3>
        <p>{q.desc}</p>
        <div className="team" key={qi}>
          {q.team.map((a, j) => (
            <div className="agent" key={j} style={{ animationDelay: `${j * 120}ms` }}>
              <Bot color={a.color} size={54} />
              <span>{a.label}</span>
            </div>
          ))}
        </div>
        <span className="keys">USE ← → TO SWITCH QUESTS</span>
      </div>
    </div>
  );
}
