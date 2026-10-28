import "server-only";
import { NextResponse } from "next/server";
import { authorizeCourseAdmin } from "./course-server";
import { resourceFor, validId, validateValues } from "./course-catalog";
import { AccessError } from "./auth";
import { sameOrigin, apiError } from "./api";

type Context = { params: Promise<{ resource: string; id?: string }> };
export async function courseMutation(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const { supabase } = await authorizeCourseAdmin();
    const { resource: key, id } = await context.params;
    const resource = resourceFor(key);
    if (!resource) throw new AccessError(404, "Resource not found.");
    if (!resource.fields || (resource.updateOnly && request.method !== "PATCH")) throw new AccessError(405, "This operation is not available for this resource.");
    if (request.method !== "POST" && (!id || !validId(id, resource.idType === "uuid"))) throw new AccessError(400, "Invalid record ID.");
    const raw = await request.text();
    if (raw.length > 90000) throw new AccessError(413, "This form is too large.");
    let body: { values?: unknown; version?: unknown };
    try { body = JSON.parse(raw); } catch { throw new AccessError(400, "Please submit a valid form."); }
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(key => !["values", "version"].includes(key))) throw new AccessError(400, "Please submit a valid form.");
    let values;
    if (request.method !== "DELETE") {
      try { values = validateValues(resource, body.values); } catch (error) { throw new AccessError(400, error instanceof Error ? error.message : "Please check the form."); }
    }
    if (request.method !== "POST" && (typeof body.version !== "string" || !Number.isFinite(Date.parse(body.version)))) throw new AccessError(400, "Refresh this record before changing it.");
    const result = request.method === "POST"
      ? await supabase.from(resource.table).insert(values!).select(resource.columns.join(",")).single()
      : request.method === "PATCH"
        ? await supabase.from(resource.table).update(values!).eq("id", id!).eq("modified_datetime_utc", body.version as string).select(resource.columns.join(",")).maybeSingle()
        : await supabase.from(resource.table).delete().eq("id", id!).eq("modified_datetime_utc", body.version as string).select("id").maybeSingle();
    if (result.error) {
      const code = result.error.code;
      if (code === "23503") throw new AccessError(409, "This record is referenced by other data, or a selected reference no longer exists.");
      if (code === "23505") throw new AccessError(409, "A record with these values already exists.");
      if (code === "42501") throw new AccessError(403, "The database did not allow this change. Check administrator access.");
      if (["23514", "23502", "22001", "22003", "22P02"].includes(code)) throw new AccessError(400, "These values do not meet the database requirements. Please check the form.");
      throw new Error("Course mutation failed");
    }
    if (!result.data) throw new AccessError(409, "This record changed or was removed. Refresh the page before trying again.");
    return NextResponse.json({ record: result.data }, { status: request.method === "POST" ? 201 : 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
