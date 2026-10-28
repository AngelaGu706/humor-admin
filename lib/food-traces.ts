import 'server-only';
import { requireAdmin } from './auth';
import { notFound, redirect } from 'next/navigation';
import { isUuid } from './content';
import type { Generation, Profile } from './data';
export type FoodRequest = {
  id: string; user_id: string; user_input: string; cuisine: string | null; neighborhood: string | null;
  chain_version: string; status: 'running' | 'succeeded' | 'failed'; generation_id: string | null;
  selected_step_id: string | null; result_title: string | null; result_content: string | null;
  error_code: string | null; created_at: string; completed_at: string | null; duration_ms: number | null;
};
export type FoodStep = {
  id: string; request_id: string; step_number: number; kind: string; provider: string; model: string;
  prompt: string; settings: Record<string, unknown>; status: string; output_text: string | null; output_truncated: boolean;
  parsed_result: { title: string; content: string } | null; validation_passed: boolean | null;
  usage: Record<string, unknown> | null; error_code: string | null; created_at: string; completed_at: string | null; duration_ms: number | null;
};
export function requestStatus(row: Pick<FoodRequest, 'status' | 'created_at'>, now = Date.now()) {
  return row.status === 'running' && now - Date.parse(row.created_at) > 600000 ? 'Incomplete' : row.status === 'succeeded' ? 'Completed' : row.status === 'failed' ? 'Failed' : 'Running';
}
export function milliseconds(value: number | null) { return value === null ? '—' : `${(value / 1000).toFixed(2)}s`; }
export async function foodRequests(page = 1, query = '') {
  const { supabase } = await requireAdmin();
  let builder = supabase.from('food_generation_requests').select('*', { count: 'exact' });
  const q = query.trim().slice(0, 120).replace(/[\\%_*,()"']/g, ' ').replace(/\s+/g, ' ').trim();
  if (q) builder = builder.or(`user_input.ilike.%${q}%,result_title.ilike.%${q}%`);
  const { data, count, error } = await builder.order('created_at', { ascending: false }).order('id').range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error('Could not load generation requests. Please try again.');
  const lastPage = Math.max(1, Math.ceil((count ?? 0) / 20));
  if (page > lastPage) redirect(`/admin/requests?page=${lastPage}${query ? `&q=${encodeURIComponent(query)}` : ''}`);
  return { rows: (data ?? []) as FoodRequest[], count: count ?? 0 };
}
export async function foodRequest(id: string) {
  if (!isUuid(id)) notFound();
  const { supabase } = await requireAdmin();
  const { data: request, error } = await supabase.from('food_generation_requests').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error('Could not load this request. Please try again.');
  if (!request) notFound();
  const [steps, person, generation] = await Promise.all([
    supabase.from('food_generation_steps').select('*').eq('request_id', id).order('step_number'),
    supabase.from('profiles').select('id,first_name,last_name,is_superadmin').eq('id', request.user_id).maybeSingle(),
    request.generation_id ? supabase.from('generations').select('id,user_id,title,prompt,content,created_at').eq('id', request.generation_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (steps.error || person.error || generation.error) throw new Error('Could not load the request details. Please try again.');
  return { request: request as FoodRequest, steps: (steps.data ?? []) as FoodStep[], profile: person.data as Profile | null, generation: generation.data as Generation | null };
}
