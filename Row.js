"use client";
import { useRouter } from "next/navigation";

/** A table row you can click anywhere to open `href` (links and buttons inside still work on their own). */
export default function Row({ href, children, className = "" }) {
  const router = useRouter();
  const open = (e) => {
    if (e.target.closest("a,button,input,select,textarea,label")) return;
    if (e.metaKey || e.ctrlKey) window.open(href, "_blank"); else router.push(href);
  };
  return <tr className={"clk " + className} tabIndex={0} onClick={open} onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) router.push(href); }}>{children}</tr>;
}
