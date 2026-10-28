import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccessError } from "./auth";

export function courseConfigured() { return Boolean(process.env.COURSE_SUPABASE_URL && process.env.COURSE_SUPABASE_PUBLISHABLE_KEY); }
export async function createCourseClient() {
  if (!courseConfigured()) throw new AccessError(503, "The course database connection has not been configured.");
  const store = await cookies();
  return createServerClient(process.env.COURSE_SUPABASE_URL!, process.env.COURSE_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => store.getAll(), setAll(values) { try { values.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* The proxy refreshes render-time cookies. */ } } },
  });
}
export async function authorizeCourseAdmin() {
  const supabase = await createCourseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AccessError(401, "Please sign in to the course workspace.");
  if (!user.identities?.some(identity => identity.provider === "google")) throw new AccessError(403, "A Google account is required.");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id, first_name, last_name, email, is_superadmin").eq("id", user.id).maybeSingle();
  if (profileError) throw new AccessError(503, "Could not verify course administrator access.");
  if (profile?.is_superadmin !== true) throw new AccessError(403, "This account does not have course administrator access.");
  // Use this user's JWT throughout. The database's existing RLS rules remain authoritative.
  return { supabase, user, profile };
}
export async function requireCourseAdmin() {
  try { return await authorizeCourseAdmin(); }
  catch (error) {
    if (error instanceof AccessError) redirect(`/course-login?${error.status === 401 ? "" : error.status === 403 ? "denied=1" : "setup=1"}`);
    throw error;
  }
}
