"use client";
import { useEffect, useState } from "react";
import { lookupPin } from "@/lib/pin";
import { etaRange } from "@/lib/format";

const TRUCK = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17" r="1.6" /><circle cx="17" cy="17" r="1.6" /></svg>;
// "Check delivery" box: reassures the shopper before they commit (delivery time + COD availability).
export default function PinCheck({ days, cod, etaMin = 3, etaMax = 4 }) {
  const [eta, setEta] = useState(""), [pin, setPin] = useState(""), [res, setRes] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => { setEta(etaRange(etaMin, etaMax)); }, [etaMin, etaMax]);
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem("tk_co") || "null"); if (s?.pin) setPin(s.pin); } catch {} }, []);
  useEffect(() => {
    if (pin.length !== 6) { setRes(null); return; }
    let live = true; setBusy(true);
    lookupPin(pin).then((r) => { if (live) { setRes(r || { bad: true }); setBusy(false); } });
    return () => { live = false; };
  }, [pin]);
  return (
    <div className="pin">
      <label htmlFor="pdp-pin">Delivery</label>
      <div className="pin-row"><input id="pdp-pin" inputMode="numeric" maxLength={6} placeholder="Enter pin code" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} /><span className="pin-st">{busy ? "Checking…" : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.4" /></svg>}</span></div>
      {res && !res.bad && <p className="pin-ok">Delivers to <b>{res.city}{res.state ? `, ${res.state}` : ""}</b> in {days}{cod ? " · Cash on delivery available" : ""}</p>}
      {res?.bad && <p className="pin-bad">We couldn't find that pin code. Double-check it.</p>}
      {!res && <p className="pin-hint">Usually delivered in {days}{cod ? " · COD available" : ""}</p>}
      {eta && <p className="pin-eta">{TRUCK}<span>Order today, get it by <b>{eta}</b></span></p>}
    </div>
  );
}
