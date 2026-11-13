import { redirect } from "next/navigation";
import AdminLogin from "@/components/admin/AdminLogin";
import { getAdmin } from "@/lib/admin";
import { hasSupabase } from "@/lib/supabase/server";

export default async function Login() {
  if (hasSupabase() && (await getAdmin())) redirect("/admin");
  return (
    <div className="login"><div>
      <img src="/logo.png" alt="Taeken" width="56" style={{ marginBottom: 16 }} />
      <h1>Admin</h1><p className="sub" style={{ marginBottom: 18 }}>Sign in with your admin account.</p>
      {hasSupabase() ? <AdminLogin /> : <p className="flash err">Supabase isn't connected yet. Add the environment variables (see README).</p>}
    </div></div>
  );
}
