"use client";
import { useRef, useState } from "react";
import { uploadImage } from "./Fields";
import { slugify } from "@/lib/format";

const base = (n) => String(n).replace(/\.\w+$/, "").replace(/--[a-z0-9]{5}$/, "");
const split = (n) => { const b = base(n); const m = b.match(/^(.*?)[-_ ]?(\d+)$/); return m && m[1] ? { slug: slugify(m[1]), n: Number(m[2]) } : { slug: slugify(b), n: 1 }; };
const csvCell = (v) => (/[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : v);
function download(name, text) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

export default function MediaBulk({ initial = [] }) {
  const [items, setItems] = useState(initial), [busy, setBusy] = useState(false), [prog, setProg] = useState(""), [errs, setErrs] = useState([]), [copied, setCopied] = useState(""), ref = useRef();
  async function run(files) {
    files = [...files].filter((f) => /^image\//.test(f.type)); if (!files.length) return;
    setBusy(true); setErrs([]); let done = 0; const bad = []; const queue = [...files]; const added = [];
    const worker = async () => { while (queue.length) { const f = queue.shift(); try { const url = await uploadImage(f, "bulk", true); added.push({ name: url.split("/").pop(), url }); } catch (e) { bad.push(`${f.name}: ${e.message}`); } setProg(`Uploaded ${++done} of ${files.length}`); } };
    await Promise.all([worker(), worker(), worker()]);
    setItems((x) => [...added.sort((a, b) => a.name.localeCompare(b.name)), ...x]); setErrs(bad); setBusy(false); setProg("");
  }
  const copy = async (t, k) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1200); } catch {} };
  const byProduct = () => {
    const g = {}; for (const it of items) { const { slug, n } = split(it.name); (g[slug] ||= []).push({ n, url: it.url }); }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b)).map(([slug, a]) => [slug, a.sort((x, y) => x.n - y.n).map((i) => i.url)]);
  };
  const productsCsv = () => { const g = byProduct(), max = Math.max(5, ...g.map(([, u]) => u.length)); const head = ["slug", ...Array.from({ length: max }, (_, i) => "image_" + (i + 1))]; return [head.join(","), ...g.map(([s, u]) => [s, ...Array.from({ length: max }, (_, i) => u[i] || "")].map(csvCell).join(","))].join("\r\n"); };
  const filesCsv = () => ["file,url", ...items.map((i) => [base(i.name), i.url].map(csvCell).join(","))].join("\r\n");
  return (
    <div className="panel">
      <div className="mb-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); run(e.dataTransfer.files); }}>
        <b>Drop photos here</b><span>or</span>
        <button type="button" className="abtn" disabled={busy} onClick={() => ref.current.click()}>{busy ? prog || "Uploading…" : "Choose photos (many at once)"}</button>
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={(e) => { run(e.target.files); e.target.value = ""; }} />
      </div>
      {errs.length > 0 && <div className="flash err"><b>{errs.length} failed</b><ul style={{ margin: "6px 0 0 18px", fontSize: 12 }}>{errs.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
      {items.length > 0 && <>
        <div className="bar-actions" style={{ margin: "16px 0" }}>
          <button type="button" className="abtn sm" onClick={() => download("taeken-product-image-links.csv", productsCsv())}>⬇ CSV grouped by product (image_1, image_2…)</button>
          <button type="button" className="abtn sm ghost" onClick={() => download("taeken-photo-links.csv", filesCsv())}>⬇ CSV: one row per photo</button>
          <button type="button" className="abtn sm ghost" onClick={() => copy(items.map((i) => i.url).join("\n"), "all")}>{copied === "all" ? "Copied ✓" : "Copy all links"}</button>
          <span className="mut" style={{ fontSize: 12 }}>{items.length} photos</span>
        </div>
        <p className="mut" style={{ fontSize: 12, marginBottom: 12 }}>The “grouped by product” file can be imported directly (Products → Import): it matches products by slug and only fills in their photos. Or copy the links into your own CSV.</p>
        <div className="mb-grid">{items.map((i) => <div key={i.url} className="mb-it"><img src={i.url} alt="" loading="lazy" /><div><b title={base(i.name)}>{base(i.name)}</b><button type="button" onClick={() => copy(i.url, i.url)}>{copied === i.url ? "Copied ✓" : "Copy link"}</button></div></div>)}</div>
      </>}
      {!items.length && <p className="mut" style={{ marginTop: 14, fontSize: 13 }}>No photos uploaded here yet.</p>}
    </div>
  );
}
