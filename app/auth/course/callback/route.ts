import { NextResponse } from "next/server";
import { createCourseClient } from "@/lib/course-server";
import { requestOrigin } from "@/lib/api";
export async function GET(request: Request) {
  const url = new URL(request.url), code = url.searchParams.get("code"), origin = requestOrigin(request);
  if (code) {
    try {
      const { error } = await (await createCourseClient()).auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/studio", origin));
    } catch { /* A failed exchange returns to sign-in rather than looping. */ }
  }
  return NextResponse.redirect(new URL("/course-login?error=1", origin));
}
