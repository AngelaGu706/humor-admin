import { NextResponse } from "next/server";
import { authorizeAdmin, AccessError } from "@/lib/auth";
import { apiError, sameOrigin, parseMedia } from "@/lib/api";
import { validateMedia, isUuid } from "@/lib/content";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const { supabase } = await authorizeAdmin();
    const { id } = await context.params;
    if (!isUuid(id)) throw new AccessError(400, "Invalid content ID.");
    let input;
    try { input = validateMedia(await parseMedia(request)); }
    catch (error) { if (error instanceof AccessError) throw error; throw new AccessError(400, (error as Error).message); }
    const { data, error } = await supabase.from("generations").update(input).eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new AccessError(404, "This content no longer exists.");
    return NextResponse.json({ id: data.id });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const { supabase } = await authorizeAdmin();
    const { id } = await context.params;
    if (!isUuid(id)) throw new AccessError(400, "Invalid content ID.");
    const { data, error } = await supabase.from("generations").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new AccessError(404, "This content no longer exists.");
    return NextResponse.json({ deleted: true });
  } catch (error) { return apiError(error); }
}
