import SEED from "./products.seed.json";

// Used only when Supabase env vars are missing (local preview). Mirrors supabase/seed.sql.
export const SETTINGS = {
  business_name: "Formula 5", legal_name: "[LEGAL_ENTITY]", address: "[ADDRESS]",
  contact_email: "", contact_phone: "", gst_number: "", instagram: "",
  ticker: ["Free shipping above ₹999", "Cash on delivery available", "Precision. Purity. Performance.", "Stronger roots. Brighter skin. Everyday care.", "Pick Pack 2 or Pack 3 and save more"],
  // placeholders until the shipping rules are confirmed
  free_shipping_min: 999, shipping_fee: 49, dispatch_days: "1–2 business days", delivery_days: "3–5 business days",
  refund_days: 7, jurisdiction: "[City], India", grievance_name: "[Grievance Officer name]",
  cod_enabled: true, cod_fee: 99, cod_prepaid_pct: 0, whatsapp: "",
  disclaimer: "Results vary. Not intended to diagnose, treat, cure or prevent any disease.",
};

export const TAGS = [
  { id: "t1", name: "Best seller", slug: "bestseller", bg: "#0A0A0A", fg: "#FFFFFF" },
  { id: "t2", name: "New", slug: "new", bg: "#FFFFFF", fg: "#0A0A0A" },
];
export const COLORS = [];
export const COLLECTIONS = [];

// Accent = the category's colour. Soft tints and deep tones are derived from it in CSS.
export const CATEGORIES = [
  { id: "cat-skincare", name: "Skincare", slug: "skincare", accent: "#A9C2A2", description: "Cleansers, serums and creams built around one stated active." },
  { id: "cat-hair-care", name: "Hair Care", slug: "hair-care", accent: "#E5CC85", description: "Oils, serums and shampoo with the hero active up front." },
  { id: "cat-supplements", name: "Supplements", slug: "supplements", accent: "#E4BC9C", description: "Daily capsules with the amount stated per serving." },
  { id: "cat-oral-care", name: "Oral Care", slug: "oral-care", accent: "#9EBFD8", description: "Everyday oral care, formulated with purpose." },
  { id: "cat-lip-care", name: "Lip Care", slug: "lip-care", accent: "#E2AFA8", description: "Lip care formulated around a stated oil percentage." },
  { id: "cat-hair-body-care", name: "Hair & Body Care", slug: "hair-body-care", accent: "#CDB892", description: "Multi-use oils for hair and body." },
  { id: "cat-intimate-care", name: "Intimate Care", slug: "intimate-care", accent: "#BDAFD6", description: "Gentle intimate hygiene, formulated for daily use." },
  { id: "cat-body-care", name: "Body Care", slug: "body-care", accent: "#9CCBBF", description: "Body cleansing with a stated hero active." },
].map((c, i) => ({ image: "", banner: "", banner_mobile: "", active: true, sort_order: i * 10, ...c }));

export const CONCERNS = [
  { id: "con-hair-growth", name: "Hair Growth", slug: "hair-growth", icon: "hair", accent: "#E5CC85" },
  { id: "con-glow", name: "Glow", slug: "glow", icon: "glow", accent: "#E4BC9C" },
  { id: "con-dark-circles", name: "Dark Circles", slug: "dark-circles", icon: "eye", accent: "#BDAFD6" },
  { id: "con-acne-cleansing", name: "Acne & Cleansing", slug: "acne-cleansing", icon: "drop", accent: "#9CCBBF" },
  { id: "con-strength-energy", name: "Strength & Energy", slug: "strength-energy", icon: "bolt", accent: "#E4BC9C" },
  { id: "con-hydration", name: "Hydration", slug: "hydration", icon: "wave", accent: "#9EBFD8" },
].map((c, i) => ({ image: "", active: true, sort_order: i * 10, ...c }));

