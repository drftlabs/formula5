"use client";
import { useEffect, useRef } from "react";
// Fades + lifts its children in as they scroll into view (no bounce).
export default function Reveal({ children, className = "", delay = 0, as: Tag = "div", style, ...rest }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!("IntersectionObserver" in window)) { el.classList.add("in"); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={"rv " + className} style={{ "--d": delay + "ms", ...style }} {...rest}>{children}</Tag>;
}
