"use client";
import { useRef, useState } from "react";
import { uploadImage } from "./Fields";
import Prose from "../Prose";

// Simple editor for the product "story": headings, bullets, bold and images. Stored as plain text:
//   ## Heading   - bullet   **bold**   ![alt text](https://image-url)
export default function RichText({ value, onChange, folder = "descriptions" }) {
  const ta = useRef(), file = useRef();
  const [busy, setBusy] = useState(false), [prev, setPrev] = useState(false), [err, setErr] = useState("");
  const wrap = (before, after = "", ph = "text") => {
    const el = ta.current, a = el.selectionStart, b = el.selectionEnd, sel = value.slice(a, b) || ph;
    const next = value.slice(0, a) + before + sel + after + value.slice(b); onChange(next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = a + before.length; el.selectionEnd = a + before.length + sel.length; });
  };
  const line = (prefix) => { const el = ta.current, a = el.selectionStart; const st = value.lastIndexOf("\n", a - 1) + 1; onChange(value.slice(0, st) + prefix + value.slice(st)); requestAnimationFrame(() => el.focus()); };
  async function addImgs(e) {
    setBusy(true); setErr("");
    try {
      let ins = ""; for (const f of e.target.files) ins += `\n\n![${f.name.replace(/\.\w+$/, "").replace(/[-_]+/g, " ")}](${await uploadImage(f, folder)})\n\n`;
      const el = ta.current, a = el.selectionStart ?? value.length; onChange(value.slice(0, a) + ins + value.slice(a));
    } catch (x) { setErr(x.message); }
    setBusy(false); e.target.value = "";
  }
  return (
    <div className="rt">
      <div className="rt-bar">
        <button type="button" onClick={() => line("## ")}>H</button>
        <button type="button" onClick={() => wrap("**", "**", "bold")}><b>B</b></button>
        <button type="button" onClick={() => line("- ")}>• List</button>
        <button type="button" disabled={busy} onClick={() => file.current.click()}>{busy ? "Uploading…" : "🖼 Insert image"}</button>
        <button type="button" className={prev ? "on" : ""} onClick={() => setPrev(!prev)} style={{ marginLeft: "auto" }}>{prev ? "Edit" : "Preview"}</button>
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={addImgs} />
      </div>
      {prev ? <div className="rt-prev"><Prose text={value || "Nothing yet."} /></div> : <textarea ref={ta} value={value} onChange={(e) => onChange(e.target.value)} placeholder={"## What is inside\nTell the story of this formula.\n\n![detail shot](image-url)"} />}
      {err && <p className="hint" style={{ color: "#A33B34" }}>{err}</p>}
      <p className="hint">Place the cursor where the image should go, then click Insert image. Photos are shrunk automatically.</p>
    </div>
  );
}
