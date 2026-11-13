"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePage, resetPage } from "@/lib/actions/admin";

export default function PageEditor({ slug, title, body, customised, defaultTitle }) {
  const [t, setT] = useState(title), [b, setB] = useState(body), [msg, setMsg] = useState(null), [pending, start] = useTransition(), router = useRouter();
  return (
    <details className="row-card">
      <summary><b>{defaultTitle}</b>{customised && <span className="pill" style={{ background: "#EDE8DC" }}>edited</span>}<span className="mut">/policies/{slug}</span></summary>
      <div className="body"><div className="af" style={{ paddingTop: 14 }}>
        <div className="full"><label>Page title</label><input className="in" value={t} onChange={(e) => setT(e.target.value)} /></div>
        <div className="full"><label>Content</label><textarea className="in" style={{ minHeight: 360, fontFamily: "monospace", fontSize: 12, lineHeight: 1.6 }} value={b} onChange={(e) => setB(e.target.value)} /><p className="hint">Use “## Heading” for headings, “- ” for bullets, **bold**. Tokens like {"{{email}}"} fill from Settings.</p></div>
      </div>
        <div className="acts">
          <button className="abtn" disabled={pending} onClick={() => start(async () => { const r = await savePage(slug, t, b); setMsg(r.error ? { err: r.error } : { ok: "Saved" }); router.refresh(); })}>Save page</button>
          {customised && <button className="abtn ghost sm" disabled={pending} onClick={() => confirm("Reset to the default text?") && start(async () => { await resetPage(slug); router.refresh(); })}>Reset to default</button>}
          <a className="abtn ghost sm" href={`/policies/${slug}`} target="_blank" rel="noopener">View page</a>
          {msg && <span className={"flash" + (msg.err ? " err" : "")} style={{ margin: 0 }}>{msg.err || msg.ok}</span>}
        </div></div>
    </details>
  );
}
