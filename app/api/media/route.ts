import { NextResponse } from "next/server";
import { authorizeAdmin, AccessError } from "@/lib/auth";
import { apiError, sameOrigin, parseMedia } from "@/lib/api";
import { validateMedia } from "@/lib/content";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { supabase, user } = await authorizeAdmin();
    let input;
    try { input = validateMedia(await parseMedia(request)); }
    catch (error) { if (error instanceof AccessError) throw error; throw new AccessError(400, (error as Error).message); }
    const { data, error } = await supabase.from("generations").insert({ ...input, user_id: user.id }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
