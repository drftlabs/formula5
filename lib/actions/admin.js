"use server";
import { revalidatePath } from "next/cache";
import { guard } from "../admin";
import { serviceClient } from "../supabase/server";
import { TABLES, SETTING_KEYS, PAGE_SLUGS } from "../adminSchema";
import { parseCSV } from "../csv";
import { slugify } from "../format";
import { sendEmail, shippedEmail, cancelledEmail } from "../email";

const db = () => serviceClient();
const refresh = () => revalidatePath("/", "layout");

/** Generic create/update for collections, tags, colors, slides, blocks. */
export async function saveRow(table, id, values) {
  { const g = await guard(table); if (g) return g; }
  const t = TABLES[table]; if (!t) return { error: "Unknown table" };
  const row = {};
  for (const c of t.cols) if (c in values) row[c] = values[c];
  if (t.slugFrom) row.slug = slugify(values.slug || values[t.slugFrom]);
  if (t.slugFrom && !row.slug) return { error: "Name is required" };
  if (table === "discounts") {
    row.code = String(values.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!row.code) return { error: "Enter a code (letters and numbers)" };
    for (const k of ["max_uses", "expires_at"]) if (row[k] === "" || row[k] == null) row[k] = null;
    for (const k of ["value", "min_order"]) row[k] = Number(row[k]) || 0;
    if (row.max_uses != null) row.max_uses = Number(row.max_uses);
  }
  const { error } = id ? await db().from(table).update(row).eq("id", id) : await db().from(table).insert(row);
  if (error) return { error: error.message };
  refresh(); return { ok: true };
}
export async function deleteRow(table, id) {
  { const g = await guard(table); if (g) return g; }
  if (!TABLES[table]) return { error: "Unknown table" };
  const { error } = await db().from(table).delete().eq("id", id);
  if (error) return { error: error.message };
  refresh(); return { ok: true };
}
/** Move a row up/down by rewriting sort_order for the whole list. */
export async function moveRow(table, id, dir) {
  { const g = await guard(table); if (g) return g; }
  if (!TABLES[table]) return { error: "Unknown table" };
  const { data } = await db().from(table).select("id").order("sort_order").order("id");
  const ids = data.map((r) => r.id); const i = ids.indexOf(id), j = i + (dir === "up" ? -1 : 1);
  if (i < 0 || j < 0 || j >= ids.length) return { ok: true };
  [ids[i], ids[j]] = [ids[j], ids[i]];
  for (let k = 0; k < ids.length; k++) await db().from(table).update({ sort_order: (k + 1) * 10 }).eq("id", ids[k]);
  refresh(); return { ok: true };
}

