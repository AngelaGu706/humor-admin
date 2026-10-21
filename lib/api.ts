import "server-only";
import { NextResponse } from "next/server";
import { AccessError } from "./auth";
export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new AccessError(403, "This request is not allowed.");
}
export function apiError(error: unknown) {
  if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Admin operation failed");
  return NextResponse.json({ error: "Could not complete this operation. Please try again." }, { status: 500 });
}
export async function parseMedia(request: Request) {
  const raw = await request.text();
  if (raw.length > 30000) throw new AccessError(413, "This content is too large.");
  try { return JSON.parse(raw); } catch { throw new AccessError(400, "Please submit valid content."); }
}