export const SLIDES = [
  { id: "s1", kicker: "Formula 5", title: "Precision.|Purity.|Performance.", subtext: "Active-led care for skin, hair and body. One hero active, its percentage right on the pack. Shop now & start your routine!", cta_text: "Shop Formula 5", link: "/collections/all", cta2_text: "Build your routine", cta2_link: "/#routine", image: "", image_mobile: "", position: "50% 50%", accent: "#CDB892", art: "hydrating-face-lotion,hair-growth-oil,glow-boost-face-wash" },
  { id: "s2", kicker: "Skincare", title: "Glow begins|with a cleanse!", subtext: "10% Vitamin C brightens while it removes impurities. Deep cleanse + hydration in one step.", cta_text: "Shop skincare", link: "/categories/skincare", cta2_text: "", cta2_link: "", image: "", image_mobile: "", position: "50% 50%", accent: "#A9C2A2", art: "glow-boost-face-wash,skin-renewal-serum" },
  { id: "s3", kicker: "Hair care", title: "Stronger roots|start here!", subtext: "8% Onion Extract + rich botanical oils to nourish the scalp. Lightweight, non-greasy daily care.", cta_text: "Shop hair care", link: "/categories/hair-care", cta2_text: "", cta2_link: "", image: "", image_mobile: "", position: "50% 50%", accent: "#E5CC85", art: "hair-growth-oil,advanced-hair-fortifying-oil,strengthening-keratin-shampoo" },
  { id: "s4", kicker: "Supplements", title: "Wellness|from within!", subtext: "Ashwagandha, Shilajit and herbal blends for daily energy, stamina and strength. Order now & stay energised.", cta_text: "Shop supplements", link: "/categories/supplements", cta2_text: "", cta2_link: "", image: "", image_mobile: "", position: "50% 50%", accent: "#E4BC9C", art: "energy-vitality-capsules,immune-herbal-complex,vital-mass-capsules" },
];

export const BLOCKS = [
  { id: "b1", type: "hero", title: "Hero slider", config: {} },
  { id: "b2", type: "categories", title: "Shop by category", config: { eyebrow: "Categories", title: "Shop by category" } },
  { id: "b3", type: "concerns", title: "Shop by concern", config: { eyebrow: "Concerns", title: "Shop by concern" } },
  { id: "b4", type: "products", title: "Best sellers", config: { eyebrow: "Most loved", title: "Best sellers", source: "tag", source_value: "bestseller", limit: 8, link: "/collections/all", link_text: "View all" } },
  { id: "b5", type: "products", title: "New arrivals", config: { eyebrow: "Just in", title: "New arrivals", source: "tag", source_value: "new", limit: 8, link: "/collections/all", link_text: "View all" } },
  { id: "b6", type: "routine", title: "Routine finder", config: { eyebrow: "Build your routine", title: "Start with what you|want to change.", text: "Pick a concern & we'll line up the products that fit, step by step. Add the whole routine in one tap." } },
  { id: "b7", type: "editorial", title: "Formulated with purpose", config: { eyebrow: "Our approach", title: "Say what's inside.|Say how much.", text: "Formula 5 starts with a simple idea: every product has one hero active, and its percentage is stated in the name. Precision in the formula. Purity in the presentation. Performance you can judge for yourself.", cta_text: "Read our story", link: "/our-story", accent: "#A9C2A2", art: "glow-boost-face-wash,hair-growth-oil,lip-repair-elixir", image: "" } },
  { id: "b7b", type: "promos", title: "Promo banners", config: { items: [
    { title: "Meet the hero actives", text: "Every ingredient, its percentage and its role, explained plainly.", cta_text: "Explore ingredients", link: "/ingredients", accent: "#E5CC85", art: "skin-renewal-serum", image: "", image_mobile: "" },
    { title: "Not sure where to start?", text: "Pick a concern & build your routine in seconds!", cta_text: "Build your routine", link: "/#routine", accent: "#BDAFD6", art: "eye-revive-complex", image: "", image_mobile: "" },
  ] } },
  { id: "b8", type: "why", title: "Why Formula 5", config: { eyebrow: "The Formula 5 difference", title: "Less noise.|Better formulation." } },
  { id: "b9", type: "testimonials", title: "Customer reviews", config: { eyebrow: "Reviews", title: "Loved by|our customers." } },
  { id: "b10", type: "newsletter", title: "Newsletter", config: { eyebrow: "The Formula 5 Journal", title: "Glow tips, hair care|and new launches.", text: "Short, useful and occasional. Be first to know when something new drops." } },
];

