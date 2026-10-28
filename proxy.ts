import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const course = /^\/(studio(?:\/|$)|api\/studio(?:\/|$)|course-login(?:\/|$)|auth\/course(?:\/|$))/.test(request.nextUrl.pathname);
  const databaseUrl = course ? process.env.COURSE_SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL;
  const databaseKey = course ? process.env.COURSE_SUPABASE_PUBLISHABLE_KEY : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (databaseUrl && databaseKey) {
    const supabase = createServerClient(databaseUrl, databaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getClaims();
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/admin/:path*", "/studio/:path*", "/api/:path*", "/login", "/course-login", "/access-denied", "/auth/:path*"] };
