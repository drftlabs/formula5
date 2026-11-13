import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";

export default async function Panel({ children }) {
  const user = await requireAdmin();
  return (
    <div className="adm-wrap">
      <AdminNav label={user.label || user.email} perms={user.perms} />
      <main className="adm-main">{children}</main>
    </div>
  );
}
