import { redirect } from "next/navigation";
import { sessionClient } from "./supabase/server";
import { permsOf } from "./perms";

/** The signed-in admin (owner or staff) with what they may open. Null if not an active admin. */
export async function getAdminCtx() {
  const sb = sessionClient();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: row } = await sb.from("admins").select("*").eq("user_id", user.id).maybeSingle();
  if (!row) return null;
  const { owner, perms } = permsOf(row);
  if (row.active === false) return null;
  return { user, row, isOwner: owner, perms, label: row.display_name || row.username || user.email };
}
export async function getAdmin() { const c = await getAdminCtx(); return c ? c.user : null; }
export async function requireAdmin() {
  const c = await getAdminCtx();
  if (!c) redirect("/admin/login");
  return Object.assign({}, c.user, { perms: c.perms, isOwner: c.isOwner, label: c.label });
}
/** For server actions: returns {error} when the signed-in admin may not do this (callers `return` it). */
export async function guard(perm) {
  const c = await getAdminCtx();
  if (!c) redirect("/admin/login");
  if (perm === "owner" ? !c.isOwner : !c.perms.includes(perm)) return { error: "You don't have access to do this." };
  return null;
}
export async function requireOwner() {
  const c = await getAdminCtx();
  if (!c) redirect("/admin/login");
  if (!c.isOwner) redirect("/admin/no-access");
  return c;
}
