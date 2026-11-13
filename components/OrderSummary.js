"use client";
import { useEffect, useState } from "react";
import { inr } from "@/lib/format";

// What you just bought + where it's going. Read from this browser only (saved at checkout), so nothing private is in the page link.
export default function OrderSummary({ order }) {
  const [d, setD] = useState(null);
  useEffect(() => { try { const x = JSON.parse(sessionStorage.getItem("tk_last") || "null"); if (x && (!order || x.o === order)) setD(x); } catch {} }, [order]);
  if (!d) return null;
  return (
    <div className="ok-sum">
      <h2>Your order</h2>
      {d.items.map((i, k) => <div className="ok-it" key={k}>{i.img ? <img src={i.img} alt="" /> : <i />}<div><b>{i.n}</b><span>UK {i.s}{i.c ? ` · ${i.c}` : ""} · Qty {i.q}</span></div><em>{inr(i.p * i.q)}</em></div>)}
      <div className="ok-to"><span>Delivering to</span><b>{d.name}</b><small>{d.addr}</small></div>
    </div>
  );
}
