"use client";
import { useState, useTransition } from "react";
import { saveSettings } from "@/lib/actions/admin";
import { Field } from "./Fields";

const G = [
  ["Announcement ticker", [{ name: "ticker", label: "Ticker lines (one per line)", type: "textarea", full: true, help: "Scrolls across the top of every page." }]],
  ["Business & legal (used in policy pages)", [
    { name: "business_name", label: "Brand name", type: "text" }, { name: "legal_name", label: "Registered business name", type: "text" },
    { name: "address", label: "Registered address", type: "text", full: true }, { name: "gst_number", label: "GSTIN", type: "text" },
    { name: "jurisdiction", label: "Jurisdiction (city, India)", type: "text" }, { name: "grievance_name", label: "Grievance Officer name", type: "text" }]],
  ["Contact & social", [
    { name: "contact_email", label: "Support email", type: "text" }, { name: "contact_phone", label: "Support phone", type: "text" },
    { name: "instagram", label: "Instagram handle", type: "text", help: "e.g. formula5 (without @). Shows the Instagram link in the footer." }]],
  ["Shipping & policies", [
    { name: "free_shipping_min", label: "Free shipping above (₹)", type: "number" }, { name: "shipping_fee", label: "Flat shipping fee (₹)", type: "number" },
    { name: "dispatch_days", label: "Dispatch time (text)", type: "text" }, { name: "delivery_days", label: "Delivery time (text)", type: "text" },
    { name: "refund_days", label: "Refund processing (business days)", type: "number" }]],
  ["Cash on delivery & contact", [
    { name: "cod_enabled", label: "Offer cash on delivery (COD)", type: "checkbox" },
    { name: "cod_prepaid_pct", label: "COD: % paid online upfront", type: "number", help: "10 = customer pays 10% via Razorpay, the rest in cash. 0 = pure cash on delivery: nothing is paid online, the customer pays the full amount (plus the COD fee) in cash." },
    { name: "cod_fee", label: "COD delivery fee (₹)", type: "number", help: "Added to every COD order and shown at checkout." },
    { name: "whatsapp", label: "WhatsApp number (with country code)", type: "text", help: "e.g. 919876543210. Shows a chat button on the site. Blank = hidden." },
    { name: "meta_pixel_id", label: "Meta (Facebook) Pixel ID", type: "text", help: "Digits only, from Meta Events Manager. Tracks PageView, ViewContent, AddToCart, InitiateCheckout and Purchase for your ads. Blank = off." }]],
];

export default function SettingsForm({ settings }) {
  const [v, setV] = useState({ ...settings, ticker: (settings.ticker || []).join("\n") });
  const [msg, setMsg] = useState(null), [pending, start] = useTransition();
  return (
    <div>
      {G.map(([title, fields]) => <div className="panel" key={title}><h2 style={{ marginTop: 0 }}>{title}</h2><div className="af">{fields.map((f) => <Field key={f.name} f={f} value={v[f.name]} onChange={(x) => setV((s) => ({ ...s, [f.name]: x }))} />)}</div></div>)}
      <div className="bar-actions"><button className="abtn" disabled={pending} onClick={() => start(async () => { const r = await saveSettings(v); setMsg(r.error ? { err: r.error } : { ok: "Settings saved" }); })}>{pending ? "Saving…" : "Save settings"}</button>{msg && <span className={"flash" + (msg.err ? " err" : "")} style={{ margin: 0 }}>{msg.err || msg.ok}</span>}</div>
    </div>
  );
}
