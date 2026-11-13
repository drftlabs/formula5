"use server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "../admin";
import { serviceClient } from "../supabase/server";
import { ALL_PERMS, staffEmail } from "../perms";

const db = () => serviceClient();
const cleanPerms = (a) => [...new Set((Array.isArray(a) ? a : []).filter((p) => ALL_PERMS.includes(p)))];
const refresh = () => revalidatePath("/admin/settings");
async function owner() { try { return await requireOwner(); } catch (e) { throw e; } }

export async function saveRole(id, { name, permissions }) {
  await owner();
  name = String(name || "").trim().slice(0, 40);
  if (!name) return { error: "Give the role a name." };
  const perms = cleanPerms(permissions);
  const { data, error } = id ? await db().from("admin_roles").update({ name, permissions: perms }).eq("id", id).select().single() : await db().from("admin_roles").insert({ name, permissions: perms }).select().single();
  if (error) return { error: error.code === "23505" ? "A role with that name already exists." : error.message };
  if (id) await db().from("admins").update({ permissions: perms }).eq("role_id", id).eq("is_owner", false);   // everyone on this role follows the change
  refresh(); return { ok: true };
}
export async function deleteRole(id) {
  await owner();
  const { count } = await db().from("admins").select("user_id", { count: "exact", head: true }).eq("role_id", id);
  if (count) return { error: `${count} user${count > 1 ? "s use" : " uses"} this role. Move them to another role first.` };
  const { error } = await db().from("admin_roles").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh(); return { ok: true };
}

/** Creates a staff login: a User ID + password (no email needed). */
export async function createStaff({ username, password, name, role_id, permissions }) {
  await owner();
  username = String(username || "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return { error: "User ID must be 3–30 characters: letters, numbers, dot, dash or underscore (no spaces, no @)." };
  if (String(password || "").length < 8) return { error: "Password must be at least 8 characters." };
  let perms = cleanPerms(permissions), rid = null;
  if (role_id) { const { data: r } = await db().from("admin_roles").select("id,permissions").eq("id", role_id).maybeSingle(); if (!r) return { error: "That role no longer exists." }; rid = r.id; perms = cleanPerms(r.permissions); }
  if (!rid && !perms.length) return { error: "Pick a role, or tick at least one tab for custom access." };
  const { data: dup } = await db().from("admins").select("user_id").eq("username", username).maybeSingle();
  if (dup) return { error: "That User ID is already taken." };
  const { data, error } = await db().auth.admin.createUser({ email: staffEmail(username), password, email_confirm: true, user_metadata: { staff: true, username } });
  if (error) return { error: /already|registered/i.test(error.message) ? "That User ID is already taken." : error.message };
  const { error: e2 } = await db().from("admins").insert({ user_id: data.user.id, username, display_name: String(name || "").trim().slice(0, 60) || username, role_id: rid, permissions: perms, is_owner: false, active: true });
  if (e2) { await db().auth.admin.deleteUser(data.user.id); return { error: e2.code === "42703" ? "Run supabase/migration_7.sql in Supabase first (team columns are missing)." : e2.message }; }
  refresh(); return { ok: true };
}
export async function updateStaff(userId, { name, role_id, permissions, active }) {
  const me = await owner();
  const { data: row } = await db().from("admins").select("*").eq("user_id", userId).maybeSingle();
  if (!row) return { error: "User not found." };
  if (row.is_owner) return { error: "Owners can't be changed here." };
  const patch = { display_name: String(name || "").trim().slice(0, 60) || row.username, active: !!active };
  if (role_id) { const { data: r } = await db().from("admin_roles").select("id,permissions").eq("id", role_id).maybeSingle(); if (!r) return { error: "That role no longer exists." }; patch.role_id = r.id; patch.permissions = cleanPerms(r.permissions); }
  else { patch.role_id = null; patch.permissions = cleanPerms(permissions); if (!patch.permissions.length) return { error: "Pick a role or tick at least one tab." }; }
  const { error } = await db().from("admins").update(patch).eq("user_id", userId);
  if (error) return { error: error.message };
  try { await db().auth.admin.updateUserById(userId, { ban_duration: active ? "none" : "876000h" }); } catch {}   // switching off also blocks sign-in
  refresh(); return { ok: true };
}
export async function resetStaffPassword(userId, password) {
  await owner();
  if (String(password || "").length < 8) return { error: "Password must be at least 8 characters." };
  const { data: row } = await db().from("admins").select("is_owner").eq("user_id", userId).maybeSingle();
  if (!row || row.is_owner) return { error: "Only staff passwords can be reset here." };
  const { error } = await db().auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  return { ok: true };
}
export async function deleteStaff(userId) {
  const me = await owner();
  if (me.user.id === userId) return { error: "You can't delete yourself." };
  const { data: row } = await db().from("admins").select("is_owner").eq("user_id", userId).maybeSingle();
  if (!row) return { error: "User not found." };
  if (row.is_owner) return { error: "Owners can't be deleted here." };
  const { error } = await db().auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  refresh(); return { ok: true };
}
