import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export class AccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Called at every data entry point, not just in the navigation or layout.
export async function authorizeAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AccessError(401, "Please sign in with Google.");
  if (!user.identities?.some(identity => identity.provider === "google")) {
    throw new AccessError(403, "A Google account is required.");
  }
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("id, first_name, last_name, is_superadmin").eq("id", user.id).maybeSingle();
  if (profileError) throw new AccessError(503, "Administrator permissions need to be configured in the database.");
  if (profile?.is_superadmin !== true) throw new AccessError(403, "This account does not have administrator access.");
  // Fail closed until the database policies and protected role flag are installed.
  const { data: ready, error: setupError } = await supabase.rpc("week6_admin_ready");
  if (setupError || ready !== true) throw new AccessError(503, "Administrator database setup is not complete.");
  return { supabase, user, profile };
}

export async function requireAdmin() {
  try { return await authorizeAdmin(); }
  catch (error) {
    if (error instanceof AccessError) {
      if (error.status === 401) redirect("/login");
      redirect(`/access-denied${error.status === 503 ? "?setup=1" : ""}`);
    }
    throw error;
  }
}
