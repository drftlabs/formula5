"use client";
import { useEffect } from "react";
// Keeps the page at a fixed scale (no pinch / double-tap zoom). Photos have their own zoom.
export default function PageGuard() {
  useEffect(() => {
    const stop = (e) => e.preventDefault();
    const multi = (e) => { if (e.touches && e.touches.length > 1 && !e.target.closest?.(".lb")) e.preventDefault(); };
    document.addEventListener("gesturestart", stop); document.addEventListener("gesturechange", stop);
    document.addEventListener("touchmove", multi, { passive: false });
    return () => { document.removeEventListener("gesturestart", stop); document.removeEventListener("gesturechange", stop); document.removeEventListener("touchmove", multi); };
  }, []);
  return null;
}
