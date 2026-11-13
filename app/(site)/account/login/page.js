import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { sessionClient } from "@/lib/supabase/server";
export const metadata = { title: "Log in or sign up", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Login() {
  const sb = sessionClient();
  if (sb) { const { data: { user } } = await sb.auth.getUser(); if (user) redirect("/account"); }
  return (
    <div className="page"><div className="wrap" style={{ maxWidth: 640 }}>
      <div className="crumbs"><Link href="/">Home</Link><span>Account</span></div>
      <h1 className="page-title">Log in / <em>Sign up</em></h1>
      <p className="lead">See your orders, tracking and wishlist. We email you a one-time code, so there is no password to remember. An account is also created automatically when you place an order.</p>
      {sb ? <LoginForm /> : <p className="msg-err">Accounts will work once the store backend is connected.</p>}
    </div></div>
  );
}
