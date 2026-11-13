import { serviceClient } from "@/lib/supabase/server";
import PageEditor from "@/components/admin/PageEditor";
import { DEFAULTS, POLICY_LIST } from "@/lib/legalDefaults";

export default async function Pages() {
  const { data } = await serviceClient().from("pages").select("*");
  const over = Object.fromEntries((data || []).map((p) => [p.slug, p]));
  return (
    <>
      <h1>Legal pages</h1><p className="sub">Privacy, terms, shipping, returns, exchange, refund and grievance policies. Defaults are provided and filled with your Settings. Edit the text here if needed. Please have these reviewed by a lawyer before launch.</p>
      {POLICY_LIST.map((p) => <PageEditor key={p.slug} slug={p.slug} defaultTitle={p.title} title={over[p.slug]?.title || p.title} body={over[p.slug]?.body || DEFAULTS[p.slug]} customised={!!over[p.slug]} />)}
    </>
  );
}
