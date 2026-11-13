"use client";
import { useEffect } from "react";
import { useShop } from "./ShopProvider";
import CheckoutForm from "./CheckoutForm";

// Checkout inside a popup, so shoppers never leave the product page.
export default function QuickCheckout() {
  const { qc, setQc } = useShop();
  useEffect(() => {
    document.body.style.overflow = qc ? "hidden" : "";
    const esc = (e) => e.key === "Escape" && setQc(false);
    addEventListener("keydown", esc); return () => { removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [qc, setQc]);
  if (!qc) return null;
  return (
    <div className="qc" role="dialog" aria-modal="true" aria-label="Checkout">
      <div className="qc-scrim" onClick={() => setQc(false)} />
      <div className="qc-panel">
        <div className="qc-head"><img className="qc-logo" src="/logo.png" alt="" width="102" height="26" /><b>Checkout</b><span className="qc-lock">🔒 Secure</span><button className="ib" aria-label="Close checkout" onClick={() => setQc(false)}><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19" /></svg></button></div>
        <div className="qc-body"><CheckoutForm modal onClose={() => setQc(false)} /></div>
      </div>
    </div>
  );
}