import RV from "./reviews.seed.json";
// Customer reviews supplied in product_reviews_generated.xlsx (emails dropped). Switch off in one place: set SHOW_REVIEWS to false.
export const SHOW_REVIEWS = true;
export const REVIEWS = SHOW_REVIEWS ? RV.map((r) => ({ ...r, verified: false })) : [];

// ---- products (from Formula5_Product_Master_Detailed.xlsx) ----
const BEST = ["glow-boost-face-wash-10-vitamin-c", "skin-renewal-serum-10-l-ascorbic-acid", "hair-growth-oil-8-argania-spinosa-oil", "hydrating-face-lotion-20-theobroma-cacao-seed-butter", "purifying-facial-cleanser-20-aloe-barbadensis-juice", "lip-repair-elixir-30-olea-europaea-oil", "eye-revive-complex-10-sodium-hyaluronate", "lustre-hair-serum-20-cyclomethicone"];
const NEW = ["age-defying-night-cream-10-glycolic-acid", "exfoliating-coffee-face-scrub-15-coffea-arabica-extract", "radiance-boost-face-mask-10-activated-charcoal", "strengthening-keratin-shampoo-10-hydrolyzed-keratin", "deep-clean-charcoal-tooth-powder-15-activated-charcoal", "skin-recovery-cream-10-glycerin", "eventone-underarm-cream-10-glycerin", "advanced-hair-fortifying-oil-8-allium-cepa-extract"];
const CONCERN = {
  "hair-growth": ["hair-growth-oil", "hair-growth-roll-on", "advanced-hair-fortifying-oil", "strengthening-keratin-shampoo", "multi-boost-oil"],
  "glow": ["glow-boost-face-wash", "skin-renewal-serum", "radiance-boost-face-mask", "age-defying-night-cream", "exfoliating-coffee-face-scrub"],
  "dark-circles": ["eye-revive-complex"],
  "acne-cleansing": ["purifying-facial-cleanser", "glow-boost-face-wash", "radiance-boost-face-mask", "exfoliating-coffee-face-scrub", "purifying-tea-tree-shower-gel"],
  "strength-energy": ["energy-vitality-capsules", "vital-mass-capsules", "bone-strength-capsules", "immune-herbal-complex"],
  "hydration": ["hydrating-face-lotion", "eye-revive-complex", "lip-repair-elixir", "skin-recovery-cream", "anti-friction-barrier-cream"],
};
export const PRODUCTS = SEED.map((p) => ({
  id: "p-" + p.slug, name: p.name, slug: p.slug, sku: p.sku, price: p.packs[0].price, compare_price: p.packs[0].mrp,
  description: p.description || "", subtitle: "", details: "", images: p.images || [], colors: [],
  usp: p.usp || "", tagline: p.tagline || "", benefits: p.benefits || "", how_to_use: p.how_to_use || "", ideal_customer: "", ingredients_raw: p.ingredients_raw || "",
  top_ingredients: p.top_ingredients || [], captions: p.captions || [],
  tags: [BEST.includes(p.slug) ? "bestseller" : "", NEW.includes(p.slug) ? "new" : ""].filter(Boolean),
  category: p.category, concerns: Object.entries(CONCERN).filter(([, l]) => l.some((k) => p.slug.startsWith(k))).map(([c]) => c),
  packs: p.packs.map((k) => ({ n: k.n, price: k.price, mrp: k.mrp, sku: k.sku })),
  sizes: Object.fromEntries(p.packs.map((k) => [k.n, k.stock ?? 50])),
  collection_id: null, active: true, accent: "", sort_order: p.sort_order,
}));
