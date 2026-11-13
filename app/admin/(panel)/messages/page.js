import { serviceClient } from "@/lib/supabase/server";
import MessageStatus from "@/components/admin/MessageStatus";
import { dateFmt } from "@/lib/format";

export default async function Messages({ searchParams }) {
  const type = ["contact", "complaint"].includes(searchParams.type) ? searchParams.type : null;
  let q = serviceClient().from("messages").select("*").order("created_at", { ascending: false }).limit(300);
  if (type) q = q.eq("type", type);
  const { data } = await q;
  return (
    <>
      <h1>Messages &amp; complaints</h1><p className="sub">Everything sent through the Contact and Complaint forms. Complaints must be acknowledged within 48 hours.</p>
      <div className="bar-actions"><a className={"abtn sm " + (type ? "ghost" : "")} href="/admin/messages">All</a><a className={"abtn sm " + (type === "contact" ? "" : "ghost")} href="?type=contact">Contact</a><a className={"abtn sm " + (type === "complaint" ? "" : "ghost")} href="?type=complaint">Complaints</a></div>
      {(data || []).map((m) => (
        <div className="panel" key={m.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div><span className="pill" style={{ background: m.type === "complaint" ? "#E2B4AE" : "#EDE8DC", marginRight: 8 }}>{m.type}</span><b>{m.subject || m.category || "Message"}</b> <span className="mut">· {dateFmt(m.created_at)}</span></div>
            <MessageStatus id={m.id} status={m.status} />
          </div>
          <p style={{ margin: "10px 0", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{m.message}</p>
          <p className="mut" style={{ fontSize: 12 }}>{m.name} · <a href={`mailto:${m.email}`} style={{ textDecoration: "underline" }}>{m.email}</a>{m.phone && ` · ${m.phone}`}{m.order_number && ` · Order ${m.order_number}`}</p>
        </div>
      ))}
      {!data?.length && <p className="mut">Nothing here yet.</p>}
    </>
  );
}
