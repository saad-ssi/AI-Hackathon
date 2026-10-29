"use client";

import { useRef } from "react";
import Bot from "./Bot";
import { addScore, arp, burst } from "./fx";

/** The prize: a pixel iPad that tilts toward the cursor and celebrates when clicked. */
export default function IPad() {
  const ipad = useRef<HTMLButtonElement>(null);
  return (
    <div
      className="tilt"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        if (!ipad.current) return;
        ipad.current.style.transform = `rotateY(${x * 24}deg) rotateX(${-y * 20}deg)`;
        ipad.current.style.boxShadow = `${16 - x * 20}px ${16 - y * 20}px 0 #E5333D`;
      }}
      onPointerLeave={() => {
        if (!ipad.current) return;
        ipad.current.style.transform = "";
        ipad.current.style.boxShadow = "";
      }}
    >
      <button
        type="button"
        ref={ipad}
        className="ipad"
        aria-label="The prize: an Apple iPad"
        onClick={(e) => {
          burst(e.clientX, e.clientY);
          arp([784, 988, 1175, 1568], 60);
          addScore(100, e.clientX, e.clientY);
        }}
      >
        <span className="cam" />
        <span className="scr">
          <Bot color="#E5333D" size={96} />
          <span>YOU WIN!</span>
        </span>
      </button>
    </div>
  );
}
