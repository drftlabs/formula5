"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import { staffEmail } from "@/lib/perms";

export default function AdminLogin() {
  const [e, setE] = useState(""), [p, setP] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false), router = useRouter();
  async function go(ev) {
    ev.preventDefault(); setBusy(true); setErr("");
    const { error } = await browserClient().auth.signInWithPassword({ email: e.includes("@") ? e.trim() : staffEmail(e), password: p });
    if (error) { setBusy(false); return setErr("Incorrect User ID / email or password."); }
    router.replace("/admin"); router.refresh();
  }
  return (
    <form onSubmit={go}>
      <div><label className="lbl" htmlFor="ae">User ID or email</label><input id="ae" className="in" type="text" required autoComplete="username" value={e} onChange={(x) => setE(x.target.value)} /></div>
      <div style={{ marginTop: 12 }}><label className="lbl" htmlFor="ap">Password</label><input id="ap" className="in" type="password" required autoComplete="current-password" value={p} onChange={(x) => setP(x.target.value)} /></div>
      {err && <p className="flash err">{err}</p>}
      <button className="abtn" style={{ marginTop: 16 }} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
