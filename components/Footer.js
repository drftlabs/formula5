import Link from "next/link";
import TrackOpen from "./TrackOpen";
import { POLICY_LIST } from "@/lib/legalDefaults";

// Columns come from Settings → footer_cols when set; otherwise categories, company links and policies fill in automatically.
export default function Footer({ settings, categories = [] }) {
  const ig = settings.instagram;
  const cols = Array.isArray(settings.footer_cols) && settings.footer_cols.length ? settings.footer_cols : null;
  return (
    <footer className="f5-foot" id="footer">
      <div className="f5-foot-in">
        <div className="f5-foot-top">
          <div className="f5-foot-brand">
            <Link className="f5-logo" href="/" aria-label="Formula 5, back to top"><img src="/logo.png" alt="Formula 5" width="816" height="208" /></Link>
            <p>Precision.<br />Purity.<br />Performance.</p>
            <a className="f5-ig" href={ig ? `https://instagram.com/${ig}` : "#"} target={ig ? "_blank" : undefined} rel="noopener" aria-label="Formula 5 on Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg><span>{ig ? "@" + ig : "Instagram"}</span>
            </a>
          </div>
          <div className="f5-foot-cols">
            {cols ? cols.map((c) => <div key={c.title}><h4>{c.title}</h4>{(c.links || []).map((l) => <Link key={l.href + l.label} href={l.href}>{l.label}</Link>)}</div>) : (
              <>
                <div><h4>Shop</h4><Link href="/collections/all">All products</Link>{categories.map((c) => <Link key={c.id} href={`/categories/${c.slug}`}>{c.name}</Link>)}</div>
                <div><h4>Formula 5</h4><Link href="/our-story">Our story</Link><Link href="/contact">Contact</Link><Link href="/complaint">Raise a complaint</Link><TrackOpen className="f5-tracklink">Track order</TrackOpen><Link href="/account">Account</Link></div>
                <div><h4>Policies</h4>{POLICY_LIST.filter((p) => !["returns", "exchange"].includes(p.slug)).map((p) => <Link key={p.slug} href={`/policies/${p.slug}`}>{p.title}</Link>)}</div>
              </>
            )}
          </div>
        </div>
        <div className="f5-foot-bot">
          <div><div>© {new Date().getFullYear()} {settings.business_name}. All rights reserved.</div></div>
          <div><b className="f5-pay">Secure payment</b> · UPI, cards, netbanking · India · INR ₹</div>
        </div>
      </div>
    </footer>
  );
}
