"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShop } from "./ShopProvider";
import { opt } from "@/lib/img";
import { inr } from "@/lib/format";

const HELLO = "Namaste! 🙏 Main Rohan hoon, Formula 5 ka AI assistant.\nBatayiye aap kaunsi problem face kar rahe hain? Hindi, Hinglish ya English, jo aapko theek lage.";
const CHIPS = ["Hair fall / growth", "Skin glow / dark circles", "Acne / face cleansing", "Energy / stamina", "Track my order", "How to order"];
const KEY = "f5_chat_v1";

// "text [[product:slug]] [[chips: a | b]]" -> clean text + quick replies
function parse(t) {
  let chips = [];
  const clean = String(t || "").replace(/\[\[chips:([^\]]*)\]\]/gi, (m, c) => { chips = c.split("|").map((x) => x.trim()).filter(Boolean).slice(0, 3); return ""; }).replace(/\[\[product:[^\]]+\]\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
  return { text: clean, chips };
}
const Rich = ({ t }) => t.split("\n").map((line, i) => <p key={i}>{line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => /^\*\*.+\*\*$/.test(part) ? <b key={j}>{part.slice(2, -2)}</b> : part)}</p>);

export default function F5Chat() {
  const path = usePathname() || "", { qc } = useShop();
  const [open, setOpen] = useState(false), [msgs, setMsgs] = useState([]), [text, setText] = useState(""), [busy, setBusy] = useState(false);
  const end = useRef(), input = useRef();
  useEffect(() => { try { const s = JSON.parse(sessionStorage.getItem(KEY) || "[]"); if (Array.isArray(s)) setMsgs(s); } catch {} }, []);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch {} }, [msgs]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, busy, open]);
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 250); }, [open]);
  const hide = path.startsWith("/checkout") || qc;
  if (hide) return null;

  async function send(t) {
    const q = String(t ?? text).trim(); if (!q || busy) return;
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }) });
      const d = await r.json();
      setMsgs([...next, { role: "assistant", content: d.reply || "Sorry, try again.", cards: d.cards || [] }]);
    } catch { setMsgs([...next, { role: "assistant", content: "Network problem. Please try again. / Network issue hai, dobara try kijiye." }]); }
    setBusy(false);
  }
  const lastA = [...msgs].reverse().find((m) => m.role === "assistant");
  const quick = !msgs.length ? CHIPS : lastA && msgs[msgs.length - 1] === lastA ? parse(lastA.content).chips : [];

  return (
    <>
      <button className={"f5ai-fab" + (open ? " hide" : "")} onClick={() => setOpen(true)} aria-label="Chat with Rohan, F5 AI assistant">
        <img src="/rohan.svg" alt="" width="56" height="56" /><i aria-hidden="true" />
      </button>
      {open && (
        <div className="f5ai" role="dialog" aria-label="Chat with Rohan, F5 AI">
          <div className="f5ai-head">
            <img src="/rohan.svg" alt="" width="40" height="40" />
            <div><b>Rohan</b><small><i /> F5 AI · Online</small></div>
            <button onClick={() => setOpen(false)} aria-label="Close chat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
          <div className="f5ai-body">
            <div className="f5ai-m a"><Rich t={HELLO} /></div>
            {msgs.map((m, i) => {
              const p = m.role === "assistant" ? parse(m.content) : { text: m.content };
              return (
                <div key={i} className={"f5ai-m " + (m.role === "user" ? "u" : "a")}>
                  <Rich t={p.text} />
                  {m.cards?.map((c) => (
                    <Link key={c.slug} href={`/products/${c.slug}`} className="f5ai-card" onClick={() => setOpen(false)}>
                      {c.image ? <img src={opt(c.image, 128)} alt="" width="56" height="56" loading="lazy" /> : <i />}
                      <span><b>{c.name}</b><small>{inr(c.price)}{c.mrp > c.price && <s>{inr(c.mrp)}</s>}</small></span>
                      <em>View →</em>
                    </Link>
                  ))}
                </div>
              );
            })}
            {busy && <div className="f5ai-m a typing" aria-label="Rohan is typing"><span /><span /><span /></div>}
            <div ref={end} />
          </div>
          {quick.length > 0 && !busy && <div className="f5ai-chips">{quick.map((c) => <button key={c} onClick={() => send(c)}>{c}</button>)}</div>}
          <form className="f5ai-in" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Apni problem likhiye…" aria-label="Type your message" />
            <button type="submit" disabled={busy || !text.trim()} aria-label="Send"><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-7-7-1z" /></svg></button>
          </form>
        </div>
      )}
    </>
  );
}
