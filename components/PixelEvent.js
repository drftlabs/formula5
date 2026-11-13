"use client";
import { useEffect } from "react";
import { track } from "@/lib/track";

// Fires one Meta Pixel event when it appears on screen. once = key so a reload never double-counts (used for Purchase).
export default function PixelEvent({ event, data, eventId, once }) {
  useEffect(() => {
    if (once) { try { if (localStorage.getItem("px_" + once)) return; localStorage.setItem("px_" + once, "1"); } catch {} }
    const t = setTimeout(() => track(event, data, eventId), 600);   // let the pixel script load first
    return () => clearTimeout(t);
  }, []); // eslint-disable-line
  return null;
}
