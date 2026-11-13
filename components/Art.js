"use client";
import { useState } from "react";
import Bottle from "./Bottle";
// Pack shot for one product: the real photo when there is one (falls back to the drawn pack if it can't load).
export function Shot({ p, scale }) {
  const [bad, setBad] = useState(false);
  const src = p.images?.[0];
  if (!src || bad) return <Bottle product={p} scale={scale} />;
  return <div className="f5-artimg" style={{ "--sc": scale }}><img src={src} alt="" loading="eager" decoding="async" onError={() => setBad(true)} /></div>;
}
// Arch, podium and floating orbs with the pack(s) standing on it.
export default function Art({ items = [], className = "" }) {
  const n = items.length;
  return (
    <div className={"f5-artbox " + className} aria-hidden="true">
      <i className="f5-arch" /><i className="f5-orb o1" /><i className="f5-orb o2" /><i className="f5-orb o3" />
      <div className="f5-artrow">{items.slice(0, 3).map((p, k) => <Shot key={p.id} p={p} scale={n === 1 ? 1.25 : k === 1 && n === 3 ? 1.1 : 0.92} />)}</div>
      <i className="f5-pod" />
    </div>
  );
}
