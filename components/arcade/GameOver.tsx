"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** The 404 page: an arcade "continue?" countdown. */
export default function GameOver() {
  const [n, setN] = useState(9);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="gameover">
      <p className="eyebrow">ERROR 404 · PAGE NOT FOUND</p>
      <h1>GAME OVER</h1>
      <p className="continue">{n > 0 ? <>CONTINUE? <span>{n}</span></> : "INSERT COIN"}</p>
      <Link href="/" className="btn">▶ CONTINUE</Link>
    </div>
  );
}
