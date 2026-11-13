import { serviceClient } from "@/lib/supabase/server";
import { inr } from "@/lib/format";
import { resolveRange, loadOrders, loadEvents, orderStats, eventStats, sliceOrders, sliceEvents, dayStart, addDays, pct, fmtDur, istDay, diffDays, dayLabel } from "@/lib/stats";
import { Kpi, RangeBar, Funnel, BarList, ColBars } from "@/components/admin/Bits";

const timeFmt = (d) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
const shortPath = (p) => (p === "/" ? "Home" : p);

export default async function Analytics({ searchParams }) {
  const sb = serviceClient();
  if (!sb) return <p className="flash err">SUPABASE_SERVICE_ROLE_KEY is not set.</p>;
  const r = resolveRange(searchParams);
  const evFrom = [r.from, r.cmp?.from].filter(Boolean).sort()[0], evTo = [r.to, r.cmp?.to].filter(Boolean).sort().reverse()[0];
  const [ev, orders, liveQ, recentQ] = await Promise.all([
    loadEvents(sb, dayStart(evFrom).toISOString(), dayStart(addDays(evTo, 1)).toISOString()),
    loadOrders(sb, dayStart(evFrom).toISOString()),
    sb.from("site_events").select("sid,path,city").eq("type", "view").gte("created_at", new Date(Date.now() - 5 * 60e3).toISOString()),
    sb.from("site_events").select("created_at,path,city,region,device,source,duration,type").order("created_at", { ascending: false }).limit(40),
  ]);
  if (ev.missing) return <><h1>Traffic &amp; analytics</h1><p className="flash err">Traffic tracking isn&apos;t set up yet. Run <code>supabase/migration_7.sql</code> in Supabase → SQL Editor, then visits will start appearing here.</p></>;
  const e = eventStats(sliceEvents(ev.rows, r.from, r.to)), pe = r.cmp ? eventStats(sliceEvents(ev.rows, r.cmp.from, r.cmp.to)) : null;
  const o = orderStats(sliceOrders(orders, r.from, r.to)), po = r.cmp ? orderStats(sliceOrders(orders, r.cmp.from, r.cmp.to)) : null;
  const live = new Map(); for (const x of liveQ.data || []) live.set(x.sid, x);
  const livePages = new Map(); for (const x of live.values()) livePages.set(x.path, (livePages.get(x.path) || 0) + 1);
  // visits per day
  const perDay = new Map(); const seen = new Set();
  for (const x of sliceEvents(ev.rows, r.from, r.to)) { if (x.type !== "view" || !x.sid) continue; const d = istDay(x.created_at), k = d + x.sid; if (seen.has(k)) continue; seen.add(k); perDay.set(d, (perDay.get(d) || 0) + 1); }
  const dayKeys = []; for (let i = 0; i < Math.min(r.days, 62); i++) dayKeys.push(addDays(r.to, -i)); dayKeys.reverse();
  const hourLabels = Array.from({ length: 24 }, (_, h) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`);
  const peak = e.hours.indexOf(Math.max(...e.hours));
  const cod = o.codCount, pre = o.prepaidCount;

  return (
    <>
      <h1>Traffic &amp; analytics</h1><p className="sub">Who visited, where from, what they did, and how many bought.</p>
      <RangeBar r={r} path="/admin/analytics" />

      <div className="attn" style={{ alignItems: "stretch" }}>
        <div style={{ background: "#14231a", border: "1px solid #244a31", padding: "10px 14px", fontSize: 13 }}><span className="livedot" /><b style={{ font: "400 22px var(--display)" }}>{live.size}</b> on the site right now{live.size > 0 && <span className="mut"> · {[...livePages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, n]) => `${shortPath(p)} (${n})`).join(", ")}</span>}</div>
      </div>

      <div className="kpis">
        <Kpi label="Visits (sessions)" value={e.sessions.toLocaleString("en-IN")} cur={e.sessions} prev={pe?.sessions} />
        <Kpi label="Unique visitors" value={e.visitors.toLocaleString("en-IN")} cur={e.visitors} prev={pe?.visitors} />
        <Kpi label="Page views" value={e.pageviews.toLocaleString("en-IN")} cur={e.pageviews} prev={pe?.pageviews} sub={e.sessions ? `${(e.pageviews / e.sessions).toFixed(1)} per visit` : ""} />
        <Kpi label="Avg. time on site" value={fmtDur(e.avgDur)} cur={e.avgDur} prev={pe?.avgDur} />
        <Kpi label="Added to bag" value={e.cart} cur={e.cart} prev={pe?.cart} sub={`${pct(e.cart, e.sessions)}% of visits`} />
        <Kpi label="Reached checkout" value={e.checkout} cur={e.checkout} prev={pe?.checkout} sub={`${pct(e.checkout, e.sessions)}% of visits`} />
        <Kpi label="Purchases" value={o.count} cur={o.count} prev={po?.count} sub={`${pct(o.count, e.sessions)}% of visits`} />
        <Kpi label="Prepaid collected" value={inr(o.collectedOnline)} cur={o.collectedOnline} prev={po?.collectedOnline} sub={`${pre} prepaid · ${cod} COD`} />
      </div>

      <div className="two">
        <div className="panel"><h2 style={{ marginTop: 0 }}>Funnel</h2>
          <Funnel steps={[{ l: "Visits", v: e.sessions }, { l: "Added to bag", v: e.cart, p: pct(e.cart, e.sessions) }, { l: "Reached checkout", v: e.checkout, p: pct(e.checkout, e.cart) }, { l: "Purchased", v: o.count, p: pct(o.count, e.checkout) }]} />
          <p className="mut" style={{ fontSize: 12, marginTop: 12 }}>Purchases come from your real orders. Visits and bag/checkout steps are counted per browsing session.</p></div>
        <div className="panel"><h2 style={{ marginTop: 0 }}>Orders by payment type</h2>
          <BarList items={[["Prepaid (online)", pre, `${pct(pre, o.count || 1)}% · ${inr(o.prepaidSales)}`], ["Cash on delivery", cod, `${pct(cod, o.count || 1)}% · ${inr(o.codSales)}`]]} empty="No orders in this period." />
          <div className="mix"><div><span className="mut">Prepaid money received</span><b>{inr(o.collectedOnline)}</b></div><div><span className="mut">COD still to collect</span><b>{inr(o.codToCollect)}</b></div></div></div>
      </div>

      <div className="two">
        <div className="panel"><h2 style={{ marginTop: 0 }}>Visits by hour of day</h2><ColBars values={e.hours} labels={hourLabels} /><p className="mut" style={{ fontSize: 12, marginTop: 4 }}>{e.pageviews ? `Busiest around ${hourLabels[peak]} (Indian time).` : "No visits yet."}</p></div>
        <div className="panel"><h2 style={{ marginTop: 0 }}>Visits per day</h2><ColBars values={dayKeys.map((d) => perDay.get(d) || 0)} labels={dayKeys.map(dayLabel)} /></div>
      </div>

      <div className="two">
        <div className="panel"><h2 style={{ marginTop: 0 }}>Top cities</h2><BarList items={e.cities} /></div>
        <div className="panel"><h2 style={{ marginTop: 0 }}>Where visitors came from</h2><BarList items={e.sources} /><h2>Devices</h2><BarList items={e.devices} /></div>
      </div>

      <h2>Top pages</h2>
      <div className="tblwrap"><table className="tbl compact"><thead><tr><th>Page</th><th>Views</th><th>Avg. time on page</th></tr></thead><tbody>
        {e.topPages.map((p) => <tr key={p.path}><td>{shortPath(p.path)}</td><td>{p.views}</td><td className="mut">{fmtDur(p.avg)}</td></tr>)}
        {!e.topPages.length && <tr><td colSpan="3" className="mut">No page views in this period.</td></tr>}
      </tbody></table></div>

      <h2>Latest visits</h2>
      <div className="tblwrap"><table className="tbl compact"><thead><tr><th>Time</th><th>City</th><th>Did</th><th>Page</th><th>Device</th><th>From</th><th>Time on page</th></tr></thead><tbody>
        {(recentQ.data || []).map((x, i) => <tr key={i}><td className="mut">{timeFmt(x.created_at)}</td><td>{x.city || "–"}{x.region ? <span className="mut">, {x.region}</span> : ""}</td><td>{x.type === "cart" ? "Added to bag" : x.type === "checkout" ? "Opened checkout" : "Viewed"}</td><td>{shortPath(x.path || "")}</td><td className="mut">{x.device || "–"}</td><td className="mut">{x.source || "Direct"}</td><td className="mut">{x.type === "view" ? fmtDur(x.duration) : ""}</td></tr>)}
        {!recentQ.data?.length && <tr><td colSpan="7" className="mut">No visits recorded yet.</td></tr>}
      </tbody></table></div>
      <p className="mut" style={{ fontSize: 12, marginTop: 8 }}>City comes from the visitor&apos;s network location (approximate). No IP addresses are stored. Admin pages and bots are not counted.</p>
    </>
  );
}
