"use client";

import { useEffect } from "react";
import { addScore, arp, beep, burst, levelUp, toast } from "./fx";

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
const BOT_PATH =
  "M292 82h315v110H292zM82 192h210v102H82zM607 192h210v102H607zM82 294h106v315H82zM712 294h105v315H712zM82 503h735v106H82zM292 347h106v105H292zM502 347h106v105H502zM292 609h106v102H292zM502 609h106v102H502zM82 711h211v108H82zM607 711h210v108H607z";

/** A pixel bot that runs across the bottom of the screen. */
function botRun() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = document.createElement("div");
  el.className = "arcade-runner";
  el.innerHTML = `<svg viewBox="82 82 735 737" shape-rendering="crispEdges" aria-hidden="true"><path fill="#3DDC97" d="${BOT_PATH}"/></svg>`;
  document.body.appendChild(el);
  el.animate([{ transform: "translateX(-80px)" }, { transform: `translateX(${innerWidth + 80}px)` }], { duration: 3200, easing: "steps(32)" }).onfinish = () =>
    el.remove();
  [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => setTimeout(() => beep(i % 2 ? 330 : 262, 0.05), i * 400));
}

// Site-wide easter eggs: Konami code, typed words, section bonuses, button blips, a console message,
// a "come back" tab title, and a celebration when a form goes through.
export default function Effects() {
  useEffect(() => {
    let k = 0;
    let typed = "";
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      k = key === KONAMI[k] ? k + 1 : key === KONAMI[0] ? 1 : 0;
      if (k === KONAMI.length) {
        k = 0;
        addScore(30000);
        toast("CHEAT ENABLED: +30,000. THE JUDGES WILL NOT ACCEPT THIS.", 3600);
        burst(innerWidth / 2, innerHeight / 3, undefined, 50);
        arp([392, 523, 659, 784, 1047], 70);
      }
      const t = e.target as HTMLElement | null;
      if (t && (t.matches("input, textarea, select") || t.isContentEditable)) return;
      if (key.length !== 1) return;
      typed = (typed + key).slice(-12);
      if (typed.endsWith("agent")) {
        typed = "";
        botRun();
        addScore(250);
      } else if (typed.endsWith("ship")) {
        typed = "";
        toast("SHIP IT! WORKING FIRST, FANCY LATER.");
        arp([523, 784, 1047]);
      }
    };
    addEventListener("keydown", onKey);

    // +100 the first time each section scrolls into view
    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      const seen = new Set<Element>();
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting && !seen.has(en.target)) {
              seen.add(en.target);
              addScore(100);
            }
          }),
        { threshold: 0.4 },
      );
      document.querySelectorAll(".arcade main section").forEach((s) => io!.observe(s));
    }

    // A short blip on buttons (only heard with sound on)
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.(".btn")) beep(660, 0.05);
    };
    document.addEventListener("click", onClick);

    // "Come back" tab title
    let title = document.title;
    const onVis = () => {
      if (document.hidden) {
        title = document.title;
        document.title = "PLAYER 1, COME BACK!";
      } else {
        document.title = title;
      }
    };
    document.addEventListener("visibilitychange", onVis);

    // Registration and submission success
    const onLevel = (e: Event) => levelUp((e as CustomEvent<string>).detail);
    addEventListener("arcade:levelup", onLevel);

    return () => {
      removeEventListener("keydown", onKey);
      io?.disconnect();
      document.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("arcade:levelup", onLevel);
    };
  }, []);

  useEffect(() => {
    const w = window as unknown as { __aatHello?: boolean };
    if (w.__aatHello) return;
    w.__aatHello = true;
    console.log(
      "%c AGENT-A-THON %c\nLooking under the hood? You'd fit right in.\nTry the Konami code, or type 'agent' anywhere on the page.",
      "font: 16px monospace; background:#E5333D; color:#fff; padding:4px 8px",
      "font: 12px monospace; color:#FFD23F",
    );
  }, []);

  return null;
}
