"use client";

import { useEffect, useRef, useState } from "react";
import { BotRects } from "./Bot";
import { addScore, beep, toast } from "./fx";

// The animated Agent-A-Thon title from the marketing site: the bot drops in, the title slams, the eyes follow the cursor.
export default function Logo() {
  const logo = useRef<SVGSVGElement>(null);
  const eyes = useRef<SVGGElement>(null);
  const bot = useRef<SVGGElement>(null);
  const [run, setRun] = useState(0);
  const clicks = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = logo.current?.getBoundingClientRect();
      if (!r || !eyes.current) return;
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.32;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 400));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 300));
      eyes.current.setAttribute("transform", `translate(${Math.round(dx * 50)} ${Math.round(dy * 40)})`);
    };
    addEventListener("pointermove", onMove);
    return () => removeEventListener("pointermove", onMove);
  }, [run]);

  function hop(e: React.MouseEvent) {
    const b = bot.current;
    if (!b) return;
    clicks.current++;
    const dizzy = clicks.current % 10 === 0;
    b.classList.remove("hop", "dizzy");
    void b.getBoundingClientRect();
    b.classList.add(dizzy ? "dizzy" : "hop");
    beep(440, 0.15, "square", 0.05, 1200);
    addScore(50, e.clientX, e.clientY);
    if (dizzy) toast("THE BOT IS DIZZY. MAYBE BUILD YOUR OWN?");
  }

  function replay() {
    setRun((n) => n + 1);
    [0, 500, 1100, 2200].forEach((t, i) => setTimeout(() => beep([880, 220, 660, 110][i], i === 3 ? 0.25 : 0.08, "square", 0.06), t));
  }

  return (
    <>
      <svg
        key={run}
        ref={logo}
        className="aat-logo"
        viewBox="60 60 1160 630"
        role="img"
        aria-label="SSI presents Agent-A-Thon. One weekend. One builder. One live agent. Click the bot."
      >
        <defs>
          <path id="aat-arc" d="M 90 492 Q 640 348 1190 492" />
        </defs>
        <text className="presents" x="640" y="122" textAnchor="middle" fill="#C9CAD3" style={{ fontFamily: "var(--sk)", fontSize: 30, letterSpacing: 9 }}>
          SSI PRESENTS
        </text>
        <g className="bot" ref={bot} onClick={hop}>
          <svg x="560" y="160" width="160" height="160" viewBox="82 82 735 737" shapeRendering="crispEdges">
            <g fill="#E5333D">
              <BotRects withEyes={false} />
              <g ref={eyes}>
                <rect x="292" y="347" width="106" height="105" />
                <rect x="502" y="347" width="106" height="105" />
              </g>
            </g>
          </svg>
        </g>
        <g className="slam" style={{ fontFamily: "var(--px)", fontSize: 78, letterSpacing: 2 }}>
          <text transform="translate(0 15)" fill="#5C0E14">
            <textPath href="#aat-arc" startOffset="50%" textAnchor="middle">AGENT-A-THON</textPath>
          </text>
          <text transform="translate(0 10)" fill="#8E1820">
            <textPath href="#aat-arc" startOffset="50%" textAnchor="middle">AGENT-A-THON</textPath>
          </text>
          <text transform="translate(0 5)" fill="#BB2029">
            <textPath href="#aat-arc" startOffset="50%" textAnchor="middle">AGENT-A-THON</textPath>
          </text>
          <text fill="#FFFFFF">
            <textPath href="#aat-arc" startOffset="50%" textAnchor="middle">
              AGENT-<tspan fill="#E5333D">A</tspan>-THON
            </textPath>
          </text>
        </g>
        <rect className="wcover" x="60" y="300" width="1200" height="240" fill="#0E0F14" />
        <text x="640" y="602" textAnchor="middle" fill="#F2F2F2" style={{ fontFamily: "var(--sk)", fontSize: 26, letterSpacing: 2 }}>
          ONE WEEKEND. ONE BUILDER. <tspan fill="#E5333D">ONE LIVE AGENT.</tspan>
        </text>
        <rect className="tcover" x="60" y="570" width="1200" height="50" fill="#0E0F14" />
      </svg>
      <button type="button" className="replay" onClick={replay}>
        ↻ REPLAY INTRO
      </button>
    </>
  );
}
