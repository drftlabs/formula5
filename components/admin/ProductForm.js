"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProduct, deleteProduct, duplicateProduct, saveRow } from "@/lib/actions/admin";
import { Field, uploadImage } from "./Fields";
import RichText from "./RichText";
import { slugify, inr } from "@/lib/format";

export default function ProductForm({ product, collections, tags, sizeKeys, categories = [], concerns = [] }) {
  const isNew = !product;
  const blank = { name: "", slug: "", price: "", compare_price: "", cost_price: "", sku: "", barcode: "", weight_g: "", vendor: "Formula 5", product_type: "", description: "", long_description: "", details: "", seo_title: "", seo_description: "", images: [], extra_images: [], colors: [], tags: [], packs: sizeKeys.map((n) => ({ n: Number(n), price: "", mrp: "", sku: "" })), category: "", concerns: [], tagline: "", top_ingredients: ["", "", ""], how_to_use: "", ingredients_raw: "", usp: "", sizes: Object.fromEntries(sizeKeys.map((s) => [s, 0])), collection_ids: [], active: true, featured: false, low_stock: 3, sort_order: 0 };
  const init = product ? { ...blank, ...Object.fromEntries(Object.entries(product).map(([k, v]) => [k, v ?? blank[k] ?? ""])), collection_ids: product.collection_ids?.length ? product.collection_ids : product.collection_id ? [product.collection_id] : [] } : blank;
  const fixPacks = (a) => sizeKeys.map((n) => { const k = (a || []).find((x) => String(x.n) === String(n)); return { n: Number(n), price: k?.price ?? "", mrp: k?.mrp ?? "", sku: k?.sku ?? "" }; });
  const [p, setP] = useState({ ...init, packs: fixPacks(init.packs), concerns: init.concerns || [], top_ingredients: [...(init.top_ingredients || []), "", "", ""].slice(0, 5) });
  const [msg, setMsg] = useState(null), [pending, start] = useTransition(), [up, setUp] = useState(false), router = useRouter();
  const set = (k) => (v) => setP((x) => ({ ...x, [k]: v }));
  const toggle = (k, v) => setP((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  async function addImages(e) {
    setUp(true); setMsg(null);
    try { const urls = []; for (const f of e.target.files) urls.push(await uploadImage(f, "products")); setP((x) => ({ ...x, images: [...x.images, ...urls] })); } catch (x) { setMsg({ err: x.message }); }
    setUp(false); e.target.value = "";
  }
  async function addExtra(e) {
    setUp(true); setMsg(null);
    try { const urls = []; for (const f of e.target.files) urls.push(await uploadImage(f, "products")); setP((x) => ({ ...x, extra_images: [...(x.extra_images || []), ...urls] })); } catch (x) { setMsg({ err: x.message }); }
    setUp(false); e.target.value = "";
  }
  const moveX = (i, d) => setP((x) => { const a = [...(x.extra_images || [])]; const j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, extra_images: a }; });
  const move = (i, d) => setP((x) => { const a = [...x.images]; const j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, images: a }; });
  const total = Object.values(p.sizes).reduce((t, n) => t + (Number(n) || 0), 0);
  const margin = p.price && p.cost_price ? Math.round(((p.price - p.cost_price) / p.price) * 100) : null;
  const save = () => start(async () => {
    const res = await saveProduct(product?.id || null, { ...p, slug: p.slug || slugify(p.name) });
    if (res.error) return setMsg({ err: res.error });
    router.push("/admin/products"); router.refresh();
  });
  return (
    <div>
      <div className="panel"><h2 style={{ marginTop: 0 }}>Basics</h2>
        <div className="af">
          <Field f={{ name: "name", label: "Product name", type: "text" }} value={p.name} onChange={set("name")} />
          <Field f={{ name: "slug", label: "URL slug", type: "text", help: "your-site/products/<slug>. Blank = made from the name." }} value={p.slug} onChange={set("slug")} />
          <Field f={{ name: "price", label: "Base price (₹)", help: "Used for sorting and as the fallback. Pack prices are set under Packs & stock.", type: "number" }} value={p.price} onChange={set("price")} />
          <Field f={{ name: "compare_price", label: "MRP (₹)", type: "number", help: "Shown struck through when higher than price." }} value={p.compare_price ?? ""} onChange={set("compare_price")} />
          <Field f={{ name: "tagline", label: "Tagline (shown after the price)", type: "text" }} value={p.tagline} onChange={set("tagline")} />
          <Field f={{ name: "description", label: "Description (shown under the five things to know)", type: "textarea", full: true }} value={p.description} onChange={set("description")} />
          <Field f={{ name: "active", label: "Visible in the store (untick to keep as draft)", type: "checkbox" }} value={p.active} onChange={set("active")} />
          <Field f={{ name: "featured", label: "Featured (shown first in lists)", type: "checkbox" }} value={p.featured} onChange={set("featured")} />
        </div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Images</h2>
        <p className="hint mut" style={{ marginBottom: 12, fontSize: 12 }}>First image is the main one: square product shot on a clean background, same angle across products. Big files are shrunk to 1600px WebP automatically.</p>
        <div className="gallery-adm">
          {p.images.map((src, i) => <div className="g" key={src + i}><img src={src} alt="" />{i === 0 && <em>MAIN</em>}<button className="x" onClick={() => setP((x) => ({ ...x, images: x.images.filter((_, k) => k !== i) }))} aria-label="Remove image">×</button>{i > 0 && <button className="l" onClick={() => move(i, -1)} aria-label="Move earlier">←</button>}</div>)}
          <label className="abtn ghost" style={{ height: 96, width: 96, justifyContent: "center", cursor: "pointer" }}>{up ? "…" : "+ Add"}<input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={addImages} /></label>
        </div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Extra photos (any size)</h2>
        <p className="hint mut" style={{ marginBottom: 12, fontSize: 12 }}>Optional lifestyle or detail shots, any shape. They are not part of the main slider.</p>
        <div className="gallery-adm">
          {(p.extra_images || []).map((src, i) => <div className="g" key={src + i}><img src={src} alt="" /><button className="x" onClick={() => setP((x) => ({ ...x, extra_images: x.extra_images.filter((_, k) => k !== i) }))} aria-label="Remove image">×</button>{i > 0 && <button className="l" onClick={() => moveX(i, -1)} aria-label="Move earlier">←</button>}</div>)}
          <label className="abtn ghost" style={{ height: 96, width: 96, justifyContent: "center", cursor: "pointer" }}>{up ? "…" : "+ Add"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={addExtra} /></label>
        </div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Five things to know</h2>
        <p className="mut" style={{ fontSize: 12, marginBottom: 10 }}>Top ingredients shown before Buy now, with the amount on the pack, e.g. “10% Vitamin C”. Leave blank to hide. Only state what is on the label.</p>
        <div className="af">{p.top_ingredients.map((t, i) => <Field key={i} f={{ name: "ti" + i, label: "Ingredient " + (i + 1), type: "text" }} value={t} onChange={(v) => setP((x) => ({ ...x, top_ingredients: x.top_ingredients.map((y, k) => (k === i ? v : y)) }))} />)}
          <Field f={{ name: "usp", label: "Key benefit line", type: "text", full: true }} value={p.usp} onChange={set("usp")} />
          <Field f={{ name: "how_to_use", label: "How to use", type: "textarea", full: true }} value={p.how_to_use} onChange={set("how_to_use")} />
          <Field f={{ name: "ingredients_raw", label: "Full ingredient list", type: "textarea", full: true }} value={p.ingredients_raw} onChange={set("ingredients_raw")} />
        </div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Product story</h2>
        <p className="mut" style={{ fontSize: 12, marginBottom: 10 }}>Optional long description. Add headings, bullet points and photos. Images placed on consecutive lines sit side by side (square 1:1 photos look great in pairs).</p>
        <RichText value={p.long_description} onChange={set("long_description")} />
        <div className="af" style={{ marginTop: 14 }}><Field f={{ name: "details", label: "Extra details (one per line)", type: "textarea", full: true }} value={p.details} onChange={set("details")} /></div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Organisation</h2>
        <span className="lbl">Collections (tick as many as you like)</span>
        <div className="chips" style={{ marginBottom: 18 }}>{collections.map((c) => <label key={c.id} className={"chipsel" + (p.collection_ids.includes(c.id) ? " on" : "")}><input type="checkbox" checked={p.collection_ids.includes(c.id)} onChange={() => toggle("collection_ids", c.id)} />{c.name}</label>)}{!collections.length && <span className="mut">Create collections first.</span>}</div>
        <span className="lbl">Tags (labels on the product)</span>
        <div className="chips" style={{ marginBottom: 18 }}>{tags.map((t) => <label key={t.slug} className={"chipsel" + (p.tags.includes(t.slug) ? " on" : "")}><input type="checkbox" checked={p.tags.includes(t.slug)} onChange={() => toggle("tags", t.slug)} /><span className="pill" style={{ background: t.bg, color: t.fg }}>{t.name}</span></label>)}{!tags.length && <span className="mut">No tags yet. Create them under Tags.</span>}</div>
        <span className="lbl">Category</span>
        <div className="chips" style={{ marginBottom: 18 }}>{categories.map((c) => <label key={c.slug} className={"chipsel" + (p.category === c.slug ? " on" : "")}><input type="radio" name="cat" checked={p.category === c.slug} onChange={() => set("category")(c.slug)} />{c.name}</label>)}{!categories.length && <span className="mut">Create categories first.</span>}</div>
        <span className="lbl">Concerns</span>
        <div className="chips" style={{ marginBottom: 18 }}>{concerns.map((c) => <label key={c.slug} className={"chipsel" + (p.concerns.includes(c.slug) ? " on" : "")}><input type="checkbox" checked={p.concerns.includes(c.slug)} onChange={() => toggle("concerns", c.slug)} />{c.name}</label>)}</div>
        <div className="af">
          <Field f={{ name: "vendor", label: "Vendor / brand", type: "text" }} value={p.vendor} onChange={set("vendor")} />
          <Field f={{ name: "product_type", label: "Product type", type: "text", help: "e.g. Face serum, Hair oil, Capsules" }} value={p.product_type} onChange={set("product_type")} />
          <Field f={{ name: "sort_order", label: "Sort order", type: "number", help: "Lower numbers show first." }} value={p.sort_order} onChange={set("sort_order")} />
        </div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Inventory &amp; pricing</h2>
        <div className="af">
          <Field f={{ name: "sku", label: "SKU", type: "text", help: "Your own stock code. Must be unique." }} value={p.sku || ""} onChange={set("sku")} />
          <Field f={{ name: "barcode", label: "Barcode (EAN / UPC)", type: "text" }} value={p.barcode || ""} onChange={set("barcode")} />
          <Field f={{ name: "cost_price", label: "Cost price (₹, private)", type: "number", help: margin != null ? `Margin ${margin}% · profit ${inr(p.price - p.cost_price)} per unit` : "Only you see this." }} value={p.cost_price ?? ""} onChange={set("cost_price")} />
          <Field f={{ name: "weight_g", label: "Weight (grams)", type: "number" }} value={p.weight_g ?? ""} onChange={set("weight_g")} />
          <Field f={{ name: "low_stock", label: "Low-stock alert at (units)", type: "number", help: "Highlights in Inventory and shows “Only N left” to shoppers." }} value={p.low_stock} onChange={set("low_stock")} />
        </div>
        <h3 style={{ margin: "22px 0 6px", fontSize: 14 }}>Packs &amp; stock <span className="mut" style={{ fontWeight: 500 }}>· {total} units in total</span></h3>
        <p className="mut" style={{ fontSize: 12, marginBottom: 12 }}>Pack 1, 2 and 3 as shown on the product page. Leave a price blank to hide that pack. 0 stock shows it as sold out. Stock reduces automatically after each paid order.</p>
        <div className="packs-adm">{p.packs.map((k, i) => { const up = (f) => (e) => setP((x) => ({ ...x, packs: x.packs.map((y, j) => (j === i ? { ...y, [f]: e.target.value } : y)) })); return (
          <div key={k.n} className="pk"><b>Pack {k.n}</b>
            <label>Price ₹<input className="in" type="number" min="0" value={k.price} onChange={up("price")} /></label>
            <label>MRP ₹<input className="in" type="number" min="0" value={k.mrp} onChange={up("mrp")} /></label>
            <label>SKU<input className="in" type="text" value={k.sku} onChange={up("sku")} /></label>
            <label>Stock<input className="in" type="number" min="0" value={p.sizes[k.n] ?? 0} onChange={(e) => setP((x) => ({ ...x, sizes: { ...x.sizes, [k.n]: e.target.value } }))} /></label>
          </div>); })}</div>
        <div className="bar-actions" style={{ marginTop: 12 }}><span className="mut" style={{ fontSize: 12 }}>Set every pack stock to</span>{[0, 10, 25, 50].map((n) => <button key={n} type="button" className="abtn sm ghost" onClick={() => setP((x) => ({ ...x, sizes: Object.fromEntries(sizeKeys.map((s) => [s, n])) }))}>{n}</button>)}</div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Search engine listing</h2>
        <div className="af">
          <Field f={{ name: "seo_title", label: "Page title", type: "text", help: `Default (leave blank): ${p.name || "the product name"}` }} value={p.seo_title} onChange={set("seo_title")} />
          <Field f={{ name: "seo_description", label: "Meta description", type: "textarea", full: true, help: `Default (leave blank): the short description${p.description ? ` — "${p.description.slice(0, 60)}${p.description.length > 60 ? "…" : ""}"` : ""}. About 150 characters if you write your own.` }} value={p.seo_description} onChange={set("seo_description")} />
        </div>
        <div className="serp"><span>www.your-site.com › products › {p.slug || slugify(p.name) || "…"}</span><b>{p.seo_title || p.name || "Product title"}</b><p>{(p.seo_description || p.description || "Description").slice(0, 160)}</p></div>
      </div>

      {msg && <p className={"flash" + (msg.err ? " err" : "")}>{msg.err || msg.ok}</p>}
      <div className="bar-actions">
        <button className="abtn" disabled={pending} onClick={save}>{pending ? "Saving…" : isNew ? "Create product" : "Save product"}</button>
        <a className="abtn ghost" href="/admin/products">Cancel</a>
        {!isNew && <button className="abtn ghost" disabled={pending} onClick={() => start(async () => { const r = await duplicateProduct(product.id); if (r.error) setMsg({ err: r.error }); else { router.push(`/admin/products/${r.id}`); router.refresh(); } })}>Duplicate</button>}
        {!isNew && <a className="abtn ghost" href={`/products/${product.slug}`} target="_blank" rel="noopener">View ↗</a>}
        {!isNew && <button className="abtn danger" style={{ marginLeft: "auto" }} onClick={() => confirm("Delete this product permanently?") && start(async () => { const r = await deleteProduct(product.id); if (r.error) setMsg({ err: r.error }); else { router.push("/admin/products"); router.refresh(); } })}>Delete</button>}
      </div>
    </div>
  );
}
