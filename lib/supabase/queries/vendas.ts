import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CrmLead, SalesGoal, SalesProfile } from '@/types/app'
import { patchIntelligence } from './persist'

type Supa = SupabaseClient<Database>

export async function persistLeads(supa: Supa, companyId: string, leads: CrmLead[]): Promise<void> {
  await patchIntelligence(supa, companyId, { salesLeads: leads as unknown as Record<string, unknown>[] })
}

export async function persistGoals(supa: Supa, companyId: string, goals: SalesGoal[]): Promise<void> {
  await patchIntelligence(supa, companyId, { salesGoals: goals as unknown as Record<string, unknown>[] })
}

export async function saveSalesProfile(
  supa: Supa,
  companyId: string,
  answers: string[],
  profile: SalesProfile,
): Promise<void> {
  await supa.from('company_sales_profile').upsert({
    company_id: companyId,
    answers: answers as unknown as import('@/types/database').Json,
    profile: profile as unknown as import('@/types/database').Json,
  })
}
