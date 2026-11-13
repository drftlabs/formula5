"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "./ShopProvider";

const Chev = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;

export default function Header({ categories = [] }) {
  const { count, setDrawer, pulse } = useShop();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [ping, setPing] = useState(false);
  const router = useRouter();
  useEffect(() => { if (!pulse) return; setPing(true); const t = setTimeout(() => setPing(false), 1000); return () => clearTimeout(t); }, [pulse]);
  useEffect(() => { document.body.style.overflow = menu ? "hidden" : ""; const esc = (e) => e.key === "Escape" && setMenu(false); addEventListener("keydown", esc); return () => removeEventListener("keydown", esc); }, [menu]);
  return (
    <div className="f5-top">
      <header className="f5-bar">
        <div className="f5-bl">
          <button className="f5-ib f5-burger" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} aria-controls="f5menu" onClick={() => setMenu(!menu)}>
            {menu ? <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg> : <svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h16" /></svg>}
          </button>
          <nav className="f5-nav" aria-label="Primary">
            <Link href="/collections/all">Shop</Link><Link href="/#categories">Categories</Link><Link href="/#concerns">Concerns</Link><Link href="/#formula">The Formula</Link><Link href="/our-story">Our story</Link>
          </nav>
        </div>
        <Link className="f5-logo" href="/" aria-label="Formula 5, home"><img src="/logo.png" alt="Formula 5" width="816" height="208" /></Link>
        <div className="f5-tools">
          <button className="f5-ib" aria-label="Search" aria-expanded={search} onClick={() => setSearch(!search)}><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg></button>
          <Link className="f5-ib" href="/account" aria-label="Account: log in or sign up"><svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c.9-4 3.8-6 7.5-6s6.6 2 7.5 6" /></svg></Link>
          <button className={"f5-ib f5-bag" + (ping ? " ping" : "")} data-bag aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`} onClick={() => setDrawer(true)}>
            <svg viewBox="0 0 24 24"><path d="M5.5 8h13l.9 12H4.6L5.5 8Z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></svg><span className={"f5-count" + (count ? "" : " zero")}>{count}</span>
          </button>
        </div>
        <div id="f5menu" className={"f5-menu" + (menu ? " open" : "")} onClick={() => setMenu(false)} inert={menu ? undefined : ""}>
          <div className="big">
            <Link href="/collections/all">Shop all<Chev /></Link><Link href="/#concerns">Shop by concern<Chev /></Link><Link href="/#formula">The Formula<Chev /></Link><Link href="/our-story">Our story<Chev /></Link>
          </div>
          <h4>Categories</h4>
          <div className="small">{categories.map((c) => <Link key={c.id} href={`/categories/${c.slug}`} style={{ "--acc": c.accent }}><span><i />{c.name}</span></Link>)}</div>
          <h4>Help</h4>
          <div className="small"><Link href="/account"><span>Account</span></Link><Link href="/contact"><span>Contact</span></Link></div>
        </div>
      </header>
      <form className={"f5-search" + (search ? " open" : "")} role="search" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.target).get("q"); if (q) { setSearch(false); router.push("/search?q=" + encodeURIComponent(q)); } }}>
        <label className="sr" htmlFor="q">Search products</label>
        {search && <input id="q" name="q" type="search" placeholder="Search products" autoComplete="off" autoFocus />}
      </form>
    </div>
  );
}
