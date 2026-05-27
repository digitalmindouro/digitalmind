import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { FormData as AppFormData, DiagResult } from '@/types/app'

type Supa   = SupabaseClient<Database>
type Json   = import('@/types/database').Json

export async function saveCompanyFields(
  supa: Supa,
  companyId: string,
  form: Partial<AppFormData>,
): Promise<void> {
  const payload: Database['public']['Tables']['companies']['Update'] = {}
  if (form.companyName    !== undefined) payload.company_name    = form.companyName    || null
  if (form.city           !== undefined) payload.city            = form.city           || null
  if (form.segment        !== undefined) payload.segment         = form.segment        || null
  if (form.marketTime     !== undefined) payload.market_time     = form.marketTime     || null
  if (form.salesModel     !== undefined) payload.sales_model     = form.salesModel     || null
  if (form.mainGoal       !== undefined) payload.main_goal       = form.mainGoal       || null
  if (form.mainDifficulty !== undefined) payload.main_difficulty = form.mainDifficulty || null
  if (Object.keys(payload).length === 0) return
  await supa.from('companies').update(payload).eq('id', companyId)
}

export async function saveDiagnostic(
  supa: Supa,
  companyId: string,
  formData: AppFormData,
  result: DiagResult,
): Promise<void> {
  await supa.from('company_diagnostics').insert({
    company_id: companyId,
    raw_input:  formData as unknown as Json,
    ai_output:  result   as unknown as Json,
    score:      result.sc,
  })
}
