import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { permForPath, permsOf, firstAllowed } from "@/lib/perms";

// Keeps login sessions fresh and gates /account and /admin behind a login.
export async function middleware(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const p = request.nextUrl.pathname;
  const needsLogin = (p.startsWith("/account") && !p.startsWith("/account/login")) || (p.startsWith("/admin") && !p.startsWith("/admin/login") && !p.startsWith("/admin/no-access"));
  if (needsLogin && !user) {
    const to = request.nextUrl.clone();
    to.pathname = p.startsWith("/admin") ? "/admin/login" : "/account/login";
    to.search = "";
    return NextResponse.redirect(to);
  }
  // staff accounts only open the tabs their role allows (owners open everything)
  if (user && p.startsWith("/admin") && !p.startsWith("/admin/login") && !p.startsWith("/admin/no-access")) {
    const need = permForPath(p);
    const { data: row } = await supabase.from("admins").select("*").eq("user_id", user.id).maybeSingle();
    if (row && need) {
      const { perms } = permsOf(row);
      if (!perms.includes(need)) {
        const to = request.nextUrl.clone(); to.search = "";
        const next = firstAllowed(perms);
        to.pathname = next && next !== p ? next : "/admin/no-access";
        return NextResponse.redirect(to);
      }
    }
  }
  return response;
}

export const config = { matcher: ["/account/:path*", "/admin/:path*"] };
