// Which tables/columns the generic admin editor may write. Used by the server action as a whitelist.
export const TABLES = {
  collections: { cols: ["name", "slug", "kanji", "image", "position", "show_home", "active", "sort_order"], slugFrom: "name" },
  tags: { cols: ["name", "slug", "bg", "fg", "sort_order"], slugFrom: "name" },
  colors: { cols: ["name", "slug", "hex", "sort_order"], slugFrom: "name" },
  slides: { cols: ["kicker", "title", "subtext", "cta_text", "link", "cta2_text", "cta2_link", "accent", "art", "image", "image_mobile", "position", "active", "sort_order"] },
  discounts: { cols: ["code", "type", "value", "min_order", "max_uses", "expires_at", "active", "sort_order"] },
  categories: { cols: ["name", "slug", "description", "accent", "image", "banner", "banner_mobile", "active", "sort_order"], slugFrom: "name" },
  concerns: { cols: ["name", "slug", "icon", "accent", "image", "active", "sort_order"], slugFrom: "name" },
  reviews: { cols: ["product_slug", "name", "rating", "title", "body", "verified", "approved", "featured", "sort_order"] },
  blocks: { cols: ["type", "title", "enabled", "sort_order", "config"] },
};
export const SETTING_KEYS = ["business_name", "legal_name", "address", "contact_email", "contact_phone", "gst_number", "instagram", "ticker", "free_shipping_min", "shipping_fee", "dispatch_days", "delivery_days", "refund_days", "jurisdiction", "grievance_name", "cod_enabled", "cod_fee", "cod_prepaid_pct", "whatsapp", "meta_pixel_id"];
export const PAGE_SLUGS = ["privacy", "terms", "shipping", "refund", "grievance"];
