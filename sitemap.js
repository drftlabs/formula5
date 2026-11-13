import { getProducts, getCollections } from "@/lib/data";
import { POLICY_LIST } from "@/lib/legalDefaults";
import { SITE_URL } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const [p, c] = await Promise.all([getProducts(), getCollections()]);
  const now = new Date();
  return [
    ...["", "/collections/all", "/our-story", "/contact", "/complaint", "/track"].map((u) => ({ url: SITE_URL + u, lastModified: now })),
    ...c.map((x) => ({ url: `${SITE_URL}/collections/${x.slug}`, lastModified: now })),
    ...p.map((x) => ({ url: `${SITE_URL}/products/${x.slug}`, lastModified: now })),
    ...POLICY_LIST.map((x) => ({ url: `${SITE_URL}/policies/${x.slug}`, lastModified: now })),
  ];
}
