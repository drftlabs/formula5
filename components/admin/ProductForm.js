"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProduct, deleteProduct, duplicateProduct, saveRow } from "@/lib/actions/admin";
import { Field, uploadImage } from "./Fields";
import RichText from "./RichText";
import { slugify, inr } from "@/lib/format";

export default function ProductForm({ product, collections, tags, colors: colors0, sizeKeys }) {
  const [colors, setColors] = useState(colors0 || []), [nc, setNc] = useState({ name: "", hex: "#d7262b" }), [ncMsg, setNcMsg] = useState("");
  const isNew = !product;
  const blank = { name: "", slug: "", price: "", compare_price: "", cost_price: "", sku: "", barcode: "", weight_g: "", vendor: "Taeken", product_type: "", description: "", long_description: "", details: "", seo_title: "", seo_description: "", images: [], extra_images: [], colors: [], tags: [], sizes: Object.fromEntries(sizeKeys.map((s) => [s, 0])), collection_ids: [], active: true, featured: false, low_stock: 3, sort_order: 0 };
  const init = product ? { ...blank, ...Object.fromEntries(Object.entries(product).map(([k, v]) => [k, v ?? blank[k] ?? ""])), collection_ids: product.collection_ids?.length ? product.collection_ids : product.collection_id ? [product.collection_id] : [] } : blank;
  const [p, setP] = useState(init);
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
          <Field f={{ name: "slug", label: "URL slug", type: "text", help: "taeken.in/products/<slug>. Blank = made from the name." }} value={p.slug} onChange={set("slug")} />
          <Field f={{ name: "price", label: "Price (₹)", type: "number" }} value={p.price} onChange={set("price")} />
          <Field f={{ name: "compare_price", label: "Compare-at price (₹)", type: "number", help: "Shown struck through when higher than price." }} value={p.compare_price ?? ""} onChange={set("compare_price")} />
          <Field f={{ name: "description", label: "Short description (shown beside the price)", type: "textarea", full: true }} value={p.description} onChange={set("description")} />
          <Field f={{ name: "active", label: "Visible in the store (untick to keep as draft)", type: "checkbox" }} value={p.active} onChange={set("active")} />
          <Field f={{ name: "featured", label: "Featured (shown first in lists)", type: "checkbox" }} value={p.featured} onChange={set("featured")} />
        </div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Images</h2>
        <p className="hint mut" style={{ marginBottom: 12, fontSize: 12 }}>First image is the main one: transparent PNG, shoe centred with about 8% empty space around it, same angle across all products. Big files are shrunk to 1600px WebP automatically.</p>
        <div className="gallery-adm">
          {p.images.map((src, i) => <div className="g" key={src + i}><img src={src} alt="" />{i === 0 && <em>MAIN</em>}<button className="x" onClick={() => setP((x) => ({ ...x, images: x.images.filter((_, k) => k !== i) }))} aria-label="Remove image">×</button>{i > 0 && <button className="l" onClick={() => move(i, -1)} aria-label="Move earlier">←</button>}</div>)}
          <label className="abtn ghost" style={{ height: 96, width: 96, justifyContent: "center", cursor: "pointer" }}>{up ? "…" : "+ Add"}<input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={addImages} /></label>
        </div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Extra photos (any size)</h2>
        <p className="hint mut" style={{ marginBottom: 12, fontSize: 12 }}>A separate “Look closer” block under the description: lifestyle shots, details, size chart, any shape (square, tall or wide). They are not part of the main slider.</p>
        <div className="gallery-adm">
          {(p.extra_images || []).map((src, i) => <div className="g" key={src + i}><img src={src} alt="" /><button className="x" onClick={() => setP((x) => ({ ...x, extra_images: x.extra_images.filter((_, k) => k !== i) }))} aria-label="Remove image">×</button>{i > 0 && <button className="l" onClick={() => moveX(i, -1)} aria-label="Move earlier">←</button>}</div>)}
          <label className="abtn ghost" style={{ height: 96, width: 96, justifyContent: "center", cursor: "pointer" }}>{up ? "…" : "+ Add"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={addExtra} /></label>
        </div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Product story</h2>
        <p className="mut" style={{ fontSize: 12, marginBottom: 10 }}>Longer description under the product. Add headings, bullet points and photos. Images placed on consecutive lines sit side by side (square 1:1 photos look great in pairs).</p>
        <RichText value={p.long_description} onChange={set("long_description")} />
        <div className="af" style={{ marginTop: 14 }}><Field f={{ name: "details", label: "Spec bullets (one per line)", type: "textarea", full: true, help: "Shown in the Details accordion: upper material, sole, fit." }} value={p.details} onChange={set("details")} /></div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Organisation</h2>
        <span className="lbl">Collections (tick as many as you like)</span>
        <div className="chips" style={{ marginBottom: 18 }}>{collections.map((c) => <label key={c.id} className={"chipsel" + (p.collection_ids.includes(c.id) ? " on" : "")}><input type="checkbox" checked={p.collection_ids.includes(c.id)} onChange={() => toggle("collection_ids", c.id)} />{c.name}</label>)}{!collections.length && <span className="mut">Create collections first.</span>}</div>
        <span className="lbl">Tags (labels on the product)</span>
        <div className="chips" style={{ marginBottom: 18 }}>{tags.map((t) => <label key={t.slug} className={"chipsel" + (p.tags.includes(t.slug) ? " on" : "")}><input type="checkbox" checked={p.tags.includes(t.slug)} onChange={() => toggle("tags", t.slug)} /><span className="pill" style={{ background: t.bg, color: t.fg }}>{t.name}</span></label>)}{!tags.length && <span className="mut">No tags yet. Create them under Tags.</span>}</div>
        <span className="lbl">Colours available</span>
        <div className="chips" style={{ marginBottom: 18 }}>{colors.map((c) => <label key={c.slug} className={"chipsel" + (p.colors.includes(c.slug) ? " on" : "")}><input type="checkbox" checked={p.colors.includes(c.slug)} onChange={() => toggle("colors", c.slug)} /><span className="sw" style={{ background: c.hex }} />{c.name}</label>)}</div>
        <div className="newcolor">
          <input type="color" aria-label="Pick colour" value={/^#[0-9a-f]{6}$/i.test(nc.hex) ? nc.hex : "#000000"} onChange={(e) => setNc({ ...nc, hex: e.target.value })} />
          <input type="text" aria-label="Hex code" value={nc.hex} onChange={(e) => setNc({ ...nc, hex: e.target.value })} placeholder="#d7262b" style={{ width: 100 }} />
          <input type="text" aria-label="Colour name" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} placeholder="New colour name, e.g. Sage green" />
          <button type="button" className="abtn" onClick={async () => {
            const name = nc.name.trim(), hex = nc.hex.trim(); setNcMsg("");
            if (!name) return setNcMsg("Type a colour name."); if (!/^#[0-9a-f]{6}$/i.test(hex)) return setNcMsg("Hex must look like #aabbcc.");
            const slug = slugify(name);
            if (colors.some((c) => c.slug === slug)) { setNcMsg("That colour already exists. Tick it above."); return; }
            const r = await saveRow("colors", null, { name, hex, sort_order: colors.length + 1 });
            if (r?.error) return setNcMsg(r.error);
            setColors([...colors, { slug, name, hex }]); toggle("colors", slug); setNc({ name: "", hex: "#d7262b" });
          }}>+ Add colour</button>
          {ncMsg && <span className="mut" style={{ color: "#ff8a8a" }}>{ncMsg}</span>}
        </div>
        <div className="af">
          <Field f={{ name: "vendor", label: "Vendor / brand", type: "text" }} value={p.vendor} onChange={set("vendor")} />
          <Field f={{ name: "product_type", label: "Product type", type: "text", help: "e.g. High top, Slide, Boot" }} value={p.product_type} onChange={set("product_type")} />
          <Field f={{ name: "sort_order", label: "Sort order", type: "number", help: "Lower numbers show first." }} value={p.sort_order} onChange={set("sort_order")} />
        </div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Inventory &amp; pricing</h2>
        <div className="af">
          <Field f={{ name: "sku", label: "SKU", type: "text", help: "Your own stock code. Must be unique." }} value={p.sku || ""} onChange={set("sku")} />
          <Field f={{ name: "barcode", label: "Barcode (EAN / UPC)", type: "text" }} value={p.barcode || ""} onChange={set("barcode")} />
          <Field f={{ name: "cost_price", label: "Cost per pair (₹, private)", type: "number", help: margin != null ? `Margin ${margin}% · profit ${inr(p.price - p.cost_price)} per pair` : "Only you see this." }} value={p.cost_price ?? ""} onChange={set("cost_price")} />
          <Field f={{ name: "weight_g", label: "Weight (grams)", type: "number" }} value={p.weight_g ?? ""} onChange={set("weight_g")} />
          <Field f={{ name: "low_stock", label: "Low-stock alert at (pairs)", type: "number", help: "Highlights in Inventory and shows “Only N left” to shoppers." }} value={p.low_stock} onChange={set("low_stock")} />
        </div>
        <h3 style={{ margin: "22px 0 6px", fontSize: 14 }}>Stock by UK size <span className="mut" style={{ fontWeight: 500 }}>· {total} pairs in total</span></h3>
        <p className="mut" style={{ fontSize: 12, marginBottom: 12 }}>0 shows the size as sold out. Stock reduces automatically after each paid order.</p>
        <div className="sizes-adm">{sizeKeys.map((s) => <div key={s}><label>UK {s}</label><input className="in" type="number" min="0" value={p.sizes[s] ?? 0} onChange={(e) => setP((x) => ({ ...x, sizes: { ...x.sizes, [s]: e.target.value } }))} /></div>)}</div>
        <div className="bar-actions" style={{ marginTop: 12 }}><span className="mut" style={{ fontSize: 12 }}>Set every size to</span>{[0, 5, 10, 20].map((n) => <button key={n} type="button" className="abtn sm ghost" onClick={() => setP((x) => ({ ...x, sizes: Object.fromEntries(sizeKeys.map((s) => [s, n])) }))}>{n}</button>)}</div>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>Search engine listing</h2>
        <div className="af">
          <Field f={{ name: "seo_title", label: "Page title", type: "text", help: `Default (leave blank): ${p.name || "the product name"}` }} value={p.seo_title} onChange={set("seo_title")} />
          <Field f={{ name: "seo_description", label: "Meta description", type: "textarea", full: true, help: `Default (leave blank): the short description${p.description ? ` — "${p.description.slice(0, 60)}${p.description.length > 60 ? "…" : ""}"` : ""}. About 150 characters if you write your own.` }} value={p.seo_description} onChange={set("seo_description")} />
        </div>
        <div className="serp"><span>www.taeken.in › products › {p.slug || slugify(p.name) || "…"}</span><b>{p.seo_title || p.name || "Product title"}</b><p>{(p.seo_description || p.description || "Description").slice(0, 160)}</p></div>
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
