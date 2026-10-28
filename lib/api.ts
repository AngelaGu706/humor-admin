import "server-only";
import { NextResponse } from "next/server";
import { AccessError } from "./auth";
export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  // The local Next server may normalize 127.0.0.1 to localhost in request.url.
  // Preserve only a loopback Host with the same port; production URLs are unchanged.
  const host = request.headers.get("host");
  if (host && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    try {
      const visible = new URL(`${url.protocol}//${host}`);
      if (["localhost", "127.0.0.1", "[::1]"].includes(visible.hostname) && visible.port === url.port) url.host = visible.host;
    } catch { /* An invalid Host cannot change the expected origin. */ }
  }
  return url.origin;
}
export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== requestOrigin(request)) throw new AccessError(403, "This request is not allowed.");
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
