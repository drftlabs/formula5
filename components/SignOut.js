"use client";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
export default function SignOut({ to = "/" }) {
  const router = useRouter();
  return <button className="link" onClick={async () => { await browserClient().auth.signOut(); router.replace(to); router.refresh(); }}>Log out</button>;
}
