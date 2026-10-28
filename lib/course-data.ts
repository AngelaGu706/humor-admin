import "server-only";
import { requireCourseAdmin } from "./course-server";
import { resources, resourceFor, validId, recordTitle, type Resource } from "./course-catalog";
import { notFound, redirect } from "next/navigation";
export type Row = Record<string, string | number | boolean | null>;
export type Lookups = Record<string, { value: string; label: string }[]>;
export const COURSE_PAGE_SIZE = 20;
export function coursePage(value: string | undefined) { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 50000) : 1; }
export type Search = { page?: string; q?: string } & Record<string, string | undefined>;
export async function courseList(key: string, search: Search) {
  const resource = resourceFor(key); if (!resource) notFound();
  const { supabase } = await requireCourseAdmin();
  const page = coursePage(search.page);
  let query = supabase.from(resource.table).select(resource.columns.join(","), { count: "exact" });
  const q = (typeof search.q === "string" ? search.q : "").trim().slice(0, 120);
  if (q) {
    if (resource.search.length) {
      // Only a literal substring is accepted; PostgREST filter syntax never comes from the caller.
      const literal = q.replace(/[\\%_*,()."']/g, " ").replace(/\s+/g, " ").trim();
      if (literal) query = query.or(resource.search.map(column => `${column}.ilike.%${literal}%`).join(","));
      else query = query.eq("id", resource.idType === "uuid" ? "00000000-0000-0000-0000-000000000000" : -1);
    } else if (validId(q, resource.idType === "uuid")) query = query.eq("id", q);
    else query = query.eq("id", resource.idType === "uuid" ? "00000000-0000-0000-0000-000000000000" : -1);
  }
  for (const [filter, column] of Object.entries(resource.filters ?? {})) {
    const value = search[filter]; if (!value) continue;
    const uuid = column === "profile_id" || column === "image_id";
    if (typeof value !== "string" || !validId(value, uuid)) notFound();
    query = query.eq(column, value);
  }
  query = key === "steps" ? query.order("humor_flavor_id").order("order_by").order("id") : query.order("id", { ascending: false });
  const { data, count, error } = await query.range((page - 1) * COURSE_PAGE_SIZE, page * COURSE_PAGE_SIZE - 1);
  if (error) throw new Error(`Could not load ${resource.title.toLowerCase()}. Please try again.`);
  const lastPage = Math.max(1, Math.ceil((count ?? 0) / COURSE_PAGE_SIZE));
  if (page > lastPage) {
    const params = new URLSearchParams();
    for (const [name, value] of Object.entries(search)) if (typeof value === "string" && name !== "page") params.set(name, value);
    params.set("page", String(lastPage)); redirect(`/studio/${key}?${params}`);
  }
  const rows = (data ?? []) as unknown as Row[];
  const lookups: Lookups = {};
  await Promise.all(Object.entries(resource.references ?? {}).map(async ([column, target]) => {
    if (!["templates", "models", "providers", "users"].includes(target)) return;
    const ids = [...new Set(rows.map(row => row[column]).filter(value => value !== null))];
    if (!ids.length) return;
    const linked = resources[target];
    const result = await supabase.from(linked.table).select(target === "users" ? "id,first_name,last_name" : target === "templates" ? "id,slug" : "id,name").in("id", ids);
    if (result.error) throw new Error("Could not load related record names.");
    lookups[column] = (result.data ?? []).map(row => ({ value: String((row as unknown as Row).id), label: recordTitle(linked, row as unknown as Row) }));
  }));
  return { resource, rows, count: count ?? 0, page, lookups };
}
const optionResources: Record<string, { table: string; label: string }> = { templates: { table: "humor_flavors", label: "slug" }, providers: { table: "llm_providers", label: "name" }, "term-types": { table: "term_types", label: "name" }, "example-categories": { table: "caption_example_categories", label: "name" } };
export async function courseOptions(resource: Resource) {
  const { supabase } = await requireCourseAdmin();
  const options: Lookups = {};
  await Promise.all((resource.fields ?? []).filter(field => field.reference).map(async field => {
    const entry = optionResources[field.reference!]; if (!entry) return;
    const { data, count, error } = await supabase.from(entry.table).select(`id,${entry.label}`, { count: "exact" }).order(entry.label).range(0, 999);
    if (error) throw new Error("Could not load form options.");
    // Large option sets use an explicit ID field rather than a silently incomplete dropdown.
    if ((count ?? 0) > 1000) return;
    options[field.key] = (data ?? []).map(row => ({ value: String((row as unknown as Row).id), label: String((row as unknown as Row)[entry.label]) }));
  }));
  return options;
}
export async function courseRecord(key: string, id: string) {
  const resource = resourceFor(key); if (!resource || !validId(id, resource.idType === "uuid")) notFound();
  const { supabase } = await requireCourseAdmin();
  const { data, error } = await supabase.from(resource.table).select(resource.columns.join(",")).eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load this record."); if (!data) notFound();
  return { resource, row: data as unknown as Row };
}
export async function relatedRecords(key: string, id: string) {
  const { supabase } = await requireCourseAdmin();
  const relationships: Record<string, [string, string][]> = {
    requests: [["chains", "caption_request_id"], ["responses", "caption_request_id"], ["content", "caption_request_id"]],
    chains: [["responses", "llm_prompt_chain_id"], ["content", "llm_prompt_chain_id"]],
    templates: [["steps", "humor_flavor_id"], ["content", "humor_flavor_id"]],
    steps: [["responses", "humor_flavor_step_id"]], models: [["steps", "llm_model_id"], ["responses", "llm_model_id"]],
    images: [["requests", "image_id"], ["content", "image_id"]], users: [["requests", "profile_id"], ["content", "profile_id"]],
  };
  return Promise.all((relationships[key] ?? []).map(async ([target, column]) => {
    const resource = resources[target];
    const { data, count, error } = await supabase.from(resource.table).select(resource.columns.join(","), { count: "exact" }).eq(column, id).order(target === "steps" ? "order_by" : "created_datetime_utc", { ascending: target === "steps" }).order("id").range(0, 9);
    if (error) throw new Error("Could not load the linked generation history.");
    const filter = Object.entries(resource.filters ?? {}).find(([, value]) => value === column)?.[0];
    return { key: target, title: resource.title, rows: (data ?? []) as unknown as Row[], count: count ?? 0, href: `/studio/${target}?${filter}=${encodeURIComponent(id)}` };
  }));
}
export async function courseOverview() {
  const { supabase } = await requireCourseAdmin();
  const counts = await Promise.all(["requests", "chains", "responses", "content", "users", "templates", "models", "terms"].map(async key => {
    const { count, error } = await supabase.from(resources[key].table).select("id", { count: "exact", head: true });
    if (error) throw new Error("Could not load course statistics.");
    return [key, count ?? 0] as const;
  }));
  const recent = await supabase.from("caption_requests").select("id,profile_id,image_id,created_datetime_utc").order("id", { ascending: false }).limit(6);
  if (recent.error) throw new Error("Could not load recent requests.");
  return { counts: Object.fromEntries(counts), recent: (recent.data ?? []) as Row[] };
}
