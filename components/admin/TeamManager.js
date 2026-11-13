"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRole, deleteRole, createStaff, updateStaff, resetStaffPassword, deleteStaff } from "@/lib/actions/team";
import { PERMS, EXTRA_PERMS } from "@/lib/perms";

const PRESETS = [
  ["Order manager", ["dashboard", "orders", "customers", "abandoned", "messages"]],
  ["Catalogue manager", ["products", "inventory", "media", "collections", "tags", "colors"]],
  ["Marketing", ["dashboard", "analytics", "discounts", "slides", "blocks", "abandoned"]],
  ["Support", ["orders", "customers", "messages"]],
];
const GROUPS = [...new Set(PERMS.map((p) => p[3]))];

function PermGrid({ value, onChange }) {
  const tog = (k) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <div className="permgrid">
      {GROUPS.map((g) => <div key={g} style={{ display: "contents" }}><div className="g">{g}</div>
        {PERMS.filter((p) => p[3] === g).map((p) => <label key={p[0]}><input type="checkbox" checked={value.includes(p[0])} onChange={() => tog(p[0])} />{p[1]}</label>)}
        {g === "Sales" && EXTRA_PERMS.map((p) => <label key={p[0]}><input type="checkbox" checked={value.includes(p[0])} onChange={() => tog(p[0])} />{p[1]}</label>)}</div>)}
    </div>
  );
}