const num = (x) => (x === "" || x == null ? null : Math.round(Number(x)));
function productRow(v) {
  const ids = [...new Set((v.collection_ids || []).filter(Boolean))];
  return {
    name: String(v.name || "").trim(), slug: slugify(v.slug || v.name),
    price: num(v.price), compare_price: num(v.compare_price), cost_price: num(v.cost_price), weight_g: num(v.weight_g),
    sku: v.sku ? String(v.sku).trim() : null, barcode: v.barcode ? String(v.barcode).trim() : null,
    vendor: v.vendor || "Taeken", product_type: v.product_type || "",
    seo_title: v.seo_title || "", seo_description: v.seo_description || "",
    description: v.description || "", long_description: v.long_description || "", details: v.details || "",
    images: (v.images || []).filter(Boolean), extra_images: (v.extra_images || []).filter(Boolean), colors: v.colors || [], tags: v.tags || [],
    sizes: Object.fromEntries(Object.entries(v.sizes || {}).map(([k, n]) => [k, Math.max(0, Number(n) || 0)])),
    collection_ids: ids, collection_id: ids[0] || null,
    active: !!v.active, featured: !!v.featured, low_stock: Math.max(0, Number(v.low_stock) || 0), sort_order: Number(v.sort_order) || 0,
  };
}
export async function saveProduct(id, v) {
  { const g = await guard("products"); if (g) return g; }
  const row = productRow(v);
  if (!row.name || !row.slug || row.price == null) return { error: "Name and price are required" };
  const run = (r) => id ? db().from("products").update(r).eq("id", id).select("id").single() : db().from("products").insert(r).select("id").single();
  let { data, error } = await run(row);
  // older database without migration_3: save everything else; only block if extra photos were actually added
  if (error && /extra_images/.test(error.message || "")) {
    if (row.extra_images?.length) return { error: "Extra photos need a one-time database update: run supabase/migration_3.sql in the Supabase SQL Editor, then save again." };
    const { extra_images, ...rest } = row; ({ data, error } = await run(rest));
  }
  if (error) return { error: error.code === "23505" ? "That URL slug or SKU is already used by another product" : error.code === "42703" ? "Database needs the latest migration (run supabase/migration_2.sql in Supabase)." : error.message };
  refresh(); return { ok: true, id: data.id };
}
export async function duplicateProduct(id) {
  { const g = await guard("products"); if (g) return g; }
  const { data: p } = await db().from("products").select("*").eq("id", id).single();
  if (!p) return { error: "Not found" };
  const { id: _i, created_at, ...rest } = p;
  const slug = slugify(p.slug + "-copy-" + Math.random().toString(36).slice(2, 5));
  const { data, error } = await db().from("products").insert({ ...rest, name: p.name + " (copy)", slug, sku: null, active: false }).select("id").single();
  if (error) return { error: error.message };
  refresh(); return { ok: true, id: data.id };
}
/** Bulk actions from the products list. action: live | hide | delete | add_collection | remove_collection | add_tag | remove_tag | set_price_pct */
export async function bulkProducts(ids, action, value) {
  { const g = await guard("products"); if (g) return g; }
  if (!ids?.length) return { error: "Select at least one product" };
  const { data: rows } = await db().from("products").select("id,tags,collection_ids,collection_id,price").in("id", ids);
  if (action === "delete") { const { error } = await db().from("products").delete().in("id", ids); if (error) return { error: error.message }; refresh(); return { ok: true }; }
  if (action === "live" || action === "hide") { const { error } = await db().from("products").update({ active: action === "live" }).in("id", ids); if (error) return { error: error.message }; refresh(); return { ok: true }; }
  for (const r of rows || []) {
    let patch = {};
    if (action === "add_tag") patch.tags = [...new Set([...(r.tags || []), value])];
    if (action === "remove_tag") patch.tags = (r.tags || []).filter((t) => t !== value);
    if (action === "add_collection" || action === "remove_collection") {
      const cur = new Set(r.collection_ids?.length ? r.collection_ids : r.collection_id ? [r.collection_id] : []);
      action === "add_collection" ? cur.add(value) : cur.delete(value);
      patch.collection_ids = [...cur]; patch.collection_id = [...cur][0] || null;
    }
    if (action === "set_price_pct") patch.price = Math.max(0, Math.round(r.price * (1 + Number(value) / 100)));
    const { error } = await db().from("products").update(patch).eq("id", r.id); if (error) return { error: error.message };
  }
  refresh(); return { ok: true };
}
/** Collections page: choose exactly which products sit in one collection. */
export async function setCollectionProducts(collectionId, productIds) {
  { const g = await guard("collections"); if (g) return g; }
  const want = new Set(productIds);
  const { data: rows } = await db().from("products").select("id,collection_ids,collection_id");
  for (const r of rows || []) {
    const cur = new Set(r.collection_ids?.length ? r.collection_ids : r.collection_id ? [r.collection_id] : []);
    const has = cur.has(collectionId), should = want.has(r.id);
    if (has === should) continue;
    should ? cur.add(collectionId) : cur.delete(collectionId);
    const { error } = await db().from("products").update({ collection_ids: [...cur], collection_id: [...cur][0] || null }).eq("id", r.id);
    if (error) return { error: error.message };
  }
  refresh(); return { ok: true };
}
/** Inventory page: updates = [{ id, sizes: {"6": 4, ...} }] */
export async function saveInventory(updates) {
  { const g = await guard("inventory"); if (g) return g; }
  for (const u of updates || []) {
    const sizes = Object.fromEntries(Object.entries(u.sizes || {}).map(([k, n]) => [k, Math.max(0, Math.round(Number(n) || 0))]));
    const { error } = await db().from("products").update({ sizes }).eq("id", u.id); if (error) return { error: error.message };
  }
  refresh(); revalidatePath("/admin/inventory"); return { ok: true };
}
/** CSV import (Shopify-style). Matches existing products by slug (or SKU) and updates; otherwise creates. */
// Common colour words -> a sensible swatch, so brand-new colour names get a usable swatch automatically (editable under Colours).
const HEX = { black: "#0b0b0b", obsidian: "#1a1a1b", white: "#f5f5f2", chalk: "#f3f1ea", red: "#d7262b", blue: "#2a5db0", navy: "#1b2a49", green: "#2f7d4f", olive: "#6b6b2f", grey: "#8a8a8f", gray: "#8a8a8f", silver: "#b9bcc2", beige: "#d8c9a8", sand: "#cdb78b", cream: "#efe6cf", brown: "#6b4a2f", tan: "#b58b5a", yellow: "#e8c52a", orange: "#e8742a", pink: "#e58ab0", purple: "#6b3fa0", maroon: "#6d1f2a", teal: "#1f7a7a", gold: "#c9a227", mint: "#a8d8c0", lavender: "#b8a6dc", sage: "#8fa88a" };
const hexFor = (name) => { const w = String(name).toLowerCase().split(/[^a-z]+/).filter(Boolean); for (const k of [...w].reverse()) if (HEX[k]) return HEX[k]; return "#888888"; };
const titleCase = (t) => t.replace(/\s+/g, " ").trim().replace(/\b\w/g, (m) => m.toUpperCase());

