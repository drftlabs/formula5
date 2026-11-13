"use client";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
export default function SignOutBtn() {
  const router = useRouter();
  return <button className="abtn" onClick={async () => { await browserClient().auth.signOut(); router.replace("/admin/login"); router.refresh(); }}>Sign out</button>;
}