export default function TeamManager({ roles, staff, meId }) {
  const router = useRouter(), [pending, start] = useTransition(), [msg, setMsg] = useState(null);
  const [role, setRole] = useState(null);                 // {id?, name, permissions}
  const [nu, setNu] = useState({ username: "", password: "", name: "", role_id: "", permissions: [] });
  const [edit, setEdit] = useState(null);                 // staff row being edited
  const [pw, setPw] = useState({});
  const run = (fn, ok) => start(async () => { const r = await fn(); setMsg(r?.error ? { err: r.error } : { ok: ok || "Saved" }); if (!r?.error) router.refresh(); return r; });
  const roleName = (id) => roles.find((r) => r.id === id)?.name;

  return (
    <>
      {msg && <p className={"flash" + (msg.err ? " err" : "")}>{msg.err || msg.ok}</p>}

      <h2>Roles</h2>
      <p className="mut" style={{ fontSize: 13, margin: "0 0 12px" }}>A role is a set of admin tabs. Tick the tabs people on that role can open; everything else is hidden and blocked. Changing a role updates everyone on it.</p>
      {roles.map((r) => (
        <div className="panel" key={r.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div><b>{r.name}</b> <span className="mut">· {r.permissions.length} tabs · {staff.filter((s) => s.role_id === r.id).length} user(s)</span></div>
            <div className="bar-actions" style={{ margin: 0 }}>
              <button className="abtn sm ghost" onClick={() => setRole({ id: r.id, name: r.name, permissions: r.permissions })}>Edit</button>
              <button className="abtn sm danger" disabled={pending} onClick={() => { if (confirm(`Delete role “${r.name}”?`)) run(() => deleteRole(r.id), "Role deleted"); }}>Delete</button>
            </div>
          </div>
          <p className="mut" style={{ fontSize: 12, margin: "8px 0 0" }}>{r.permissions.map((k) => PERMS.find((p) => p[0] === k)?.[1] || EXTRA_PERMS.find((p) => p[0] === k)?.[1] || k).join(" · ") || "No access"}</p>
        </div>
      ))}
      {role ? (
        <div className="panel"><h2 style={{ marginTop: 0 }}>{role.id ? "Edit role" : "New role"}</h2>
          <div className="af"><div><label className="lbl">Role name</label><input type="text" value={role.name} onChange={(e) => setRole({ ...role, name: e.target.value })} placeholder="e.g. Order manager" /></div></div>
          {!role.id && <div className="bar-actions" style={{ margin: "12px 0 0" }}><span className="mut" style={{ fontSize: 12 }}>Start from:</span>{PRESETS.map(([n, p]) => <button key={n} className="abtn sm ghost" onClick={() => setRole({ ...role, name: role.name || n, permissions: p })}>{n}</button>)}</div>}
          <PermGrid value={role.permissions} onChange={(permissions) => setRole({ ...role, permissions })} />
          <div className="bar-actions"><button className="abtn" disabled={pending} onClick={() => run(async () => { const r = await saveRole(role.id, role); if (!r.error) setRole(null); return r; }, "Role saved")}>Save role</button><button className="abtn ghost" onClick={() => setRole(null)}>Cancel</button></div>
        </div>
      ) : <button className="abtn" onClick={() => setRole({ name: "", permissions: [] })}>+ New role</button>}

      <h2>Users</h2>
      <p className="mut" style={{ fontSize: 13, margin: "0 0 12px" }}>Staff sign in at <code>/admin</code> with their <b>User ID</b> and password (no email needed). Owners (accounts created with an email) always have full access.</p>
      <div className="tblwrap"><table className="tbl"><thead><tr><th>User ID</th><th>Name</th><th>Access</th><th>Status</th><th></th></tr></thead><tbody>
        {staff.map((s) => <tr key={s.user_id}>
          <td><b>{s.username || s.email || "-"}</b>{s.user_id === meId && <span className="mut"> (you)</span>}</td><td>{s.display_name || "-"}</td>
          <td>{s.is_owner ? <span className="pill" style={{ background: "#FBF3DF", color: "#8A6A22" }}>Owner · full access</span> : s.role_id ? <>{roleName(s.role_id) || "Role"}</> : <span className="mut">Custom · {s.permissions.length} tabs</span>}</td>
          <td>{s.active === false ? <span className="pill" style={{ background: "#FBEDEA", color: "#A33B34" }}>Off</span> : <span className="pill" style={{ background: "#EAF4EC", color: "#2E7D4F" }}>Active</span>}</td>
          <td>{!s.is_owner && <button className="abtn sm ghost" onClick={() => setEdit({ ...s, permissions: s.permissions || [] })}>Manage</button>}</td></tr>)}
      </tbody></table></div>

      {edit && (
        <div className="panel"><h2 style={{ marginTop: 0 }}>Manage {edit.username}</h2>
          <div className="af">
            <div><label className="lbl">Name</label><input type="text" value={edit.display_name || ""} onChange={(e) => setEdit({ ...edit, display_name: e.target.value })} /></div>
            <div><label className="lbl">Role</label><select value={edit.role_id || ""} onChange={(e) => setEdit({ ...edit, role_id: e.target.value || null })}><option value="">Custom (choose tabs)</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
          </div>
          {!edit.role_id && <PermGrid value={edit.permissions} onChange={(permissions) => setEdit({ ...edit, permissions })} />}
          <label className="chk"><input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />Account active (untick to block sign-in)</label>
          <div className="bar-actions" style={{ marginTop: 14 }}>
            <button className="abtn" disabled={pending} onClick={() => run(async () => { const r = await updateStaff(edit.user_id, { name: edit.display_name, role_id: edit.role_id, permissions: edit.permissions, active: edit.active !== false }); if (!r.error) setEdit(null); return r; }, "User saved")}>Save</button>
            <button className="abtn ghost" onClick={() => setEdit(null)}>Close</button>
            <button className="abtn danger" disabled={pending} onClick={() => { if (confirm(`Delete ${edit.username}? They will no longer be able to sign in.`)) run(async () => { const r = await deleteStaff(edit.user_id); if (!r.error) setEdit(null); return r; }, "User deleted"); }}>Delete user</button>
          </div>
          <h2>Reset password</h2>
          <div className="bar-actions"><input className="in" style={{ width: 240 }} type="text" placeholder="New password (8+ characters)" value={pw[edit.user_id] || ""} onChange={(e) => setPw({ ...pw, [edit.user_id]: e.target.value })} />
            <button className="abtn sm" disabled={pending} onClick={() => run(async () => { const r = await resetStaffPassword(edit.user_id, pw[edit.user_id]); if (!r.error) setPw({ ...pw, [edit.user_id]: "" }); return r; }, "Password changed")}>Set password</button></div>
        </div>
      )}

      <div className="panel"><h2 style={{ marginTop: 0 }}>Add a user</h2>
        <div className="af">
          <div><label className="lbl">User ID (used to sign in)</label><input type="text" autoComplete="off" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} placeholder="e.g. ravi.packing" /></div>
          <div><label className="lbl">Password (8+ characters)</label><input type="text" autoComplete="off" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} /></div>
          <div><label className="lbl">Name</label><input type="text" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} placeholder="e.g. Ravi" /></div>
          <div><label className="lbl">Role</label><select value={nu.role_id} onChange={(e) => setNu({ ...nu, role_id: e.target.value })}><option value="">Custom (choose tabs)</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
        </div>
        {!nu.role_id && <PermGrid value={nu.permissions} onChange={(permissions) => setNu({ ...nu, permissions })} />}
        <div className="bar-actions" style={{ marginTop: 14 }}><button className="abtn" disabled={pending} onClick={() => run(async () => { const r = await createStaff(nu); if (!r.error) setNu({ username: "", password: "", name: "", role_id: "", permissions: [] }); return r; }, "User created. Share the User ID and password with them.")}>Create user</button></div>
      </div>
    </>
  );
}
