"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "./ShopProvider";
import { inr, STATES, etaRange } from "@/lib/format";
import { track } from "@/lib/track";
import { ping, ids } from "@/lib/analytics";
import { priceOrder } from "@/lib/pricing";
import { lookupPin } from "@/lib/pin";
import { Arrow } from "./Media";

function loadRzp() {
  return new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = res; s.onerror = () => rej(new Error("Could not load the payment window. Check your connection.")); document.body.appendChild(s);
  });
}
const EMPTY = { name: "", email: "", phone: "", pin: "", area: "", line1: "", line2: "", city: "", state: "" };

export default function CheckoutForm({ modal = false, onClose }) {
  const { items, subtotal, shipping: cfg, clear, setQty, remove, email: loginEmail, ready } = useShop();
  const router = useRouter();
  const [f, setF] = useState(EMPTY), [areas, setAreas] = useState([]), [pinMsg, setPinMsg] = useState("");
  const ONLINE = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID; // online payments appear once Razorpay keys are added
  const [method, setMethod] = useState(ONLINE ? "online" : "cod"), [code, setCode] = useState(""), [rule, setRule] = useState(null), [codeMsg, setCodeMsg] = useState(null);
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const lastPin = useRef(""), [eta, setEta] = useState("");
  useEffect(() => { setEta(etaRange(cfg.etaMin || 3, cfg.etaMax || 4)); }, [cfg.etaMin, cfg.etaMax]);

  // remember details on this device so the next order is one tap
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem("tk_co") || "null"); if (s) { setF((x) => ({ ...x, ...s })); lastPin.current = s.pin || ""; } } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("tk_co", JSON.stringify(f)); } catch {} }, [f]);
  useEffect(() => { if (loginEmail && !f.email) setF((x) => ({ ...x, email: loginEmail })); }, [loginEmail]); // eslint-disable-line
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  // pin code -> city, state, area (autofill; always editable)
  useEffect(() => {
    if (f.pin.length !== 6 || f.pin === lastPin.current) { if (f.pin.length < 6) { setPinMsg(""); setAreas([]); } return; }
    lastPin.current = f.pin; setPinMsg("Looking up pin code…");
    lookupPin(f.pin).then((r) => {
      if (!r) { setPinMsg("Couldn't auto-fill this pin code. Please enter city and state."); setAreas([]); return; }
      setAreas(r.areas); setPinMsg(`✓ ${r.city}${r.state ? ", " + r.state : ""}`);
      setF((x) => ({ ...x, city: r.city || x.city, state: r.state || x.state, area: r.areas.includes(x.area) ? x.area : r.areas[0] || "" }));
    });
  }, [f.pin]);
  useEffect(() => { if (f.pin.length === 6 && areas.length === 0) lookupPin(f.pin).then((r) => r && setAreas(r.areas)); }, []); // eslint-disable-line

  const contactOk = f.name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(f.email) && f.phone.replace(/\D/g, "").length >= 10;
  const addrOk = /^\d{6}$/.test(f.pin) && f.line1.trim().length > 3 && f.city.trim() && f.state;
  const price = useMemo(() => priceOrder({ subtotal, method, cfg, discount: rule }), [subtotal, method, cfg, rule]);
  const alt = useMemo(() => priceOrder({ subtotal, method: method === "cod" ? "online" : "cod", cfg, discount: rule }), [subtotal, method, cfg, rule]);
  const online = method === "cod" ? alt : price, cod = method === "cod" ? price : alt;

  async function applyCode() {
    setCodeMsg(null); if (!code.trim()) return;
    const r = await fetch("/api/checkout/discount", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, subtotal }) }).then((x) => x.json()).catch(() => ({ ok: false, error: "Couldn't check the code. Try again." }));
    if (r.ok) { setRule(r.rule); setCodeMsg({ ok: true, t: `${r.rule.code} applied` }); } else { setRule(null); setCodeMsg({ ok: false, t: r.error }); }
  }

  const fired = useRef(false);
  useEffect(() => { if (ready && items.length && !fired.current) { fired.current = true; track("InitiateCheckout", { content_ids: items.map((i) => i.id), num_items: items.reduce((t, i) => t + i.qty, 0), value: subtotal, currency: "INR" }); } }, [ready, items.length]); // eslint-disable-line

  const sentCo = useRef(false);
  useEffect(() => { if (ready && items.length && !sentCo.current) { sentCo.current = true; ping({ t: "checkout", path: "/checkout" }); } }, [ready, items.length]); // eslint-disable-line
  // once a valid email is typed, remember the bag so we can follow up if they leave (abandoned cart)
  useEffect(() => {
    if (!ready || !items.length || !/^\S+@\S+\.\S+$/.test(f.email)) return;
    const t = setTimeout(() => { try { fetch("/api/cart/capture", { method: "POST", keepalive: true, headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ sid: ids().sid, email: f.email, name: f.name, phone: f.phone, city: f.city, state: f.state, pin: f.pin, items: items.map((i) => ({ id: i.id, name: i.name, size: i.size, qty: i.qty, price: i.price, image: i.image, color: i.colorName || i.color })) }) }).catch(() => {}); } catch {} }, 1500);
    return () => clearTimeout(t);
  }, [ready, items, f.email, f.name, f.phone, f.pin]); // eslint-disable-line

  if (ready && !items.length) return <div className="center"><h1 className="page-title">Your bag is <em>empty</em></h1><p className="lead">Add something you like first.</p><Link className="btn" href="/products" onClick={onClose}>Shop all products <Arrow /></Link></div>;

  async function pay(e) {
    e.preventDefault(); setErr("");
    if (!contactOk) return setErr("Please check your name, email and 10-digit phone number.");
    if (!addrOk) return setErr("Please complete your delivery address.");
    setBusy(true); track("AddPaymentInfo", { value: price.total, currency: "INR" });
    const done = (num, due, total) => {
      try { sessionStorage.setItem("tk_last", JSON.stringify({ o: num, total, due, method, name: f.name, addr: [f.line1, f.line2, f.area, f.city, f.state, f.pin].filter(Boolean).join(", "), items: items.map((i) => ({ n: i.name, s: i.size, c: i.colorName || "", q: i.qty, p: i.price, img: i.image })) })); } catch {}
      clear(); onClose?.(); router.push(`/checkout/success?o=${encodeURIComponent(num)}${due ? `&due=${due}` : ""}${total ? `&v=${total}` : ""}&m=${method}`); };
    try {
      const r = await fetch("/api/checkout/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map((i) => ({ id: i.id, size: i.size, qty: i.qty, color: i.color || "" })), method, code: rule?.code || "", customer: { name: f.name, email: f.email, phone: f.phone }, address: { line1: f.line1, line2: f.line2, area: f.area, city: f.city, state: f.state, pin: f.pin } }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not start payment");
      if (d.cod) return done(d.orderNumber, d.due, d.total);
      await loadRzp();
      const rz = new window.Razorpay({
        key: d.key, amount: d.amount, currency: "INR", name: "Formula 5", description: d.method === "cod" ? `Order ${d.orderNumber}: ${cfg.codPct}% advance (COD)` : `Order ${d.orderNumber}`, order_id: d.rzpOrderId,
        prefill: { name: d.prefill.name, email: d.prefill.email, contact: d.prefill.phone }, theme: { color: "#D7262B" },
        modal: { ondismiss: () => { setBusy(false); setErr("Payment was not completed. Your bag is saved, so you can try again."); } },
        handler: async (resp) => {
          const v = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: d.orderId, ...resp }) });
          const vd = await v.json();
          if (!v.ok) { setBusy(false); setErr((vd.error || "Verification failed") + " If money was deducted, it will be confirmed automatically or refunded. Contact us with order " + d.orderNumber + "."); return; }
          done(vd.orderNumber, d.due, d.total);
        },
      });
      rz.on("payment.failed", (x) => { setBusy(false); setErr(x.error?.description || "Payment failed. Please try again."); });
      rz.open();
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <form className={"co2" + (modal ? " in-modal" : "")} onSubmit={pay} noValidate>
      <section className="co-step">
        <h2><i>01</i>Contact</h2>
        <div className="form">
          <div className="field"><label htmlFor="name">Full name</label><input id="name" required autoComplete="name" value={f.name} onChange={set("name")} /></div>
          <div className="row">
            <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} /></div>
            <div className="field"><label htmlFor="phone">Phone</label><input id="phone" type="tel" required inputMode="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} /></div>
          </div>
          <p className="hint">Order updates and your account login use this email.</p>
        </div>
      </section>

      <section className="co-step">
        <h2><i>02</i>Delivery address</h2>
        <div className="form">
          <div className="row">
            <div className="field"><label htmlFor="pin">Pin code</label><input id="pin" required inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="6 digits" value={f.pin} onChange={(e) => setF((x) => ({ ...x, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />{pinMsg && <p className={"hint" + (pinMsg.startsWith("✓") ? " ok" : "")}>{pinMsg}</p>}</div>
            <div className="field"><label htmlFor="area">Area / locality</label>{areas.length > 1 ? <select id="area" value={f.area} onChange={set("area")}>{areas.map((a) => <option key={a}>{a}</option>)}</select> : <input id="area" autoComplete="address-level3" value={f.area} onChange={set("area")} />}</div>
          </div>
          <div className="field"><label htmlFor="l1">House no., building, street</label><input id="l1" required autoComplete="address-line1" value={f.line1} onChange={set("line1")} /></div>
          <div className="field"><label htmlFor="l2">Landmark (optional)</label><input id="l2" autoComplete="address-line2" value={f.line2} onChange={set("line2")} /></div>
          <div className="row">
            <div className="field"><label htmlFor="city">City</label><input id="city" required autoComplete="address-level2" value={f.city} onChange={set("city")} /></div>
            <div className="field"><label htmlFor="state">State</label><select id="state" required autoComplete="address-level1" value={f.state} onChange={set("state")}><option value="">Select state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
      </section>

      {!addrOk ? <p className="co-wait"><span aria-hidden="true">⬆</span> Fill in your pin code and address to see your order summary and payment options.</p> : (
        <>
          <section className="co-step reveal">
            <h2><i>03</i>Order summary</h2>
            {eta && <p className="co-eta"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17" r="1.6" /><circle cx="17" cy="17" r="1.6" /></svg><span>Estimated delivery: <b>{eta}</b></span></p>}
            <div className="co-sum">
              {items.map((i) => <div className="li" key={i.id + i.size + (i.color || "")}><div className="thumb">{i.image && <img src={i.image} alt={i.name} />}</div><div><h3>{i.name}</h3><small>Pack {i.size}{i.colorName ? ` · ${i.colorName}` : ""}</small>
                <div className="co-qty"><button type="button" aria-label="Decrease quantity" onClick={() => setQty(i.id, i.size, i.qty - 1, i.color)}>−</button><span>{i.qty}</span><button type="button" aria-label="Increase quantity" onClick={() => setQty(i.id, i.size, Math.min(10, i.qty + 1), i.color)}>+</button><button type="button" className="co-rm" onClick={() => remove(i.id, i.size, i.color)}>Remove</button></div></div><div className="pr">{inr(i.price * i.qty)}</div></div>)}
              <div className="code-row">{rule ? <div className="code-ok"><b>{rule.code}</b> applied <button type="button" onClick={() => { setRule(null); setCode(""); setCodeMsg(null); }}>Remove</button></div> : <><input aria-label="Discount code" placeholder="Discount code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCode())} /><button type="button" onClick={applyCode}>Apply</button></>}</div>
              {codeMsg && <p className={"hint" + (codeMsg.ok ? " ok" : " bad")}>{codeMsg.t}</p>}
              <div className="line"><span>Subtotal</span><span>{inr(price.subtotal)}</span></div>
              {price.discount > 0 && <div className="line save"><span>Discount</span><span>−{inr(price.discount)}</span></div>}
              <div className="line"><span>{method === "cod" ? "COD delivery fee" : "Shipping"}</span><span>{price.shipping ? inr(price.shipping) : "Free"}</span></div>
              <div className="line tot"><span>Total</span><span>{inr(price.total)}</span></div>
              {method === "cod" && price.payNow > 0 && <div className="line split"><span>Pay now (advance)</span><span>{inr(price.payNow)}</span></div>}
              {method === "cod" && <div className="line split"><span>{price.payNow > 0 ? "Pay in cash on delivery" : "Pay in cash on delivery (total)"}</span><span>{inr(price.due)}</span></div>}
            </div>
          </section>

          <section className="co-step reveal">
            <h2><i>04</i>Payment</h2>
            <div className="pay-opts" role="radiogroup" aria-label="Payment method">
              {ONLINE && <label className={"pay-opt" + (method === "online" ? " on" : "")}>
                <span className={"pay-chip" + (online.shipping === 0 ? " free" : "")}>{online.shipping === 0 ? "Free shipping" : cfg.min > 0 ? `Free shipping above ${inr(cfg.min)}` : `Shipping ${inr(online.shipping)}`}</span>
                <input type="radio" name="m" checked={method === "online"} onChange={() => setMethod("online")} />
                <span className="dot" />
                <span className="pt"><b>Pay online</b><small>UPI · Cards · Netbanking · Wallets · EMI. Opens the secure Razorpay window.</small></span>
                <span className="pa">{inr(online.total)}</span>
              </label>}
              {cfg.codEnabled && (
                <label className={"pay-opt" + (method === "cod" ? " on" : "")}>
                  <span className="pay-chip cod">{inr(cfg.codFee)} COD shipping extra</span>
                  <input type="radio" name="m" checked={method === "cod"} onChange={() => setMethod("cod")} />
                  <span className="dot" />
                  <span className="pt"><b>Cash on delivery</b>{cfg.codPct > 0
                    ? <small>Pay <b>{cfg.codPct}%</b> now ({inr(cod.payNow)}) to confirm your order, and the rest ({inr(cod.due)}) in cash when it arrives. A <b>{inr(cfg.codFee)} COD delivery fee</b> is added.</small>
                    : <small>Pay in cash when it arrives. A <b>{inr(cfg.codFee)} COD delivery fee</b> is added.</small>}</span>
                  <span className="pa">{inr(cod.total)}</span>
                </label>
              )}
            </div>
          </section>

          {err && <p className="msg-err" role="alert">{err}</p>}
          <button className="btn co-pay" type="submit" disabled={busy}>{busy ? (method === "cod" ? "Confirming your order…" : "Opening payment…") : method === "cod" ? (price.payNow ? <>Pay {inr(price.payNow)} now &amp; confirm COD <Arrow /></> : <>Confirm order <Arrow /></>) : <>Pay {inr(price.total)} <Arrow /></>}</button>
          <div className="secure-row"><span>🔒 Secure payment by Razorpay</span><span>✓ Your card details never touch our server</span></div>
          <p className="secure">By ordering you agree to our <Link className="link" href="/policies/terms" style={{ fontSize: 12 }} onClick={onClose}>Terms</Link>.</p>
        </>
      )}
      {!addrOk && err && <p className="msg-err" role="alert">{err}</p>}
    </form>
  );
}