/** CSV import. Any column may be missing or blank: blanks never wipe existing data, and new colour names are added to the colour list. */
export async function importProducts(csvText) {
  { const g = await guard("products"); if (g) return g; }
  const rows = parseCSV(csvText); const out = { created: 0, updated: 0, errors: [], newColors: [] };
  if (!rows.length) return { ...out, errors: ["The file has no rows."] };
  const [{ data: cols }, { data: existing }, { data: colorRows }] = await Promise.all([db().from("collections").select("id,slug"), db().from("products").select("id,slug,sku,name"), db().from("colors").select("slug,name")]);
  const colBySlug = Object.fromEntries((cols || []).map((c) => [c.slug, c.id]));
  const colorSlugs = new Set((colorRows || []).map((c) => c.slug)); const colorByName = Object.fromEntries((colorRows || []).map((c) => [String(c.name).toLowerCase(), c.slug]));
  const list = (x) => String(x || "").split(/[|;]/).map((t) => t.trim()).filter(Boolean);
  // "Sage green" or "Sage green:#8fa88a" -> product colour slug; creates the colour if it's new
  async function colourSlug(token) {
    const [nm, hx] = token.split(":").map((t) => t.trim()); const slug = slugify(nm); if (!slug) return null;
    if (colorSlugs.has(slug)) return slug; if (colorByName[nm.toLowerCase()]) return colorByName[nm.toLowerCase()];
    const hex = /^#[0-9a-f]{6}$/i.test(hx || "") ? hx : hexFor(nm);
    const { error } = await db().from("colors").insert({ name: titleCase(nm), slug, hex, sort_order: colorSlugs.size + 1 });
    if (error) { out.errors.push(`Colour "${nm}" could not be created: ${error.message}`); return null; }
    colorSlugs.add(slug); out.newColors.push(titleCase(nm)); return slug;
  }
  let line = 1;
  for (const r of rows) {
    line++;
    const has = (k) => r[k] !== undefined && r[k] !== "";
    const slugIn = r.slug || (r.name || r.title ? slugify(r.name || r.title) : "");
    const match = (existing || []).find((e) => (slugIn && e.slug === slugIn) || (r.sku && e.sku === r.sku));
    const name = r.name || r.title || match?.name;
    if (!name) { out.errors.push(`Row ${line}: needs a name (or a slug/SKU of an existing product)`); continue; }
    const sizes = {}; for (const k of Object.keys(r)) { const m = k.match(/^(?:size|stock)_(\d+(?:\.\d)?)$/); if (m && r[k] !== "") sizes[m[1]] = Number(r[k]) || 0; }
    const imgKeys = Object.keys(r).map((k) => k.match(/^(?:image|photo|img)_?(\d+)$/)).filter(Boolean).sort((x, y) => Number(x[1]) - Number(y[1]));
    const images = [...imgKeys.map((m) => r[m[0]]).filter(Boolean), ...list(r.images)];
    const colSlugs = list(r.collections); const unknown = colSlugs.filter((c) => !colBySlug[c]);
    if (unknown.length) out.errors.push(`Row ${line}: unknown collection(s) ${unknown.join(", ")} (ignored)`);
    const colours = []; for (const t of list(r.colors || r.colours)) { const c = await colourSlug(t); if (c && !colours.includes(c)) colours.push(c); }
    const v = {
      name, slug: slugIn || slugify(name), price: r.price, compare_price: r.compare_price, cost_price: r.cost_price, weight_g: r.weight_g, sku: r.sku, barcode: r.barcode,
      vendor: r.vendor, product_type: r.product_type, seo_title: r.seo_title, seo_description: r.seo_description,
      description: r.description, long_description: r.long_description, details: String(r.details || "").split("||").join("\n"),
      images, colors: colours, tags: list(r.tags), sizes,
      collection_ids: colSlugs.map((c) => colBySlug[c]).filter(Boolean),
      active: !/^(false|no|0|hidden|draft)$/i.test(r.active || "true"), featured: /^(true|yes|1)$/i.test(r.featured || ""), low_stock: r.low_stock || 3, sort_order: r.sort_order || 0,
    };
    const row = productRow(v);
    if (match) {
      // update: only change what the CSV actually provides
      const keep = { name: has("name") || has("title"), price: has("price"), compare_price: has("compare_price"), cost_price: has("cost_price"), weight_g: has("weight_g"), sku: has("sku"), barcode: has("barcode"), vendor: has("vendor"), product_type: has("product_type"), seo_title: has("seo_title"), seo_description: has("seo_description"), description: has("description"), long_description: has("long_description"), details: has("details"), images: images.length > 0, colors: colours.length > 0, tags: has("tags"), sizes: Object.keys(sizes).length > 0, collection_ids: colSlugs.length > 0, collection_id: colSlugs.length > 0, active: has("active"), featured: has("featured"), low_stock: has("low_stock"), sort_order: has("sort_order") };
      for (const k of Object.keys(row)) if (k in keep ? !keep[k] : k !== "slug") delete row[k];
      row.slug = match.slug; delete row.extra_images;
      const { error } = await db().from("products").update(row).eq("id", match.id);
      error ? out.errors.push(`Row ${line} (${name}): ${error.message}`) : out.updated++;
    } else {
      delete row.extra_images;
      let note = "";
      if (row.price == null || Number.isNaN(row.price)) { row.price = 0; row.active = false; note = " Added as HIDDEN with price 0: set the price, then make it live."; }
      const { data, error } = await db().from("products").insert(row).select("id,slug,sku,name").single();
      if (error) out.errors.push(`Row ${line} (${name}): ${error.code === "23505" ? "duplicate slug/SKU" : error.message}`);
      else { out.created++; (existing || []).push(data); if (note) out.errors.push(`Row ${line} (${name}): price missing.${note}`); }
    }
  }
  refresh(); revalidatePath("/admin/products"); return out;
}
export async function deleteProduct(id) {
  { const g = await guard("products"); if (g) return g; }
  const { error } = await db().from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh(); return { ok: true };
}

