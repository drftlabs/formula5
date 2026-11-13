"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importTracking } from "@/lib/actions/admin";

export default function TrackingImport() {
  const [text, setText] = useState(""), [res, setRes] = useState(null), [pending, start] = useTransition(), router = useRouter();
  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>Import tracking numbers</h2>
      <p className="mut" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>Upload a CSV with columns <b>order_number, courier, tracking_number, tracking_url</b> (the last is optional). Each matching paid order becomes <b>Shipped</b> and the customer is emailed. Tip: export the orders CSV, fill in the courier columns and upload it back.</p>
      <div className="bar-actions">
        <input type="file" accept=".csv,text/csv" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
      </div>
      <textarea className="in" style={{ minHeight: 110, fontFamily: "monospace", fontSize: 12 }} placeholder={"order_number,courier,tracking_number,tracking_url\nTK-1001,Delhivery,DL123456789,https://..."} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="bar-actions" style={{ marginTop: 12 }}>
        <button className="abtn" disabled={pending || !text.trim()} onClick={() => start(async () => { setRes(await importTracking(text)); router.refresh(); })}>{pending ? "Importing…" : "Import & notify customers"}</button>
      </div>
      {res && <div className="flash"><b>{res.updated} order(s) updated.</b>{res.skipped?.length > 0 && <ul style={{ margin: "8px 0 0 18px" }}>{res.skipped.map((s, i) => <li key={i}>{s}</li>)}</ul>}</div>}
    </div>
  );
}
