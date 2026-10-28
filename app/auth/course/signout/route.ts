import { NextResponse } from "next/server";
import { createCourseClient } from "@/lib/course-server";
import { requestOrigin, sameOrigin } from "@/lib/api";
export async function POST(request: Request) {
  try { sameOrigin(request); } catch { return new Response("Forbidden", { status: 403 }); }
  await (await createCourseClient()).auth.signOut();
  return NextResponse.redirect(new URL("/course-login", requestOrigin(request)), 303);
}
