"use client";
import { useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { useShop } from "./ShopProvider";
import { Arrow } from "./Media";
import { inr } from "@/lib/format";

// Steps are worked out from the product name, so new products slot in without extra setup.
const STEPS = [
  ["Cleanse", /wash|cleanser|shampoo|shower gel/i],
  ["Treat", /serum|oil|elixir|roll-on|mask|scrub|capsule|complex|powder|night/i],
  ["Care", /cream|lotion|butter|balm/i],
];
const Head = ({ t }) => String(t).split("|").map((l, i, a) => (i === a.length - 1 && a.length > 1 ? <em key={i}>{l}</em> : <span key={i}>{l}</span>));

export default function RoutineBlock({ c, concerns, products, categories, tags }) {
  const [sel, setSel] = useState(concerns[1]?.slug || concerns[0]?.slug);
  const { add } = useShop();
  const [done, setDone] = useState(false);
  const catMap = Object.fromEntries(categories.map((x) => [x.slug, x]));
  const tagMap = Object.fromEntries(tags.map((x) => [x.slug, x]));
  const list = products.filter((p) => (p.concerns || []).includes(sel));
  const used = new Set();
  const steps = STEPS.map(([name, re], i) => {
    const p = list.find((x) => !used.has(x.id) && re.test(x.name)); if (p) used.add(p.id);
    return p ? { name, p, n: i + 1 } : null;
  }).filter(Boolean);
  const total = steps.reduce((t, s) => t + (s.p.packs?.[0]?.price ?? s.p.price), 0);
  const addAll = () => { steps.forEach((s) => add({ ...s.p, price: s.p.packs?.[0]?.price ?? s.p.price }, "Pack 1", 1, true)); setDone(true); setTimeout(() => setDone(false), 1800); };
  return (
    <section className="f5-sec f5-band-warm" id="routine" aria-label={c.title}>
      <div className="f5-wrap">
        <div className="f5-head"><div><p className="f5-eyebrow">{c.eyebrow}</p><h2 className="f5-h2"><Head t={c.title} /></h2>{c.text && <p className="f5-lede">{c.text}</p>}</div></div>
        <div className="f5-chips" role="tablist" aria-label="Concern">
          {concerns.map((x) => <button key={x.id} role="tab" aria-selected={sel === x.slug} className={"f5-chip2" + (sel === x.slug ? " on" : "")} style={{ "--acc": x.accent }} onClick={() => setSel(x.slug)}>{x.name}</button>)}
        </div>
        {steps.length ? (
          <>
            <div className="f5-scroll f5-steps" key={sel}>
              {steps.map((s, i) => (
                <div key={s.p.id} className="f5-step" style={{ animationDelay: i * 80 + "ms" }}>
                  <div className="f5-step-l"><span>0{s.n}</span>{s.name}</div>
                  <ProductCard p={s.p} category={catMap[s.p.category]?.name} accent={catMap[s.p.category]?.accent} tagMap={tagMap} />
                </div>
              ))}
            </div>
            <div className="f5-routine-bar">
              <div><small>{steps.length}-step routine, Pack 1 each</small><b>{inr(total)}</b></div>
              <button className="btn" onClick={addAll}>{done ? "Added to bag" : "Add routine to bag"}{!done && <Arrow />}</button>
              <Link className="f5-link" href={`/concerns/${sel}`}>See all for this concern</Link>
            </div>
          </>
        ) : <p className="f5-lede">No products are linked to this concern yet.</p>}
      </div>
    </section>
  );
}
