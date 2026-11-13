import Link from "next/link";
import { notFound } from "next/navigation";
import Prose from "@/components/Prose";
import { getSettings, getPageOverride } from "@/lib/data";
import { DEFAULTS, POLICY_LIST, fillTokens } from "@/lib/legalDefaults";

export const dynamic = "force-dynamic";
const find = (slug) => POLICY_LIST.find((p) => p.slug === slug);

export async function generateMetadata({ params }) { const p = find(params.slug); return { title: p ? p.title : "Policy" }; }

export default async function Policy({ params }) {
  const meta = find(params.slug); if (!meta) notFound();
  const [s, over] = await Promise.all([getSettings(), getPageOverride(params.slug)]);
  const words = (over?.title || meta.title).split(" ");
  return (
    <div className="page"><div className="wrap" style={{ maxWidth: 860 }}>
      <div className="crumbs"><Link href="/">Home</Link><span>Legal</span><span>{meta.title}</span></div>
      <h1 className="page-title">{words.slice(0, -1).join(" ")} <em>{words.slice(-1)}</em></h1>
      <nav className="policy-nav" aria-label="Policies">{POLICY_LIST.map((p) => <Link key={p.slug} href={`/policies/${p.slug}`} className={p.slug === params.slug ? "on" : ""}>{p.title}</Link>)}</nav>
      <Prose text={fillTokens(over?.body || DEFAULTS[params.slug], s)} />
      <p className="lead" style={{ marginTop: 40, fontSize: 14 }}>Questions? <Link className="link" href="/contact">Contact us</Link> or <Link className="link" href="/complaint">raise a complaint</Link>.</p>
    </div></div>
  );
}