export async function saveSettings(v) {
  { const g = await guard("settings"); if (g) return g; }
  const { data } = await db().from("site_settings").select("value").eq("key", "site").maybeSingle();
  const next = { ...(data?.value || {}) };
  for (const k of SETTING_KEYS) if (k in v) next[k] = v[k];
  for (const k of ["free_shipping_min", "shipping_fee", "return_days", "exchange_days", "refund_days", "cod_fee", "cod_prepaid_pct"]) next[k] = Number(next[k]) || 0;
  next.cod_enabled = next.cod_enabled !== false && next.cod_enabled !== "false";
  next.whatsapp = String(next.whatsapp || "").replace(/[^\d]/g, "");
  if (typeof next.ticker === "string") next.ticker = next.ticker.split("\n").map((s) => s.trim()).filter(Boolean);
  next.instagram = String(next.instagram || "").replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
  const { error } = await db().from("site_settings").upsert({ key: "site", value: next, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  refresh(); return { ok: true };
}

export async function updateOrder(id, v) {
  { const g = await guard("orders"); if (g) return g; }
  const { data: before } = await db().from("orders").select("*").eq("id", id).single();
  const patch = { status: v.status, courier: v.courier || null, tracking_number: v.tracking_number || null, tracking_url: v.tracking_url || null, notes: v.notes || null };
  if (v.status === "shipped" && !before.shipped_at) patch.shipped_at = new Date().toISOString();
  if (v.status === "delivered" && !before.delivered_at) patch.delivered_at = new Date().toISOString();
  if (v.cod_collected && before.amount_due > 0) { patch.amount_paid = before.total; patch.amount_due = 0; }
  const { data, error } = await db().from("orders").update(patch).eq("id", id).select().single();
  if (error) return { error: error.message };
  if (v.status === "shipped" && (before.status !== "shipped" || before.tracking_number !== data.tracking_number)) await sendEmail({ to: data.email, ...shippedEmail(data) });
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`); return { ok: true };
}

/** CSV columns: order_number, courier, tracking_number, tracking_url (optional). Marks orders shipped + emails customers. */
export async function importTracking(csvText) {
  { const g = await guard("orders"); if (g) return g; }
  const rows = parseCSV(csvText);
  const out = { updated: 0, skipped: [] };
  for (const r of rows) {
    const num = (r.order_number || "").trim();
    if (!num || !r.tracking_number) { if (num) out.skipped.push(`${num}: missing tracking_number`); continue; }
    const { data: o } = await db().from("orders").select("*").eq("order_number", num).maybeSingle();
    if (!o) { out.skipped.push(`${num}: order not found`); continue; }
    if (!["paid", "processing", "shipped"].includes(o.status)) { out.skipped.push(`${num}: status is ${o.status}`); continue; }
    const patch = { courier: r.courier || null, tracking_number: r.tracking_number, tracking_url: r.tracking_url || null, status: "shipped", shipped_at: o.shipped_at || new Date().toISOString() };
    const { data, error } = await db().from("orders").update(patch).eq("id", o.id).select().single();
    if (error) { out.skipped.push(`${num}: ${error.message}`); continue; }
    await sendEmail({ to: data.email, ...shippedEmail(data) });
    out.updated++;
  }
  revalidatePath("/admin/orders"); return out;
}

export async function setMessageStatus(id, status) {
  { const g = await guard("messages"); if (g) return g; }
  const { error } = await db().from("messages").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/messages"); return { ok: true };
}

export async function savePage(slug, title, body) {
  { const g = await guard("pages"); if (g) return g; }
  if (!PAGE_SLUGS.includes(slug)) return { error: "Unknown page" };
  const { error } = await db().from("pages").upsert({ slug, title, body, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath(`/policies/${slug}`); return { ok: true };
}
export async function resetPage(slug) {
  { const g = await guard("pages"); if (g) return g; }
  await db().from("pages").delete().eq("slug", slug);
  revalidatePath(`/policies/${slug}`); revalidatePath("/admin/pages"); return { ok: true };
}


/** Cancel an order: marks it cancelled, optionally puts the pairs back in stock and emails the customer. */
export async function cancelOrder(id, { reason = "", restock = true, notify = false } = {}) {
  { const g = await guard("orders"); if (g) return g; }
  const { data: o } = await db().from("orders").select("*").eq("id", id).maybeSingle();
  if (!o) return { error: "Order not found" };
  if (o.status === "cancelled") return { error: "This order is already cancelled." };
  const patch = { status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: String(reason || "").slice(0, 300) || null };
  let { error } = await db().from("orders").update(patch).eq("id", id);
  if (error?.code === "42703") ({ error } = await db().from("orders").update({ status: "cancelled", notes: [o.notes, reason && `Cancelled: ${reason}`].filter(Boolean).join("\n") || null }).eq("id", id));   // migration_7 not run yet
  if (error) return { error: error.message };
  let restocked = false;
  // stock was only taken off once the order was confirmed
  if (restock && o.status !== "pending_payment") {
    restocked = true;
    for (const it of o.items || []) { const { error: e2 } = await db().rpc("increment_stock", { p_id: it.id, p_size: String(it.size), p_qty: it.qty }); if (e2) restocked = false; }
  }
  if (notify) await sendEmail({ to: o.email, ...cancelledEmail(o, reason) });
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`); revalidatePath("/admin");
  return { ok: true, restocked };
}

/** Permanently removes an order (use Cancel to keep a record). */
export async function deleteOrder(id) {
  { const g = await guard("orders_delete"); if (g) return g; }
  const { error } = await db().from("orders").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/orders"); revalidatePath("/admin");
  return { ok: true };
}
