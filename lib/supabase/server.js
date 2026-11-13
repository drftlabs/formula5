import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabase = () => !!(URL && ANON);
const noStore = (u, o) => fetch(u, { ...o, cache: "no-store" });

/** Anonymous client: public storefront reads (products, collections, ...). */
export function publicClient() {
  if (!hasSupabase()) return null;
  return createClient(URL, ANON, { auth: { persistSession: false }, global: { fetch: noStore } });
}

/** Service-role client: SERVER ONLY. Bypasses RLS. Never import in client components. */
export function serviceClient() {
  if (!URL || !SERVICE) return null;
  return createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: noStore } });
}

/** Client bound to the visitor's login session (cookies). RLS applies. */
export function sessionClient() {
  if (!hasSupabase()) return null;
  const store = cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(list) { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} },
    },
  });
}
