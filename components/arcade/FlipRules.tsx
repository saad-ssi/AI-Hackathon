"use client";

import Link from "next/link";
import { useState } from "react";
import { beep } from "./fx";

export type RuleCard = { title: string; text: string; color: string };

/** House rules as flip cards: the rule on the front, the detail on the back. */
export default function FlipRules({ rules }: { rules: RuleCard[] }) {
  const [open, setOpen] = useState<boolean[]>(() => rules.map(() => false));
  return (
    <div className="rules-grid">
      {rules.map((r, i) => (
        <button
          key={r.title}
          type="button"
          className="flip"
          aria-pressed={open[i]}
          onClick={() => {
            setOpen((o) => o.map((v, j) => (j === i ? !v : v)));
            beep(open[i] ? 440 : 660, 0.06);
          }}
        >
          <div className="in">
            <div className="face">
              <span className="n" style={{ color: r.color }}>{i + 1}</span>
              <h3>{r.title.toUpperCase()}</h3>
              <span className="hint">TAP TO FLIP ▶</span>
            </div>
            <div className="face back">
              <span className="n" style={{ color: r.color }}>{i + 1}</span>
              <p>{r.text}</p>
            </div>
          </div>
        </button>
      ))}
      <Link href="/rules" className="flip flip-link">
        <div className="in">
          <div className="face">
            <span className="n" style={{ color: "var(--red)" }}>▶</span>
            <h3>FULL RULES + CRITERIA</h3>
            <p>Every detail, plus the tools and platform.</p>
            <span className="hint">OPEN ▶</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
