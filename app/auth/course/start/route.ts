import { NextResponse } from "next/server";
import { createCourseClient } from "@/lib/course-server";
import { requestOrigin } from "@/lib/api";
export async function GET(request: Request) {
  const origin = requestOrigin(request);
  try {
    const supabase = await createCourseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/course/callback`, skipBrowserRedirect: true } });
    if (!error && data.url) return NextResponse.redirect(data.url);
  } catch { /* Display a recoverable sign-in error. */ }
  return NextResponse.redirect(new URL("/course-login?error=1", origin));
}
