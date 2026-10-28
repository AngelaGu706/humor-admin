import "server-only";
import { requireAdmin } from "./auth";

export type Generation = { id: string; user_id: string; title: string; prompt: string; content: string; created_at: string; trace_id?: string | null };
export type Profile = { id: string; first_name: string | null; last_name: string | null; is_superadmin: boolean };
export type Vote = { id: string; user_id: string; generation_id: string; vote: "up" | "down"; created_at: string };
export const PAGE_SIZE = 20;
export function pageNumber(value: string | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1;
}
export function displayName(profile?: Profile | null) {
  return [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unnamed user";
}
export function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
export async function generations(page = 1, id?: string) {
  const { supabase } = await requireAdmin();
  let query = supabase.from("generations").select("id, user_id, title, prompt, content, created_at", { count: "exact" })
;
  if (id) query = query.eq("id", id);
  const result = await query.order("created_at", { ascending: false }).order("id").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (result.error) throw new Error("Could not load AI content. Please try again.");
  const rows = (result.data ?? []) as Generation[];
  const traces = rows.length ? await supabase.from("food_generation_requests").select("id,generation_id").in("generation_id", rows.map(row => row.id)) : { data: [], error: null };
  if (traces.error) throw new Error("Could not load generation traces. Please try again.");
  return { rows: rows.map(row => ({ ...row, trace_id: traces.data?.find(trace => trace.generation_id === row.id)?.id ?? null })), count: result.count ?? 0 };
}
export async function profiles(page = 1) {
  const { supabase } = await requireAdmin();
  const result = await supabase.from("profiles").select("id, first_name, last_name, is_superadmin", { count: "exact" })
    .order("id").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (result.error) throw new Error("Could not load user profiles. Please try again.");
  return { rows: (result.data ?? []) as Profile[], count: result.count ?? 0 };
}
export async function votes(page = 1) {
  const { supabase } = await requireAdmin();
  const result = await supabase.from("votes").select("id, user_id, generation_id, vote, created_at", { count: "exact" })
    .order("created_at", { ascending: false }).order("id").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (result.error) throw new Error("Could not load ratings. Please try again.");
  const rows = (result.data ?? []) as Vote[];
  const ids = [...new Set(rows.map(row => row.generation_id))];
  const userIds = [...new Set(rows.map(row => row.user_id))];
  const [media, people] = await Promise.all([
    ids.length ? supabase.from("generations").select("id, title").in("id", ids) : Promise.resolve({ data: [], error: null }),
    userIds.length ? supabase.from("profiles").select("id, first_name, last_name").in("id", userIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (media.error || people.error) throw new Error("Could not load rating details. Please try again.");
  return { rows, count: result.count ?? 0, media: media.data ?? [], people: people.data ?? [] };
}
export async function overview() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("week6_admin_statistics");
  if (error || !data) throw new Error("Could not load statistics. Please try again.");
  return data as {
    users: number; media: number; votes: number; up: number; down: number;
    days: { day: string; count: number }[];
    top: { id: string; title: string; up: number; down: number }[];
    neighborhoods: { name: string; count: number }[];
  };
}
