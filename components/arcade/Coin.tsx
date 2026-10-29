"use client";

import { useEffect, useState } from "react";
import { type CoinId, collectCoin, subscribe } from "./fx";

/** A hidden coin. Each one can be collected once per visitor; the HUD counts them across the whole site. */
export default function Coin({ id, style }: { id: CoinId; style: React.CSSProperties }) {
  const [show, setShow] = useState(false);
  useEffect(() => subscribe((s) => setShow(!s.coins.includes(id))), [id]);
  if (!show) return null;
  return (
    <button type="button" className="coin" style={style} aria-label="Hidden coin" onClick={(e) => collectCoin(id, e.clientX, e.clientY)}>
      A
    </button>
  );
}
