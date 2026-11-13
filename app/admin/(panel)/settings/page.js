import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import { getAdminCtx } from "@/lib/admin";
import SettingsForm from "@/components/admin/SettingsForm";
import TeamManager from "@/components/admin/TeamManager";
import { SETTINGS } from "@/lib/fallback";

export default async function Settings({ searchParams }) {
  const ctx = await getAdminCtx();
  const sb = serviceClient();
  const team = searchParams.tab === "team" && ctx?.isOwner;
  let body;
  if (team) {
    const [{ data: roles, error: e1 }, { data: admins }] = await Promise.all([sb.from("admin_roles").select("*").order("name"), sb.from("admins").select("*").order("created_at")]);
    if (e1) body = <p className="flash err">Run <code>supabase/migration_7.sql</code> in Supabase → SQL Editor to turn on team users and roles.</p>;
    else {
      const { data: list } = await sb.auth.admin.listUsers({ perPage: 200 });
      const mail = Object.fromEntries((list?.users || []).map((u) => [u.id, u.email]));
      const staff = (admins || []).map((a) => ({ user_id: a.user_id, username: a.username, email: mail[a.user_id], display_name: a.display_name, role_id: a.role_id, permissions: a.permissions || [], is_owner: a.is_owner === true || !("is_owner" in a), active: a.active !== false }));
      body = <><h1>Team &amp; roles</h1><p className="sub">Create logins for your team and choose exactly which admin tabs each person can open.</p><TeamManager roles={roles || []} staff={staff} meId={ctx.user.id} /></>;
    }
  } else {
    const { data } = await sb.from("site_settings").select("value").eq("key", "site").maybeSingle();
    body = <><h1>Settings</h1><p className="sub">Ticker, business details, contact info, shipping and policy numbers. Policy pages pick these up automatically.</p><SettingsForm settings={{ ...SETTINGS, ...(data?.value || {}) }} /></>;
  }
  return (
    <>
      {ctx?.isOwner && <div className="ap-tabs"><Link href="/admin/settings" className={!team ? "on" : ""}>Store settings</Link><Link href="/admin/settings?tab=team" className={team ? "on" : ""}>Team &amp; roles</Link></div>}
      {body}
    </>
  );
}
