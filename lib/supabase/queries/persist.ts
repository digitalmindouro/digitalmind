import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Supa = SupabaseClient<Database>

/**
 * Patch a subset of keys in company_intelligence.ai_context without overwriting
 * other modules' data. Reads current value, merges, writes back.
 */
export async function patchIntelligence(
  supa: Supa,
  companyId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { data } = await supa
    .from('company_intelligence')
    .select('ai_context')
    .eq('company_id', companyId)
    .single()

  const current = (data?.ai_context as Record<string, unknown> | null) ?? {}
  const merged: Record<string, unknown> = { ...current, ...patch }

  await supa
    .from('company_intelligence')
    .upsert({ company_id: companyId, ai_context: merged as import('@/types/database').Json, updated_at: new Date().toISOString() })
}
